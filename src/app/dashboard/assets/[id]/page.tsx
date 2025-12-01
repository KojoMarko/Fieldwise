
'use client';

import { useEffect, useState, useMemo, use } from 'react';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Asset, Customer, WorkOrder, WorkOrderStatus, User, LifecycleEvent } from '@/lib/types';
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
  LoaderCircle,
  Package,
  MapPin,
  Calendar,
  Wrench,
  CheckCircle,
  Flag,
  Info,
  History,
  HardDrive,
  Download,
  Filter,
  User as UserIcon,
  TrendingUp,
  Clock,
  AlertTriangle,
  DollarSign,
  Building,
  PenSquare,
} from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusStyles: Record<WorkOrderStatus, string> = {
  Draft: 'bg-gray-200 text-gray-800',
  Scheduled: 'bg-blue-100 text-blue-800',
  Dispatched: 'bg-cyan-100 text-cyan-800',
  'On-Site': 'bg-teal-100 text-teal-800',
  'In-Progress': 'bg-yellow-100 text-yellow-800',
  'On-Hold': 'bg-orange-100 text-orange-800',
  Completed: 'bg-green-100 text-green-800',
  Invoiced: 'bg-purple-100 text-purple-800',
  Cancelled: 'bg-red-100 text-red-800',
};

const workOrderTypeStyles: Record<WorkOrder['type'], string> = {
  Preventive: 'bg-blue-100 text-blue-800',
  Corrective: 'bg-orange-100 text-orange-800',
  Emergency: 'bg-red-100 text-red-800',
  Installation: 'bg-purple-100 text-purple-800',
  Other: 'bg-gray-200 text-gray-800',
};

function KpiCard({ icon: Icon, title, value, footer }: { icon: React.ElementType, title: string, value: string, footer: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardDescription>{title}</CardDescription>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <CardTitle className="text-3xl">{value}</CardTitle>
            </CardContent>
            <CardContent>
                {footer}
            </CardContent>
        </Card>
    )
}

function MaintenanceHistory({ asset }: { asset: Asset }) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!asset.id) return;
    const q = query(
      collection(db, 'work-orders'),
      where('assetId', '==', asset.id)
    );
    const unsubscribeWorkOrders = onSnapshot(q, (snapshot) => {
      const orders: WorkOrder[] = [];
      snapshot.forEach((doc) =>
        orders.push({ id: doc.id, ...doc.data() } as WorkOrder)
      );
      setWorkOrders(orders);
      setIsLoading(false);
    });

    const fetchUsers = async () => {
        if (!asset.companyId) return;
        const usersQuery = query(
            collection(db, 'users'),
            where('companyId', '==', asset.companyId)
        );
        const snapshot = await getDocs(usersQuery);
        const usersData: Record<string, User> = {};
        snapshot.forEach((doc) => (usersData[doc.id] = doc.data() as User));
        setUsers(usersData);
    };
    
    fetchUsers();

    return () => {
      unsubscribeWorkOrders();
    };
  }, [asset.id, asset.companyId]);
  
  const combinedHistory = useMemo(() => {
    const manualEntries = (asset.lifecycleNotes || []).map((note, index) => ({
      id: `manual-${index}`,
      date: note.date ? new Date(note.date) : new Date(0), // Use epoch for sorting if no date
      type: note.type,
      description: note.note,
      technician: 'N/A',
      status: 'Manual Entry',
      isManual: true,
      originalDate: note.date,
      duration: undefined,
      cost: undefined,
    }));

    const woEntries = workOrders.map(wo => ({
      id: wo.id,
      date: parseISO(wo.scheduledDate),
      type: wo.type,
      description: wo.title,
      technician: wo.technicianIds?.map(id => users[id]?.name).join(', ') || 'Unassigned',
      status: wo.status,
      isManual: false,
      originalDate: wo.scheduledDate,
      duration: wo.duration,
      cost: wo.cost,
    }));
    
    const allEntries = [...manualEntries, ...woEntries];
    
    // Sort by date descending, putting entries without a date last
    allEntries.sort((a, b) => {
        if (!a.originalDate) return 1;
        if (!b.originalDate) return -1;
        return new Date(b.originalDate).getTime() - new Date(a.originalDate).getTime();
    });

    return allEntries;
  }, [asset.lifecycleNotes, workOrders, users]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoaderCircle className="h-6 w-6 animate-spin" />
      </div>
    );
  }
  
  const manualEntryTypeStyles: Record<LifecycleEvent['type'], string> = {
    PPM: 'bg-blue-100 text-blue-800',
    Corrective: 'bg-orange-100 text-orange-800',
    Event: 'bg-gray-200 text-gray-800'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                <CardTitle>Maintenance History</CardTitle>
            </div>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Export
            </Button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4">
            <Input
                placeholder="Search maintenance records..."
                className="w-full sm:max-w-xs"
            />
            <Button variant="outline" size="sm" className="w-full sm:w-auto mt-1 sm:mt-0">
                <Filter className="h-4 w-4 mr-2" />
                All Types
            </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        <div className="overflow-x-auto hidden sm:block">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[90px]">Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="hidden sm:table-cell w-[110px]">Technician</TableHead>
                    <TableHead className="hidden lg:table-cell w-[90px]">Duration</TableHead>
                    <TableHead className="hidden lg:table-cell w-[90px]">Cost</TableHead>
                    <TableHead className="w-[110px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {combinedHistory.length > 0 ? (
                    combinedHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap">
                          {item.originalDate ? format(new Date(item.originalDate), 'MM/dd/yy') : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "whitespace-nowrap",
                              item.isManual
                                ? manualEntryTypeStyles[item.type as LifecycleEvent['type']]
                                : workOrderTypeStyles[item.type as WorkOrder['type']]
                            )}
                          >
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium line-clamp-2">{item.description}</p>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{item.technician}</TableCell>
                        <TableCell className="hidden lg:table-cell whitespace-nowrap">
                          {item.duration ? `${item.duration}h` : 'N/A'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell whitespace-nowrap">
                          {item.cost ? `GH₵${item.cost.toLocaleString()}` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "whitespace-nowrap",
                              item.isManual ? 'bg-purple-100 text-purple-800' : statusStyles[item.status as WorkOrderStatus]
                            )}
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No maintenance history found for this asset.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* --- Responsive Card View for Mobile --- */}
        <div className="block sm:hidden space-y-4">
          {combinedHistory.length > 0 ? (
            combinedHistory.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-3 shadow-sm bg-card"
              >
                <div className="flex justify-between items-center mb-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      item.isManual
                        ? manualEntryTypeStyles[item.type as LifecycleEvent['type']]
                        : workOrderTypeStyles[item.type as WorkOrder['type']]
                    )}
                  >
                    {item.type}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs",
                      item.isManual ? 'bg-purple-100 text-purple-800' : statusStyles[item.status as WorkOrderStatus]
                    )}
                  >
                    {item.status}
                  </Badge>
                </div>
                <p className="font-medium text-sm mb-1">{item.description}</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Date: {item.originalDate ? format(new Date(item.originalDate), 'MMM dd, yyyy') : 'N/A'}</p>
                  <p>Technician: {item.technician}</p>
                  <p>Duration: {item.duration ? `${item.duration}h` : 'N/A'}</p>
                  <p>Cost: {item.cost ? `GH₵${item.cost.toLocaleString()}` : 'N/A'}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center">No maintenance history found for this asset.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [asset, setAsset] = useState<Asset | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const nextPpmDate = useMemo(() => {
    if (asset?.lastPpmDate && asset?.ppmFrequency) {
      const lastPpm = new Date(asset.lastPpmDate);
      return addMonths(lastPpm, asset.ppmFrequency);
    }
    return null;
  }, [asset]);

  useEffect(() => {
    setIsLoading(true);
    const assetRef = doc(db, 'assets', id);
    const unsubscribeAsset = onSnapshot(assetRef, (assetSnap) => {
      if (assetSnap.exists()) {
        const assetData = { id: assetSnap.id, ...assetSnap.data() } as Asset;
        setAsset(assetData);

        if (assetData.customerId) {
          const customerRef = doc(db, 'customers', assetData.customerId);
          const unsubscribeCustomer = onSnapshot(customerRef, (customerSnap) => {
            if (customerSnap.exists()) {
              setCustomer({ id: customerSnap.id, ...customerSnap.data() } as Customer);
            } else {
              setCustomer(null);
            }
            setIsLoading(false);
          });
          return () => unsubscribeCustomer();
        } else {
          setCustomer(null);
          setIsLoading(false);
        }
      } else {
        setAsset(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAsset();
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
  
  const TABS = [
    { value: "overview", label: "Overview" },
    { value: "installation", label: "Installation" },
    { value: "maintenance", label: "Maintenance" },
    { value: "history", label: "History" },
  ];

  return (
    <div className="mx-auto grid w-full flex-1 auto-rows-max gap-4">
      <div className="p-4 bg-card border rounded-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{asset.name}</h1>
            <p className="text-muted-foreground">{asset.model}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-muted-foreground">Machine ID</p>
            <p className="font-mono">{asset.serialNumber}</p>
          </div>
        </div>
        <div className="flex items-center flex-wrap gap-4 mt-2 text-sm">
          <Badge
            variant="outline"
            className={cn(
              asset.status === 'Operational'
                ? 'border-green-500 text-green-600'
                : asset.status === 'Maintenance'
                ? 'border-yellow-500 text-yellow-600'
                : 'border-red-500 text-red-600'
            )}
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            {asset.status}
          </Badge>
          <span className="text-muted-foreground">
            Location: {asset.location}
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="block sm:hidden mb-4">
            <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="justify-center">
                    <SelectValue placeholder="Select a tab" />
                </SelectTrigger>
                <SelectContent>
                    {TABS.map((tab) => (
                        <SelectItem key={tab.value} value={tab.value}>
                            {tab.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="hidden sm:flex justify-center">
            <TabsList>
                {TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                        {tab.label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </div>
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
             <KpiCard icon={TrendingUp} title="Machine Uptime" value="97.5%" footer={<><Progress value={97.5} className="h-2" /><p className="text-xs text-muted-foreground mt-2">Excellent performance this month</p></>} />
            <KpiCard icon={DollarSign} title="Total Maintenance Cost" value="GH₵24,750" footer={<p className="text-xs text-muted-foreground">12% decrease from last month</p>} />
            <KpiCard icon={Clock} title="Maintenance Hours" value="186h" footer={<p className="text-xs text-muted-foreground">Total hours this year</p>} />
            <KpiCard icon={Calendar} title="Last Maintenance" value={asset.lastPpmDate ? format(new Date(asset.lastPpmDate), 'PPP') : 'N/A'} footer={<p className="text-xs text-muted-foreground">Preventive maintenance completed</p>} />
            <KpiCard icon={Calendar} title="Next Scheduled" value={nextPpmDate ? format(nextPpmDate, 'PPP') : 'N/A'} footer={<p className="text-xs text-muted-foreground">Routine inspection due</p>} />
            <KpiCard icon={AlertTriangle} title="Overdue Items" value="0" footer={<p className="text-xs text-muted-foreground">Requires immediate attention</p>} />
          </div>
        </TabsContent>
        <TabsContent value="installation" className="mt-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Installation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Installation Date</p>
                    <p className="font-medium">{asset.installationDate ? format(new Date(asset.installationDate), 'PPP') : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Purchase Date</p>
                    <p className="font-medium">{asset.purchaseDate ? format(new Date(asset.purchaseDate), 'PPP') : 'N/A'}</p>
                  </div>
                   <div>
                    <p className="text-muted-foreground">Installed By</p>
                    <p className="font-medium">Tech Solutions Inc.</p>
                  </div>
                   <div>
                    <p className="text-muted-foreground">Vendor</p>
                    <p className="font-medium">{asset.vendor || 'N/A'}</p>
                  </div>
                   <div>
                    <p className="text-muted-foreground">Installation Location</p>
                    <p className="font-medium">{asset.location}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Warranty Expiry</p>
                    <p className="font-medium">{asset.warrantyExpiry ? format(new Date(asset.warrantyExpiry), 'PPP') : 'N/A'}</p>
                  </div>
                   <div className="col-span-1 sm:col-span-2">
                    <p className="text-muted-foreground">Serial Number</p>
                    <p className="font-medium font-mono">{asset.serialNumber}</p>
                  </div>
                </div>
                 {asset.lifecycleNotes?.find(n => n.note.toLowerCase().includes("install")) && (
                    <div className="pt-4">
                        <h4 className="font-medium mb-2 text-sm">Installation Notes</h4>
                        <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
                            {asset.lifecycleNotes?.find(n => n.note.toLowerCase().includes("install"))?.note}
                        </div>
                    </div>
                )}
              </CardContent>
            </Card>
             <div className="grid gap-4 auto-rows-max">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {customer ? (
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <p className="font-semibold">{customer.name}</p>
                                </div>
                                <p className="text-muted-foreground">{customer.address}</p>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/dashboard/customers/${customer.id}`}>View Customer</Link>
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No customer associated with this asset.</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                        {asset.lifecycleNotes && asset.lifecycleNotes.length > 0 ? (
                            asset.lifecycleNotes.slice(0,3).map((note, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-medium">{note.note}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {note.date ? format(new Date(note.date), 'yyyy-MM-dd') : 'Date not specified'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-muted-foreground">No manual history logged.</div>
                        )}
                        </div>
                    </CardContent>
                </Card>
             </div>
          </div>
        </TabsContent>
        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance</CardTitle>
              <CardDescription>
                Upcoming and scheduled maintenance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Maintenance schedule details will be shown here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <MaintenanceHistory asset={asset} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

  

    
