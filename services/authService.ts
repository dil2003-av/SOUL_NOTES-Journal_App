import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export const loginUser = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password);
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
