import { addDoc, collection, getDocs, orderBy, query, where } from "firebase/firestore"
import { db } from "./firebase";
import { getAuth } from "firebase/auth";


const auth =  getAuth()
const taskCollection = collection(db, "tasks");
export const addTask = async (title: string, description: string, isComplete: boolean) => {

    const user = auth.currentUser;
    if(!user) return;

   await addDoc(taskCollection, {
        title,
        description,
        isComplete,
        userId: user.uid,
        createdAt: new Date().toISOString()
})
}
export const getAllTasks = async() => {
    const user = auth.currentUser;
    if(!user) return;
   const q =  query(taskCollection, 
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc"));

    const snapshot =  await getDocs(q);
    snapshot.docs.map((document)=>{
        const data = document.data();
        return {
            id: document.id,
            title: data.title as string,
            description: data.description as string,
        isComplete: (data.isComplete as boolean) || false,
            createdAt: data.createdAt as string
        }
    })

}