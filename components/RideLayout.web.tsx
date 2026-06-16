import { router } from "expo-router";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

import Map from "@/components/Map";
import { icons } from "@/constants";

const RideLayout = ({
  title,
  children,
}: {
  title: string;
  snapPoints?: string[];
  children: React.ReactNode;
}) => {
  return (
    <View className="flex-1 bg-white">
      <View className="h-[45vh] bg-blue-500">
        <View className="absolute z-10 top-16 flex-row items-center justify-start px-5">
          <TouchableOpacity onPress={() => router.back()}>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
              <Image
                source={icons.backArrow}
                resizeMode="contain"
                className="h-6 w-6"
              />
            </View>
          </TouchableOpacity>
          <Text className="ml-5 text-xl font-JakartaSemiBold">
            {title || "Go Back"}
          </Text>
        </View>

        <Map />
      </View>

      <ScrollView className="flex-1 px-5 py-5">{children}</ScrollView>
    </View>
  );
};

export default RideLayout;
