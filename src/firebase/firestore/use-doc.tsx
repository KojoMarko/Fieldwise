'use client';
import { useState, useEffect } from 'react';
import type {
  DocumentReference,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { useAuth as useFirebaseAuth } from '@/hooks/use-auth';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import { useFirestore } from '../provider';

export function useDoc<T>(docRef: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const { isLoading: isAuthLoading } = useFirebaseAuth();
  const firestore = useFirestore();

  useEffect(() => {
    // Don't run if auth is loading or the docRef isn't ready
    if (isAuthLoading || !docRef || !firestore) {
      setIsLoading(true);
      return;
    }

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...snapshot.data() } as T);
        } else {
          setData(null); // Document does not exist
        }
        setIsLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error("Firestore Error in useDoc:", err);
        const permissionError = new FirestorePermissionError({
          operation: 'get',
          path: docRef.path,
        });
        setError(permissionError);
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
        setData(null);
      }
    );

    return () => unsubscribe();
  }, [firestore, docRef, isAuthLoading]);

  return { data, isLoading, error };
}
