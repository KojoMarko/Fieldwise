
'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Customer } from '@/lib/types';
import { notFound, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, LoaderCircle, Mail, MapPin, Phone, User } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const docRef = doc(db, 'customers', params.id);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setCustomer({ id: docSnap.id, ...docSnap.data() } as Customer);
        } else {
          setCustomer(null);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching customer:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [params.id]);

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
      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
          <CardDescription>
            All information related to {customer.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
                <User className="h-5 w-5 text-muted-foreground"/>
                <div>
                    <p className="text-muted-foreground">Contact Person</p>
                    <p className="font-medium">{customer.contactPerson}</p>
                </div>
            </div>
             <div className="flex items-center gap-4 text-sm">
                <Mail className="h-5 w-5 text-muted-foreground"/>
                <div>
                    <p className="text-muted-foreground">Contact Email</p>
                    <p className="font-medium">{customer.contactEmail}</p>
                </div>
            </div>
             <div className="flex items-center gap-4 text-sm">
                <Phone className="h-5 w-5 text-muted-foreground"/>
                <div>
                    <p className="text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{customer.phone}</p>
                </div>
            </div>
             <div className="flex items-center gap-4 text-sm">
                <MapPin className="h-5 w-5 text-muted-foreground"/>
                <div>
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium">{customer.address}</p>
                </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
