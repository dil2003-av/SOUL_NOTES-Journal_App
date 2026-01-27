import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import React from "react";

const tabs = [
  { name: "home", title: "Home", icon: "home-filled" },
  { name: "add-entry", title: "Add", icon: "note-add" },
  { name: "journal-detail", title: "Journal", icon: "description" },
  { name: "profile", title: "Profile", icon: "person" },
] as const;

export default function DashboardLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      {tabs.map(({ name, title, icon }: any) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: title,
            tabBarActiveTintColor: "#22C55E",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name={icon} color={color} size={size} />
            ),
          }}
        />
      ))}

      {/* Hide legacy tasks tab from the bar */}
      <Tabs.Screen
        name="tasks"
        options={{
          href: null,
          title: "Tasks",
        }}
      />
    </Tabs>
  );
}
