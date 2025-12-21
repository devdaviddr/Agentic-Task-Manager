import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode, FC } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth as firebaseAuth, googleProvider } from '../config/firebase';
import api from '../services/api';

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          // Sync user with backend
          const response = await api.post('/auth/sync');
          setUser(response.data.user);
        } catch (error) {
          console.error('Failed to sync user with backend:', error);
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      await signInWithPopup(firebaseAuth, googleProvider);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(firebaseAuth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    firebaseUser,
    isAuthenticated: !!user && !!firebaseUser,
    loginWithGoogle,
    logout,
    loading,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};