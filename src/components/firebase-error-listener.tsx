
'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/lib/error-emitter';
import type { SecurityRuleError } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { X, ShieldAlert, Code } from 'lucide-react';
import { Button } from './ui/button';

export function FirebaseErrorListener({ children }: { children: React.ReactNode }) {
  const [error, setError] = useState<SecurityRuleError | null>(null);

  useEffect(() => {
    const handleError = (e: SecurityRuleError) => {
      console.error("Caught a Firestore permission error:", e);
      setError(e);
    };

    errorEmitter.on('permission-error', handleError);

    // No need to return a cleanup function as the emitter is a singleton
    // and we want it to listen for the entire lifecycle of the app.
  }, []);

  if (!error) {
    return <>{children}</>;
  }

  // When an error is caught, render the overlay
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="max-w-4xl w-full mx-4">
        <Alert variant="destructive" className="shadow-2xl">
           <div className="flex justify-between items-start">
             <div className='flex items-start gap-4'>
                <ShieldAlert className="h-6 w-6" />
                <div>
                    <AlertTitle className="text-xl font-bold">Firestore Security Rules Error</AlertTitle>
                    <AlertDescription className="mt-2 text-md">
                        Your request was blocked by security rules. Here's the context:
                    </AlertDescription>
                </div>
             </div>
             <Button variant="ghost" size="icon" onClick={() => setError(null)}>
                <X className="h-5 w-5" />
             </Button>
           </div>
           
            <div className="mt-4 p-4 bg-secondary/30 rounded-md font-mono text-sm overflow-auto max-h-[60vh]">
                <pre className="whitespace-pre-wrap break-words">{JSON.stringify(error.context, null, 2)}</pre>
            </div>
            <div className="mt-4 text-xs text-destructive/80">
                This overlay is only shown in development. It will not appear in production.
            </div>
        </Alert>
      </div>
    </div>
  );
}
