
'use client';
import { File, PlusCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkOrder, ServiceCallLog } from '@/lib/types';
import { customers } from '@/lib/data'; // Keep for customer role filtering
import { LoaderCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OnCallTriageTab } from './components/on-call-triage-tab';
import { CreateCallLogDialog } from './components/create-call-log-dialog';
import { Input } from '@/components/ui/input';

type TriageStatusFilter = 'all' | 'resolved' | 'unresolved';

export default function WorkOrdersPage() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mainTab, setMainTab] = useState('work_orders');
  const [workOrderSubTab, setWorkOrderSubTab] = useState('all');
  const [isLogDialogOpen, setLogDialogOpen] = useState(false);
  const [callLogs, setCallLogs] = useState<ServiceCallLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  // State for triage filters, lifted up to the parent component
  const [triageSearchFilter, setTriageSearchFilter] = useState('');
  const [triageStatusFilter, setTriageStatusFilter] = useState<TriageStatusFilter>('all');
  const [workOrderSearchFilter, setWorkOrderSearchFilter] = useState('');

  useEffect(() => {
    if (!user?.companyId) {
        setIsLoading(false);
        setIsLoadingLogs(false);
        return;
    }

    setIsLoading(true);
    setIsLoadingLogs(true);
    
    const workOrdersQuery = query(collection(db, 'work-orders'), where('companyId', '==', user.companyId));
    
    const unsubWorkOrders = onSnapshot(workOrdersQuery, (snapshot) => {
        let fetchedWorkOrders: WorkOrder[] = [];
        snapshot.forEach((doc) => {
            fetchedWorkOrders.push({ ...doc.data(), id: doc.id } as WorkOrder);
        });

        fetchedWorkOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (user.role === 'Admin' || user.role === 'Engineer') {
            setWorkOrders(fetchedWorkOrders);
        } else if (user.role === 'Customer') {
            const customerProfile = customers.find(c => c.contactEmail === user.email);
            if (!customerProfile) {
                setWorkOrders([]);
            } else {
                setWorkOrders(fetchedWorkOrders.filter(wo => wo.customerId === customerProfile.id));
            }
        } else {
            setWorkOrders([]);
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching work orders: ", error);
        setIsLoading(false);
    });

    const logsQuery = query(collection(db, 'service-call-logs'), where('companyId', '==', user.companyId));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
        const logsData: ServiceCallLog[] = [];
        snapshot.forEach(doc => {
            logsData.push({ id: doc.id, ...doc.data() } as ServiceCallLog);
        });
        logsData.sort((a, b) => new Date(b.reportingTime).getTime() - new Date(a.reportingTime).getTime());
        setCallLogs(logsData);
        setIsLoadingLogs(false);
    }, (error) => {
        console.error("Error fetching call logs:", error);
        setIsLoadingLogs(false);
    });

    return () => {
        unsubWorkOrders();
        unsubLogs();
    };
  }, [user]);

  const filteredWorkOrders = workOrders.filter(wo => {
      const statusMatch = 
          workOrderSubTab === 'all' ||
          (workOrderSubTab === 'active' && ['Scheduled', 'In-Progress', 'On-Hold', 'Dispatched', 'On-Site'].includes(wo.status)) ||
          (workOrderSubTab === 'completed' && ['Completed', 'Invoiced'].includes(wo.status)) ||
          (workOrderSubTab === 'draft' && wo.status === 'Draft');

      const searchMatch = workOrderSearchFilter ?
          wo.title.toLowerCase().includes(workOrderSearchFilter.toLowerCase()) : true;

      return statusMatch && searchMatch;
  });

  const canCreateWorkOrder = user?.role === 'Admin' || user?.role === 'Customer' || user?.role === 'Engineer';
  const createButtonText = user?.role === 'Customer' ? 'Request Service' : 'New Work Order';

  const isEngineerOrAdmin = user?.role === 'Admin' || user?.role === 'Engineer';

  const renderDataTable = (data: WorkOrder[], title: string, description: string) => (
     <Card>
        <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="flex items-center justify-center p-10">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4 text-muted-foreground">Loading work orders...</p>
                </div>
            ) : <DataTable columns={columns} data={data} />}
        </CardContent>
    </Card>
  );

  return (
    <>
    <CreateCallLogDialog open={isLogDialogOpen} onOpenChange={setLogDialogOpen} />
    <div className="flex flex-col items-center mb-4 text-center">
        <h1 className="text-lg font-semibold md:text-2xl">Service Desk</h1>
    </div>
    <Tabs defaultValue={mainTab} value={mainTab} onValueChange={setMainTab}>
        <div className="flex justify-center mb-4">
            <TabsList className={`grid w-full max-w-md ${isEngineerOrAdmin ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger value="work_orders">Work Orders</TabsTrigger>
            {isEngineerOrAdmin && (
                <TabsTrigger value="on_call_triage">On-Call Triage</TabsTrigger>
            )}
            </TabsList>
        </div>

        <TabsContent value="work_orders" className="mt-4 space-y-4">
            <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col md:flex-row gap-2">
                     <Input
                        placeholder="Filter by title..."
                        value={workOrderSearchFilter}
                        onChange={(e) => setWorkOrderSearchFilter(e.target.value)}
                        className="max-w-full sm:max-w-xs"
                    />
                    <Select value={workOrderSubTab} onValueChange={setWorkOrderSubTab}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="all">All</SelectItem>
                             <SelectItem value="active">Active</SelectItem>
                             <SelectItem value="completed">Completed</SelectItem>
                             {isEngineerOrAdmin && <SelectItem value="draft">Draft</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-start gap-2">
                    {user?.role === 'Admin' && (
                        <Button size="sm" variant="outline" className="h-9 gap-1">
                            <File className="h-4 w-4" />
                            <span className="sr-only sm:not-sr-only">Export</span>
                        </Button>
                    )}
                    {canCreateWorkOrder && (
                        <Button size="sm" className="h-9 gap-1" asChild>
                        <Link href="/dashboard/work-orders/new">
                            <PlusCircle className="h-4 w-4" />
                            <span className="sr-only sm:not-sr-only">{createButtonText}</span>
                        </Link>
                        </Button>
                    )}
                </div>
            </div>
            
            {renderDataTable(filteredWorkOrders, 'Work Orders', 'Manage all service jobs and assignments.')}
        </TabsContent>
        
        {isEngineerOrAdmin && (
            <TabsContent value="on_call_triage" className="mt-4 space-y-4">
                 <div className="flex justify-between items-start gap-4">
                     <div className="flex flex-col md:flex-row gap-2">
                        <Input
                        placeholder="Filter by customer, asset, problem..."
                        value={triageSearchFilter}
                        onChange={(e) => setTriageSearchFilter(e.target.value)}
                        className="max-w-full sm:max-w-xs"
                        />
                        <Select value={triageStatusFilter} onValueChange={(value) => setTriageStatusFilter(value as TriageStatusFilter)}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="unresolved">Unresolved</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                    <div className="flex items-start">
                        <Button size="sm" className="h-9 gap-1" onClick={() => setLogDialogOpen(true)}>
                            <Phone className="h-4 w-4" />
                            <span className="sr-only sm:not-sr-only">Log New Call</span>
                        </Button>
                    </div>
                </div>
                <OnCallTriageTab 
                    callLogs={callLogs} 
                    isLoading={isLoadingLogs} 
                    searchFilter={triageSearchFilter}
                    statusFilter={triageStatusFilter}
                />
            </TabsContent>
        )}
    </Tabs>
    </>
  );
}
