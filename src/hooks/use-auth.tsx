
'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { useAuthFirebase } from '@/firebase';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    updateProfile,
    type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';


interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string, companyName: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const firebaseAuth = useAuthFirebase();
  const db = useFirestore();

  useEffect(() => {
    if (!firebaseAuth) {
        setIsLoading(false);
        return;
    };
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        if (!db) {
            console.error("Firestore is not initialized");
            setIsLoading(false);
            return;
        }
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            setUser(userDoc.data() as User);
          } else {
            console.warn(`User ${fbUser.uid} exists in Auth but not in Firestore. Logging out.`);
            await signOut(firebaseAuth);
            setUser(null);
            setFirebaseUser(null);
          }
        } catch (error) {
          console.error('Error fetching user document:', error);
          setUser(null);
          setFirebaseUser(null);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseAuth, db]);

  const login = useCallback(async (email: string, pass: string) => {
    if (!firebaseAuth) throw new Error("Auth service not available.");
    await signInWithEmailAndPassword(firebaseAuth, email, pass);
  }, [firebaseAuth]);

  const signup = useCallback(async (email: string, pass: string, name: string, companyName: string) => {
    if (!firebaseAuth || !db) throw new Error("Auth or Firestore service not available.");

    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, pass);
    const fbUser = userCredential.user;
    
    if (fbUser) {
        await updateProfile(fbUser, {
            displayName: name,
            photoURL: `https://picsum.photos/seed/${fbUser.uid}/100/100`
        });

        const companyId = companyName.toLowerCase().replace(/\s+/g, '-');
        const newUser: User = {
            id: fbUser.uid,
            name: name,
            email: email,
            role: 'Admin',
            avatarUrl: `https://picsum.photos/seed/${fbUser.uid}/100/100`,
            companyId: companyId
        };
        
        await setDoc(doc(db, "users", fbUser.uid), newUser);
        
        const companyDocRef = doc(db, "companies", companyId);
        const companyDoc = await getDoc(companyDocRef);
        if (!companyDoc.exists()) {
            await setDoc(companyDocRef, {
                id: companyId,
                name: companyName
            });
        }

        setUser(newUser);
    }
  }, [firebaseAuth, db]);

  const logout = useCallback(async () => {
    if (!firebaseAuth) return;
    await signOut(firebaseAuth);
    router.push('/login');
  }, [firebaseAuth, router]);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthGuard({ children }: { children: ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [isLoading, user, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null; // or a loading spinner, as the redirect will happen shortly
    }

    return <>{children}</>;
}
