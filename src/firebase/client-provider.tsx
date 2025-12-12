
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { initializeFirebase, type FirebaseServices } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';
import { connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator as connectDbEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator as connectStoreEmulator } from 'firebase/storage';


export function FirebaseClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [firebase, setFirebase] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // Initialize Firebase on the client
    const services = initializeFirebase();

    if (process.env.NODE_ENV === 'development') {
      try {
        connectAuthEmulator(services.auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        connectDbEmulator(services.db, '127.0.0.1', 8080);
        connectStoreEmulator(services.storage, '127.0.0.1', 9199);
      } catch (error) {
        // This can happen with Next.js fast refresh. It's usually safe to ignore.
        console.warn('Firebase emulators already connected or connection failed:', error);
      }
    }

    setFirebase(services);
  }, []);

  if (!firebase) {
    // You can return a loading spinner here if you want
    return null; 
  }

  return (
    <FirebaseProvider
      app={firebase.app}
      auth={firebase.auth}
      firestore={firebase.db}
      storage={firebase.storage}
    >
      {children}
    </FirebaseProvider>
  );
}
