import { AuthContext } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { signOut, updateProfile } from "firebase/auth";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, storage } from "../../services/firebase";

const Profile = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.photoURL || null,
  );
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Sync profile image from Firebase Auth when user data changes
  useEffect(() => {
    const loadProfileImage = async () => {
      if (!user) {
        setProfileImage(null);
        return;
      }

      console.log("Loading profile image for user:", user.uid);

      try {
        // First, check Firebase Auth photoURL
        if (user?.photoURL) {
          console.log("Loading from Firebase Auth:", user.photoURL);
          setProfileImage(user.photoURL);
          return;
        }

        // Then try to load from local storage as fallback
        console.log("Checking local storage for profile image...");
        const localImage = await AsyncStorage.getItem(
          `profileImage_${user.uid}`,
        );

        if (localImage) {
          console.log("Found local profile image, loading...");
          setProfileImage(localImage);
        } else {
          console.log("No profile image found (Firebase or local)");
          setProfileImage(null);
        }
      } catch (error) {
        console.error("Error loading profile image:", error);
        setProfileImage(null);
      }
    };

    loadProfileImage();
  }, [user?.uid, user?.photoURL]); // Changed dependency array for better tracking

  // Request permissions and pick image from gallery
  const pickImageFromGallery = async () => {
    try {
      // Request media library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need gallery permissions to upload photos.",
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image from gallery");
    }
  };

  // Request permissions and take photo with camera
  const takePhotoWithCamera = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera permissions to take photos.",
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileImage(result.assets[0].uri);
        await uploadProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    }
  };

  // Show options for image selection
  const handleImageSelection = () => {
    Alert.alert(
      "Update Profile Picture",
      "Choose an option",
      [
        {
          text: "Take Photo",
          onPress: takePhotoWithCamera,
        },
        {
          text: "Choose from Gallery",
          onPress: pickImageFromGallery,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true },
    );
  };

  // Upload profile image to Firebase Storage
  const uploadProfileImage = async (imageUri: string) => {
    try {
      setUploading(true);

      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert("Error", "No user logged in");
        setUploading(false);
        return;
      }

      console.log("Starting image upload for user:", currentUser.uid);
      console.log("Image URI:", imageUri);

      // Read image file and convert to base64
      let base64Data: string;
      try {
        console.log("Reading file from URI:", imageUri);

        // Use fetch to read the local file and convert to base64
        const response = await fetch(imageUri);
        const blob = await response.blob();

        // Convert blob to base64 using FileReader-like approach for React Native
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const dataUrl = reader.result as string;
            // Extract the base64 part after the comma
            const base64 = dataUrl.split(",")[1];
            resolve(base64);
          };
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(blob);
        });

        base64Data = await base64Promise;
        console.log("✅ File read successfully, size:", base64Data.length);
      } catch (fileError: any) {
        console.error("Error reading file:", fileError);
        Alert.alert("Error", "Failed to read image file: " + fileError.message);
        setUploading(false);
        return;
      }

      // Prepare base64 data URL
      const base64Url = `data:image/jpeg;base64,${base64Data}`;

      // Try to upload to Firebase Storage first
      let downloadURL: string | null = null;

      try {
        const timestamp = Date.now();
        const storageRef = ref(
          storage,
          `profileImages/${currentUser.uid}/${timestamp}.jpg`,
        );

        console.log("Uploading to Firebase Storage...");

        // Convert base64 to blob for Firebase upload
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/jpeg" });

        const uploadResult = await uploadBytes(storageRef, blob, {
          contentType: "image/jpeg",
          cacheControl: "public, max-age=3600",
        });

        downloadURL = await getDownloadURL(uploadResult.ref);
        console.log("✅ Firebase upload successful:", downloadURL);

        // Update Firebase Auth profile
        try {
          await updateProfile(currentUser, {
            photoURL: downloadURL,
          });
          console.log("✅ Firebase profile updated with download URL");
        } catch (authError: any) {
          console.warn(
            "Failed to update Firebase Auth profile:",
            authError.message,
          );
        }
      } catch (firebaseError: any) {
        console.warn("Firebase Storage upload failed:", firebaseError.message);
        console.log("Using local AsyncStorage as fallback...");

        // Fallback: Save base64 data locally
        try {
          const key = `profileImage_${currentUser.uid}`;
          console.log("Saving to AsyncStorage with key:", key);

          await AsyncStorage.setItem(key, base64Url);

          // Verify save
          const saved = await AsyncStorage.getItem(key);
          if (saved) {
            console.log("✅ Image saved to AsyncStorage successfully");
            downloadURL = base64Url;
          } else {
            console.error("❌ Failed to save image to AsyncStorage");
            throw new Error("AsyncStorage save failed");
          }
        } catch (storageError: any) {
          console.error("AsyncStorage error:", storageError);
          Alert.alert("Error", "Failed to save profile picture");
          setUploading(false);
          return;
        }
      }

      if (!downloadURL) {
        throw new Error("Failed to get image URL");
      }

      // Update local state
      console.log("Updating local state with profile image");
      setProfileImage(downloadURL);

      Alert.alert("Success", "Profile picture saved successfully!");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      if (error.code === "storage/unauthorized") {
        Alert.alert(
          "Storage Permission Error",
          "Firebase Storage rules not configured.",
        );
      } else if (error.code === "auth/invalid-profile-attribute") {
        Alert.alert("Success", "Profile picture saved locally on your device!");
      } else {
        Alert.alert(
          "Error",
          `Failed to upload image: ${error.message || "Unknown error"}`,
        );
      }
    } finally {
      setUploading(false);
    }
  };

  // Update display name
  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name cannot be empty");
      return;
    }

    try {
      setUploading(true);
      if (user) {
        await updateProfile(user, {
          displayName: displayName.trim(),
        });
      }
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setUploading(false);
    }
  };

  // Update contact information
  const handleUpdateContact = () => {
    setIsEditingContact(false);
    Alert.alert("Success", "Contact information updated!");
  };

  // Handle logout
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace("/(auth)/login");
          } catch (error) {
            console.error("Logout error:", error);
            Alert.alert("Error", "Failed to logout");
          }
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="px-6 pt-16 pb-8">
        {/* Header */}
        <Text className="text-3xl font-bold text-gray-900 mb-2">Profile</Text>
        <Text className="text-gray-600 mb-8">Manage your account settings</Text>

        {/* Profile Picture Section */}
        <View className="items-center mb-8">
          <Pressable
            onPress={handleImageSelection}
            className="relative"
            disabled={uploading}
          >
            <View className="w-32 h-32 rounded-full bg-[#10B981] items-center justify-center overflow-hidden border-4 border-[#0ea5a4]">
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-5xl">👤</Text>
              )}
            </View>

            {/* Camera Icon Overlay */}
            <View className="absolute bottom-0 right-0 bg-[#10B981] w-10 h-10 rounded-full items-center justify-center border-2 border-white">
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={20} color="#fff" />
              )}
            </View>
          </Pressable>

          <Text className="text-gray-900 text-xl font-semibold mt-4">
            {displayName || "Anonymous"}
          </Text>
          <Text className="text-gray-600 text-sm mt-1">{user?.email}</Text>
        </View>

        {/* Display Name Section */}
        <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-200">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-900 text-lg font-semibold">
              Display Name
            </Text>
            <Pressable onPress={() => setIsEditing(!isEditing)}>
              <Ionicons
                name={isEditing ? "close" : "pencil"}
                size={20}
                color="#10B981"
              />
            </Pressable>
          </View>

          {isEditing ? (
            <View>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-100 text-gray-900 px-4 py-3 rounded-xl mb-4 border border-gray-300"
              />
              <Pressable
                onPress={handleUpdateProfile}
                disabled={uploading}
                className="bg-[#10B981] py-3 rounded-xl items-center"
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Save Changes
                  </Text>
                )}
              </Pressable>
            </View>
          ) : (
            <Text className="text-gray-700">{displayName || "Not set"}</Text>
          )}
        </View>

        {/* Account Info */}
        <View className="bg-white rounded-2xl p-6 mb-6 border border-gray-200">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-gray-900 text-lg font-semibold">
              Account Information
            </Text>
            <Pressable onPress={() => setIsEditingContact(!isEditingContact)}>
              <Ionicons
                name={isEditingContact ? "close" : "pencil"}
                size={20}
                color="#10B981"
              />
            </Pressable>
          </View>

          <View className="mb-4">
            <Text className="text-gray-500 text-sm mb-1">Email</Text>
            <Text className="text-gray-900">{user?.email}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-gray-500 text-sm mb-1">Telephone Number</Text>
            {isEditingContact ? (
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter your phone number"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                className="bg-gray-100 text-gray-900 px-4 py-3 rounded-xl border border-gray-300"
              />
            ) : (
              <Text className="text-gray-700">{phoneNumber || "Not set"}</Text>
            )}
          </View>

          <View className="mb-4">
            <Text className="text-gray-500 text-sm mb-1">Home Address</Text>
            {isEditingContact ? (
              <TextInput
                value={homeAddress}
                onChangeText={setHomeAddress}
                placeholder="Enter your home address"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                className="bg-gray-100 text-gray-900 px-4 py-3 rounded-xl border border-gray-300"
              />
            ) : (
              <Text className="text-gray-700">{homeAddress || "Not set"}</Text>
            )}
          </View>

          {isEditingContact && (
            <Pressable
              onPress={handleUpdateContact}
              className="bg-[#10B981] py-3 rounded-xl items-center mt-2"
            >
              <Text className="text-white font-semibold text-base">
                Save Contact Info
              </Text>
            </Pressable>
          )}

          <View className="border-t border-gray-200 mt-4 pt-4">
            <View className="mb-3">
              <Text className="text-gray-500 text-sm mb-1">User ID</Text>
              <Text className="text-gray-700 text-xs">{user?.uid}</Text>
            </View>

            <View>
              <Text className="text-gray-500 text-sm mb-1">
                Account Created
              </Text>
              <Text className="text-gray-700">
                {user?.metadata?.creationTime
                  ? new Date(user.metadata.creationTime).toLocaleDateString()
                  : "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="space-y-3">
          <Pressable
            onPress={handleImageSelection}
            className="bg-white py-4 rounded-xl flex-row items-center justify-between px-6 border border-gray-200"
          >
            <View className="flex-row items-center">
              <Ionicons name="images-outline" size={24} color="#10B981" />
              <Text className="text-gray-900 text-base ml-3">
                Change Profile Picture
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </Pressable>

          <Pressable
            onPress={handleLogout}
            className="bg-red-50 py-4 rounded-xl flex-row items-center justify-between px-6 mt-3 border border-red-200"
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={24} color="#EF4444" />
              <Text className="text-red-500 text-base ml-3 font-semibold">
                Logout
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

export default Profile;
