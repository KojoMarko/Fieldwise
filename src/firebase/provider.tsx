
'use client';
import {
  createContext,
  useContext,
  type ReactNode,
} from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  storage: FirebaseStorage | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  auth: null,
  firestore: null,
  storage: null,
});

export function FirebaseProvider({
  children,
  app,
  auth,
  firestore,
  storage,
}: {
  children: ReactNode;
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
}) {
  return (
    <FirebaseContext.Provider value={{ app, auth, firestore, storage }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebaseApp = () => {
    const context = useContext(FirebaseContext);
    if (!context || !context.app) {
        throw new Error('useFirebaseApp must be used within a FirebaseProvider');
    }
    return context.app;
}

export const useAuthFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context || !context.auth) {
        throw new Error('useAuth must be used within a FirebaseProvider');
    }
    return context.auth;
}

export const useFirestore = (): Firestore => {
    const context = useContext(FirebaseContext);
    if (!context || !context.firestore) {
        throw new Error('useFirestore must be used within a FirebaseProvider');
    }
    return context.firestore;
}

export const useStorage = () => {
    const context = useContext(FirebaseContext);
    if (!context || !context.storage) {
        throw new Error('useStorage must be used within a FirebaseProvider');
    }
    return context.storage;
}
