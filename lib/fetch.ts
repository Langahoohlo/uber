import Constants from "expo-constants";
import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";

const trimSlashes = (value: string) => value.replace(/\/+$/, "");

const getHostname = (value?: string) => {
  if (!value) return null;

  try {
    const hostname = new URL(value).hostname;
    if (hostname) return hostname;
  } catch {
    // Plain host strings such as "localhost:8081" are handled below.
  }

  return (
    value.replace(/^[a-z][a-z\d+.-]*:\/\//i, "").split("/")[0]?.split(":")[0] ||
    null
  );
};

const getExpoConstants = () =>
  Constants as typeof Constants & {
    expoGoConfig?: { debuggerHost?: string; hostUri?: string };
    expoConfig?: { hostUri?: string };
    experienceUrl?: string;
    linkingUri?: string;
    manifest?: { debuggerHost?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  };

const getExpoHostUri = () => {
  const constants = getExpoConstants();

  return (
    constants.expoConfig?.hostUri ??
    constants.expoGoConfig?.hostUri ??
    constants.manifest2?.extra?.expoClient?.hostUri ??
    constants.manifest?.debuggerHost ??
    constants.expoGoConfig?.debuggerHost ??
    constants.linkingUri ??
    constants.experienceUrl
  );
};

const getDevServerUrl = () => {
  if (Platform.OS === "web") {
    return "";
  }

  const explicitUrl = process.env.EXPO_PUBLIC_SERVER_URL?.trim();
  if (explicitUrl) {
    if (!/^https?:\/\//i.test(explicitUrl)) {
      throw new Error(
        "EXPO_PUBLIC_SERVER_URL must start with http:// or https://",
      );
    }

    return trimSlashes(explicitUrl);
  }

  const hostname = getHostname(getExpoHostUri());

  if (!hostname) {
    throw new Error(
      "Missing EXPO_PUBLIC_SERVER_URL. Set it to your Expo dev server HTTP URL, for example http://192.168.42.56:8081.",
    );
  }

  return `http://${hostname}:8081`;
};

const resolveAPIUrl = (url: string) => {
  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${getDevServerUrl()}${url.startsWith("/") ? url : `/${url}`}`;
};

const joinAPIUrl = (baseUrl: string, url: string) =>
  `${trimSlashes(baseUrl)}${url.startsWith("/") ? url : `/${url}`}`;

const unique = <T,>(values: T[]) =>
  values.filter((value, index) => values.indexOf(value) === index);

const getAPIUrlCandidates = (url: string) => {
  if (/^https?:\/\//i.test(url)) {
    return [url];
  }

  const relativeUrl = url.startsWith("/") ? url : `/${url}`;
  if (Platform.OS === "web") {
    return [relativeUrl];
  }

  const explicitUrl = process.env.EXPO_PUBLIC_SERVER_URL?.trim();
  const expoHostname = getHostname(getExpoHostUri());

  if (explicitUrl) {
    return [joinAPIUrl(explicitUrl, relativeUrl)];
  }

  return unique(
    [
      "http://127.0.0.1:8081",
      "http://10.0.2.2:8081",
      expoHostname ? `http://${expoHostname}:8081` : null,
    ]
      .filter((value): value is string => Boolean(value))
      .map((baseUrl) => joinAPIUrl(baseUrl, relativeUrl)),
  );
};

const getRequestMethod = (options?: RequestInit) => options?.method ?? "GET";
const API_ATTEMPT_TIMEOUT_MS = 25000;

const describeNetworkTarget = () => ({
  platform: Platform.OS,
  configuredServerUrl: process.env.EXPO_PUBLIC_SERVER_URL?.trim() || null,
  expoHostUri: getExpoHostUri() ?? null,
});

export const fetchAPI = async (url: string, options?: RequestInit) => {
  const urlCandidates = getAPIUrlCandidates(url);
  const method = getRequestMethod(options);
  const startedAt = Date.now();

  console.log("[API] request", {
    method,
    url,
    urlCandidates,
    ...describeNetworkTarget(),
  });

  let lastError: unknown;

  for (const [attemptIndex, resolvedUrl] of urlCandidates.entries()) {
    const attemptStartedAt = Date.now();
    const abortController =
      options?.signal === undefined ? new AbortController() : null;
    const timeoutId = abortController
      ? setTimeout(() => abortController.abort(), API_ATTEMPT_TIMEOUT_MS)
      : null;

    try {
      console.log("[API] attempt", {
        method,
        url,
        resolvedUrl,
        attempt: attemptIndex + 1,
        totalAttempts: urlCandidates.length,
      });

      const response = await fetch(resolvedUrl, {
        ...options,
        signal: options?.signal ?? abortController?.signal,
      });
      const durationMs = Date.now() - attemptStartedAt;

      console.log("[API] response", {
        method,
        url,
        resolvedUrl,
        status: response.status,
        ok: response.ok,
        durationMs,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error ${response.status}: ${errorText || response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      lastError = error;
      console.error("[API] attempt failed", {
        method,
        url,
        resolvedUrl,
        attempt: attemptIndex + 1,
        totalAttempts: urlCandidates.length,
        durationMs: Date.now() - attemptStartedAt,
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      if (
        !(error instanceof TypeError) &&
        !(error instanceof Error && error.name === "AbortError")
      ) {
        throw error;
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }

  console.error("[API] fetch failed", {
    method,
    url,
    urlCandidates,
    durationMs: Date.now() - startedAt,
    errorName: lastError instanceof Error ? lastError.name : "UnknownError",
    errorMessage:
      lastError instanceof Error ? lastError.message : String(lastError),
    hint:
      Platform.OS === "android"
        ? lastError instanceof Error && lastError.name === "AbortError"
          ? "The Android request timed out. The backend may be reachable but too slow to answer before the dev timeout."
          : "All Android dev API URLs failed. For a physical phone, run `adb reverse tcp:8081 tcp:8081` and use http://127.0.0.1:8081. For an emulator, use http://10.0.2.2:8081."
        : undefined,
    ...describeNetworkTarget(),
  });

  throw lastError;
};

export const useFetch = <T>(url: string | null, options?: RequestInit) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchAPI(url, options);
      setData(result.data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};
