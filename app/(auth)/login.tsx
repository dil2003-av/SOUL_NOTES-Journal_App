import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import React from "react";

export default function Login() {
  const router = useRouter();

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-gray-100 justify-center items-center px-6">
        
        {/* Card */}
        <View className="w-full max-w-md bg-white rounded-2xl p-6 shadow-lg">
          
          {/* Title */}
          <Text className="text-2xl font-bold text-center text-gray-800 mb-6">
            Welcome Back
          </Text>

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-gray-600 mb-1">Email</Text>
            <TextInput
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
            />
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-gray-600 mb-1">Password</Text>
            <TextInput
              placeholder="Enter your password"
              secureTextEntry
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
            />
          </View>

          {/* Login Button */}
          <Pressable
            onPress={() => router.replace("/home")}
            className="bg-blue-600 rounded-xl py-3 active:opacity-80"
          >
            <Text className="text-white text-center text-lg font-semibold">
              Login
            </Text>
          </Pressable>

          {/* Register Link */}
          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-600">Don’t have an account?</Text>
            <Pressable onPress={() => router.push("/register")}>
              <Text className="text-blue-600 font-semibold ml-1">
                Register
              </Text>
            </Pressable>
          </View>

        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
