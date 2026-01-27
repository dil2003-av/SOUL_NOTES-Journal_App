import { useLoader } from "@/hooks/useLoader";
import { auth } from "@/services/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { createContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { hideLoader, isLoading, showLoader } = useLoader();

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    showLoader();

    try {
      const unscrib = onAuthStateChanged(
        auth,
        (currentUser) => {
          console.log("Auth state changed:", currentUser?.email);
          setUser(currentUser);
          hideLoader();
        },
        (error) => {
          console.error("Auth state change error:", error);
          hideLoader();
        },
      );

      // cleanup functions (component unmount)
      return () => unscrib();
    } catch (err) {
      console.error("AuthProvider setup error:", err);
      hideLoader();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading: isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
