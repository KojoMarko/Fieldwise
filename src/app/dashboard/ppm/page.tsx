
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Asset, Customer } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { addMonths, format, isPast } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function PpmPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const assetsQuery = query(collection(db, "assets"), where("companyId", "==", user.companyId));
    const customersQuery = query(collection(db, "customers"), where("companyId", "==", user.companyId));
    
    const unsubscribeAssets = onSnapshot(assetsQuery, (snapshot) => {
      const assetsData: Asset[] = [];
      snapshot.forEach((doc) => {
        const asset = { id: doc.id, ...doc.data() } as Asset;
        // Only show assets that have a PPM schedule defined.
        if (asset.ppmFrequency) {
          assetsData.push(asset);
        }
      });
      setAssets(assetsData);
      setIsLoading(false);
    });

    const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
        const customersData: Record<string, string> = {};
        snapshot.forEach((doc) => {
            const customer = doc.data() as Customer;
            customersData[doc.id] = customer.name;
        });
        setCustomers(customersData);
    });


    return () => {
        unsubscribeAssets();
        unsubscribeCustomers();
    };
  }, [user?.companyId]);

  const ppmSchedule = assets.map(asset => {
    if (asset.lastPpmDate && asset.ppmFrequency) {
        const lastPpm = new Date(asset.lastPpmDate);
        const nextPpm = addMonths(lastPpm, asset.ppmFrequency);
        return {
            ...asset,
            nextPpmDate: nextPpm,
            isOverdue: isPast(nextPpm)
        }
    }
    return {
        ...asset,
        nextPpmDate: null,
        isOverdue: false
    }
  }).sort((a,b) => {
      if (a.nextPpmDate && b.nextPpmDate) {
        return a.nextPpmDate.getTime() - b.nextPpmDate.getTime();
      }
      if (!a.nextPpmDate) return 1;
      if (!b.nextPpmDate) return -1;
      return 0;
  });

  return (
    <>
      <div className="flex items-center mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">Upcoming PPMs</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Preventive Maintenance Schedule</CardTitle>
          <CardDescription>
            A list of all assets with scheduled upcoming preventive maintenance.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
             <div className="flex items-center justify-center p-10">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading PPM schedule...</p>
            </div>
           ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Last PPM</TableHead>
                    <TableHead>Next PPM Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ppmSchedule.length > 0 ? (
                    ppmSchedule.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell>
                            <Link href={`/dashboard/assets/${asset.id}`} className="font-medium text-primary hover:underline">{asset.name}</Link>
                            <div className="text-sm text-muted-foreground">{asset.serialNumber}</div>
                        </TableCell>
                        <TableCell>
                            <Link href={`/dashboard/customers/${asset.customerId}`} className="text-sm text-primary hover:underline">{customers[asset.customerId] || 'Loading...'}</Link>
                        </TableCell>
                        <TableCell>{asset.lastPpmDate ? format(new Date(asset.lastPpmDate), 'PPP') : 'N/A'}</TableCell>
                        <TableCell>{asset.nextPpmDate ? format(asset.nextPpmDate, 'PPP') : 'N/A'}</TableCell>
                        <TableCell>
                            {asset.nextPpmDate ? (
                                asset.isOverdue ? (
                                    <Badge variant="destructive">Overdue</Badge>
                                ) : (
                                    <Badge variant="outline">Upcoming</Badge>
                                )
                            ) : (
                                <Badge variant="secondary">Unscheduled</Badge>
                            )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center"
                      >
                        No assets with PPM schedules found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
           )}
        </CardContent>
      </Card>
    </>
  );
}
