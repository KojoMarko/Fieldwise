
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
import type { WorkOrder } from '@/lib/types';
import { customers } from '@/lib/data'; // Keep for customer role filtering
import { LoaderCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OnCallTriageTab } from './components/on-call-triage-tab';
import { CreateCallLogDialog } from './components/create-call-log-dialog';

export default function WorkOrdersPage() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mainTab, setMainTab] = useState('work_orders');
  const [workOrderSubTab, setWorkOrderSubTab] = useState('all');
  const [isLogDialogOpen, setLogDialogOpen] = useState(false);

  useEffect(() => {
    if (!user?.companyId) {
        setIsLoading(false);
        return;
    };

    setIsLoading(true);
    
    const workOrdersQuery = query(collection(db, 'work-orders'), where('companyId', '==', user.companyId));
    
    const unsubscribe = onSnapshot(workOrdersQuery, (snapshot) => {
        let fetchedWorkOrders: WorkOrder[] = [];
        snapshot.forEach((doc) => {
            fetchedWorkOrders.push({ ...doc.data(), id: doc.id } as WorkOrder);
        });

        // Sort by creation date descending
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

    return () => unsubscribe();
  }, [user]);


  const activeOrders = workOrders.filter(
    (wo) => wo.status === 'Scheduled' || wo.status === 'In-Progress' || wo.status === 'On-Hold'
  );
  const completedOrders = workOrders.filter(
    (wo) => wo.status === 'Completed' || wo.status === 'Invoiced'
  );
  const draftOrders = workOrders.filter((wo) => wo.status === 'Draft');

  const canCreateWorkOrder = user?.role === 'Admin' || user?.role === 'Customer' || user?.role === 'Engineer';
  const createButtonText = user?.role === 'Customer' ? 'Request Service' : 'Create Work Order';

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
  )

  const adminOrTechSubTabs = [
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
      { value: 'draft', label: 'Draft' },
  ];
  
  const customerSubTabs = [
       { value: 'all', label: 'All' },
       { value: 'active', label: 'Active' },
       { value: 'completed', label: 'Completed' },
  ];
  
  const SUB_TABS = user?.role === 'Admin' || user?.role === 'Engineer' ? adminOrTechSubTabs : customerSubTabs;
  const isEngineerOrAdmin = user?.role === 'Admin' || user?.role === 'Engineer';


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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-auto">
                    <div className="sm:hidden">
                        <Select value={workOrderSubTab} onValueChange={setWorkOrderSubTab}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a filter" />
                            </SelectTrigger>
                            <SelectContent>
                                {SUB_TABS.map((tab) => (
                                    <SelectItem key={tab.value} value={tab.value}>
                                        {tab.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="hidden sm:block">
                        <Tabs value={workOrderSubTab} onValueChange={setWorkOrderSubTab}>
                             <TabsList className={`grid w-full ${isEngineerOrAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
                                {SUB_TABS.map((tab) => (
                                    <TabsTrigger key={tab.value} value={tab.value}>
                                        {tab.label}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-end">
                    {user?.role === 'Admin' && (
                        <Button size="sm" variant="outline" className="h-8 gap-1">
                            <File className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Export
                            </span>
                        </Button>
                    )}
                    {canCreateWorkOrder && (
                        <Button size="sm" className="h-8 gap-1" asChild>
                        <Link href="/dashboard/work-orders/new">
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            {createButtonText}
                            </span>
                        </Link>
                        </Button>
                    )}
                </div>
            </div>

            <Tabs value={workOrderSubTab} onValueChange={setWorkOrderSubTab} className="w-full">
                <TabsContent value="all">
                    {renderDataTable(workOrders, 'All Work Orders', 'Manage all service jobs and assignments.')}
                </TabsContent>
                <TabsContent value="active">
                    {renderDataTable(activeOrders, 'Active Work Orders', 'Work orders that are scheduled, in-progress, or on-hold.')}
                </TabsContent>
                <TabsContent value="completed">
                    {renderDataTable(completedOrders, 'Completed Work Orders', 'Work orders that have been completed or invoiced.')}
                </TabsContent>
                {isEngineerOrAdmin && (
                <TabsContent value="draft">
                    {renderDataTable(draftOrders, 'Draft Work Orders', 'Work orders that are not yet scheduled.')}
                </TabsContent>
                )}
            </Tabs>
        </TabsContent>
        {isEngineerOrAdmin && (
            <TabsContent value="on_call_triage" className="mt-4 space-y-4">
                 <div className="flex justify-end">
                    <Button size="sm" className="h-8 gap-1" onClick={() => setLogDialogOpen(true)}>
                        <Phone className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Log New Call
                        </span>
                    </Button>
                </div>
                <OnCallTriageTab />
            </TabsContent>
        )}
    </Tabs>
    </>
  );
}
