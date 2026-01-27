import { AuthProvider } from "@/context/AuthContext";
import { LoaderProvider } from "@/context/LoaderContext";
import { Slot } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const RootLayout = () => {
  const insets = useSafeAreaInsets();
  console.log(insets);
  return (
    <AuthProvider>
      <LoaderProvider>
        <View className="flex-1" style={{ marginTop: insets.top }}>
          <Slot />
        </View>
      </LoaderProvider>
    </AuthProvider>

    // <SafeAreaView className='flex-1'>
    //    <Slot />
    //    </SafeAreaView>
  );
};

export default RootLayout;
