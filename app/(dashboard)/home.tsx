import { useLoader } from "@/hooks/useLoader";
import { logout } from "@/services/authService";
import { auth } from "@/services/firebase";
import { getJournalEntries, JournalEntry } from "@/services/journalService";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const Home = () => {
  const router = useRouter();
  const { showLoader, hideLoader, isLoading } = useLoader();

  const [userName, setUserName] = useState("");
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Fetch user's name from Firebase auth
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserName(currentUser.displayName || "User");
    }
    fetchJournalEntries();
  }, []);

  const fetchJournalEntries = async () => {
    try {
      showLoader();
      const entries = await getJournalEntries();
      setJournalEntries(entries);
    } catch (error) {
      Alert.alert("Error", "Failed to load journal entries");
    } finally {
      hideLoader();
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJournalEntries();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/(auth)/login");
          } catch (error) {
            Alert.alert("Error", "Failed to logout");
          }
        },
      },
    ]);
  };

  const handleEntryPress = (entry: JournalEntry) => {
    router.push(`./entry/${entry.id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-8 py-20">
      <Text className="text-7xl mb-4">📝</Text>
      <Text className="text-xl font-bold text-gray-900 mb-2">
        No Entries Yet
      </Text>
      <Text className="text-gray-500 text-center text-base">
        Start your journaling journey by adding your first note
      </Text>
    </View>
  );

  const renderJournalEntry = ({ item }: { item: JournalEntry }) => (
    <Pressable
      onPress={() => handleEntryPress(item)}
      className="bg-white rounded-2xl p-5 mb-4 border border-gray-100 active:bg-gray-50"
      style={{
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View className="flex-row items-start justify-between mb-3">
        <Text
          className="text-lg font-bold text-gray-900 flex-1 pr-3"
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <View className="px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
          <Text className="text-xs text-green-700 font-semibold">
            {formatDate(item.date)}
          </Text>
        </View>
      </View>
      <Text className="text-gray-600 text-sm leading-5" numberOfLines={2}>
        {item.content}
      </Text>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View
        className="bg-white pt-14 pb-6 px-5 border-b border-gray-200"
        style={{
          elevation: 4,
          shadowColor: "#000",
          shadowOpacity: 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-1">
            <Text className="text-gray-600 text-sm font-medium mb-1">
              {getGreeting()}
            </Text>
            <Text className="text-gray-900 text-2xl font-bold">
              Hello {userName} 🌙
            </Text>
          </View>
          <Pressable
            onPress={handleLogout}
            className="bg-gray-100 rounded-full px-4 py-2.5 active:bg-gray-200 border border-gray-200"
          >
            <Text className="text-gray-700 font-semibold text-sm">Logout</Text>
          </Pressable>
        </View>
        <View className="flex-row items-center mt-2">
          <View className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
          <Text className="text-gray-600 text-sm">
            {journalEntries.length}{" "}
            {journalEntries.length === 1 ? "entry" : "entries"} in your journal
          </Text>
        </View>
      </View>

      {/* Journal Entries List */}
      {isLoading && journalEntries.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#22C55E" />
          <Text className="text-gray-500 mt-4 font-medium">
            Loading your journal...
          </Text>
        </View>
      ) : (
        <FlatList
          data={journalEntries}
          renderItem={renderJournalEntry}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 100,
            flexGrow: 1,
          }}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#22C55E"]}
              tintColor="#22C55E"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Add Button */}
      <TouchableOpacity
        onPress={() => router.push("./add-entry")}
        className="absolute bottom-8 right-6 bg-green-600 rounded-full w-16 h-16 items-center justify-center active:bg-green-700 border-2 border-white"
        style={{
          elevation: 8,
          shadowColor: "#000",
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <Text className="text-white text-3xl font-bold">➕</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Home;
