import { Image, Text, View } from "react-native";

import CustomButton from "@/components/CustomButton";
import { icons } from "@/constants";

const OAuth = () => {
  return (
    <View>
      <View className="mt-4 flex flex-row items-center justify-center gap-x-3">
        <View className="h-[1px] flex-1 bg-general-100" />
        <Text className="text-lg">Or</Text>
        <View className="h-[1px] flex-1 bg-general-100" />
      </View>

      <CustomButton
        title="Log In with Google"
        className="mt-5 w-full shadow-none"
        IconLeft={() => (
          <Image
            source={icons.google}
            resizeMode="contain"
            className="mx-2 h-5 w-5"
          />
        )}
        bgVariant="outline"
        textVariant="primary"
        onPress={() => {}}
      />
    </View>
  );
};

export default OAuth;
