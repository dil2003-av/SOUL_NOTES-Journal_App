import React from "react";
import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const tabs = [
  { name: "home", title: "Home", icon: "home-filled" },
  { name: "news", title: "News", icon: "article" },
  { name: "tasks", title: "Tasks", icon: "check-circle" },
  { name: "profile", title: "Profile", icon: "person" },
] as const;

export default function DashboardLayout() {
return (
    <Tabs
        screenOptions={{
            headerShown: false
        }}
    >
        {tabs.map(({name, title, icon}: any) => (
            <Tabs.Screen
                name={name}
                options={{
                    title: title,
                    tabBarIcon: ({color , size , focused}) => (
                        <MaterialIcons name={icon} color={color} size={size} />
                        // <MaterialIcons name={icon} color={focused ? "blue" : "gray"} size={size} />
                    )
                }}
            />
        ))}

    </Tabs>
  )
}
    // {/* <Tabs.Screen name="home" options={{ title: 'Home', tabBarIcon: (data) => <MaterialIcons name="home-filled" size={24} color={data.color} /> }} />
    // <Tabs.Screen name="news" options={{ title: 'News' }} />
    // <Tabs.Screen name="tasks" options={{ title: 'Tasks' }} />
    // <Tabs.Screen name="profile" options={{ title: 'Profile' }} /> */ 
    