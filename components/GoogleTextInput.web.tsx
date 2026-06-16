import { Image, TextInput, TouchableOpacity, View } from "react-native";

import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";

const GoogleTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
}: GoogleInputProps) => {
  return (
    <View
      className={`relative z-50 flex flex-row items-center justify-center rounded-xl px-5 ${containerStyle}`}
    >
      <View className="h-6 w-6 items-center justify-center">
        <Image
          source={icon ? icon : icons.search}
          className="h-6 w-6"
          resizeMode="contain"
        />
      </View>
      <TextInput
        className="mx-3 my-2 flex-1 rounded-full p-4 text-[15px] font-JakartaSemiBold"
        placeholder={initialLocation ?? "Where do you want to go?"}
        placeholderTextColor="gray"
        style={{
          backgroundColor: textInputBackgroundColor || "white",
        }}
        onSubmitEditing={(event) => {
          handlePress({
            latitude: 0,
            longitude: 0,
            address: event.nativeEvent.text,
          });
        }}
      />
      <TouchableOpacity
        className="rounded-full bg-primary-500 px-4 py-2"
        onPress={() =>
          handlePress({
            latitude: 0,
            longitude: 0,
            address: initialLocation || "Selected location",
          })
        }
      />
    </View>
  );
};

export default GoogleTextInput;
