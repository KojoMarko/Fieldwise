
'use client';

import { useEffect, useState, use } from 'react';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Asset, Customer, WorkOrder, WorkOrderStatus, LifecycleEvent } from '@/lib/types';
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
  Wrench,
  CheckCircle,
  Flag,
  Info,
  History,
} from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const statusStyles: Record<WorkOrderStatus, string> = {
  Draft: 'bg-gray-200 text-gray-800',
  Scheduled: 'bg-blue-100 text-blue-800',
  'In-Progress': 'bg-yellow-100 text-yellow-800',
  'On-Hold': 'bg-orange-100 text-orange-800',
  Completed: 'bg-green-100 text-green-800',
  Invoiced: 'bg-purple-100 text-purple-800',
  Cancelled: 'bg-red-100 text-red-800',
};


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

function AssetServiceHistory({ asset }: { asset: Asset }) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!asset.id) return;
    const q = query(collection(db, 'work-orders'), where('assetId', '==', asset.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders: WorkOrder[] = [];
      snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data()} as WorkOrder));
      setWorkOrders(orders);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [asset.id]);

  const timelineEvents = [
      {
          type: 'installation',
          date: parseISO(asset.installationDate),
          title: 'Asset Installed',
          description: `Asset was installed at ${asset.location}.`
      },
      ...(asset.lifecycleNotes || []).map((event: LifecycleEvent) => ({
          type: 'manual_log',
          date: parseISO(event.date),
          title: 'Manual Log Entry',
          description: event.note,
      })),
      ...workOrders.map(wo => ({
          type: 'work-order',
          date: parseISO(wo.scheduledDate),
          title: wo.title,
          status: wo.status,
          id: wo.id
      }))
  ].sort((a,b) => b.date.getTime() - a.date.getTime());


  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoaderCircle className="h-6 w-6 animate-spin" />
      </div>
    )
  }
  
  const eventIcons: Record<string, React.ReactNode> = {
      installation: <CheckCircle className="h-4 w-4 text-green-500" />,
      'work-order': <Wrench className="h-4 w-4 text-blue-500" />,
      manual_log: <History className="h-4 w-4 text-gray-500" />,
  }


  return (
    <div>
      {timelineEvents.length > 0 ? (
        <div className="relative pl-8">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border -translate-x-1/2"></div>
            <ul className="space-y-8">
            {timelineEvents.map((event, index) => (
                <li key={index} className="relative">
                    <div className="absolute -left-0.5 top-1 h-9 w-9 bg-background rounded-full flex items-center justify-center border-2">
                        {eventIcons[event.type] || <Info className="h-4 w-4 text-muted-foreground"/>}
                    </div>
                    {event.type === 'work-order' ? (
                        <Link href={`/dashboard/work-orders/${event.id}`} className="block p-4 border rounded-lg hover:bg-muted transition-colors ml-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{event.title}</p>
                                    <time className="text-xs text-muted-foreground">{format(event.date, 'PPP')}</time>
                                </div>
                                <Badge variant="outline" className={statusStyles[event.status!]}>{event.status}</Badge>
                            </div>
                        </Link>
                    ) : (
                         <div className="p-4 border rounded-lg bg-muted/50 ml-4">
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                            <time className="text-xs text-muted-foreground">{format(event.date, 'PPP')}</time>
                        </div>
                    )}
                </li>
            ))}
            </ul>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed py-10 text-center">
            <Wrench className="h-10 w-10 text-muted-foreground" />
            <p className="mt-4 font-semibold">No Service History</p>
            <p className="text-sm text-muted-foreground">
                There are no work orders logged for this asset yet.
            </p>
        </div>
      )}
    </div>
  )

}


export default function AssetDetailPage({ params }: { params: { id: string } }) {
  const { id } = use(params);
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
        <div className="grid gap-4 md:grid-cols-2">
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

        <Card>
          <CardHeader>
            <CardTitle>Asset Lifecycle &amp; Service History</CardTitle>
            <CardDescription>
              A complete history of all service events for this asset.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssetServiceHistory asset={asset} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
