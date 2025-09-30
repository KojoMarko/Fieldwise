
'use client';
import { File, PlusCircle, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Asset } from '@/lib/types';
import Link from 'next/link';


export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const assetsQuery = query(collection(db, "assets"), where("companyId", "==", user.companyId));
    
    const unsubscribe = onSnapshot(assetsQuery, (snapshot) => {
      const assetsData: Asset[] = [];
      snapshot.forEach((doc) => {
        assetsData.push({ id: doc.id, ...doc.data() } as Asset);
      });
      setAssets(assetsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.companyId]);


  return (
    <>
      <div className="flex items-center mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">Assets</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
           <Button size="sm" className="h-8 gap-1" asChild>
                <Link href="/dashboard/assets/new">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Asset
                    </span>
                </Link>
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Assets</CardTitle>
            <CardDescription>
            Manage all company and customer assets.
            </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center p-10">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading assets...</p>
            </div>
           ) : (
            <DataTable columns={columns} data={assets} />
           )}
        </CardContent>
      </Card>
    </>
  );
}
