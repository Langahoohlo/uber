import { useUser } from "@clerk/clerk-expo";
import { useAuth } from "@clerk/clerk-expo";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GoogleTextInput from "@/components/GoogleTextInput";
import Map from "@/components/Map";
import RideCard from "@/components/RideCard";
import { icons, images } from "@/constants";
import { fetchAPI, useFetch } from "@/lib/fetch";
import { useLocationStore } from "@/store";
import { Ride } from "@/types/type";

const Home = () => {
  const { user } = useUser();
  const { signOut } = useAuth();

  const { setUserLocation, setDestinationLocation } = useLocationStore();

  const handleSignOut = () => {
    signOut();
    router.replace("/(auth)/sign-in");
  };

  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const {
    data: recentRides,
    loading,
    error,
  } = useFetch<Ride[]>(user?.id ? `/(api)/ride/${user.id}` : null);

  useEffect(() => {
    let mounted = true;

    const withTimeout = <T,>(promise: Promise<T>, ms: number) =>
      Promise.race<T>([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error("Location request timed out")), ms),
        ),
      ]);

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;

        if (status !== "granted") {
          setLocationError("Location permission was denied.");
          return;
        }

        const location =
          (await Location.getLastKnownPositionAsync({})) ??
          (await withTimeout(
            Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            }),
            15000,
          ));

        if (!mounted) return;

        const address = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: address[0]
            ? `${address[0].name ?? "Current location"}, ${address[0].region ?? ""}`
            : "Current location",
        });
      } catch (err) {
        if (mounted) setLocationError((err as Error).message);
      } finally {
        if (mounted) setLocationLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [setUserLocation]);

  useEffect(() => {
    if (!user?.id) return;

    fetchAPI("/(api)/health")
      .then((health) => {
        console.log("[API] post-login health check ok", health);
      })
      .catch((err) => {
        console.error("[API] post-login health check failed", {
          errorName: err instanceof Error ? err.name : "UnknownError",
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      });
  }, [user?.id]);

  const handleDestinationPress = (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => {
    setDestinationLocation(location);

    router.push("/(root)/find-ride");
  };

  return (
    <SafeAreaView className="bg-general-500">
      <FlatList
        data={recentRides?.slice(0, 5)}
        renderItem={({ item }) => <RideCard ride={item} />}
        keyExtractor={(item, index) => index.toString()}
        className="px-5"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingBottom: 100,
        }}
        ListEmptyComponent={() => (
          <View className="flex flex-col items-center justify-center">
            {error ? (
              <Text className="text-sm text-red-500 text-center">{error}</Text>
            ) : !loading ? (
              <>
                <Image
                  source={images.noResult}
                  className="w-40 h-40"
                  alt="No recent rides found"
                  resizeMode="contain"
                />
                <Text className="text-sm">No recent rides found</Text>
              </>
            ) : (
              <ActivityIndicator size="small" color="#000" />
            )}
          </View>
        )}
        ListHeaderComponent={
          <>
            <View className="flex flex-row items-center justify-between my-5">
              <Text className="text-2xl font-JakartaExtraBold">
                Welcome {user?.firstName}👋
              </Text>
              <TouchableOpacity
                onPress={handleSignOut}
                className="justify-center items-center w-10 h-10 rounded-full bg-white"
              >
                <Image source={icons.out} className="w-4 h-4" />
              </TouchableOpacity>
            </View>

            <GoogleTextInput
              icon={icons.search}
              containerStyle="bg-white shadow-md shadow-neutral-300"
              handlePress={handleDestinationPress}
            />

            <>
              <Text className="text-xl font-JakartaBold mt-5 mb-3">
                Your current location
              </Text>
              <View className="flex flex-row items-center bg-transparent h-[300px]">
                {locationError ? (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-sm text-red-500 text-center">
                      {locationError}
                    </Text>
                  </View>
                ) : locationLoading ? (
                  <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="small" color="#000" />
                  </View>
                ) : (
                  <Map />
                )}
              </View>
            </>

            <Text className="text-xl font-JakartaBold mt-5 mb-3">
              Recent Rides
            </Text>
          </>
        }
      />
    </SafeAreaView>
  );
};

export default Home;
