import { AuthContext } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Text, View } from "react-native";
import "../global.css";

const { width } = Dimensions.get("window");

export default function Splash() {
  const router = useRouter();
  const { user, loading } = useContext(AuthContext);

  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslate = useRef(new Animated.Value(16)).current;

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const dot4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslate, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // looping dots
    const loop = () => {
      Animated.stagger(120, [
        Animated.sequence([
          Animated.timing(dot1, {
            toValue: -6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot1, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dot2, {
            toValue: -6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot2, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dot3, {
            toValue: -6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot3, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(dot4, {
            toValue: -6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot4, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => loop());
    };
    loop();

    // navigate after a slightly longer delay so animations are visible
    const timer = setTimeout(() => {
      if (!loading) {
        if (user) {
          router.replace("/(dashboard)/home");
        } else {
          router.replace("/(auth)/login");
        }
      }
    }, 4200);
    return () => clearTimeout(timer);
  }, [user, loading]);

  return (
    <View className="flex-1 bg-[#071029] justify-center items-center px-6">
      <Animated.View
        className="w-28 h-28 rounded-full bg-[#10B981] justify-center items-center mb-6"
        style={{
          transform: [{ scale: logoScale }],
          opacity: logoOpacity,
        }}
      >
        <Text className="text-6xl">🪶</Text>
      </Animated.View>

      <Animated.Text
        className="text-4xl font-extrabold text-white tracking-wide"
        style={{ opacity: titleOpacity }}
      >
        SoulNotes
      </Animated.Text>

      <Animated.View
        style={{
          width: Math.min(220, width - 80),
          height: 6,
          backgroundColor: "#0ea5a4",
          borderRadius: 6,
          marginTop: 12,
          marginBottom: 14,
          opacity: 0.95,
          transform: [{ translateY: taglineTranslate }],
        }}
      />

      <Animated.Text
        className="text-gray-300 text-center text-base leading-6 px-6"
        style={{
          transform: [{ translateY: taglineTranslate }],
          opacity: titleOpacity,
        }}
      >
        Write what your soul feels — private, secure, and beautiful.
      </Animated.Text>

      {/* Animated loading dots */}
      <View className="flex-row items-center mt-8 h-6">
        <Animated.View
          style={{
            width: 10,
            height: 10,
            borderRadius: 6,
            backgroundColor: "#94f3c4",
            marginHorizontal: 6,
            transform: [{ translateY: dot1 }],
          }}
        />
        <Animated.View
          style={{
            width: 10,
            height: 10,
            borderRadius: 6,
            backgroundColor: "#6ee7b7",
            marginHorizontal: 6,
            transform: [{ translateY: dot2 }],
          }}
        />
        <Animated.View
          style={{
            width: 10,
            height: 10,
            borderRadius: 6,
            backgroundColor: "#34d399",
            marginHorizontal: 6,
            transform: [{ translateY: dot3 }],
          }}
        />
        <Animated.View
          style={{
            width: 10,
            height: 10,
            borderRadius: 6,
            backgroundColor: "#6ee7b7",
            marginHorizontal: 6,
            transform: [{ translateY: dot4 }],
          }}
        />
      </View>
    </View>
  );
}
