'use client';
import { useState, useEffect } from 'react';
import type {
  CollectionReference,
  Query,
  DocumentData,
  FirestoreError,
} from 'firebase/firestore';
import { onSnapshot } from 'firebase/firestore';
import { useAuth as useFirebaseAuth } from '@/hooks/use-auth';
import { errorEmitter } from '@/lib/error-emitter';
import { FirestorePermissionError } from '@/lib/errors';
import { useFirestore } from '../provider';

export function useCollection<T>(
  query: Query<T> | CollectionReference<T> | null
) {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const { isLoading: isAuthLoading } = useFirebaseAuth();
  const firestore = useFirestore();

  useEffect(() => {
    // Don't run the query if authentication is still loading or if the query is not yet available
    if (isAuthLoading || !query || !firestore) {
      // If we are not authenticated yet, we are in a loading state.
      // If the query is null, it means the necessary conditions (e.g., user ID) aren't met yet.
      setIsLoading(true);
      return;
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const result: T[] = [];
        snapshot.forEach((doc) => {
          if (doc.exists()) {
            result.push({ id: doc.id, ...doc.data() } as T);
          }
        });
        setData(result);
        setIsLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error("Firestore Error in useCollection:", err);
        const permissionError = new FirestorePermissionError({
          operation: 'list',
          path: 'path' in query ? query.path : 'unknown',
        });
        setError(permissionError);
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
        setData(null);
      }
    );

    return () => unsubscribe();
  }, [firestore, query, isAuthLoading]);

  return { data, isLoading, error };
}
