import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import { onboarding } from "@/constants";

const Home = () => {
  const firstSlide = onboarding[0];

  return (
    <SafeAreaView className="flex h-full items-center justify-between bg-white">
      <TouchableOpacity
        onPress={() => router.replace("/(auth)/sign-up")}
        className="flex w-full items-end justify-end p-5"
      >
        <Text className="text-md font-JakartaBold text-black">Skip</Text>
      </TouchableOpacity>

      <View className="flex items-center justify-center p-5">
        <Image
          source={firstSlide.image}
          className="h-[300px] w-full"
          resizeMode="contain"
        />
        <View className="mt-10 flex w-full flex-row items-center justify-center">
          <Text className="mx-10 text-center text-3xl font-bold text-black">
            {firstSlide.title}
          </Text>
        </View>
        <Text className="text-md mx-10 mt-3 text-center font-JakartaSemiBold text-[#858585]">
          {firstSlide.description}
        </Text>
      </View>

      <CustomButton
        title="Get Started"
        onPress={() => router.replace("/(auth)/sign-up")}
        className="mb-5 mt-10 w-11/12"
      />
    </SafeAreaView>
  );
};

export default Home;
