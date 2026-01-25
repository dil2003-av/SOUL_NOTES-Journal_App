import { useLoader } from "@/hooks/useLoader";
import { auth } from "@/services/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, useEffect, useState } from "react";

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType> ({
    user: null,
    loading: false
})

export const AuthProvider = ({children}: {children: React.ReactNode}) => {

    const {hideLoader, isLoading, showLoader} = useLoader();
    
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        showLoader();

        const unscrib = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            hideLoader();
        });

        // cleanup functions (component unmount)
        return () => unscrib();
    } , []);

    return <AuthContext.Provider value={{user , loading: isLoading}} ></AuthContext.Provider>
}