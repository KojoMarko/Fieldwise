
'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { users as mockUsers } from '@/lib/data';
import type { User } from '@/lib/types';
import { auth as firebaseAuth, db } from '@/lib/firebase';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    updateProfile,
    type User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';


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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
        if (fbUser) {
            setFirebaseUser(fbUser);
            const userDocRef = doc(db, 'users', fbUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                setUser(userDoc.data() as User);
            } else {
                // Fallback for initial mock users who don't exist in Firestore yet
                const mockUser = mockUsers.find(u => u.email === fbUser.email);
                if (mockUser) {
                    const userToSave: User = { ...mockUser, id: fbUser.uid };
                    await setDoc(userDocRef, userToSave);
                    setUser(userToSave);
                } else {
                    setUser(null);
                }
            }
        } else {
            setFirebaseUser(null);
            setUser(null);
        }
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    await signInWithEmailAndPassword(firebaseAuth, email, pass);
  }, []);

  const signup = useCallback(async (email: string, pass: string, name: string, companyName: string) => {
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
            role: 'Admin', // The first user of a company is an Admin
            avatarUrl: `https://picsum.photos/seed/${fbUser.uid}/100/100`,
            companyId: companyId
        };
        
        // Create a new document in the 'users' collection
        await setDoc(doc(db, "users", fbUser.uid), newUser);
        
        // Also create a company document if it's a new company
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
  }, []);

  const logout = useCallback(async () => {
    await signOut(firebaseAuth);
    router.push('/login');
  }, [router]);

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
