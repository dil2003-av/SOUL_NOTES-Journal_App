import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { registerUser } from "@/services/authService";
import { useLoader } from "@/hooks/useLoader";

export default function Register() {
  const router = useRouter();

  const {showLoader,hideLoader, isLoading} = useLoader();  //isloader-load vnvd ndd kiyl blgnn puluvn

  const [name,setName] = useState("")
  const[email,setEmail] = useState("")
  const[password,setPassword] = useState("")
  const[confirmPassword,setConfirmPassword] = useState("")

  const handleRegister = async () => {
    if(isLoading){
      return;
    }
    if(!name || !email || !password){
      Alert.alert("Please fill all fields")
      return;
    }
    if(password !== confirmPassword){
      Alert.alert("Passwords do not match")
      return;
    }
    showLoader();

    try{
      showLoader();
      await registerUser(name,email,password)
      Alert.alert("Registration Successful")
      router.replace("./login")
    }catch(err){
      Alert.alert("Registration Failed")
    }finally {
      hideLoader();
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-gray-100 justify-center items-center px-6">

        {/* Card */}
        <View
          className="w-full bg-white rounded-2xl p-6"
          style={{ elevation: 5 }}
        >

          {/* Title */}
          <Text className="text-2xl font-bold text-center text-gray-800 mb-6">
            Create Account
          </Text>

          {/* Name */}
          <View className="mb-4">
            <Text className="text-gray-600 mb-1">Name</Text>
            <TextInput
              placeholder="Enter your name"
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Email */}
          <View className="mb-4">
            <Text className="text-gray-600 mb-1">Email</Text>
            <TextInput
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
               value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View className="mb-4">
            <Text className="text-gray-600 mb-1">Password</Text>
            <TextInput
              placeholder="Enter password"
              secureTextEntry
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
               value={password}
              onChangeText={setPassword}
            />
          </View>

          {/* Confirm Password */}
          <View className="mb-6">
            <Text className="text-gray-600 mb-1">Confirm Password</Text>
            <TextInput
              placeholder="Re-enter password"
              secureTextEntry
              className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800"
               value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

         {/* Register Button */}
                <TouchableOpacity
                    onPress={handleRegister}
                    className="bg-gray-800 py-3 rounded-xl mb-6 shadow-lg"
                >
                    <Text className="text-white text-center font-bold text-lg">
                    Register
                    </Text>
                </TouchableOpacity>

          {/* Login Link */}
          <View className="flex-row justify-center mt-4">
            <Text className="text-gray-600">
              Already have an account?
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text className="text-blue-600 font-semibold ml-1">
                Login
              </Text>
            </Pressable>
          </View>

        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}