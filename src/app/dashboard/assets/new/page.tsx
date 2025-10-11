
'use client';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { AssetForm } from '../components/asset-form';
import { useAuth } from '@/hooks/use-auth';
import { Suspense } from 'react';

function NewAssetPageContent() {
  const { user } = useAuth();

  return (
    <div className="mx-auto grid max-w-4xl flex-1 auto-rows-max gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/assets">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          Add New Asset
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Asset Details</CardTitle>
          <CardDescription>
            Fill out the form below to add a new asset to the inventory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssetForm />
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewAssetPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewAssetPageContent />
        </Suspense>
    )
}
