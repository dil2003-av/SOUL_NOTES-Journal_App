import { AuthContext } from "@/context/AuthContext";
import { uploadImageToCloudinary } from "@/services/cloudinary";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
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
import { auth, db } from "../../services/firebase";

const Profile = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // New state for additional profile fields
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [accountCreatedDate, setAccountCreatedDate] = useState<Date | null>(
    null,
  );
  const [totalJournals, setTotalJournals] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);

  // Load profile from Firestore (with fallback to Firebase Auth)
  useEffect(() => {
    if (!user?.uid) return;

    const loadProfile = async () => {
      try {
        console.log("Loading profile for user:", user.uid);
        const snap = await getDoc(doc(db, "users", user.uid));

        let photoURL = null;
        let displayNameValue = "";

        if (snap.exists()) {
          const data = snap.data();
          console.log("✓ Loaded user data from Firestore:", data);
          photoURL = data.photoURL || null;
          displayNameValue = data.displayName || data.name || "";

          // Load additional fields
          setBio(data.bio || "");
          setPhoneNumber(data.phoneNumber || "");
          setLocation(data.location || "");
          setDateOfBirth(data.dateOfBirth || "");
          setAccountCreatedDate(data.createdAt?.toDate() || null);
        } else {
          console.log("✗ No Firestore document found for user:", user.uid);
        }

        // FALLBACK: Load from Firebase Auth if not in Firestore
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log("Firebase Auth photoURL:", currentUser.photoURL);
          console.log("Firebase Auth displayName:", currentUser.displayName);

          if (!photoURL && currentUser.photoURL) {
            console.log("✓ Using photoURL from Firebase Auth");
            photoURL = currentUser.photoURL;
          }

          if (!displayNameValue && currentUser.displayName) {
            console.log("✓ Using displayName from Firebase Auth");
            displayNameValue = currentUser.displayName;
          }
        }

        setProfileImage(photoURL);
        setDisplayName(displayNameValue);
      } catch (error) {
        console.error("Profile load error:", error);
      }
    };

    loadProfile();
  }, [user?.uid]);

  // Sync Firebase Auth changes to local state
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setProfileImage(null);
      setDisplayName("");
      return;
    }

    console.log("Syncing Firebase Auth user:", currentUser.email);
    console.log("Current photoURL:", currentUser.photoURL);
    console.log("Current displayName:", currentUser.displayName);

    if (currentUser.photoURL) {
      setProfileImage(currentUser.photoURL);
    }
    if (currentUser.displayName) {
      setDisplayName(currentUser.displayName);
    }
  }, [user?.uid]);

  // Log profile image URL for debugging
  useEffect(() => {
    if (profileImage) {
      console.log("Profile Image URL:", profileImage);
    }
  }, [profileImage]);

  // Pick image from gallery
  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Gallery access is needed");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfileImage(result.assets[0].uri);
    }
  };

  // Take photo with camera
  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Camera access is needed");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      uploadProfileImage(result.assets[0].uri);
    }
  };

  // Image selection popup
  const handleImageSelection = () => {
    Alert.alert("Update Profile Picture", "Choose an option", [
      { text: "Camera", onPress: takePhotoWithCamera },
      { text: "Gallery", onPress: pickImageFromGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Upload profile image
  const uploadProfileImage = async (imageUri: string) => {
    // Use auth.currentUser directly instead of relying on context
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("No user logged in - auth.currentUser is null");
      console.error("Context user:", user);
      Alert.alert("Error", "No user logged in. Please login first.");
      return;
    }

    try {
      setUploading(true);
      console.log("=== START UPLOAD PROCESS ===");
      console.log("User ID:", currentUser.uid);
      console.log("User Email:", currentUser.email);

      // Step 1: Upload to Cloudinary
      console.log("Step 1: Uploading to Cloudinary...");
      const cloudImageUrl = await uploadImageToCloudinary(imageUri);
      console.log("✓ Cloudinary returned URL:", cloudImageUrl);

      if (!cloudImageUrl) {
        throw new Error("Cloudinary returned empty URL");
      }

      // Step 2: Update Firebase Auth
      console.log("Step 2: Updating Firebase Auth profile...");
      await updateProfile(currentUser, { photoURL: cloudImageUrl });
      console.log("✓ Firebase Auth photoURL updated");

      // Step 2b: RELOAD the user to persist changes
      console.log("Step 2b: Reloading Firebase Auth user...");
      await currentUser.reload();
      console.log("✓ Firebase Auth user reloaded");

      // Step 3: Save to Firestore
      console.log("Step 3: Saving to Firestore...");
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          photoURL: cloudImageUrl,
          displayName: currentUser.displayName || "",
          email: currentUser.email || "",
          updatedAt: new Date(),
        },
        { merge: true },
      );
      console.log("✓ Firestore photoURL saved");

      // Step 4: Update local state
      console.log("Step 4: Updating local state...");
      setProfileImage(cloudImageUrl);
      console.log("✓ Local state updated with photoURL:", cloudImageUrl);
      console.log("=== UPLOAD PROCESS COMPLETE ===");

      Alert.alert("Success", "Profile picture updated!");
    } catch (error: any) {
      console.error("✗ Upload Error:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      Alert.alert("Upload failed", error.message || "Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  // Update display name
  const handleUpdateProfile = async () => {
    const currentUser = auth.currentUser;

    if (!displayName.trim() || !currentUser) {
      Alert.alert("Error", "Please enter a name and login first");
      return;
    }

    try {
      setUploading(true);

      await updateProfile(currentUser, { displayName });

      await setDoc(
        doc(db, "users", currentUser.uid),
        { displayName, updatedAt: new Date() },
        { merge: true },
      );

      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert("Error updating profile", error.message);
    } finally {
      setUploading(false);
    }
  };

  // Update bio
  const handleUpdateBio = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      setUploading(true);
      await setDoc(
        doc(db, "users", currentUser.uid),
        { bio, updatedAt: new Date() },
        { merge: true },
      );
      setIsEditingBio(false);
      Alert.alert("Success", "Bio updated!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setUploading(false);
    }
  };

  // Update contact info
  const handleUpdateContact = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      setUploading(true);
      await setDoc(
        doc(db, "users", currentUser.uid),
        { phoneNumber, location, dateOfBirth, updatedAt: new Date() },
        { merge: true },
      );
      setIsEditingContact(false);
      Alert.alert("Success", "Contact info updated!");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setUploading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const currentUser = auth.currentUser;
              if (currentUser) {
                await setDoc(
                  doc(db, "users", currentUser.uid),
                  { deleted: true, deletedAt: new Date() },
                  { merge: true },
                );
                await signOut(auth);
                router.replace("/(auth)/login");
                Alert.alert("Account Deleted", "Your account has been deleted");
              }
            } catch (error: any) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ],
    );
  };

  // Logout
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await signOut(auth);
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <View
        style={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 }}
      >
        <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 8 }}>
          Profile
        </Text>
        <Text style={{ color: "#6B7280", marginBottom: 32 }}>
          Manage your account
        </Text>

        {/* Profile Image */}
        <View style={{ alignItems: "center", marginBottom: 32 }}>
          <Pressable onPress={handleImageSelection}>
            <View
              style={{
                width: 128,
                height: 128,
                borderRadius: 64,
                backgroundColor: "#10B981",
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {profileImage ? (
                <Image
                  source={{
                    uri: profileImage
                      ? `${profileImage}?t=${Date.now()}`
                      : profileImage,
                  }}
                  style={{ width: 128, height: 128, borderRadius: 64 }}
                  onError={(error) => {
                    console.error("Image load error:", error);
                  }}
                  onLoadEnd={() => {
                    console.log("Image loaded successfully");
                  }}
                />
              ) : (
                <Text style={{ fontSize: 48 }}>👤</Text>
              )}
            </View>

            <View
              style={{
                position: "absolute",
                bottom: 4,
                right: 4,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#10B981",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="camera" size={20} color="#fff" />
              )}
            </View>
          </Pressable>

          <Text style={{ fontSize: 20, fontWeight: "600", marginTop: 16 }}>
            {displayName || "Anonymous"}
          </Text>
          <Text style={{ color: "#6B7280" }}>{user?.email}</Text>
        </View>

        {/* Display Name */}
        <View
          style={{
            backgroundColor: "#fff",
            padding: 24,
            borderRadius: 24,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontWeight: "600", fontSize: 16 }}>
              Display Name
            </Text>
            <Pressable onPress={() => setIsEditing(!isEditing)}>
              <Ionicons name="pencil" size={18} color="#10B981" />
            </Pressable>
          </View>

          {isEditing ? (
            <>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name"
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 16,
                }}
              />
              <Pressable
                onPress={handleUpdateProfile}
                style={{
                  backgroundColor: "#10B981",
                  paddingVertical: 12,
                  borderRadius: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Save</Text>
              </Pressable>
            </>
          ) : (
            <Text style={{ color: "#374151" }}>{displayName || "Not set"}</Text>
          )}
        </View>

        {/* Bio Section */}
        <View
          style={{
            backgroundColor: "#fff",
            padding: 24,
            borderRadius: 24,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontWeight: "600", fontSize: 16 }}>Bio</Text>
            <Pressable onPress={() => setIsEditingBio(!isEditingBio)}>
              <Ionicons name="pencil" size={18} color="#10B981" />
            </Pressable>
          </View>

          {isEditingBio ? (
            <>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 16,
                  textAlignVertical: "top",
                  minHeight: 100,
                }}
              />
              <Pressable
                onPress={handleUpdateBio}
                style={{
                  backgroundColor: "#10B981",
                  paddingVertical: 12,
                  borderRadius: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Save</Text>
              </Pressable>
            </>
          ) : (
            <Text style={{ color: "#374151" }}>
              {bio || "No bio added yet"}
            </Text>
          )}
        </View>

        {/* Contact Information */}
        <View
          style={{
            backgroundColor: "#fff",
            padding: 24,
            borderRadius: 24,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontWeight: "600", fontSize: 16 }}>
              Contact Information
            </Text>
            <Pressable onPress={() => setIsEditingContact(!isEditingContact)}>
              <Ionicons name="pencil" size={18} color="#10B981" />
            </Pressable>
          </View>

          {isEditingContact ? (
            <>
              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{ color: "#6B7280", marginBottom: 8, fontSize: 14 }}
                >
                  Phone Number
                </Text>
                <TextInput
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+1 234 567 8900"
                  keyboardType="phone-pad"
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                />
              </View>

              <View style={{ marginBottom: 12 }}>
                <Text
                  style={{ color: "#6B7280", marginBottom: 8, fontSize: 14 }}
                >
                  Location
                </Text>
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="City, Country"
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                />
              </View>

              <View style={{ marginBottom: 16 }}>
                <Text
                  style={{ color: "#6B7280", marginBottom: 8, fontSize: 14 }}
                >
                  Date of Birth
                </Text>
                <TextInput
                  value={dateOfBirth}
                  onChangeText={setDateOfBirth}
                  placeholder="YYYY-MM-DD"
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                />
              </View>

              <Pressable
                onPress={handleUpdateContact}
                style={{
                  backgroundColor: "#10B981",
                  paddingVertical: 12,
                  borderRadius: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Save</Text>
              </Pressable>
            </>
          ) : (
            <>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>Phone</Text>
                <Text style={{ color: "#374151", marginTop: 4 }}>
                  {phoneNumber || "Not set"}
                </Text>
              </View>
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>Location</Text>
                <Text style={{ color: "#374151", marginTop: 4 }}>
                  {location || "Not set"}
                </Text>
              </View>
              <View>
                <Text style={{ color: "#6B7280", fontSize: 14 }}>
                  Date of Birth
                </Text>
                <Text style={{ color: "#374151", marginTop: 4 }}>
                  {dateOfBirth || "Not set"}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Account Info */}
        <View
          style={{
            backgroundColor: "#fff",
            padding: 24,
            borderRadius: 24,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 16 }}>
            Account Information
          </Text>

          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: "#6B7280", fontSize: 14 }}>Email</Text>
            <Text style={{ color: "#374151", marginTop: 4 }}>
              {user?.email}
            </Text>
          </View>

          {accountCreatedDate && (
            <View>
              <Text style={{ color: "#6B7280", fontSize: 14 }}>
                Member Since
              </Text>
              <Text style={{ color: "#374151", marginTop: 4 }}>
                {accountCreatedDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Settings */}
        <View
          style={{
            backgroundColor: "#fff",
            padding: 24,
            borderRadius: 24,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 16 }}>
            Settings
          </Text>

          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
            }}
          >
            <Ionicons name="notifications-outline" size={20} color="#6B7280" />
            <Text style={{ marginLeft: 12, color: "#374151", flex: 1 }}>
              Notifications
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </Pressable>

          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
            }}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#6B7280"
            />
            <Text style={{ marginLeft: 12, color: "#374151", flex: 1 }}>
              Privacy & Security
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </Pressable>

          <Pressable
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
            }}
          >
            <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
            <Text style={{ marginLeft: 12, color: "#374151", flex: 1 }}>
              Help & Support
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </Pressable>
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          style={{
            backgroundColor: "#FEE2E2",
            paddingVertical: 16,
            borderRadius: 16,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={{ color: "#EF4444", marginLeft: 8, fontWeight: "600" }}>
            Logout
          </Text>
        </Pressable>

        {/* Delete Account */}
        <Pressable
          onPress={handleDeleteAccount}
          style={{
            backgroundColor: "#FEF2F2",
            paddingVertical: 16,
            borderRadius: 16,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="trash-outline" size={22} color="#DC2626" />
          <Text style={{ color: "#DC2626", marginLeft: 8, fontWeight: "600" }}>
            Delete Account
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

export default Profile;
