import { useLoader } from "@/hooks/useLoader";
import { registerUser } from "@/services/authService";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

export default function Register() {
  const router = useRouter();

  const { showLoader, hideLoader, isLoading } = useLoader();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (isLoading) {
      return;
    }
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Validation Error", "Please fill all fields");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Validation Error", "Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Validation Error", "Passwords do not match");
      return;
    }

    showLoader();

    try {
      await registerUser(name.trim(), email.trim(), password);
      Alert.alert(
        "Success",
        "Registration successful! Redirecting to login...",
      );
      router.replace("./login");
    } catch (err) {
      Alert.alert(
        "Registration Failed",
        "An error occurred. Please try again.",
      );
    } finally {
      hideLoader();
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="bg-gradient-to-br from-blue-50 via-white to-purple-50"
      >
        <View className="flex-1 justify-center items-center px-5 py-12">
          {/* Header Section */}
          <View className="mb-8 items-center">
            <View className="w-15 h-15 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full items-center justify-center mb-4 shadow-lg border- border-green-400">
              <Text className="text-7xl">🪶</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900 text-center">
              Join SoulNotes
            </Text>
            <Text className="text-gray-500 text-center mt-2 text-base">
              Create your account to start journaling
            </Text>
          </View>

          {/* Card */}
          <View
            className="w-full bg-white rounded-3xl p-7"
            style={{
              elevation: 8,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 8,
            }}
          >
            {/* Name Field */}
            <View className="mb-5">
              <Text className="text-gray-800 font-semibold mb-2 text-base">
                Full Name
              </Text>
              <View className="border-2 border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 flex-row items-center">
                <TextInput
                  placeholder="John Doe"
                  placeholderTextColor="#999"
                  className="flex-1 text-gray-800 text-base"
                  value={name}
                  onChangeText={setName}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Email Field */}
            <View className="mb-5">
              <Text className="text-gray-800 font-semibold mb-2 text-base">
                Email Address
              </Text>
              <View className="border-2 border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 flex-row items-center">
                <TextInput
                  placeholder="your@email.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 text-gray-800 text-base"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Field */}
            <View className="mb-5">
              <Text className="text-gray-800 font-semibold mb-2 text-base">
                Password
              </Text>
              <View className="border-2 border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 flex-row items-center">
                <TextInput
                  placeholder="At least 6 characters"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  className="flex-1 text-gray-800 text-base"
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Text className="text-gray-500 text-lg">
                    {showPassword ? "👁" : "👁‍🗨"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Confirm Password Field */}
            <View className="mb-7">
              <Text className="text-gray-800 font-semibold mb-2 text-base">
                Confirm Password
              </Text>
              <View className="border-2 border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 flex-row items-center">
                <TextInput
                  placeholder="Re-enter password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showConfirmPassword}
                  className="flex-1 text-gray-800 text-base"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isLoading}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text className="text-gray-500 text-lg">
                    {showConfirmPassword ? "👁" : "👁‍🗨"}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              className={`py-4 rounded-2xl mb-5 flex-row items-center justify-center ${
                isLoading
                  ? "bg-gray-400"
                  : "bg-gradient-to-r from-blue-500 to-purple-600"
              } shadow-lg`}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text className="text-green-600 text-center font-bold text-lg ml-2">
                    Creating Account...
                  </Text>
                </>
              ) : (
                <Text className="text-green-600 text-center font-bold text-lg">
                  Create Account
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center mb-5">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="px-3 text-gray-400 text-sm">OR</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Login Link */}
            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600 text-base">
                Already have an account?
              </Text>
              <Pressable onPress={() => router.back()}>
                <Text className="text-green-600 font-bold ml-1.5 text-base">
                  Sign In
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Footer */}
          <Text className="text-gray-400 text-xs text-center mt-8">
            By signing up, you agree to our Terms of Service
          </Text>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}
