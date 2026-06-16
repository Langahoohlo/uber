import { useUser } from "@clerk/clerk-expo";
import { Image, Text, View } from "react-native";

import Payment from "@/components/Payment";
import RideLayout from "@/components/RideLayout";
import { icons } from "@/constants";
import { formatTime } from "@/lib/utils";
import { useDriverStore, useLocationStore } from "@/store";

const BookRide = () => {
  const { user } = useUser();
  const { userAddress, destinationAddress } = useLocationStore();
  const { drivers, selectedDriver } = useDriverStore();

  const driverDetails = drivers?.filter(
    (driver) => +driver.id === selectedDriver,
  )[0];

  return (
    <RideLayout title="Book Ride">
      <>
        <Text className="mb-3 text-xl font-JakartaSemiBold">
          Ride Information
        </Text>

        <View className="mt-10 flex w-full flex-col items-center justify-center">
          <Image
            source={{ uri: driverDetails?.profile_image_url }}
            className="h-28 w-28 rounded-full"
          />

          <View className="mt-5 flex flex-row items-center justify-center space-x-2">
            <Text className="text-lg font-JakartaSemiBold">
              {driverDetails?.title}
            </Text>

            <View className="flex flex-row items-center space-x-0.5">
              <Image
                source={icons.star}
                className="h-5 w-5"
                resizeMode="contain"
              />
              <Text className="text-lg font-JakartaRegular">
                {driverDetails?.rating}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-5 flex w-full flex-col items-start justify-center rounded-3xl bg-general-600 px-5 py-3">
          <View className="flex w-full flex-row items-center justify-between border-b border-white py-3">
            <Text className="text-lg font-JakartaRegular">Ride Price</Text>
            <Text className="text-lg font-JakartaRegular text-[#0CC25F]">
              ${driverDetails?.price}
            </Text>
          </View>

          <View className="flex w-full flex-row items-center justify-between border-b border-white py-3">
            <Text className="text-lg font-JakartaRegular">Pickup Time</Text>
            <Text className="text-lg font-JakartaRegular">
              {formatTime(driverDetails?.time!)}
            </Text>
          </View>

          <View className="flex w-full flex-row items-center justify-between py-3">
            <Text className="text-lg font-JakartaRegular">Car Seats</Text>
            <Text className="text-lg font-JakartaRegular">
              {driverDetails?.car_seats}
            </Text>
          </View>
        </View>

        <View className="mt-5 flex w-full flex-col items-start justify-center">
          <View className="mt-3 flex w-full flex-row items-center justify-start border-b border-t border-general-700 py-3">
            <Image source={icons.to} className="h-6 w-6" />
            <Text className="ml-2 text-lg font-JakartaRegular">
              {userAddress}
            </Text>
          </View>

          <View className="flex w-full flex-row items-center justify-start border-b border-general-700 py-3">
            <Image source={icons.point} className="h-6 w-6" />
            <Text className="ml-2 text-lg font-JakartaRegular">
              {destinationAddress}
            </Text>
          </View>
        </View>

        <Payment
          fullName={user?.fullName!}
          email={user?.emailAddresses[0].emailAddress!}
          amount={driverDetails?.price!}
          driverId={driverDetails?.id}
          rideTime={driverDetails?.time!}
        />
      </>
    </RideLayout>
  );
};

export default BookRide;
