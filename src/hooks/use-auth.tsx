import { useContext, createContext, useEffect, useState, ReactNode } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "@/firebase";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean; // Legacy support
  loading: boolean;   // ✅ Added for consistency with AdminRoute/ProtectedRoute
  user: User | null;
  signIn: (type: string, formData?: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async (type: string, formData?: FormData) => {
    if (type === "anonymous") {
      await signInAnonymously(auth);
    } 
    else if (type === "google") {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    }
    else if (type === "email-password") {
      const email = formData?.get("email") as string;
      const password = formData?.get("password") as string;
      const isSignUp = formData?.get("isSignUp") === "true";

      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated: !!user, 
      isLoading, 
      loading: isLoading, // ✅ Map loading to isLoading
      user, 
      signIn, 
      signOut, 
      resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}