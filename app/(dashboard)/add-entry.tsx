import { useLoader } from "@/hooks/useLoader";
import { createJournalEntry } from "@/services/journalService";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

const MOOD_EMOJIS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😡", label: "Angry" },
  { emoji: "😰", label: "Anxious" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🤩", label: "Excited" },
  { emoji: "😌", label: "Calm" },
  { emoji: "🤔", label: "Thoughtful" },
];

export default function AddEntry() {
  const router = useRouter();
  const { showLoader, hideLoader, isLoading } = useLoader();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [showCalendar, setShowCalendar] = useState(false);

  const handleAddEntry = async () => {
    if (isLoading) {
      return;
    }

    if (!title.trim()) {
      Alert.alert("Validation Error", "Please enter a title");
      return;
    }

    if (!content.trim()) {
      Alert.alert("Validation Error", "Please enter content");
      return;
    }

    showLoader();

    try {
      const entryData = {
        title: title.trim(),
        content: content.trim(),
        date,
        mood: selectedMood,
      };
      await createJournalEntry(
        entryData.title,
        entryData.content,
        entryData.date,
      );
      Alert.alert("Success", "Journal entry created successfully!");
      // Refresh the home page and go back
      router.replace("/(dashboard)/home");
    } catch (err) {
      console.error("Error creating entry:", err);
      Alert.alert("Error", "Failed to create journal entry. Please try again.");
    } finally {
      hideLoader();
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  };

  const handleDateChange = (increment: number) => {
    const currentDate = new Date(date + "T00:00:00");
    currentDate.setDate(currentDate.getDate() + increment);
    setDate(currentDate.toISOString().split("T")[0]);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-gray-600 text-sm font-medium mb-1">
                Create New Entry
              </Text>
              <Text className="text-gray-900 text-2xl font-bold">
                Write Your Thoughts ✍️
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              className="bg-gray-100 rounded-full w-10 h-10 items-center justify-center active:bg-gray-200 border border-gray-200"
            >
              <Text className="text-gray-700 font-bold text-lg">✕</Text>
            </Pressable>
          </View>
        </View>

        {/* Form */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          className="px-5 py-6"
          showsVerticalScrollIndicator={false}
        >
          <View
            className="bg-white rounded-3xl p-6 mb-6 border border-gray-100"
            style={{
              elevation: 2,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 8,
            }}
          >
            {/* Title Field */}
            <View className="mb-5">
              <Text className="text-gray-900 font-bold mb-2 text-base">
                Title
              </Text>
              <View className="border-2 border-gray-200 rounded-2xl px-4 py-3 bg-gray-50">
                <TextInput
                  placeholder="Give your entry a title"
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 text-base"
                  value={title}
                  onChangeText={setTitle}
                  editable={!isLoading}
                  maxLength={100}
                />
              </View>
              <Text className="text-gray-400 text-xs mt-1.5">
                {title.length}/100 characters
              </Text>
            </View>

            {/* Date Picker with Calendar Modal */}
            <View className="mb-5">
              <Text className="text-gray-900 font-bold mb-2 text-base">
                Date
              </Text>
              <TouchableOpacity
                onPress={() => setShowCalendar(true)}
                disabled={isLoading}
                className="border-2 border-gray-200 rounded-2xl px-4 py-3 bg-gray-50 active:bg-gray-100"
              >
                <Text className="text-gray-900 text-base font-semibold text-center">
                  📅 {formatDateForDisplay(date)}
                </Text>
              </TouchableOpacity>
              <Text className="text-gray-400 text-xs mt-1.5 text-center">
                Tap to select a date
              </Text>
            </View>

            {/* Calendar Modal */}
            <Modal
              visible={showCalendar}
              transparent
              animationType="fade"
              onRequestClose={() => setShowCalendar(false)}
            >
              <View className="flex-1 bg-black/50 justify-center items-center p-4">
                <View className="bg-white rounded-3xl p-6 w-full max-w-md">
                  <Text className="text-lg font-bold text-gray-800 mb-4 text-center">
                    Select Date
                  </Text>
                  <Calendar
                    onDayPress={(day: any) => {
                      setDate(day.dateString);
                      setShowCalendar(false);
                    }}
                    markedDates={{
                      [date]: {
                        selected: true,
                        marked: true,
                        selectedColor: "#16a34a",
                      },
                    }}
                    theme={{
                      backgroundColor: "#ffffff",
                      calendarBackground: "#ffffff",
                      textSectionTitleColor: "#b6c1cd",
                      textSectionTitleDisabledColor: "#d9e1e8",
                      selectedDayBackgroundColor: "#16a34a",
                      selectedDayTextColor: "#ffffff",
                      todayTextColor: "#3B82F6",
                      dayTextColor: "#2d3436",
                      textDisabledColor: "#d9e1e8",
                      dotColor: "#16a34a",
                      selectedDotColor: "#ffffff",
                      arrowColor: "#16a34a",
                      disabledArrowColor: "#d9e1e8",
                      monthTextColor: "#2d3436",
                      indicatorColor: "#16a34a",
                      textDayFontFamily: "System",
                      textMonthFontSize: 16,
                      textDayHeaderFontSize: 13,
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowCalendar(false)}
                    className="mt-4 py-3 bg-gray-200 rounded-xl active:bg-gray-300"
                  >
                    <Text className="text-center text-gray-800 font-semibold">
                      Close
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {/* Mood Selector */}
            <View className="mb-5">
              <Text className="text-gray-900 font-bold mb-3 text-base">
                How are you feeling?
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {MOOD_EMOJIS.map((mood) => (
                  <Pressable
                    key={mood.emoji}
                    onPress={() => setSelectedMood(mood.emoji)}
                    className={`px-4 py-3 rounded-xl border-2 ${
                      selectedMood === mood.emoji
                        ? "bg-green-50 border-green-500"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <Text className="text-2xl">{mood.emoji}</Text>
                  </Pressable>
                ))}
              </View>
              {selectedMood && (
                <View className="mt-2 flex-row items-center">
                  <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <Text className="text-gray-600 text-sm">
                    Mood: {selectedMood}{" "}
                    {MOOD_EMOJIS.find((m) => m.emoji === selectedMood)?.label}
                  </Text>
                </View>
              )}
            </View>

            {/* Content Field */}
            <View className="mb-4">
              <Text className="text-gray-900 font-bold mb-2 text-base">
                Content
              </Text>
              <View
                className="border-2 border-gray-200 rounded-2xl px-4 py-3 bg-gray-50"
                style={{ minHeight: 200 }}
              >
                <TextInput
                  placeholder="Write your thoughts here..."
                  placeholderTextColor="#9CA3AF"
                  className="text-gray-900 text-base flex-1"
                  value={content}
                  onChangeText={setContent}
                  editable={!isLoading}
                  multiline
                  textAlignVertical="top"
                  maxLength={5000}
                />
              </View>
              <Text className="text-gray-400 text-xs mt-1.5">
                {content.length}/5000 characters
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-4 mb-8">
            <TouchableOpacity
              onPress={() => router.back()}
              disabled={isLoading}
              className="flex-1 py-4 rounded-2xl border-2 border-gray-300 bg-white active:bg-gray-50"
            >
              <Text className="text-gray-700 text-center font-bold text-base">
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddEntry}
              disabled={isLoading}
              className={`flex-1 py-4 rounded-2xl flex-row items-center justify-center ${
                isLoading ? "bg-gray-400" : "bg-green-600 active:bg-green-700"
              }`}
              style={{
                elevation: 3,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 8,
              }}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text className="text-white text-center font-bold text-base ml-2">
                    Saving...
                  </Text>
                </>
              ) : (
                <Text className="text-white text-center font-bold text-base">
                  Save Entry ✓
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}
