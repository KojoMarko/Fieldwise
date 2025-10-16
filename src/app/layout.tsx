
'use client';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { FirebaseErrorListener } from '@/components/firebase-error-listener';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <AuthProvider>
            <FirebaseErrorListener>
                {children}
            </FirebaseErrorListener>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
