
'use client';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/lib/firebase';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const firebaseServices = initializeFirebase();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>FieldWise</title>
        <meta name="description" content="Enterprise-grade field service management" />
        <link rel="icon" href="/Field Wise Logo.png" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <FirebaseProvider
          app={firebaseServices.app}
          auth={firebaseServices.auth}
          firestore={firebaseServices.db}
          storage={firebaseServices.storage}
        >
          <AuthProvider>
              <FirebaseErrorListener>
                  {children}
              </FirebaseErrorListener>
          </AuthProvider>
        </FirebaseProvider>
        <Toaster />
      </body>
    </html>
  );
}
