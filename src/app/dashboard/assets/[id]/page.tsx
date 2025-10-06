
'use client';

import { useEffect, useState, use } from 'react';
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Asset, Customer, WorkOrder, WorkOrderStatus, User } from '@/lib/types';
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
} from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';
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

const statusStyles: Record<WorkOrderStatus, string> = {
  Draft: 'bg-gray-200 text-gray-800',
  Scheduled: 'bg-blue-100 text-blue-800',
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
      // Sort client-side to avoid needing a composite index
      orders.sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime());
      setWorkOrders(orders);
      setIsLoading(false);
    });

    // We assume users for a company don't change that often for this view.
    // A more robust solution might listen for changes.
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoaderCircle className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            <CardTitle>Maintenance History</CardTitle>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        <div className="flex items-center gap-4 pt-4">
          <Input
            placeholder="Search maintenance records..."
            className="max-w-xs"
          />
          <Button variant="outline" size="sm" className="ml-auto">
            <Filter className="h-4 w-4 mr-2" />
            All Types
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workOrders.length > 0 ? (
              workOrders.map((wo) => (
                <TableRow key={wo.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(parseISO(wo.scheduledDate), 'yyyy-MM-dd')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(workOrderTypeStyles[wo.type])}
                    >
                      {wo.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{wo.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {wo.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {users[wo.technicianId || '']?.name || 'Unassigned'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(statusStyles[wo.status])}
                    >
                      {wo.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No maintenance history found for this asset.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
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
    <div className="mx-auto grid w-full flex-1 auto-rows-max gap-4">
      <div className="p-4 bg-card border rounded-lg">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-semibold">{asset.name}</h1>
            <p className="text-muted-foreground">{asset.model}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Machine ID</p>
            <p className="font-mono">{asset.serialNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2 text-sm">
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

      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="installation">Installation</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             <KpiCard icon={TrendingUp} title="Machine Uptime" value="97.5%" footer={<><Progress value={97.5} className="h-2" /><p className="text-xs text-muted-foreground mt-2">Excellent performance this month</p></>} />
            <KpiCard icon={DollarSign} title="Total Maintenance Cost" value="$24,750" footer={<p className="text-xs text-muted-foreground">12% decrease from last month</p>} />
            <KpiCard icon={Clock} title="Maintenance Hours" value="186h" footer={<p className="text-xs text-muted-foreground">Total hours this year</p>} />
            <KpiCard icon={Calendar} title="Last Maintenance" value={asset.lastPpmDate ? format(new Date(asset.lastPpmDate), 'PPP') : 'N/A'} footer={<p className="text-xs text-muted-foreground">Preventive maintenance completed</p>} />
            <KpiCard icon={Calendar} title="Next Scheduled" value="Jan 15, 2025" footer={<p className="text-xs text-muted-foreground">Routine inspection due</p>} />
            <KpiCard icon={AlertTriangle} title="Overdue Items" value="0" footer={<p className="text-xs text-muted-foreground">Requires immediate attention</p>} />
          </div>
        </TabsContent>
        <TabsContent value="installation" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Installation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
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
                   <div className="col-span-2">
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

    