'use client';
import { AppSidebar } from '@/components/app-sidebar';
import { Header } from '@/components/header';
import { useAuth, AuthGuard } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isArticlePage = pathname.startsWith('/dashboard/articles');

  if (isArticlePage) {
    return <main>{children}</main>;
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <AppSidebar />
      <div className="flex flex-col sm:gap-4 sm:pl-14">
        <Header />
        <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardContent>{children}</DashboardContent>
    </AuthGuard>
  );
}
