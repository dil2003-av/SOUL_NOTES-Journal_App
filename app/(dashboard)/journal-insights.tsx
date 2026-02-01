import { useLoader } from "@/hooks/useLoader";
import { auth, db } from "@/services/firebase";
import { getJournalEntries, JournalEntry } from "@/services/journalService";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useFocusEffect, useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
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

const MOOD_EMOJIS = [
  { emoji: "😊", label: "Happy", color: "#FCD34D" },
  { emoji: "😢", label: "Sad", color: "#60A5FA" },
  { emoji: "😡", label: "Angry", color: "#F87171" },
  { emoji: "😰", label: "Anxious", color: "#A78BFA" },
  { emoji: "😴", label: "Tired", color: "#9CA3AF" },
  { emoji: "🤩", label: "Excited", color: "#FB923C" },
  { emoji: "😌", label: "Calm", color: "#34D399" },
  { emoji: "🤔", label: "Thoughtful", color: "#818CF8" },
];

const safeISO = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const JournalInsights = () => {
  const router = useRouter();
  const { showLoader, hideLoader } = useLoader();
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year" | "all"
  >("all");

  const fetch = async () => {
    try {
      showLoader();
      const list = await getJournalEntries();
      setEntries(list);

      // Fetch tasks
      const currentUser = auth.currentUser;
      if (currentUser) {
        const tasksCollection = collection(db, "tasks");
        const q = query(
          tasksCollection,
          where("userId", "==", currentUser.uid),
        );
        const querySnapshot = await getDocs(q);
        const tasksList: Task[] = [];
        querySnapshot.forEach((doc) => {
          tasksList.push({
            id: doc.id,
            ...(doc.data() as Omit<Task, "id">),
          });
        });
        setTasks(tasksList);
      }
    } catch (e) {
      setEntries([]);
      setTasks([]);
    } finally {
      hideLoader();
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetch();
    }, []),
  );

  const stats = useMemo(() => {
    if (!entries)
      return {
        total: 0,
        currentMonth: 0,
        lastWeek: 0,
        avgWordsPerEntry: 0,
        totalWords: 0,
        longestEntry: 0,
        shortestEntry: 0,
        moodDistribution: [] as {
          mood: string;
          count: number;
          color: string;
          label: string;
        }[],
        mostUsedMood: null as string | null,
        topTags: [] as { tag: string; count: number }[],
        streak: 0,
        longestStreak: 0,
        activityByDay: [] as { day: string; count: number }[],
        monthlyTrend: [] as { month: string; count: number }[],
        writingTimes: { morning: 0, afternoon: 0, evening: 0, night: 0 },
        mostProductiveDay: "",
        entriesThisYear: 0,
        growthRate: 0,
        achievements: [] as {
          emoji: string;
          title: string;
          description: string;
        }[],
      };

    // Filter entries by selected period
    let filteredEntries = entries;
    const now = new Date();

    if (selectedPeriod === "week") {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredEntries = entries.filter((e) => {
        const d = new Date((e.date || "") + "T00:00:00");
        return d >= weekAgo;
      });
    } else if (selectedPeriod === "month") {
      filteredEntries = entries.filter((e) => {
        const d = new Date((e.date || "") + "T00:00:00");
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
    } else if (selectedPeriod === "year") {
      filteredEntries = entries.filter((e) => {
        const d = new Date((e.date || "") + "T00:00:00");
        return d.getFullYear() === now.getFullYear();
      });
    }

    const total = filteredEntries.length;

    // Current month
    const currentMonth = entries.filter((e) => {
      const d = new Date((e.date || "") + "T00:00:00");
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;

    // Last 7 days
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const lastWeek = entries.filter((e) => {
      const d = new Date((e.date || "") + "T00:00:00");
      return d >= weekAgo;
    }).length;

    // This year
    const entriesThisYear = entries.filter((e) => {
      const d = new Date((e.date || "") + "T00:00:00");
      return d.getFullYear() === now.getFullYear();
    }).length;

    // Word statistics
    const wordCounts = filteredEntries.map(
      (e) => e.content.trim().split(/\s+/).length,
    );
    const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
    const avgWordsPerEntry = total > 0 ? Math.round(totalWords / total) : 0;
    const longestEntry = wordCounts.length > 0 ? Math.max(...wordCounts) : 0;
    const shortestEntry = wordCounts.length > 0 ? Math.min(...wordCounts) : 0;

    // Growth rate (comparing last month to previous month)
    const lastMonth = entries.filter((e) => {
      const d = new Date((e.date || "") + "T00:00:00");
      const lastMonthDate = new Date(now);
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      return (
        d.getMonth() === lastMonthDate.getMonth() &&
        d.getFullYear() === lastMonthDate.getFullYear()
      );
    }).length;
    const growthRate =
      lastMonth > 0
        ? Math.round(((currentMonth - lastMonth) / lastMonth) * 100)
        : 0;

    // Mood distribution and other stats
    const moodCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    const dateSet = new Set<string>();
    const dayOfWeekCounts: Record<string, number> = {
      Sun: 0,
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
    };
    const writingTimes = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    const monthCounts: Record<string, number> = {};

    filteredEntries.forEach((e) => {
      // Mood
      const moodObj = MOOD_EMOJIS.find((m) => e.content.startsWith(m.emoji));
      if (moodObj) {
        moodCounts[moodObj.emoji] = (moodCounts[moodObj.emoji] || 0) + 1;
      }

      // Tags
      const tags = Array.from(e.content.match(/#(\w+)/g) || []).map((s) =>
        s.replace(/^#/, ""),
      );
      tags.forEach((t) => (tagCounts[t] = (tagCounts[t] || 0) + 1));

      // Dates and analytics
      try {
        const d = new Date((e.date || "") + "T00:00:00");
        const iso = safeISO(d);
        dateSet.add(iso);

        // Day of week
        const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
          d.getDay()
        ];
        dayOfWeekCounts[dayName]++;

        // Monthly trend (last 6 months)
        const monthKey = d.toLocaleDateString("en-US", {
          month: "short",
          year: "2-digit",
        });
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;

        // Writing times (based on current time as proxy - in real app, store timestamp)
        const hour = d.getHours();
        if (hour >= 5 && hour < 12) writingTimes.morning++;
        else if (hour >= 12 && hour < 17) writingTimes.afternoon++;
        else if (hour >= 17 && hour < 21) writingTimes.evening++;
        else writingTimes.night++;
      } catch (err) {
        // ignore
      }
    });

    // Most productive day
    const mostProductiveDay =
      Object.entries(dayOfWeekCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "";

    // Mood distribution
    const moodDistribution = MOOD_EMOJIS.map((m) => ({
      mood: m.emoji,
      label: m.label,
      count: moodCounts[m.emoji] || 0,
      color: m.color,
    })).filter((m) => m.count > 0);

    const mostUsedMood =
      Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Top 5 tags
    const topTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));

    // Current writing streak
    let streak = 0;
    let cur = new Date();
    while (true) {
      const iso = safeISO(cur);
      if (dateSet.has(iso)) {
        streak += 1;
        cur.setDate(cur.getDate() - 1);
      } else break;
    }

    // Longest streak
    let longestStreak = 0;
    let currentStreak = 0;
    const sortedDates = Array.from(dateSet).sort();
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prev = new Date(sortedDates[i - 1]);
        const curr = new Date(sortedDates[i]);
        const diff = Math.floor(
          (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (diff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, currentStreak);

    // Activity by day
    const activityByDay = Object.entries(dayOfWeekCounts).map(
      ([day, count]) => ({
        day,
        count,
      }),
    );

    // Monthly trend (last 6 months)
    const monthlyTrend = Object.entries(monthCounts)
      .map(([month, count]) => ({ month, count }))
      .slice(-6);

    // Calculate achievements based on both entries and tasks
    const achievements: {
      emoji: string;
      title: string;
      description: string;
    }[] = [];
    const completedTasks = tasks.filter((t) => t.isComplete).length;
    const completedEntries = entries.filter((e) => e.isComplete).length;
    const totalCompleted = completedTasks + completedEntries;

    // Journal & Task Achievements
    if (total >= 1)
      achievements.push({
        emoji: "📝",
        title: "First Entry",
        description: "Wrote your first journal entry",
      });
    if (total >= 5)
      achievements.push({
        emoji: "📚",
        title: "Bookworm",
        description: "5+ journal entries written",
      });
    if (total >= 10)
      achievements.push({
        emoji: "✨",
        title: "Dedicated Writer",
        description: "10+ journal entries",
      });
    if (total >= 20)
      achievements.push({
        emoji: "🌟",
        title: "Prolific",
        description: "20+ journal entries",
      });

    // Task achievements
    if (tasks.length >= 1)
      achievements.push({
        emoji: "✅",
        title: "First Task",
        description: "Created your first task",
      });
    if (completedTasks >= 1)
      achievements.push({
        emoji: "🎯",
        title: "Task Master",
        description: "Completed your first task",
      });
    if (completedTasks >= 5)
      achievements.push({
        emoji: "🚀",
        title: "On Fire",
        description: "5 tasks completed",
      });
    if (completedTasks >= 10)
      achievements.push({
        emoji: "⚡",
        title: "Unstoppable",
        description: "10 tasks completed",
      });

    // Combined achievements
    if (totalCompleted >= 1)
      achievements.push({
        emoji: "🏆",
        title: "Goal Crusher",
        description: "First task or entry completed",
      });
    if (totalCompleted >= 5)
      achievements.push({
        emoji: "💪",
        title: "Momentum",
        description: "5 total completions",
      });
    if (totalCompleted >= 10)
      achievements.push({
        emoji: "🔥",
        title: "On a Roll",
        description: "10 total completions",
      });

    // Word achievements
    if (totalWords >= 100)
      achievements.push({
        emoji: "✍️",
        title: "Writer",
        description: "100+ words written",
      });
    if (totalWords >= 500)
      achievements.push({
        emoji: "📖",
        title: "Author",
        description: "500+ words written",
      });
    if (totalWords >= 1000)
      achievements.push({
        emoji: "📕",
        title: "Novelist",
        description: "1000+ words written",
      });
    if (totalWords >= 5000)
      achievements.push({
        emoji: "🎭",
        title: "Storyteller",
        description: "5000+ words written",
      });

    // Streak achievements
    if (streak >= 3)
      achievements.push({
        emoji: "🌊",
        title: "Wave Rider",
        description: "3-day writing streak",
      });
    if (streak >= 7)
      achievements.push({
        emoji: "🔥",
        title: "Week Warrior",
        description: "7-day writing streak",
      });
    if (longestStreak >= 14)
      achievements.push({
        emoji: "🌙",
        title: "Night Owl",
        description: "14-day longest streak",
      });
    if (longestStreak >= 30)
      achievements.push({
        emoji: "🌟",
        title: "30-Day Hero",
        description: "30-day longest streak",
      });

    // Mood achievements
    if (moodDistribution.length >= 5)
      achievements.push({
        emoji: "😊",
        title: "Mood Ring",
        description: "5+ different moods tracked",
      });

    // Remove duplicates
    const uniqueAchievements = Array.from(
      new Map(achievements.map((a) => [a.title, a])).values(),
    );

    return {
      total,
      currentMonth,
      lastWeek,
      avgWordsPerEntry,
      totalWords,
      longestEntry,
      shortestEntry,
      moodDistribution,
      mostUsedMood,
      topTags,
      streak,
      longestStreak,
      activityByDay,
      monthlyTrend,
      writingTimes,
      mostProductiveDay,
      entriesThisYear,
      growthRate,
      achievements: uniqueAchievements,
    };
  }, [entries, selectedPeriod, tasks]);

  if (!entries) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-gray-500 mt-4 font-medium">
          Loading insights...
        </Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get("window").width;

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
        <View className="flex-row items-center justify-between mb-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-gray-100 rounded-full p-2.5 active:bg-gray-200 border border-gray-200"
          >
            <MaterialIcons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-gray-900 text-lg font-bold">
            Analytics Dashboard
          </Text>
          <View className="w-10" />
        </View>
        <Text className="text-gray-500 text-xs text-center mb-3">
          Deep insights from your journaling journey
        </Text>

        {/* Period Selector */}
        <View className="flex-row gap-2 justify-center">
          {(["week", "month", "year", "all"] as const).map((period) => (
            <Pressable
              key={period}
              onPress={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-full ${
                selectedPeriod === period
                  ? "bg-green-600"
                  : "bg-gray-100 border border-gray-200"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedPeriod === period ? "text-white" : "text-gray-700"
                }`}
              >
                {period === "week"
                  ? "7 Days"
                  : period === "month"
                    ? "Month"
                    : period === "year"
                      ? "Year"
                      : "All Time"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      >
        {/* Achievement Badges */}
        {stats.achievements.length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-900 text-base font-bold mb-3 uppercase tracking-wide text-xs">
              🏆 Achievements ({stats.achievements.length})
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {stats.achievements.map((achievement, index) => (
                <View
                  key={index}
                  className="bg-white p-4 rounded-2xl border border-yellow-200 items-center"
                  style={{
                    width: (screenWidth - 56) / 2 - 6,
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                >
                  <Text className="text-3xl mb-2">{achievement.emoji}</Text>
                  <Text className="text-xs font-bold text-gray-900 text-center">
                    {achievement.title}
                  </Text>
                  <Text className="text-xs text-gray-500 text-center mt-1">
                    {achievement.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Stats Grid */}
        <View className="mb-6">
          <Text className="text-gray-900 text-base font-bold mb-3 uppercase tracking-wide text-xs">
            📊 Overview
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <View
              className="bg-white p-4 rounded-2xl border border-gray-100 flex-1"
              style={{
                minWidth: (screenWidth - 56) / 2,
                elevation: 2,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
              }}
            >
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="menu-book" size={20} color="#22C55E" />
                <Text className="text-gray-500 text-xs ml-2">
                  Total Entries
                </Text>
              </View>
              <Text className="text-3xl font-bold text-gray-900">
                {stats.total}
              </Text>
            </View>

            <View
              className="bg-white p-4 rounded-2xl border border-gray-100 flex-1"
              style={{
                minWidth: (screenWidth - 56) / 2,
                elevation: 2,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
              }}
            >
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="trending-up" size={20} color="#3B82F6" />
                <Text className="text-gray-500 text-xs ml-2">This Year</Text>
              </View>
              <Text className="text-3xl font-bold text-gray-900">
                {stats.entriesThisYear}
              </Text>
            </View>

            <View
              className="bg-white p-4 rounded-2xl border border-gray-100 flex-1"
              style={{
                minWidth: (screenWidth - 56) / 2,
                elevation: 2,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
              }}
            >
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="text-fields" size={20} color="#F59E0B" />
                <Text className="text-gray-500 text-xs ml-2">Total Words</Text>
              </View>
              <Text className="text-3xl font-bold text-gray-900">
                {stats.totalWords.toLocaleString()}
              </Text>
            </View>

            <View
              className="bg-white p-4 rounded-2xl border border-gray-100 flex-1"
              style={{
                minWidth: (screenWidth - 56) / 2,
                elevation: 2,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
              }}
            >
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="show-chart" size={20} color="#8B5CF6" />
                <Text className="text-gray-500 text-xs ml-2">Growth Rate</Text>
              </View>
              <Text
                className={`text-3xl font-bold ${stats.growthRate >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {stats.growthRate > 0 ? "+" : ""}
                {stats.growthRate}%
              </Text>
            </View>
          </View>
        </View>

        {/* Word Statistics */}
        <View className="mb-6">
          <Text className="text-gray-900 text-base font-bold mb-3 uppercase tracking-wide text-xs">
            📝 Writing Statistics
          </Text>
          <View
            className="bg-white p-5 rounded-2xl border border-gray-100"
            style={{
              elevation: 2,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 4,
            }}
          >
            <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
              <Text className="text-gray-600 text-sm">Average per Entry</Text>
              <Text className="text-gray-900 text-lg font-bold">
                {stats.avgWordsPerEntry} words
              </Text>
            </View>
            <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
              <Text className="text-gray-600 text-sm">Longest Entry</Text>
              <Text className="text-gray-900 text-lg font-bold">
                {stats.longestEntry} words
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-600 text-sm">Shortest Entry</Text>
              <Text className="text-gray-900 text-lg font-bold">
                {stats.shortestEntry} words
              </Text>
            </View>
          </View>
        </View>

        {/* Streak Info */}
        <View className="mb-6">
          <Text className="text-gray-900 text-base font-bold mb-3 uppercase tracking-wide text-xs">
            🔥 Writing Streaks
          </Text>
          <View
            className="bg-white p-5 rounded-2xl border border-gray-100"
            style={{
              elevation: 2,
              shadowColor: "#000",
              shadowOpacity: 0.05,
              shadowRadius: 4,
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1">
                <Text className="text-gray-500 text-xs mb-1">
                  Current Streak
                </Text>
                <Text className="text-4xl font-bold text-green-600">
                  {stats.streak} 🔥
                </Text>
                <Text className="text-gray-400 text-xs mt-1">
                  {stats.streak >= 7
                    ? "Amazing! Keep it up!"
                    : stats.streak >= 3
                      ? "Great progress!"
                      : "Start building your streak"}
                </Text>
              </View>
              <View className="flex-1 items-end">
                <Text className="text-gray-500 text-xs mb-1">
                  Longest Streak
                </Text>
                <Text className="text-4xl font-bold text-orange-500">
                  {stats.longestStreak}
                </Text>
                <Text className="text-gray-400 text-xs mt-1">days</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Most Productive Day */}
        {stats.mostProductiveDay && (
          <View className="mb-6">
            <Text className="text-gray-900 text-base font-bold mb-3 uppercase tracking-wide text-xs">
              ⭐ Productivity Insights
            </Text>
            <View
              className="bg-white p-5 rounded-2xl border border-gray-100"
              style={{
                elevation: 2,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
              }}
            >
              <Text className="text-gray-600 text-sm mb-2">
                Most Productive Day
              </Text>
              <Text className="text-3xl font-bold text-green-600 mb-1">
                {stats.mostProductiveDay}
              </Text>
              <Text className="text-gray-400 text-xs">
                You write most often on this day
              </Text>
            </View>
          </View>
        )}

        {/* Mood Distribution Chart */}
        {stats.moodDistribution.length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-900 text-base font-bold mb-3 uppercase tracking-wide text-xs">
              😊 Mood Distribution
            </Text>
            <View
              className="bg-white p-5 rounded-2xl border border-gray-100"
              style={{
                elevation: 2,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
              }}
            >
              <View className="mb-4">
                {stats.moodDistribution.map((item, index) => {
                  const maxCount = Math.max(
                    ...stats.moodDistribution.map((m) => m.count),
                  );
                  const percentage = (item.count / maxCount) * 100;
                  return (
                    <View key={index} className="mb-3">
                      <View className="flex-row items-center justify-between mb-1">
                        <View className="flex-row items-center">
                          <Text className="text-2xl mr-2">{item.mood}</Text>
                          <Text className="text-gray-700 text-sm font-medium">
                            {item.label}
                          </Text>
                        </View>
                        <Text className="text-gray-900 text-sm font-bold">
                          {item.count} (
                          {Math.round((item.count / stats.total) * 100)}%)
                        </Text>
                      </View>
                      <View className="bg-gray-100 h-3 rounded-full overflow-hidden">
                        <View
                          className="h-full rounded-full"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>

              {stats.mostUsedMood && (
                <View className="bg-green-50 p-3 rounded-xl border border-green-200">
                  <Text className="text-green-700 text-xs font-semibold text-center">
                    Most Frequent: {stats.mostUsedMood}{" "}
                    {
                      MOOD_EMOJIS.find((m) => m.emoji === stats.mostUsedMood)
                        ?.label
                    }
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Activity by Day of Week */}
        {stats.activityByDay.length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-900 text-base font-bold mb-3 uppercase tracking-wide text-xs">
              📅 Activity by Day
            </Text>
            <View
              className="bg-white p-5 rounded-2xl border border-gray-100"
              style={{
                elevation: 2,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
              }}
            >
              <View
                className="flex-row items-end justify-between"
                style={{ height: 150 }}
              >
                {stats.activityByDay.map((item, index) => {
                  const maxCount = Math.max(
                    ...stats.activityByDay.map((d) => d.count),
                  );
                  const height =
                    maxCount > 0 ? (item.count / maxCount) * 120 : 0;
                  const isHighest = item.count === maxCount && maxCount > 0;
                  return (
                    <View key={index} className="items-center flex-1">
                      <Text
                        className={`text-xs font-bold mb-1 ${isHighest ? "text-green-600" : "text-gray-900"}`}
                      >
                        {item.count}
                      </Text>
                      <View
                        className={`rounded-t-lg w-8 ${isHighest ? "bg-green-600" : "bg-green-500"}`}
                        style={{ height: Math.max(height, 5) }}
                      />
                      <Text
                        className={`text-xs font-semibold mt-2 ${isHighest ? "text-green-600" : "text-gray-600"}`}
                      >
                        {item.day}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Top Tags */}
        {stats.topTags.length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-900 text-base font-bold mb-3 uppercase tracking-wide text-xs">
              🏷️ Top Tags
            </Text>
            <View
              className="bg-white p-5 rounded-2xl border border-gray-100"
              style={{
                elevation: 2,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 4,
              }}
            >
              <View className="flex-row flex-wrap gap-2">
                {stats.topTags.map((item, index) => (
                  <View
                    key={index}
                    className="bg-green-50 px-4 py-2 rounded-full border border-green-200"
                  >
                    <Text className="text-green-700 font-semibold text-sm">
                      #{item.tag} ({item.count})
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Empty State */}
        {stats.total === 0 && (
          <View className="bg-white p-8 rounded-2xl border border-gray-100 items-center">
            <Text className="text-6xl mb-3">📊</Text>
            <Text className="text-gray-900 text-lg font-bold mb-2">
              No Data Yet
            </Text>
            <Text className="text-gray-500 text-center text-sm mb-4">
              Start writing journal entries to see your insights and analytics
            </Text>
            <TouchableOpacity
              onPress={() => router.push("./add-entry")}
              className="bg-green-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-bold text-sm">
                Create First Entry
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default JournalInsights;
