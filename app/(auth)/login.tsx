import { useLoader } from "@/hooks/useLoader";
import {
  getProvidersForEmail,
  loginUser,
  sendResetEmail,
} from "@/services/authService";
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

export default function Login() {
  const router = useRouter();

  const { showLoader, hideLoader, isLoading } = useLoader();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (isLoading) {
      return;
    }
    if (!email.trim() || !password) {
      Alert.alert("Validation Error", "Please fill all fields");
      return;
    }

    showLoader();

    try {
      await loginUser(email.trim(), password);
      Alert.alert("Success", "Login successful!");
      router.replace("/(dashboard)/home");
    } catch (err: any) {
      console.log("Login error:", err);
      let errorMessage = "Invalid credentials. Please try again.";

      if (err.code === "auth/user-not-found") {
        errorMessage = "Email not found. Please sign up first.";
      } else if (err.code === "auth/wrong-password") {
        errorMessage = "Wrong password. Please try again.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Invalid email format.";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many login attempts. Try again later.";
      } else if (err.code === "auth/invalid-credential") {
        // Diagnose which providers are associated with the email
        const methods = await getProvidersForEmail(email.trim());
        if (methods.includes("password")) {
          // Email exists with password; likely wrong password
          Alert.alert(
            "Wrong password",
            "Looks like the password is incorrect. Would you like to reset it?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Reset Password",
                onPress: async () => {
                  try {
                    await sendResetEmail(email.trim());
                    Alert.alert(
                      "Email sent",
                      "Check your inbox for reset link.",
                    );
                  } catch (e: any) {
                    Alert.alert(
                      "Failed",
                      e?.message ?? "Could not send reset email.",
                    );
                  }
                },
              },
            ],
          );
          hideLoader();
          return;
        } else if (methods.length > 0) {
          // Email exists but with different provider (e.g., Google)
          errorMessage = `This email is registered via ${methods.join(", ")}. Use that provider to sign in.`;
        } else {
          // No methods: email not registered
          errorMessage = "Email not found. Please sign up first.";
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      Alert.alert("Login Failed", errorMessage);
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
              Welcome Back
            </Text>
            <Text className="text-gray-500 text-center mt-2 text-base">
              Sign in to continue your journaling journey
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
            <View className="mb-7">
              <Text className="text-gray-800 font-semibold mb-2 text-base">
                Password
              </Text>
              <View className="border-2 border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 flex-row items-center">
                <TextInput
                  placeholder="Enter your password"
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

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
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
                    Signing In...
                  </Text>
                </>
              ) : (
                <Text className="text-green-600 text-center font-bold text-lg">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center mb-5">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="px-3 text-gray-400 text-sm">OR</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            {/* Register Link */}
            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600 text-base">
                Don't have an account?
              </Text>
              <Pressable onPress={() => router.push("./register")}>
                <Text className="text-green-600 font-bold ml-1.5 text-base">
                  Sign Up
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Footer */}
          <Text className="text-gray-400 text-xs text-center mt-8">
            Secure login powered by SoulNotes
          </Text>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}
