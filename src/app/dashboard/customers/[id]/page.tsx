
'use client';

import { useEffect, useState, use } from 'react';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Asset, Customer, WorkOrder, User } from '@/lib/types';
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
  User as UserIcon,
  Plus,
  Wrench,
  FileText,
  Mail as MailIcon,
  Edit,
  History,
  Calendar,
  Layers,
  Briefcase,
  AlertTriangle,
  History as HistoryIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format, parseISO, isValid, addMonths } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EditCustomerDialog } from '../components/edit-customer-dialog';
import { useToast } from '@/hooks/use-toast';

const workOrderStatusStyles: Record<WorkOrder['status'], string> = {
  Draft: 'bg-gray-200 text-gray-800',
  Scheduled: 'bg-blue-100 text-blue-800',
  'In-Progress': 'bg-yellow-100 text-yellow-800',
  'On-Hold': 'bg-orange-100 text-orange-800',
  Completed: 'bg-green-100 text-green-800',
  Invoiced: 'bg-purple-100 text-purple-800',
  Cancelled: 'bg-red-100 text-red-800',
  Dispatched: 'bg-cyan-100 text-cyan-800',
  'On-Site': 'bg-teal-100 text-teal-800',
};

const assetStatusStyles = {
  Operational: 'border-green-500 text-green-600',
  Maintenance: 'border-yellow-500 text-yellow-600',
  Down: 'border-red-500 text-red-600',
};

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    const unsubscribers: (() => void)[] = [];

    const customerRef = doc(db, 'customers', id);
    unsubscribers.push(
      onSnapshot(customerRef, (docSnap) => {
        setCustomer(docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Customer) : null);
      })
    );

    const assetsQuery = query(collection(db, 'assets'), where('customerId', '==', id));
    unsubscribers.push(
      onSnapshot(assetsQuery, (snapshot) => {
        const assetsData: Asset[] = [];
        snapshot.forEach((doc) => assetsData.push({ id: doc.id, ...doc.data() } as Asset));
        setAssets(assetsData);
      })
    );

    const workOrdersQuery = query(
      collection(db, 'work-orders'),
      where('customerId', '==', id),
      limit(20) // Fetch more to sort client-side
    );
    unsubscribers.push(
      onSnapshot(workOrdersQuery, (snapshot) => {
        const woData: WorkOrder[] = [];
        snapshot.forEach((doc) => woData.push({ id: doc.id, ...doc.data() } as WorkOrder));
        
        // Sort client-side
        woData.sort((a,b) => {
            const dateA = a.scheduledDate ? parseISO(a.scheduledDate) : 0;
            const dateB = b.scheduledDate ? parseISO(b.scheduledDate) : 0;
            if (!isValid(dateA)) return 1;
            if (!isValid(dateB)) return -1;
            return dateB.getTime() - dateA.getTime();
        });
        setWorkOrders(woData.slice(0,5));
        
        // After fetching work orders, fetch the relevant users if not already fetched
        const technicianIds = [...new Set(woData.map(wo => wo.technicianId).filter(Boolean))];
        if (technicianIds.length > 0) {
            const usersQuery = query(collection(db, 'users'), where('id', 'in', technicianIds));
            onSnapshot(usersQuery, userSnapshot => {
                const usersData: Record<string, User> = {};
                userSnapshot.forEach(doc => usersData[doc.id] = doc.data() as User);
                setUsers(prev => ({...prev, ...usersData}));
            });
        }
        setIsLoading(false);
      })
    );

    return () => unsubscribers.forEach(unsub => unsub());
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

  const handleGenerateReport = () => {
    toast({
        title: "Feature in Development",
        description: "Customer infographic report generation is coming soon!",
    });
  }
  
  const validInstallationDates = assets
    .map(asset => parseISO(asset.installationDate))
    .filter(isValid);

  const customerSince = validInstallationDates.length > 0
    ? new Date(Math.min(...validInstallationDates.map(date => date.getTime())))
    : null;

  const stats = {
      totalAssets: assets.length,
      totalWorkOrders: workOrders.length,
      pendingWorkOrders: workOrders.filter(wo => !['Completed', 'Cancelled', 'Invoiced'].includes(wo.status)).length,
      lastServiceDate: workOrders.length > 0 && isValid(parseISO(workOrders[0].scheduledDate)) ? parseISO(workOrders[0].scheduledDate) : null,
      customerSince: customerSince,
  }

  const upcomingMaintenance = assets
    .filter(a => a.lastPpmDate && a.ppmFrequency && isValid(parseISO(a.lastPpmDate)))
    .map(a => ({
        ...a,
        nextPpmDate: addMonths(new Date(a.lastPpmDate!), a.ppmFrequency!),
    }))
    .sort((a,b) => a.nextPpmDate.getTime() - b.nextPpmDate.getTime())
    .slice(0, 3);


  return (
    <>
      <EditCustomerDialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen} customer={customer} />
      <div className="flex items-center gap-4 mb-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/customers">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back to Customers</span>
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
            {customer.name}
          </h1>
          <p className="text-sm text-muted-foreground">Customer Details</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => toast({ title: "Coming Soon!", description: "Full customer history will be available here." })}><HistoryIcon className="h-4 w-4 mr-2" />View History</Button>
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}><Edit className="h-4 w-4 mr-2" />Edit</Button>
            <Button size="sm" asChild><Link href={`/dashboard/work-orders/new?customerId=${customer.id}`}><Plus className="h-4 w-4 mr-2" />New Work Order</Link></Button>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-12">
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Customer Details</CardTitle>
                    <CardDescription>Contact information for {customer.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 text-sm">
                        <div className="flex items-center gap-3">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-muted-foreground">Contact Person</p>
                                <p className="font-medium">{customer.contactPerson}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-muted-foreground">Contact Email</p>
                                <p className="font-medium">{customer.contactEmail}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-muted-foreground">Phone Number</p>
                                <p className="font-medium">{customer.phone}</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                            <CardTitle>Managed Assets</CardTitle>
                            <CardDescription>All equipment supplied to or managed for this customer.</CardDescription>
                        </div>
                        <Button size="sm" asChild><Link href={`/dashboard/assets/new?customerId=${customer.id}`}><Plus className="h-4 w-4 mr-2" />Add Asset</Link></Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {assets.length > 0 ? (
                        <ul className="space-y-4">
                            {assets.map((asset) => (
                            <li key={asset.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-md border p-4 gap-4">
                                <div className="grid gap-1 flex-1">
                                    <div className="flex items-center gap-3">
                                        <Wrench className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-semibold leading-none">{asset.name}</p>
                                            <p className="text-sm text-muted-foreground">Model: {asset.model}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-xs text-muted-foreground pl-8">
                                        <p>Serial Number: <span className="font-mono text-foreground">{asset.serialNumber}</span></p>
                                        <p>Location: <span className="font-medium text-foreground">{asset.location}</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 self-stretch sm:self-center w-full sm:w-auto">
                                    <Badge variant="outline" className={cn("hidden sm:flex", assetStatusStyles[asset.status as keyof typeof assetStatusStyles])}>{asset.status}</Badge>
                                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild><Link href={`/dashboard/assets/${asset.id}`}>View</Link></Button>
                                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none" asChild><Link href={`/dashboard/assets/${asset.id}?tab=history`}>History</Link></Button>
                                    <Button variant="secondary" size="sm" className="flex-1 sm:flex-none" asChild><Link href={`/dashboard/work-orders/new?customerId=${customer.id}&assetId=${asset.id}`}>Service</Link></Button>
                                </div>
                            </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed py-10 text-center">
                            <HardDrive className="h-10 w-10 text-muted-foreground" />
                            <p className="mt-4 font-semibold">No Assets Found</p>
                            <p className="text-sm text-muted-foreground">There are no assets currently assigned to this customer.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Recent Service History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Work Order ID</TableHead>
                                    <TableHead>Asset</TableHead>
                                    <TableHead>Service Type</TableHead>
                                    <TableHead>Technician</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workOrders.length > 0 ? workOrders.map(wo => (
                                    <TableRow key={wo.id}>
                                        <TableCell>{isValid(parseISO(wo.scheduledDate)) ? format(parseISO(wo.scheduledDate), 'MMM dd, yyyy') : 'N/A'}</TableCell>
                                        <TableCell>
                                            <Link href={`/dashboard/work-orders/${wo.id}`} className="text-primary hover:underline font-medium">
                                                {wo.id.toUpperCase().substring(0, 8)}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{assets.find(a => a.id === wo.assetId)?.name || 'N/A'}</TableCell>
                                        <TableCell>{wo.type}</TableCell>
                                        <TableCell>{users[wo.technicianId || '']?.name || 'Unassigned'}</TableCell>
                                        <TableCell>
                                            <Badge className={cn(workOrderStatusStyles[wo.status])} variant="outline">{wo.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            No service history for this customer yet.
                                        </TableCell>
                                    </TableRow> 
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
             </Card>
        </div>
        <div className="md:col-span-4 lg:col-span-3 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Customer Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Layers className="h-4 w-4" />Total Assets</span>
                        <span className="font-semibold">{stats.totalAssets}</span>
                    </div>
                     <Separator />
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Briefcase className="h-4 w-4" />Total Work Orders</span>
                        <span className="font-semibold">{stats.totalWorkOrders}</span>
                    </div>
                     <Separator />
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Pending Work Orders</span>
                        <span className="font-semibold">{stats.pendingWorkOrders}</span>
                    </div>
                     <Separator />
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><History className="h-4 w-4" />Last Service</span>
                        <span className="font-semibold">{stats.lastServiceDate ? format(stats.lastServiceDate, 'MMM dd, yyyy') : 'N/A'}</span>
                    </div>
                     <Separator />
                     <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4" />Customer Since</span>
                        <span className="font-semibold">{stats.customerSince ? format(stats.customerSince, 'MMM dd, yyyy') : 'N/A'}</span>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" asChild><Link href={`/dashboard/work-orders/new?customerId=${customer.id}`}><Plus className="h-4 w-4 mr-2" />Schedule Service</Link></Button>
                    <Button variant="outline" className="w-full justify-start" onClick={handleGenerateReport}><FileText className="h-4 w-4 mr-2" />Generate Report</Button>
                    <Button variant="outline" className="w-full justify-start" asChild><a href={`mailto:${customer.contactEmail}`}><MailIcon className="h-4 w-4 mr-2" />Send Email</a></Button>
                    <Button variant="outline" className="w-full justify-start" onClick={() => setEditDialogOpen(true)}><Edit className="h-4 w-4 mr-2" />Edit Customer</Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Maintenance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {upcomingMaintenance.length > 0 ? (
                        upcomingMaintenance.map(asset => (
                            <div key={asset.id}>
                                <p className="font-semibold">{asset.name}</p>
                                <p className="text-sm text-muted-foreground">Next maintenance: {format(asset.nextPpmDate, 'MMM dd, yyyy')}</p>
                            </div>
                        ))
                    ) : (
                       <p className="text-sm text-muted-foreground">No upcoming maintenance scheduled.</p> 
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}

    