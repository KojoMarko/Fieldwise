'use client';
import {
  ChevronLeft,
  Wrench,
  ShieldAlert,
  Calendar,
  Clock,
  User as UserIcon,
  HardDrive,
  MapPin,
  ClipboardList,
  ClipboardCheck,
  Package,
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
import type { WorkOrder, WorkOrderStatus, Customer, Asset, User, WorkOrderPriority } from '@/lib/types';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, use } from 'react';
import { collection, doc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoaderCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';


const statusStyles: Record<WorkOrderStatus, string> = {
  Draft: 'bg-gray-200 text-gray-800',
  Scheduled: 'bg-blue-100 text-blue-800',
  'In-Progress': 'bg-yellow-100 text-yellow-800',
  'On-Hold': 'bg-orange-100 text-orange-800',
  Completed: 'bg-green-100 text-green-800',
  Invoiced: 'bg-purple-100 text-purple-800',
  Cancelled: 'bg-red-100 text-red-800',
};

const priorityStyles: Record<WorkOrderPriority, string> = {
    Low: 'bg-gray-200 text-gray-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    High: 'bg-red-100 text-red-800 border-red-200'
}


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
    if (user.role === 'Admin' || user.role === 'Engineer') {
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
    <div className="mx-auto grid max-w-4xl flex-1 auto-rows-max gap-4 p-4 md:p-0">
        <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Engineer's Work Order Details Page: {workOrder.id}
            </h1>
            <p className="text-muted-foreground">
                Comprehensive maintenance work order management system for field engineers.
            </p>
        </div>

        {/* --- Status & Priority --- */}
        <Card>
            <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className='space-y-1'>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge className={cn('w-fit', statusStyles[workOrder.status])} variant="outline">{workOrder.status}</Badge>
                </div>
                <div className='space-y-1'>
                    <p className="text-sm font-medium text-muted-foreground">Priority</p>
                    <Badge className={cn('w-fit', priorityStyles[workOrder.priority])} variant="destructive">{workOrder.priority}</Badge>
                </div>
                <div className='space-y-1'>
                    <p className="text-sm font-medium text-muted-foreground">Work Order No.</p>
                    <p className="font-semibold">{workOrder.id}</p>
                </div>
                 <div className='space-y-1'>
                    <p className="text-sm font-medium text-muted-foreground">Work Order Type</p>
                    <p className="font-semibold">{workOrder.type}</p>
                </div>
                <div className='space-y-1'>
                    <p className="text-sm font-medium text-muted-foreground">Order Issued</p>
                    <p className="font-semibold">{format(parseISO(workOrder.createdAt), 'yyyy-MM-dd hh:mm a')}</p>
                </div>
                <div className='space-y-1'>
                    <p className="text-sm font-medium text-muted-foreground">Target Completion</p>
                    <p className="font-semibold">{format(parseISO(workOrder.scheduledDate), 'yyyy-MM-dd hh:mm a')}</p>
                </div>
            </CardContent>
        </Card>

        {/* --- Asset & Location Info --- */}
        <Card>
             <CardHeader>
                <CardTitle className="text-lg">Asset & Location Information</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Asset Name</p>
                        <p className="font-semibold">{asset?.name} ({asset?.model})</p>
                        <p className="text-xs text-muted-foreground">Asset ID: {asset?.serialNumber}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Location</p>
                        <p className="font-semibold">{asset?.location}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Physical Location</p>
                        <p className="font-semibold">{customer?.address}</p>
                    </div>
                    <div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/assets/${asset?.id}`}>
                                <HardDrive className="mr-2 h-4 w-4" /> View Asset History
                            </Link>
                        </Button>
                         <p className="text-xs text-muted-foreground mt-2">
                            <Link href="#" className="underline">Last 5 work orders</Link>, <Link href="#" className="underline">PM schedule</Link>, and <Link href="#" className="underline">sensor readings</Link>.
                        </p>
                    </div>
                </div>
                 <div className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Requester</p>
                        <p className="font-semibold">{customer?.contactPerson}</p>
                         <p className="text-xs text-muted-foreground">Contact: {customer?.phone} | {customer?.contactEmail}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Date of Report</p>
                        <p className="font-semibold">{format(parseISO(workOrder.createdAt), 'yyyy-MM-dd hh:mm a')}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* --- Problem & Scope --- */}
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Problem & Scope of Work</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h3 className="font-semibold mb-2">Problem Description (Reported Issue)</h3>
                    <p className="text-sm text-muted-foreground bg-slate-50 p-3 rounded-md border">
                        {workOrder.description || "No description provided."}
                    </p>
                </div>
                 <div>
                    <h3 className="font-semibold mb-2">Scope of Work (Required Action)</h3>
                    <div className="text-sm text-muted-foreground bg-slate-50 p-3 rounded-md border">
                        {workOrder.technicianNotes ? (
                             <div dangerouslySetInnerHTML={{ __html: workOrder.technicianNotes?.replace(/\\n/g, '<br />') || '' }} />
                        ) : (
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Diagnose the root cause of the issue.</li>
                                <li>Perform necessary repairs or replacements.</li>
                                <li>Test the equipment to ensure it is fully operational.</li>
                                <li>Document all actions taken and parts used.</li>
                            </ol>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
        
        {/* --- Assignment & Safety --- */}
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Assignment & Safety</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Assigned Engineer</p>
                        <p className="font-semibold">{technician?.name || "Unassigned"}</p>
                        {technician && <p className="text-xs text-muted-foreground">Dispatched: {format(parseISO(workOrder.createdAt), 'yyyy-MM-dd hh:mm a')}</p>}
                    </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Skill/Crew Required</p>
                        <p className="font-semibold">Electrical/Instrumentation Technician</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Estimated Labor</p>
                        <p className="font-semibold">{workOrder.duration ? `${workOrder.duration} hours` : "4 hours"}</p>
                    </div>
                </div>
                <div className="space-y-4">
                     <div className="border border-destructive/50 rounded-lg p-3 bg-red-50 text-destructive">
                        <h4 className="font-semibold flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Safety Notes</h4>
                        <Separator className="my-2 bg-destructive/20" />
                        <ul className="text-sm space-y-1 list-disc list-inside">
                           <li>Mandatory LOTO required before opening any electrical cabinet.</li>
                           <li>Use insulated tools.</li>
                        </ul>
                         <div className="mt-2">
                            <Button size="sm" variant="link" className="p-0 h-auto text-destructive">
                                <ClipboardList className="mr-1 h-3 w-3" /> LOTO Procedure 8.4.1
                            </Button>
                         </div>
                     </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Required PPE</p>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline">Hard hat</Badge>
                            <Badge variant="outline">Safety glasses</Badge>
                            <Badge variant="outline">Gloves</Badge>
                            <Badge variant="outline">Arc Flash Suit (Level E)</Badge>
                        </div>
                     </div>
                </div>
            </CardContent>
        </Card>
        
        {/* --- Parts & Tools --- */}
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Parts & Tools Required</CardTitle>
            </CardHeader>
            <CardContent>
                 <div>
                    <h3 className="font-semibold mb-2">Required Parts (Pre-Staged or Requested)</h3>
                    <div className="rounded-md border">
                        {/* Table would go here */}
                    </div>
                 </div>
                 <div className="mt-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-2"><Wrench className="h-4 w-4" />Special Tools / Equipment</h3>
                     <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                        <li>Digital Multimeter (Fluke 87V)</li>
                        <li>Board Extraction Tool Kit</li>
                        <li>Service Laptop with Diagnostic Software (v4.5)</li>
                    </ul>
                 </div>
            </CardContent>
        </Card>

        {/* --- Engineer Completion & Sign-Off --- */}
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Engineer Completion & Sign-Off</CardTitle>
                <CardDescription>To be filled by the Engineer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Time inputs would go here */}
                </div>
                 <div>
                    <Label htmlFor="actual-work">Actual Work Performed</Label>
                    <Textarea id="actual-work" placeholder="Detail diagnosis, steps taken, and troubleshooting path..." />
                 </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cause of failure select would go here */}
                  </div>
                   <div>
                    <Label>Parts Consumed</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary">Channel Control Board/SD01... (1 unit)</Badge>
                    </div>
                   </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="follow-up" />
                        <label
                        htmlFor="follow-up"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                        Follow Up Needed?
                        </label>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Technician/Requester Sign-Off</Label>
                            <div className="mt-2 h-20 rounded-md border border-dashed flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Signature Field (Digital Signature)</p>
                            </div>
                        </div>
                         <div>
                            <Label>Program Sign-Off</Label>
                            <div className="mt-2 h-20 rounded-md border border-dashed flex items-center justify-center">
                                <p className="text-sm text-muted-foreground">Signature Field (Digital Signature)</p>
                            </div>
                        </div>
                     </div>
                     <div>
                        {/* Final status select would go here */}
                     </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex-col items-stretch gap-4 md:flex-row md:justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ClipboardCheck className="h-4 w-4 text-green-500" />
                    Review time: approx 5 min
                </div>
                 <Button className="w-full md:w-auto">Complete Work Order</Button>
            </CardFooter>
        </Card>
    </div>
  );
}
