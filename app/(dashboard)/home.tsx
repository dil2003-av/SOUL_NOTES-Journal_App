﻿import { useLoader } from "@/hooks/useLoader";
import { logout } from "@/services/authService";
import { auth, db } from "@/services/firebase";
import {
  getJournalEntries,
  JournalEntry,
  updateJournalEntryComplete,
} from "@/services/journalService";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import {
  collection,
  doc,
  updateDoc,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Task {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
}

const MOOD_EMOJIS = ["😊", "😢", "😡", "😰", "😴", "🤩", "😌", "🤔"];

const Home = () => {
  const router = useRouter();
  const { showLoader, hideLoader, isLoading } = useLoader();

  const [userName, setUserName] = useState("");
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUserName(currentUser.displayName || "User");
    }
    fetchJournalEntries();
   
  }, []);



  const handleToggleTaskComplete = async (task: Task) => {
    try {
      const taskDoc = doc(db, "tasks", task.id);
      await updateDoc(taskDoc, { isComplete: !task.isComplete });

      // Calculate new state first
      const updatedTasks = tasks.map((t) =>
        t.id === task.id ? { ...t, isComplete: !t.isComplete } : t,
      );

      // Update all state at once
      setTasks(updatedTasks);

      // Count both completed tasks and completed journal entries
      const completedTasksCount = updatedTasks.filter(
        (t) => t.isComplete,
      ).length;
      const completedEntriesCount = journalEntries.filter(
        (e) => e.isComplete,
      ).length;
      const totalCompleted = completedTasksCount + completedEntriesCount;

      setCompletedTasks(totalCompleted);

      if (!task.isComplete) {
        Alert.alert("✅ Great!", `"${task.title}" marked as complete!`);
      }
    } catch (error) {
      console.error("Error updating task:", error);
      Alert.alert("Error", "Failed to update task");
    }
  };

  const handleToggleJournalComplete = async (entry: JournalEntry) => {
    try {
      const newStatus = !(entry.isComplete || false);
      await updateJournalEntryComplete(entry.id, newStatus);

      // Update local state immediately
      const updatedEntries = journalEntries.map((e) =>
        e.id === entry.id ? { ...e, isComplete: newStatus } : e,
      );
      setJournalEntries(updatedEntries);

      // Update stats - count both completed tasks and completed journal entries
      const completedTasksCount = tasks.filter((t) => t.isComplete).length;
      const completedEntriesCount = updatedEntries.filter(
        (e) => e.isComplete,
      ).length;
      const totalCompleted = completedTasksCount + completedEntriesCount;

      setCompletedTasks(totalCompleted);

      if (newStatus) {
        Alert.alert("✅ Marked!", `"${entry.title}" completed!`);
      }
    } catch (error) {
      console.error("Error updating journal entry:", error);
      Alert.alert("Error", "Failed to mark journal entry");
    }
  };

  // Auto-refresh when screen comes into focus (after saving a new entry)
  useFocusEffect(
    useCallback(() => {
      fetchJournalEntries();
     
    }, []),
  );

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
    router.push({
      pathname: "./journal-detail",
      params: { id: entry.id },
    });
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
      <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
        <MaterialIcons name="description" size={40} color="#22C55E" />
      </View>
      <Text className="text-xl font-bold text-gray-900 mb-2">
        📓 No Entries Yet
      </Text>
      <Text className="text-gray-500 text-center text-base leading-6">
        Start your journaling journey by tapping the + button below to create
        your first entry
      </Text>
      <View className="mt-6 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
        <Text className="text-green-700 text-xs font-medium text-center">
          💡 Your entries will appear here after saving
        </Text>
      </View>
    </View>
  );

  const renderJournalEntry = ({ item }: { item: JournalEntry }) =>
    (() => {
      const mood = MOOD_EMOJIS.find((m) => item.content.startsWith(m));
      const previewContent = mood
        ? item.content.replace(mood, "").trimStart()
        : item.content;
      const displayMood = mood || "📝";
      return (
        <Pressable
          onPress={() => handleEntryPress(item)}
          className={`rounded-2xl p-5 mb-4 border ${
            item.isComplete
              ? "bg-green-50 border-green-200"
              : "bg-white border-gray-100"
          }`}
          style={{
            elevation: 3,
            shadowColor: "#000",
            shadowOpacity: 0.1,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <View className="flex-row items-start justify-between mb-3">
            {/* Checkbox */}
            <TouchableOpacity
              onPress={() => handleToggleJournalComplete(item)}
              className="mr-2 mt-1"
            >
              <View
                className={`w-5 h-5 rounded-md border-2 items-center justify-center ${
                  item.isComplete
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300 bg-white"
                }`}
              >
                {item.isComplete && (
                  <MaterialIcons name="check" size={14} color="#fff" />
                )}
              </View>
            </TouchableOpacity>

            <View className="flex-1 pr-3">
              <Text
                className={`text-lg font-bold mb-1 ${
                  item.isComplete
                    ? "text-gray-400 line-through"
                    : "text-gray-900"
                }`}
                numberOfLines={2}
              >
                {displayMood} {item.title}
              </Text>
              <View className="flex-row items-center gap-1">
                <MaterialIcons
                  name="calendar-today"
                  size={14}
                  color="#6B7280"
                />
                <Text className="text-xs text-gray-500 font-medium">
                  {formatDate(item.date)}
                </Text>
              </View>
            </View>
            <View className="px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
              <MaterialIcons name="arrow-forward" size={16} color="#22C55E" />
            </View>
          </View>
          <Text
            className={`text-sm leading-5 ${
              item.isComplete ? "text-gray-400" : "text-gray-600"
            }`}
            numberOfLines={3}
          >
            {previewContent}
          </Text>
          <View className="flex-row items-center gap-1 mt-3 pt-3 border-t border-gray-100">
            <MaterialIcons name="description" size={12} color="#9CA3AF" />
            <Text className="text-xs text-gray-400">
              {previewContent.length} characters
            </Text>
          </View>
        </Pressable>
      );
    })();

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
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-gray-600 text-sm font-medium mb-1">
              {getGreeting()}
            </Text>
            <Text className="text-gray-900 text-2xl font-bold">
              Hello {userName} 🌙
            </Text>
          </View>
          <Pressable
            onPress={handleLogout}
            className="bg-gray-100 rounded-full p-2.5 active:bg-gray-200 border border-gray-200"
          >
            <MaterialIcons name="logout" size={20} color="#6B7280" />
          </Pressable>
        </View>
        <View className="flex-row items-center mt-2">
          <Text className="text-gray-600 text-sm">
            📔 {journalEntries.length}{" "}
            {journalEntries.length === 1 ? "entry" : "entries"} in your journal
          </Text>
        </View>

        {/* Task Stats */}
        <View className="flex-row gap-4 mt-4">
          <View className="flex-1 bg-blue-50 rounded-lg p-3 border border-blue-200">
            <Text className="text-blue-700 font-bold text-lg">
              {completedTasks}/{tasks.length + journalEntries.length}
            </Text>
            <Text className="text-blue-600 text-xs font-medium">Completed</Text>
          </View>
          <View className="flex-1 bg-purple-50 rounded-lg p-3 border border-purple-200">
            <Text className="text-purple-700 font-bold text-lg">
              {journalEntries.length}
            </Text>
            <Text className="text-purple-600 text-xs font-medium">
              Total Entries
            </Text>
          </View>
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
          ListHeaderComponent={
            <>
              {achievements.length > 0 && (
                <View
                  className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-4 mb-6 border-2 border-yellow-300"
                  style={{
                    elevation: 2,
                    shadowColor: "#FCD34D",
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 2 },
                  }}
                >
                  <View className="flex-row items-center gap-2 mb-3">
                    <Text className="text-2xl">🏆</Text>
                    <Text className="text-lg font-bold text-orange-900">
                      New Achievements!
                    </Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="gap-2"
                  >
                    {achievements.map((achievement, index) => (
                      <View
                        key={index}
                        className="bg-white rounded-lg px-4 py-2 border border-yellow-200 mr-2"
                        style={{
                          elevation: 1,
                          shadowColor: "#000",
                          shadowOpacity: 0.05,
                          shadowRadius: 4,
                        }}
                      >
                        <Text className="text-sm font-semibold text-yellow-900">
                          {achievement}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {tasks.length > 0 && (
                <View className="mb-6">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-lg font-bold text-gray-900">
                      📋 Today's Tasks
                    </Text>
                    <Pressable
                      onPress={() => router.push("/(dashboard)/tasks")}
                    >
                      <Text className="text-blue-600 font-semibold text-sm">
                        View All
                      </Text>
                    </Pressable>
                  </View>

                  {tasks.map((task) => (
                    <Pressable
                      key={task.id}
                      onPress={() => handleToggleTaskComplete(task)}
                      className={`rounded-xl p-3 mb-2 flex-row items-center gap-3 border ${
                        task.isComplete
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200"
                      }`}
                      style={{
                        elevation: 1,
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                      }}
                    >
                      {/* Checkbox */}
                      <View
                        className={`w-5 h-5 rounded-md border-2 items-center justify-center ${
                          task.isComplete
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {task.isComplete && (
                          <MaterialIcons name="check" size={14} color="#fff" />
                        )}
                      </View>

                      {/* Task Title */}
                      <View className="flex-1">
                        <Text
                          className={`font-semibold ${
                            task.isComplete
                              ? "text-gray-400 line-through"
                              : "text-gray-800"
                          }`}
                          numberOfLines={1}
                        >
                          {task.title}
                        </Text>
                      </View>

                      {/* Arrow */}
                      <MaterialIcons
                        name={
                          task.isComplete
                            ? "check-circle"
                            : "radio-button-unchecked"
                        }
                        size={20}
                        color={task.isComplete ? "#10B981" : "#D1D5DB"}
                      />
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          }
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
          shadowColor: "#22C55E",
          shadowOpacity: 0.3,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <MaterialIcons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

export default Home;