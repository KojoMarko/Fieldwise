
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { initializeFirebase, type FirebaseServices } from '@/lib/firebase';
import { FirebaseProvider } from '@/firebase/provider';
import { LoaderCircle } from 'lucide-react';

export function FirebaseClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [firebase, setFirebase] = useState<FirebaseServices | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const services = initializeFirebase();
    setFirebase(services);
    setIsInitializing(false);
  }, []);

  // Show loading state while initializing
  if (isInitializing || !firebase) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoaderCircle className="animate-spin h-12 w-12 text-primary mx-auto mb-4" />
          <p>Loading Application...</p>
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
