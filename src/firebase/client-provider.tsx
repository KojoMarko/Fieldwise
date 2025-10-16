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

  useEffect(() => {
    // Initialize Firebase on the client
    const services = initializeFirebase();
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
    >
      {children}
    </FirebaseProvider>
  );
}
