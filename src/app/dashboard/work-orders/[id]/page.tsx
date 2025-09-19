
'use client';
import {
  ChevronLeft,
  MoreVertical,
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
import { workOrders, customers, assets, users } from '@/lib/data';
import type { WorkOrderStatus } from '@/lib/types';
import Link from 'next/link';
import { WorkOrderClientSection } from './components/work-order-client-section';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkOrderPartsTab } from './components/work-order-parts-tab';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useMemo } from 'react';

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
  params: { id: string };
}) {
  const { user } = useAuth();
  const router = useRouter();

  const workOrder = workOrders.find((wo) => wo.id === params.id);

  useEffect(() => {
    if (!user || !workOrder) return;

    if (user.role === 'Admin') return; // Admins can see everything

    if (user.role === 'Technician' && workOrder.technicianId !== user.id) {
      router.push('/dashboard/work-orders');
    }

    if (user.role === 'Customer') {
      const customerProfile = customers.find(c => c.contactEmail === user.email);
      if (workOrder.customerId !== customerProfile?.id) {
        router.push('/dashboard/work-orders');
      }
    }
  }, [user, workOrder, router]);


  if (!workOrder) {
    return notFound();
  }

  const customer = customers.find((c) => c.id === workOrder.customerId);
  const asset = assets.find((a) => a.id === workOrder.assetId);
  const technician = users.find((u) => u.id === workOrder.technicianId);
  
  if (!user) {
    return null; // or a loading state
  }
  
  // Final check to prevent rendering for unauthorized users before redirect kicks in
  const isAuthorized = useMemo(() => {
    if (!user || !workOrder) return false;
    if (user.role === 'Admin') return true;
    if (user.role === 'Technician') return workOrder.technicianId === user.id;
    if (user.role === 'Customer') {
       const customerProfile = customers.find(c => c.contactEmail === user.email);
       return workOrder.customerId === customerProfile?.id;
    }
    return false;
  }, [user, workOrder]);

  if (!isAuthorized) {
       return (
        <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-4">
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
        {user.role === 'Admin' && (
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
          <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8 mt-4">
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
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
                customer={customer}
                technician={technician}
                asset={asset}
              />
            </div>
            <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
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
                    <Link
                      href="#"
                      className="text-sm text-primary hover:underline"
                    >
                      View Profile
                    </Link>
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
                  <CardTitle>Assigned Technician</CardTitle>
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
