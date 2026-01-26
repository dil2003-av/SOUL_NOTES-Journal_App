import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    Timestamp,
    updateDoc,
    where
} from "firebase/firestore";
import { auth, db } from "./firebase";

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: Date;
}

// Get all journal entries for the current user
export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    const journalRef = collection(db, "journals");
    const q = query(journalRef, where("userId", "==", user.uid));

    const querySnapshot = await getDocs(q);
    const entries: JournalEntry[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      entries.push({
        id: doc.id,
        title: data.title,
        content: data.content,
        date: data.date,
        createdAt: data.createdAt?.toDate() || new Date(),
      });
    });

    // Sort entries by createdAt in descending order on the client side
    entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return entries;
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    throw error;
  }
};

// Get a single journal entry by ID
export const getJournalEntry = async (
  entryId: string,
): Promise<JournalEntry> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    const entryRef = doc(db, "journals", entryId);
    const entryDoc = await getDoc(entryRef);

    if (!entryDoc.exists()) {
      throw new Error("Journal entry not found");
    }

    const data = entryDoc.data();
    return {
      id: entryDoc.id,
      title: data.title,
      content: data.content,
      date: data.date,
      createdAt: data.createdAt?.toDate() || new Date(),
    };
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    throw error;
  }
};

// Create a new journal entry
export const createJournalEntry = async (
  title: string,
  content: string,
  date: string,
): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    const journalRef = collection(db, "journals");
    const docRef = await addDoc(journalRef, {
      userId: user.uid,
      title,
      content,
      date,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating journal entry:", error);
    throw error;
  }
};

// Update an existing journal entry
export const updateJournalEntry = async (
  entryId: string,
  title: string,
  content: string,
  date: string,
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    const entryRef = doc(db, "journals", entryId);
    await updateDoc(entryRef, {
      title,
      content,
      date,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error("Error updating journal entry:", error);
    throw error;
  }
};

// Delete a journal entry
export const deleteJournalEntry = async (entryId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    const entryRef = doc(db, "journals", entryId);
    await deleteDoc(entryRef);
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    throw error;
  }
};
