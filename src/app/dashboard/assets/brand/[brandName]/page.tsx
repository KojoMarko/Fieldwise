
'use client';
import { useState, useEffect, use } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Asset } from '@/lib/types';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit, HardDrive, LoaderCircle, PlusCircle, Sparkles, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { DataTable } from '../../components/data-table';
import { columns } from '../../components/columns';
import { Textarea } from '@/components/ui/textarea';

export default function AssetBrandPage({
  params,
}: {
  params: Promise<{ brandName: string }>;
}) {
  const { user } = useAuth();
  const resolvedParams = use(params);
  const brandName = decodeURIComponent(resolvedParams.brandName);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }

    const assetsQuery = query(
      collection(db, 'assets'),
      where('companyId', '==', user.companyId),
      where('name', '==', brandName)
    );

    const unsubscribe = onSnapshot(assetsQuery, (snapshot) => {
      const assetsData: Asset[] = [];
      snapshot.forEach((doc) =>
        assetsData.push({ id: doc.id, ...doc.data() } as Asset)
      );
      setAssets(assetsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.companyId, brandName]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!isLoading && assets.length === 0) {
    return notFound();
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/assets">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold truncate">{brandName}</h1>
            <p className="text-sm text-muted-foreground">{assets.length} assets in inventory</p>
        </div>
        <Button size="sm" className="h-8 gap-1" asChild>
            <Link href={`/dashboard/assets/new?name=${encodeURIComponent(brandName)}`}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Asset
                </span>
            </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Asset Inventory</CardTitle>
                    <CardDescription>
                    All registered assets for the {brandName} brand.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DataTable columns={columns} data={assets} />
                </CardContent>
            </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Service Intelligence
                    </CardTitle>
                    <CardDescription>
                        Key repair notes and messages from senior engineers for the {brandName}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea placeholder="Add a new note or insight for this machine type..."/>
                    <Button className="w-full">Save Note</Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Repair Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="border-l-4 border-yellow-400 pl-4 py-2 bg-yellow-50">
                        <p className="text-sm font-medium">"Remember to check the secondary pump filter (P/N V5600-PF-S2) if you get a low-pressure error. It's often overlooked."</p>
                        <p className="text-xs text-muted-foreground mt-1">- Senior Engineer, 05/20/2024</p>
                    </div>
                     <div className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50">
                        <p className="text-sm font-medium">"The calibration sequence must be run twice after replacing the mainboard. The first run often fails with a timeout."</p>
                         <p className="text-xs text-muted-foreground mt-1">- Tech Support Bulletin, 03/11/2024</p>
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
