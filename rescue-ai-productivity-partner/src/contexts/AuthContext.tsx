import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, appleProvider, db } from '../firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserSettings {
  role?: 'student' | 'professional' | 'entrepreneur';
  taskPreferences: string;
  customNeeds: string;
}

interface AuthContextType {
  currentUser: any;
  loading: boolean;
  settings: UserSettings | null;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInGuest: (role?: 'student' | 'professional' | 'entrepreneur') => Promise<void>;
  logout: () => Promise<void>;
  updateSettings: (newSettings: UserSettings) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedGuest = localStorage.getItem('rescue_ai_guest');
    if (savedGuest) {
      try {
        const parsed = JSON.parse(savedGuest);
        setCurrentUser(parsed.user);
        setSettings(parsed.settings || { taskPreferences: 'Focus on high priority', customNeeds: 'None' });
        setLoading(false);
      } catch (e) {
        localStorage.removeItem('rescue_ai_guest');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Only set user if we are NOT in guest mode currently
      const isGuestActive = localStorage.getItem('rescue_ai_guest') !== null;
      if (isGuestActive) {
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      if (user) {
        // Fetch or create user doc
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const existingSettings = docSnap.data().settings || { taskPreferences: '', customNeeds: '' };
            if (!existingSettings.role) {
              existingSettings.role = (localStorage.getItem('onboarding_role') as any) || 'professional';
            }
            setSettings(existingSettings);
          } else {
            const savedRole = (localStorage.getItem('onboarding_role') as any) || 'professional';
            const initialSettings = { 
              role: savedRole,
              taskPreferences: 'Default preference', 
              customNeeds: 'None' 
            };
            await setDoc(userDocRef, {
              email: user.email,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              settings: initialSettings
            });
            setSettings(initialSettings);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setSettings(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    localStorage.removeItem('rescue_ai_guest');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      throw error;
    }
  };

  const signInWithApple = async () => {
    localStorage.removeItem('rescue_ai_guest');
    try {
      await signInWithPopup(auth, appleProvider);
    } catch (error) {
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    localStorage.removeItem('rescue_ai_guest');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    localStorage.removeItem('rescue_ai_guest');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    }
  };

  const signInGuest = async (role?: 'student' | 'professional' | 'entrepreneur') => {
    const guestUser = {
      uid: 'guest_user_123',
      email: 'demo.guest@rescueai.app',
      displayName: 'Rescue Guest'
    };
    const savedRole = role || (localStorage.getItem('onboarding_role') as any) || 'professional';
    const guestSettings = {
      role: savedRole,
      taskPreferences: 'Break items down automatically',
      customNeeds: 'Visual and textual support'
    };
    localStorage.setItem('onboarding_role', savedRole);
    localStorage.setItem('rescue_ai_guest', JSON.stringify({ user: guestUser, settings: guestSettings }));
    setCurrentUser(guestUser);
    setSettings(guestSettings);
  };

  const logout = async () => {
    localStorage.removeItem('rescue_ai_guest');
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
    setCurrentUser(null);
    setSettings(null);
  };

  const updateSettings = async (newSettings: UserSettings) => {
    if (!currentUser) return;
    const isGuestActive = localStorage.getItem('rescue_ai_guest') !== null;
    if (isGuestActive) {
      localStorage.setItem('rescue_ai_guest', JSON.stringify({ user: currentUser, settings: newSettings }));
      setSettings(newSettings);
      return;
    }
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        settings: newSettings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setSettings(newSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
    }
  };

  const value = {
    currentUser,
    loading,
    settings,
    signInWithGoogle,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    signInGuest,
    logout,
    updateSettings
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
