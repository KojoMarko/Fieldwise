
'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Asset, Customer } from '@/lib/types';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  LoaderCircle,
  Package,
  MapPin,
  Barcode,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

function CustomerInfo({ customerId }: { customerId: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (!customerId) return;
    const customerRef = doc(db, 'customers', customerId);
    const unsubscribe = onSnapshot(customerRef, (docSnap) => {
      if (docSnap.exists()) {
        setCustomer({ id: docSnap.id, ...docSnap.data() } as Customer);
      }
    });
    return () => unsubscribe();
  }, [customerId]);

  if (!customer) {
    return <p className="text-sm text-muted-foreground">Loading customer...</p>;
  }

  return (
    <div className="grid gap-3">
        <div className="font-semibold">{customer.name}</div>
        <address className="grid gap-0.5 not-italic text-muted-foreground text-sm">
            <span>{customer.contactPerson}</span>
            <span>{customer.address}</span>
        </address>
        <Button variant="outline" size="sm" asChild className="mt-2 w-fit">
            <Link href={`/dashboard/customers/${customer.id}`}>View Customer</Link>
        </Button>
    </div>
  )
}

export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const docRef = doc(db, 'assets', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setAsset({ id: docSnap.id, ...docSnap.data() } as Asset);
      } else {
        setAsset(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!asset) {
    return notFound();
  }

  return (
    <div className="mx-auto grid max-w-4xl flex-1 auto-rows-max gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/assets">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to Assets</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          {asset.name}
        </h1>
        <Badge variant="outline" className="ml-auto sm:ml-0">
          Asset
        </Badge>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Asset Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 text-sm">
                <Package className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Model</p>
                  <p className="font-medium">{asset.model}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-4 text-sm">
                <Barcode className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Serial Number</p>
                  <p className="font-medium">{asset.serialNumber}</p>
                </div>
              </div>
               <Separator />
              <div className="flex items-start gap-4 text-sm">
                <Calendar className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Installation Date</p>
                  <p className="font-medium">{asset.installationDate ? format(new Date(asset.installationDate), 'PPP') : 'N/A'}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-4 text-sm">
                <MapPin className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{asset.location}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
             <CardDescription>
                This asset is assigned to the following customer.
              </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerInfo customerId={asset.customerId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
