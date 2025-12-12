'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { initializeFirebase, type FirebaseServices } from '@/firebase';
import { FirebaseProvider } from '@/firebase/provider';

export function FirebaseClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [firebase, setFirebase] = useState<FirebaseServices | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Initialize Firebase on the client
    try {
      const services = initializeFirebase();
      setFirebase(services);
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Show loading state while initializing
  if (isInitializing || !firebase) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
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