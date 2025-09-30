
'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Asset, Customer } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
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
  HardDrive,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function CustomerDetailPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const docRef = doc(db, 'customers', id);

    const unsubscribeCustomer = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setCustomer({ id: docSnap.id, ...docSnap.data() } as Customer);
        } else {
          setCustomer(null);
        }
        // Don't set loading to false here yet
      },
      (error) => {
        console.error('Error fetching customer:', error);
        setIsLoading(false);
      }
    );

    const assetsQuery = query(
      collection(db, 'assets'),
      where('customerId', '==', id)
    );
    const unsubscribeAssets = onSnapshot(assetsQuery, (snapshot) => {
      const assetsData: Asset[] = [];
      snapshot.forEach((doc) => {
        assetsData.push({ id: doc.id, ...doc.data() } as Asset);
      });
      setAssets(assetsData);
      setIsLoading(false); // Set loading to false after assets are fetched
    });

    return () => {
      unsubscribeCustomer();
      unsubscribeAssets();
    };
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return notFound();
  }

  return (
    <div className="mx-auto grid max-w-4xl flex-1 auto-rows-max gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/customers">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to Customers</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          {customer.name}
        </h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
            <CardDescription>
              Contact information for {customer.name}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 text-sm">
                <User className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Contact Person</p>
                  <p className="font-medium">{customer.contactPerson}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-4 text-sm">
                <Mail className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Contact Email</p>
                  <p className="font-medium">{customer.contactEmail}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-4 text-sm">
                <Phone className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Phone Number</p>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-start gap-4 text-sm">
                <MapPin className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-medium">{customer.address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Managed Assets</CardTitle>
            <CardDescription>
              All equipment supplied to or managed for this customer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {assets.length > 0 ? (
              <ul className="space-y-4">
                {assets.map((asset) => (
                  <li
                    key={asset.id}
                    className="flex items-center justify-between rounded-md border p-4"
                  >
                    <div className="grid gap-1">
                      <p className="font-semibold leading-none">{asset.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Model: {asset.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        S/N: {asset.serialNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Location: {asset.location}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/assets/${asset.id}`}>
                        View Asset
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed py-10 text-center">
                <HardDrive className="h-10 w-10 text-muted-foreground" />
                <p className="mt-4 font-semibold">No Assets Found</p>
                <p className="text-sm text-muted-foreground">
                  There are no assets currently assigned to this customer.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
