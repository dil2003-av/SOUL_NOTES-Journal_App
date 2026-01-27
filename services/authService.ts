import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export const loginUser = async (email: string, password: string) => {
  try {
    console.log("Attempting login with email:", email);
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log("Login successful:", result.user.email);
    return result;
  } catch (err: any) {
    console.error("Login error code:", err.code);
    console.error("Login error message:", err.message);
    throw err;
  }
};

export const getProvidersForEmail = async (email: string) => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    console.log("Providers for email", email, methods);
    return methods;
  } catch (err) {
    console.error("fetchSignInMethodsForEmail error:", err);
    return [] as string[];
  }
};

export const sendResetEmail = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log("Password reset email sent to:", email);
    return true;
  } catch (err) {
    console.error("sendPasswordResetEmail error:", err);
    throw err;
  }
};

export const logout = async () => {
  await signOut(auth);
  AsyncStorage.clear();

  return;
};
export const registerUser = async (
  name: string,
  email: string,
  password: string,
) => {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await updateProfile(userCred.user, {
      displayName: name,
      photoURL: "",
    });

    // create user document in Firestore
    await setDoc(doc(db, "users", userCred.user.uid), {
      name,
      role: "",
      email,
      createdAt: new Date(),
    });

    return userCred.user;
  } catch (err) {
    // If storing profile or Firestore write fails, rethrow to caller
    throw err;
  }
};
