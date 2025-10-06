
'use client';
import {
  ChevronLeft,
  Wrench,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { notFound, useRouter } from 'next/navigation';
import type { WorkOrder, WorkOrderStatus, Customer, Asset, User } from '@/lib/types';
import Link from 'next/link';
import { WorkOrderClientSection } from './components/work-order-client-section';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkOrderPartsTab } from './components/work-order-parts-tab';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, use } from 'react';
import { collection, doc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoaderCircle } from 'lucide-react';


const statusStyles: Record<WorkOrderStatus, string> = {
  Draft: 'bg-gray-200 text-gray-800',
  Scheduled: 'bg-blue-100 text-blue-800',
  'In-Progress': 'bg-yellow-100 text-yellow-800',
  'On-Hold': 'bg-orange-100 text-orange-800',
  Completed: 'bg-green-100 text-green-800',
  Invoiced: 'bg-purple-100 text-purple-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export default function WorkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [technician, setTechnician] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!id) return;
    const workOrderRef = doc(db, 'work-orders', id);

    const unsubWorkOrder = onSnapshot(workOrderRef, (docSnap) => {
        if (docSnap.exists()) {
            const wo = { ...docSnap.data(), id: docSnap.id } as WorkOrder;
            setWorkOrder(wo);
        } else {
            setWorkOrder(null);
        }
        setIsLoading(false);
    });

    return () => unsubWorkOrder();

  }, [id]);


  useEffect(() => {
    if (!workOrder || !user) return;
    
    if (workOrder.customerId) {
        const customerRef = doc(db, 'customers', workOrder.customerId);
        onSnapshot(customerRef, (docSnap) => setCustomer(docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } as Customer : null));
    }

    if (workOrder.assetId) {
        const assetRef = doc(db, 'assets', workOrder.assetId);
        onSnapshot(assetRef, (docSnap) => setAsset(docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } as Asset : null));
    }

    if (workOrder.technicianId) {
        const techRef = doc(db, 'users', workOrder.technicianId);
        onSnapshot(techRef, (docSnap) => setTechnician(docSnap.exists() ? { ...docSnap.data(), id: docSnap.id } as User : null));
    }

    // Authorization logic
    let authorized = false;
    if (user.role === 'Admin') {
        authorized = true;
    } else if (user.role === 'Engineer' && workOrder.technicianId === user.id) {
        authorized = true;
    } else if (user.role === 'Customer') {
        // Need to check if the user is linked to the customer account
        const customerQuery = query(collection(db, 'customers'), where('contactEmail', '==', user.email), where('companyId', '==', user.companyId));
        getDocs(customerQuery).then(customerSnapshot => {
            if (!customerSnapshot.empty) {
                const customerProfileId = customerSnapshot.docs[0].id;
                if(workOrder.customerId === customerProfileId) {
                    setIsAuthorized(true);
                } else {
                    router.push('/dashboard/work-orders');
                }
            } else {
                 router.push('/dashboard/work-orders');
            }
        });
        return; // Early return because auth is async
    } else {
         router.push('/dashboard/work-orders');
    }

    setIsAuthorized(authorized);
    if (!authorized) {
      router.push('/dashboard/work-orders');
    }

  }, [workOrder, user, router]);


  if (isLoading || isAuthLoading) {
    return <div className="flex h-screen w-full items-center justify-center"><LoaderCircle className="h-10 w-10 animate-spin" /></div>
  }

  if (!workOrder) {
    return notFound();
  }
  
  if (!isAuthorized) {
       return (
        <div className="flex flex-col items-center justify-center h-[80vh] text-center gap-4 p-4">
            <Card className='max-w-md'>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                        Access Denied
                    </CardTitle>
                    <CardDescription>
                        You do not have permission to view this work order.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className='text-sm text-muted-foreground'>You are being redirected to your dashboard.</p>
                </CardContent>
                <CardFooter>
                     <Button asChild className="w-full">
                        <Link href="/dashboard/work-orders">Return to Work Orders</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
  }


  return (
    <div className="mx-auto grid max-w-6xl flex-1 auto-rows-max gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/work-orders">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          {workOrder.title}
        </h1>
        <Badge variant="outline" className={statusStyles[workOrder.status]}>
          {workOrder.status}
        </Badge>
        {user?.role === 'Admin' && (
            <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Button variant="outline" size="sm">
                    Discard
                </Button>
                <Button size="sm">Save</Button>
            </div>
        )}
      </div>
      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="parts">Parts &amp; Inventory</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <div className="grid gap-4 xl:grid-cols-3 xl:gap-8 mt-4">
            <div className="grid auto-rows-max items-start gap-4 xl:col-span-2 xl:gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Work Order Details</CardTitle>
                  <CardDescription>{workOrder.id}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {workOrder.description}
                  </p>
                </CardContent>
              </Card>
              <WorkOrderClientSection
                workOrder={workOrder}
                customer={customer || undefined}
                technician={technician || undefined}
                asset={asset || undefined}
              />
            </div>
            <div className="grid auto-rows-max items-start gap-4 xl:gap-8">
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle>Asset Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <div className="font-semibold">{asset?.name}</div>
                    <dl className="grid gap-1">
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">Model</dt>
                        <dd>{asset?.model}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt className="text-muted-foreground">S/N</dt>
                        <dd>{asset?.serialNumber}</dd>
                      </div>
                    </dl>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{customer?.name}</div>
                    {customer && (
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Profile
                    </Link>
                    )}
                  </div>
                  <address className="grid gap-0.5 not-italic text-muted-foreground">
                    <span>{customer?.contactPerson}</span>
                    <span>{customer?.address}</span>
                  </address>
                  <Separator />
                  <div className="font-semibold">Contact</div>
                  <dl className="grid gap-1">
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd>
                        <a href={`mailto:${customer?.contactEmail}`}>
                          {customer?.contactEmail}
                        </a>
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd>
                        <a href={`tel:${customer?.phone}`}>{customer?.phone}</a>
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Assigned Engineer</CardTitle>
                </CardHeader>
                <CardContent>
                  {technician ? (
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <span>{technician.name}</span>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Unassigned
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="parts">
            <WorkOrderPartsTab workOrder={workOrder} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

    