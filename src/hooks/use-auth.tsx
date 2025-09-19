
'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { users as mockUsers } from '@/lib/data';
import type { User } from '@/lib/types';
import { auth as firebaseAuth } from '@/lib/firebase';
import { 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    updateProfile,
    type User as FirebaseUser
} from 'firebase/auth';

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
    const unsubscribe = onAuthStateChanged(firebaseAuth, (fbUser) => {
        setFirebaseUser(fbUser);
        if (fbUser) {
            // This is a simplified mapping. In a real app, you'd fetch user role and other details from Firestore.
            const appUser = mockUsers.find(u => u.email === fbUser.email);
            setUser(appUser || {
                id: fbUser.uid,
                name: fbUser.displayName || 'New User',
                email: fbUser.email!,
                // New users are Customers by default, an Admin can change this.
                // In a real app, the first user for a company would be an admin.
                role: 'Admin', 
                avatarUrl: fbUser.photoURL || `https://picsum.photos/seed/${fbUser.uid}/100/100`,
                companyId: 'new-company' // This would be properly assigned
            });
        } else {
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
    
    if (userCredential.user) {
        await updateProfile(userCredential.user, {
            displayName: name,
        });

        // In a real app, you would create a new company and user document in Firestore here.
        console.log(`New company "${companyName}" created for user "${name}"`);

        setFirebaseUser(userCredential.user);
         setUser({
            id: userCredential.user.uid,
            name: name,
            email: email,
            role: 'Admin', // The first user is an Admin
            avatarUrl: `https://picsum.photos/seed/${userCredential.user.uid}/100/100`,
            companyId: companyName.toLowerCase().replace(/\s+/g, '-') // generate a companyId
        });
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
