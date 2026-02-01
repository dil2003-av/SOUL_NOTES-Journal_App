import { AuthContext } from "@/context/AuthContext";
import { uploadImageToCloudinary } from "@/services/cloudinary";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { signOut, updateProfile } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Switch,
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

  // Settings State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const loadProfile = useCallback(async () => {
    const currentUser = auth.currentUser;

    if (!currentUser?.uid) {
      console.log("❌ No user logged in - waiting for auth...");
      return;
    }

    try {
      console.log("=== LOADING PROFILE ===");
      console.log("User UID:", currentUser.uid);
      console.log("User Email:", currentUser.email);

      // First, try to load from users/{uid}
      let snap = await getDoc(doc(db, "users", currentUser.uid));

      if (snap.exists()) {
        const data = snap.data();
        console.log("✅ Found document at users/" + currentUser.uid);
        console.log("Document data:", JSON.stringify(data, null, 2));

        // Load all data from the document
        setProfileImage(data.photoURL || null);
        setDisplayName(data.displayName || data.name || "");
        setBio(data.bio || "");
        setPhoneNumber(data.phoneNumber || "");
        setLocation(data.location || "");
        setDateOfBirth(data.dateOfBirth || "");
        setAccountCreatedDate(data.createdAt?.toDate() || null);

        const settings = (data.settings as Record<string, any>) || {};
        setNotificationsEnabled(
          settings.notifications ?? data.notificationsEnabled ?? true,
        );
        setRemindersEnabled(
          settings.dailyReminder ?? data.remindersEnabled ?? true,
        );
        setDarkModeEnabled(settings.darkMode ?? data.darkModeEnabled ?? false);
        setSoundEnabled(settings.soundEnabled ?? data.soundEnabled ?? true);

        console.log("✅ Profile loaded successfully");
        return;
      }

      // Document doesn't exist at users/{uid}, try email-based lookup
      console.log("⚠️ No document at users/" + currentUser.uid);

      if (currentUser.email) {
        console.log("🔍 Searching for user by email:", currentUser.email);

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", currentUser.email));
        const emailSnap = await getDocs(q);

        console.log("📧 Email query returned", emailSnap.size, "documents");

        if (!emailSnap.empty) {
          const emailDoc = emailSnap.docs[0];
          const foundDocId = emailDoc.id;
          const data = emailDoc.data();

          console.log("✅ Found user document by email!");
          console.log("Document ID:", foundDocId);
          console.log("Document data:", JSON.stringify(data, null, 2));

          // Migrate data to users/{uid}
          console.log("📦 Migrating data to users/" + currentUser.uid);
          await setDoc(
            doc(db, "users", currentUser.uid),
            {
              ...data,
              email: currentUser.email,
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );

          console.log("✅ Migration complete!");

          // Load the migrated data
          setProfileImage(data.photoURL || null);
          setDisplayName(data.displayName || data.name || "");
          setBio(data.bio || "");
          setPhoneNumber(data.phoneNumber || "");
          setLocation(data.location || "");
          setDateOfBirth(data.dateOfBirth || "");
          setAccountCreatedDate(data.createdAt?.toDate() || null);

          const settings = (data.settings as Record<string, any>) || {};
          setNotificationsEnabled(
            settings.notifications ?? data.notificationsEnabled ?? true,
          );
          setRemindersEnabled(
            settings.dailyReminder ?? data.remindersEnabled ?? true,
          );
          setDarkModeEnabled(
            settings.darkMode ?? data.darkModeEnabled ?? false,
          );
          setSoundEnabled(settings.soundEnabled ?? data.soundEnabled ?? true);

          console.log("✅ Profile loaded from migrated data");
          return;
        }

        console.log("⚠️ No documents found by email query");
      }

      // No existing data found, create new user document
      console.log("📝 Creating new user document");
      await setDoc(
        doc(db, "users", currentUser!.uid),
        {
          displayName: currentUser?.displayName || "",
          email: currentUser?.email || "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      // Load from Firebase Auth
      setProfileImage(currentUser?.photoURL || null);
      setDisplayName(currentUser?.displayName || "");
      console.log("✅ New user document created");
    } catch (error) {
      console.error("❌ Profile load error:", error);
      Alert.alert(
        "Error",
        "Failed to load profile. Check console for details.",
      );
    }
  }, [user?.uid]);

  // Load profile from Firestore (with fallback to Firebase Auth)
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser?.uid) return;

    const docRef = doc(db, "users", currentUser.uid);
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();

        setBio(data.bio || "");
        setPhoneNumber(data.phoneNumber || "");
        setLocation(data.location || "");
        setDateOfBirth(data.dateOfBirth || "");
        setAccountCreatedDate(data.createdAt?.toDate() || null);

        const settings = (data.settings as Record<string, any>) || {};
        setNotificationsEnabled(
          settings.notifications ?? data.notificationsEnabled ?? true,
        );
        setRemindersEnabled(
          settings.dailyReminder ?? data.remindersEnabled ?? true,
        );
        setDarkModeEnabled(settings.darkMode ?? data.darkModeEnabled ?? false);
        setSoundEnabled(settings.soundEnabled ?? data.soundEnabled ?? true);

        if (data.photoURL) {
          setProfileImage(data.photoURL);
        }
        if (data.displayName) {
          setDisplayName(data.displayName);
        }
      },
      (error) => {
        console.error("Profile realtime listener error:", error);
      },
    );

    return () => unsub();
  }, [user]);

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
      const result = await setDoc(
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

      Alert.alert("Success", "Profile picture updated successfully!");
    } catch (error: any) {
      console.error("✗ Upload Error:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack,
      });
      Alert.alert(
        "Upload failed",
        error.message || "Failed to upload profile picture. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  // Update display name
  const handleUpdateProfile = async () => {
    const currentUser = auth.currentUser;

    if (!displayName.trim()) {
      Alert.alert("Error", "Please enter a name");
      return;
    }

    if (!currentUser) {
      Alert.alert("Error", "No user logged in");
      return;
    }

    try {
      setUploading(true);
      console.log("Updating profile for user:", currentUser.uid);

      // Update Firebase Auth
      await updateProfile(currentUser, { displayName: displayName.trim() });
      console.log("✓ Firebase Auth displayName updated");

      // Reload user
      await currentUser.reload();
      console.log("✓ Firebase Auth user reloaded");

      // Save to Firestore
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          displayName: displayName.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      console.log("✓ Firestore displayName saved");

      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      Alert.alert(
        "Error updating profile",
        error.message || "Something went wrong",
      );
    } finally {
      setUploading(false);
    }
  };

  // Update bio
  const handleUpdateBio = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "No user logged in");
      return;
    }

    if (!bio.trim()) {
      Alert.alert("Error", "Bio cannot be empty");
      return;
    }

    try {
      setUploading(true);
      console.log("Saving bio to Firestore for user:", currentUser.uid);
      const trimmedBio = bio.trim();

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          bio: trimmedBio,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      const savedSnap = await getDoc(doc(db, "users", currentUser.uid));
      const savedBio = savedSnap.exists() ? savedSnap.data().bio : null;
      if (savedBio !== trimmedBio) {
        throw new Error("Bio save confirmation failed");
      }

      console.log("✓ Bio saved successfully:", savedBio);
      setBio(savedBio || "");
      await currentUser.reload();
      console.log("✓ User data reloaded");
      setIsEditingBio(false);
      Alert.alert("Success", "Bio saved to Firebase successfully!");
    } catch (error: any) {
      console.error("Error saving bio:", error);
      Alert.alert("Error", error.message || "Failed to save bio");
    } finally {
      setUploading(false);
    }
  };

  // Update contact info
  const handleUpdateContact = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "No user logged in");
      return;
    }

    // Validate at least one field is filled
    if (!phoneNumber.trim() && !location.trim() && !dateOfBirth.trim()) {
      Alert.alert("Error", "Please fill in at least one contact field");
      return;
    }

    try {
      setUploading(true);
      console.log(
        "Saving contact info to Firestore for user:",
        currentUser.uid,
      );
      const trimmedPhone = phoneNumber.trim();
      const trimmedLocation = location.trim();
      const trimmedDob = dateOfBirth.trim();

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          phoneNumber: trimmedPhone,
          location: trimmedLocation,
          dateOfBirth: trimmedDob,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      const savedSnap = await getDoc(doc(db, "users", currentUser.uid));
      const savedData = savedSnap.exists() ? savedSnap.data() : null;
      const savedPhone = savedData?.phoneNumber || "";
      const savedLocation = savedData?.location || "";
      const savedDob = savedData?.dateOfBirth || "";

      if (
        savedPhone !== trimmedPhone ||
        savedLocation !== trimmedLocation ||
        savedDob !== trimmedDob
      ) {
        throw new Error("Contact info save confirmation failed");
      }

      console.log("✓ Contact info saved successfully");
      setPhoneNumber(savedPhone);
      setLocation(savedLocation);
      setDateOfBirth(savedDob);
      await currentUser.reload();
      console.log("✓ User data reloaded");
      setIsEditingContact(false);
      Alert.alert("Success", "Contact information saved to Firebase!");
    } catch (error: any) {
      console.error("Error saving contact info:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to save contact information",
      );
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

  // Toggle Settings
  const handleToggleSetting = async (
    settingName: string,
    currentValue: boolean,
    setter: (value: boolean) => void,
  ) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Error", "No user logged in");
      return;
    }

    try {
      const newValue = !currentValue;
      setter(newValue);

      const settingsUpdate: Record<string, boolean> = {};
      if (settingName === "notificationsEnabled") {
        settingsUpdate.notifications = newValue;
      }
      if (settingName === "remindersEnabled") {
        settingsUpdate.dailyReminder = newValue;
      }
      if (settingName === "darkModeEnabled") {
        settingsUpdate.darkMode = newValue;
      }
      if (settingName === "soundEnabled") {
        settingsUpdate.soundEnabled = newValue;
      }

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          [settingName]: newValue,
          settings: settingsUpdate,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      console.log(`✓ ${settingName} updated to:`, newValue);
    } catch (error: any) {
      console.error(`Error updating ${settingName}:`, error);
      setter(currentValue); // Revert on error
      Alert.alert("Error", `Failed to update ${settingName}`);
    }
  };

  // Privacy & Security
  const handlePrivacySecurity = () => {
    Alert.alert("Privacy & Security", "Choose an option", [
      {
        text: "Change Password",
        onPress: () => {
          Alert.alert(
            "Change Password",
            "A password reset link will be sent to your email.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Send Link",
                onPress: async () => {
                  try {
                    const { sendPasswordResetEmail } =
                      await import("firebase/auth");
                    if (user?.email) {
                      await sendPasswordResetEmail(auth, user.email);
                      Alert.alert(
                        "Success",
                        `Password reset email sent to ${user.email}`,
                      );
                    }
                  } catch (error: any) {
                    Alert.alert("Error", error.message);
                  }
                },
              },
            ],
          );
        },
      },
      {
        text: "Data Privacy",
        onPress: () => {
          Alert.alert(
            "Data Privacy",
            "Your data is encrypted and stored securely. We never share your personal information with third parties. All journal entries are private and only accessible by you.",
          );
        },
      },
      {
        text: "Account Visibility",
        onPress: () => {
          Alert.alert(
            "Account Visibility",
            "Your account is private by default. Only you can see your journals, tasks, and personal information.",
          );
        },
      },
      {
        text: "Two-Factor Authentication",
        onPress: () => {
          Alert.alert(
            "Two-Factor Authentication",
            "Enhanced security feature coming soon! This will add an extra layer of protection to your account.",
          );
        },
      },
      { text: "Close", style: "cancel" },
    ]);
  };

  // Help & Support
  const handleHelpSupport = () => {
    Alert.alert("Help & Support", "How can we help you?", [
      {
        text: "Contact Support",
        onPress: () => {
          Alert.alert(
            "Contact Support",
            "Email: support@soulnotes.com\n\nOur team will respond within 24 hours.",
            [{ text: "OK" }],
          );
        },
      },
      {
        text: "Report a Bug",
        onPress: () => {
          Alert.alert(
            "Report a Bug",
            "Please email us at bugs@soulnotes.com with:\n\n• Description of the issue\n• Steps to reproduce\n• Screenshots (if applicable)\n\nThank you for helping us improve!",
          );
        },
      },
      {
        text: "FAQ",
        onPress: () => {
          Alert.alert(
            "Frequently Asked Questions",
            "Q: How do I backup my data?\nA: Your data is automatically backed up to the cloud.\n\nQ: Can I export my journals?\nA: Export feature coming soon!\n\nQ: Is my data secure?\nA: Yes! All data is encrypted and stored securely.",
          );
        },
      },
      {
        text: "App Info",
        onPress: () => {
          Alert.alert(
            "SoulNotes",
            "Version: 1.0.0\n\nA mindful journaling app to track your thoughts, emotions, and daily life.\n\n© 2026 SoulNotes. All rights reserved.",
          );
        },
      },
      { text: "Close", style: "cancel" },
    ]);
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
                editable={!uploading}
                style={{
                  backgroundColor: "#F3F4F6",
                  borderRadius: 16,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 16,
                }}
              />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={() => setIsEditing(false)}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    backgroundColor: "#E5E7EB",
                    paddingVertical: 12,
                    borderRadius: 16,
                    alignItems: "center",
                    opacity: uploading ? 0.5 : 1,
                  }}
                >
                  <Text style={{ color: "#374151", fontWeight: "600" }}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleUpdateProfile}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    backgroundColor: "#10B981",
                    paddingVertical: 12,
                    borderRadius: 16,
                    alignItems: "center",
                    opacity: uploading ? 0.5 : 1,
                  }}
                >
                  {uploading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      Save
                    </Text>
                  )}
                </Pressable>
              </View>
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
                editable={!uploading}
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
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={() => setIsEditingBio(false)}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    backgroundColor: "#E5E7EB",
                    paddingVertical: 12,
                    borderRadius: 16,
                    alignItems: "center",
                    opacity: uploading ? 0.5 : 1,
                  }}
                >
                  <Text style={{ color: "#374151", fontWeight: "600" }}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleUpdateBio}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    backgroundColor: "#10B981",
                    paddingVertical: 12,
                    borderRadius: 16,
                    alignItems: "center",
                    opacity: uploading ? 0.5 : 1,
                  }}
                >
                  {uploading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      Save
                    </Text>
                  )}
                </Pressable>
              </View>
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
                  editable={!uploading}
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
                  editable={!uploading}
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
                  editable={!uploading}
                  style={{
                    backgroundColor: "#F3F4F6",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={() => setIsEditingContact(false)}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    backgroundColor: "#E5E7EB",
                    paddingVertical: 12,
                    borderRadius: 16,
                    alignItems: "center",
                    opacity: uploading ? 0.5 : 1,
                  }}
                >
                  <Text style={{ color: "#374151", fontWeight: "600" }}>
                    Cancel
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleUpdateContact}
                  disabled={uploading}
                  style={{
                    flex: 1,
                    backgroundColor: "#10B981",
                    paddingVertical: 12,
                    borderRadius: 16,
                    alignItems: "center",
                    opacity: uploading ? 0.5 : 1,
                  }}
                >
                  {uploading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontWeight: "600" }}>
                      Save
                    </Text>
                  )}
                </Pressable>
              </View>
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
            <Text style={{ color: "#6B7280", fontSize: 14, fontWeight: "500" }}>
              Login Email
            </Text>
            <Text style={{ color: "#374151", marginTop: 4, fontSize: 15 }}>
              {user?.email || auth.currentUser?.email || "Not available"}
            </Text>
          </View>

          <View style={{ marginBottom: 12 }}>
            <Text
              style={{
                color: "#6B7280",
                marginTop: 4,
                fontSize: 12,
                fontFamily: "monospace",
              }}
              numberOfLines={1}
              ellipsizeMode="middle"
            ></Text>
          </View>

          {accountCreatedDate && (
            <View style={{ marginBottom: 12 }}>
              <Text
                style={{ color: "#6B7280", fontSize: 14, fontWeight: "500" }}
              >
                Member Since
              </Text>
              <Text style={{ color: "#374151", marginTop: 4, fontSize: 15 }}>
                {accountCreatedDate.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
          )}

          <View>
            <Text style={{ color: "#6B7280", fontSize: 14, fontWeight: "500" }}>
              Account Status
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: "#10B981",
                  marginRight: 8,
                }}
              />
              <Text
                style={{ color: "#10B981", fontSize: 15, fontWeight: "600" }}
              >
                Active
              </Text>
            </View>
          </View>
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

          {/* Push Notifications */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
            }}
          >
            <Ionicons name="notifications-outline" size={20} color="#6B7280" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: "#374151", fontWeight: "600" }}>
                Push Notifications
              </Text>
              <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>
                Receive updates and alerts
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={() =>
                handleToggleSetting(
                  "notificationsEnabled",
                  notificationsEnabled,
                  setNotificationsEnabled,
                )
              }
              trackColor={{ false: "#D1D5DB", true: "#86EFAC" }}
              thumbColor={notificationsEnabled ? "#10B981" : "#f4f3f4"}
            />
          </View>

          {/* Reminders */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
            }}
          >
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: "#374151", fontWeight: "600" }}>
                Daily Reminders
              </Text>
              <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>
                Get reminded to journal daily
              </Text>
            </View>
            <Switch
              value={remindersEnabled}
              onValueChange={() =>
                handleToggleSetting(
                  "remindersEnabled",
                  remindersEnabled,
                  setRemindersEnabled,
                )
              }
              trackColor={{ false: "#D1D5DB", true: "#86EFAC" }}
              thumbColor={remindersEnabled ? "#10B981" : "#f4f3f4"}
            />
          </View>

          {/* Dark Mode */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
            }}
          >
            <Ionicons name="moon-outline" size={20} color="#6B7280" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: "#374151", fontWeight: "600" }}>
                Dark Mode
              </Text>
              <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>
                Enable dark theme
              </Text>
            </View>
            <Switch
              value={darkModeEnabled}
              onValueChange={() =>
                handleToggleSetting(
                  "darkModeEnabled",
                  darkModeEnabled,
                  setDarkModeEnabled,
                )
              }
              trackColor={{ false: "#D1D5DB", true: "#86EFAC" }}
              thumbColor={darkModeEnabled ? "#10B981" : "#f4f3f4"}
            />
          </View>

          {/* Sound */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
            }}
          >
            <Ionicons name="volume-high-outline" size={20} color="#6B7280" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: "#374151", fontWeight: "600" }}>
                Sound Effects
              </Text>
              <Text style={{ color: "#6B7280", fontSize: 12, marginTop: 2 }}>
                Enable app sounds
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={() =>
                handleToggleSetting(
                  "soundEnabled",
                  soundEnabled,
                  setSoundEnabled,
                )
              }
              trackColor={{ false: "#D1D5DB", true: "#86EFAC" }}
              thumbColor={soundEnabled ? "#10B981" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Privacy & Security */}
        <View>
          <Pressable
            onPress={handlePrivacySecurity}
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
        </View>

        {/* Help & Support */}
        <Pressable
          onPress={handleHelpSupport}
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
