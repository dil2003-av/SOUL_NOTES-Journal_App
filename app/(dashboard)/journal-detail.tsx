import { useLoader } from "@/hooks/useLoader";
import {
  deleteJournalEntry,
  getJournalEntry,
  updateJournalEntry,
} from "@/services/journalService";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
  Share,
} from "react-native";

import "../../global.css";

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

const JournalDetail = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { showLoader, hideLoader, isLoading } = useLoader();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  });
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetchJournal();
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (id) fetchJournal();
    }, [id]),
  );

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = content.length;
    setWordCount(words);
    setCharCount(chars);
  }, [content]);

  const safeISO = (d: Date) => {
    if (isNaN(d.getTime())) {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate(),
      ).padStart(2, "0")}`;
    }
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const normalizeDate = (value?: string) => {
    if (!value) return safeISO(new Date());
    const parsed = new Date(value + "T00:00:00");
    if (isNaN(parsed.getTime())) return safeISO(new Date());
    return safeISO(parsed);
  };

  const fetchJournal = async () => {
    try {
      setLoading(true);
      if (!id) throw new Error("Missing entry id");
      const entry = await getJournalEntry(id as string);
      setTitle(entry.title);

      const moodEmoji = MOOD_EMOJIS.find((m) =>
        entry.content.startsWith(m.emoji),
      );
      if (moodEmoji) {
        setSelectedMood(moodEmoji.emoji);
        setContent(entry.content.slice(moodEmoji.emoji.length).trim());
      } else {
        setContent(entry.content);
      }

      setDate(normalizeDate(entry.date));
    } catch (error) {
      Alert.alert("Error", "Failed to load journal entry");
      setDate(normalizeDate());
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const parsed = new Date((dateString || "") + "T00:00:00");
    if (isNaN(parsed.getTime())) return "";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return parsed.toLocaleDateString("en-US", options);
  };

  const handleDateChange = (increment: number) => {
    const currentDate = new Date((date || "") + "T00:00:00");
    if (isNaN(currentDate.getTime())) {
      setDate(normalizeDate());
      return;
    }
    currentDate.setDate(currentDate.getDate() + increment);
    setDate(safeISO(currentDate));
  };

  const handleUpdate = async () => {
    if (!title.trim() || !content.trim()) {
      Alert.alert("Validation Error", "Title and content cannot be empty");
      return;
    }

    try {
      showLoader();
      const finalContent = selectedMood
        ? `${selectedMood} ${content.trim()}`
        : content.trim();

      await updateJournalEntry(id as string, title.trim(), finalContent, date);
      Alert.alert("Success", "Journal entry updated successfully", [
        {
          text: "OK",
          onPress: () => {
            setIsEditing(false);
            fetchJournal();
          },
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to update journal entry");
    } finally {
      hideLoader();
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this entry? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              showLoader();
              await deleteJournalEntry(id as string);
              Alert.alert("Deleted", "Journal entry removed successfully", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              Alert.alert("Error", "Failed to delete journal entry");
              hideLoader();
            }
          },
        },
      ],
    );
  };

  const handleCancel = () => {
    if (!title.trim() && !content.trim()) {
      setIsEditing(false);
      return;
    }
    
    Alert.alert(
      "Discard Changes",
      "Are you sure you want to discard your changes?",
      [
        { text: "Keep Editing", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            fetchJournal();
            setIsEditing(false);
          },
        },
      ],
    );
  };

  const handleShare = async () => {
    try {
      const message = `${title}\n\n${content}\n\n📅 ${formatDate(date)}`;
      await Share.share({
        message: message,
        title: title,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share entry");
    }
  };

  const handleDuplicate = async () => {
    Alert.alert(
      "Duplicate Entry",
      "Create a copy of this entry?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Duplicate",
          onPress: () => {
            router.push({
              pathname: "./add-entry",
              params: { duplicateTitle: title, duplicateContent: content },
            });
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-gray-500 mt-4 font-medium">
          Loading journal entry...
        </Text>
      </View>
    );
  }

  const normalizedDate = normalizeDate(date);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View
          className="bg-white pt-14 pb-5 px-5 border-b border-gray-200"
          style={{
            elevation: 4,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
          }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <Pressable
              onPress={() => router.back()}
              className="bg-gray-100 rounded-full p-2.5 active:bg-gray-200 border border-gray-200"
            >
              <MaterialIcons name="arrow-back" size={22} color="#374151" />
            </Pressable>
            <Text className="text-gray-900 text-lg font-bold">
              {isEditing ? "Edit Entry" : "Journal Entry"}
            </Text>
            <View className="flex-row gap-2">
              {!isEditing && (
                <>
                  <Pressable
                    onPress={() => setIsFavorite(!isFavorite)}
                    className="bg-gray-100 rounded-full p-2.5 active:bg-gray-200 border border-gray-200"
                  >
                    <MaterialIcons 
                      name={isFavorite ? "star" : "star-border"} 
                      size={20} 
                      color={isFavorite ? "#F59E0B" : "#6B7280"} 
                    />
                  </Pressable>
                  <Pressable
                    onPress={handleShare}
                    className="bg-gray-100 rounded-full p-2.5 active:bg-gray-200 border border-gray-200"
                  >
                    <MaterialIcons name="share" size={20} color="#374151" />
                  </Pressable>
                </>
              )}
            </View>
          </View>

          {/* Date Badge */}
          <View className="flex-row items-center justify-center">
            <View className="bg-green-50 px-4 py-2 rounded-full border border-green-200">
              <View className="flex-row items-center gap-2">
                <MaterialIcons
                  name="calendar-today"
                  size={16}
                  color="#15803D"
                />
                <Text className="text-green-700 text-sm font-semibold">
                  {formatDate(normalizedDate)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={true}
        >
          <View className="px-5 py-6">
            {/* Stats Bar */}
            {!isEditing && (
              <View className="mb-5">
                <View
                  className="bg-white rounded-2xl p-4 border border-gray-100"
                  style={{
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                >
                  <View className="flex-row items-center justify-around">
                    <View className="items-center">
                      <MaterialIcons name="text-fields" size={18} color="#22C55E" />
                      <Text className="text-gray-900 text-lg font-bold mt-1">
                        {wordCount}
                      </Text>
                      <Text className="text-gray-500 text-xs">Words</Text>
                    </View>
                    <View className="w-px h-10 bg-gray-200" />
                    <View className="items-center">
                      <MaterialIcons name="description" size={18} color="#3B82F6" />
                      <Text className="text-gray-900 text-lg font-bold mt-1">
                        {charCount}
                      </Text>
                      <Text className="text-gray-500 text-xs">Characters</Text>
                    </View>
                    {selectedMood && (
                      <>
                        <View className="w-px h-10 bg-gray-200" />
                        <View className="items-center">
                          <Text className="text-2xl">{selectedMood}</Text>
                          <Text className="text-gray-500 text-xs mt-1">
                            {MOOD_EMOJIS.find((m) => m.emoji === selectedMood)?.label}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Mood Selector (Edit Mode) */}
            {isEditing && (
              <View className="mb-5">
                <Text className="text-gray-900 font-bold mb-3 text-sm uppercase tracking-wide">
                  Mood
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {MOOD_EMOJIS.map((mood) => (
                    <Pressable
                      key={mood.emoji}
                      onPress={() =>
                        setSelectedMood(
                          selectedMood === mood.emoji ? "" : mood.emoji,
                        )
                      }
                      className={`px-4 py-3 rounded-xl border-2 ${
                        selectedMood === mood.emoji
                          ? "bg-green-50 border-green-500"
                          : "bg-white border-gray-200"
                      }`}
                      style={{
                        elevation: 1,
                        shadowColor: "#000",
                        shadowOpacity: 0.03,
                        shadowRadius: 2,
                      }}
                    >
                      <Text className="text-2xl">{mood.emoji}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Date Editor (Edit Mode) */}
            {isEditing && (
              <View className="mb-5">
                <Text className="text-gray-900 font-bold mb-3 text-sm uppercase tracking-wide">
                  Date
                </Text>
                <View className="flex-row items-center gap-3 mb-3">
                  <Pressable
                    onPress={() => handleDateChange(-1)}
                    className="bg-gray-100 rounded-xl w-12 h-12 items-center justify-center active:bg-gray-200 border border-gray-200"
                  >
                    <MaterialIcons name="chevron-left" size={24} color="#374151" />
                  </Pressable>

                  <View className="flex-1 border-2 border-gray-200 rounded-2xl px-4 py-3 bg-gray-50">
                    <Text className="text-gray-900 text-base font-semibold text-center">
                      📅 {formatDate(normalizedDate)}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => handleDateChange(1)}
                    className="bg-gray-100 rounded-xl w-12 h-12 items-center justify-center active:bg-gray-200 border border-gray-200"
                  >
                    <MaterialIcons name="chevron-right" size={24} color="#374151" />
                  </Pressable>
                </View>

                {/* Calendar Week Strip */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
                >
                  {(() => {
                    const base = new Date((normalizedDate || "") + "T00:00:00");
                    const center = isNaN(base.getTime()) ? new Date() : base;
                    const days = [];
                    for (let offset = -3; offset <= 3; offset++) {
                      const d = new Date(center);
                      d.setDate(center.getDate() + offset);
                      const value = safeISO(d);
                      const isSelected = value === normalizedDate;
                      const isToday = safeISO(new Date()) === value;
                      days.push(
                        <Pressable
                          key={value}
                          onPress={() => setDate(value)}
                          className={`px-4 py-3 rounded-xl border-2 ${
                            isSelected
                              ? "border-green-500 bg-green-50"
                              : "border-gray-200 bg-white"
                          }`}
                          style={{
                            elevation: 1,
                            shadowColor: "#000",
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                          }}
                        >
                          <View className="items-center" style={{ minWidth: 50 }}>
                            <Text
                              className={`text-xs font-semibold mb-1 ${
                                isSelected ? "text-green-700" : "text-gray-500"
                              }`}
                            >
                              {d.toLocaleDateString("en-US", { weekday: "short" })}
                            </Text>
                            <Text
                              className={`text-xl font-bold ${
                                isSelected ? "text-green-700" : "text-gray-900"
                              }`}
                            >
                              {d.getDate()}
                            </Text>
                            {isToday && (
                              <View className="mt-1 px-2 py-0.5 bg-green-600 rounded-full">
                                <Text className="text-[9px] font-bold text-white">
                                  Today
                                </Text>
                              </View>
                            )}
                          </View>
                        </Pressable>
                      );
                    }
                    return days;
                  })()}
                </ScrollView>

                <Pressable
                  onPress={() => setDate(normalizeDate())}
                  className="mt-3"
                >
                  <Text className="text-green-600 text-xs font-semibold text-center">
                    Reset to Today
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Title */}
            <View className="mb-5">
              <Text className="text-gray-900 font-bold mb-3 text-sm uppercase tracking-wide">
                Title
              </Text>
              {isEditing ? (
                <View>
                  <TextInput
                    className="bg-white text-gray-900 text-lg font-bold p-4 rounded-2xl border-2 border-green-500"
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter title..."
                    placeholderTextColor="#9CA3AF"
                    maxLength={100}
                    style={{
                      elevation: 2,
                      shadowColor: "#22C55E",
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    }}
                  />
                  <Text className="text-gray-400 text-xs mt-1.5">
                    {title.length}/100 characters
                  </Text>
                </View>
              ) : (
                <View
                  className="bg-white p-5 rounded-2xl border border-gray-100"
                  style={{
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                >
                  <Text className="text-gray-900 text-xl font-bold leading-7">
                    {title}
                  </Text>
                </View>
              )}
            </View>

            {/* Content */}
            <View className="mb-5">
              <Text className="text-gray-900 font-bold mb-3 text-sm uppercase tracking-wide">
                Content
              </Text>
              {isEditing ? (
                <View>
                  <TextInput
                    className="bg-white text-gray-800 text-base p-4 rounded-2xl border-2 border-green-500"
                    style={{
                      minHeight: 300,
                      elevation: 2,
                      shadowColor: "#22C55E",
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    }}
                    value={content}
                    onChangeText={setContent}
                    multiline
                    textAlignVertical="top"
                    placeholder="Write your thoughts..."
                    placeholderTextColor="#9CA3AF"
                    maxLength={5000}
                  />
                  <View className="flex-row items-center justify-between mt-1.5">
                    <Text className="text-xs text-gray-400">
                      {wordCount} words · {charCount}/5000 characters
                    </Text>
                  </View>
                </View>
              ) : (
                <View
                  className="bg-white p-5 rounded-2xl border border-gray-100"
                  style={{
                    minHeight: 200,
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                >
                  <Text className="text-gray-800 text-base leading-7">
                    {content}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View className="gap-3 mt-2">
              {!isEditing ? (
                <>
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => setIsEditing(true)}
                      className="flex-1 bg-green-600 px-6 py-4 rounded-2xl active:bg-green-700"
                      style={{
                        elevation: 3,
                        shadowColor: "#22C55E",
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                      }}
                    >
                      <View className="flex-row items-center justify-center gap-2">
                        <MaterialIcons name="edit" size={20} color="#FFFFFF" />
                        <Text className="text-white font-bold text-base">
                          Edit
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleDuplicate}
                      className="flex-1 bg-white border-2 border-gray-300 px-6 py-4 rounded-2xl active:bg-gray-50"
                      style={{
                        elevation: 2,
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                      }}
                    >
                      <View className="flex-row items-center justify-center gap-2">
                        <MaterialIcons name="content-copy" size={20} color="#6B7280" />
                        <Text className="text-gray-700 font-bold text-base">
                          Duplicate
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={handleDelete}
                    className="bg-white border-2 border-red-200 px-6 py-4 rounded-2xl active:bg-red-50"
                    style={{
                      elevation: 2,
                      shadowColor: "#000",
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                    }}
                  >
                    <View className="flex-row items-center justify-center gap-2">
                      <MaterialIcons name="delete" size={20} color="#DC2626" />
                      <Text className="text-red-600 font-bold text-base">
                        Delete Entry
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={handleUpdate}
                    className={`px-6 py-4 rounded-2xl ${
                      isLoading
                        ? "bg-gray-400"
                        : "bg-green-600 active:bg-green-700"
                    }`}
                    style={{
                      elevation: 3,
                      shadowColor: "#22C55E",
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                    }}
                    disabled={isLoading}
                  >
                    <View className="flex-row items-center justify-center gap-2">
                      {isLoading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <MaterialIcons name="save" size={20} color="#FFFFFF" />
                      )}
                      <Text className="text-white font-bold text-base">
                        {isLoading ? "Saving..." : "Save Changes"}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCancel}
                    className="bg-white border-2 border-gray-300 px-6 py-4 rounded-2xl active:bg-gray-50"
                    style={{
                      elevation: 2,
                      shadowColor: "#000",
                      shadowOpacity: 0.05,
                      shadowRadius: 4,
                    }}
                    disabled={isLoading}
                  >
                    <View className="flex-row items-center justify-center gap-2">
                      <MaterialIcons name="cancel" size={20} color="#6B7280" />
                      <Text className="text-gray-700 font-bold text-base">
                        Cancel
                      </Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default JournalDetail;