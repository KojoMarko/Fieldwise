
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SettingsForm } from "./components/settings-form";
import { useAuth } from "@/hooks/use-auth";
import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Company } from "@/lib/types";

export default function SettingsPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    
    if (user.role !== 'Admin') {
      // Non-admins shouldn't see this page.
      // In a real app, you might redirect them.
      setIsLoading(false);
      return;
    }

    const companyRef = doc(db, 'companies', user.companyId);
    const unsubscribe = onSnapshot(companyRef, (docSnap) => {
      if (docSnap.exists()) {
        setCompany(docSnap.data() as Company);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (isAuthLoading || isLoading) {
     return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  if (user?.role !== 'Admin') {
    return (
       <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>Only administrators can access company settings.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Company Settings</CardTitle>
          <CardDescription>Manage your company's information.</CardDescription>
        </CardHeader>
        <CardContent>
          {company ? <SettingsForm company={company} /> : <p>Could not load company data.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
