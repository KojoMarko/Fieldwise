
'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, File, HardDrive, Wrench, ChevronRight, LoaderCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { AddCustomerDialog } from '../work-orders/components/add-customer-dialog';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Customer, Asset, WorkOrder } from '@/lib/types';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

export default function CustomersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [isAddCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const companyId = user.companyId;

    const unsubCustomers = onSnapshot(query(collection(db, 'customers'), where('companyId', '==', companyId)), snapshot => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
      setIsLoading(false);
    });

    const unsubAssets = onSnapshot(query(collection(db, 'assets'), where('companyId', '==', companyId)), snapshot => {
      setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Asset)));
    });

    const unsubWorkOrders = onSnapshot(query(collection(db, 'work-orders'), where('companyId', '==', companyId)), snapshot => {
      setWorkOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkOrder)));
    });

    return () => {
      unsubCustomers();
      unsubAssets();
      unsubWorkOrders();
    };

  }, [user?.companyId]);
  
  const handleCustomerCreated = (id: string, name: string) => {
    // The onSnapshot listener will automatically update the state
    console.log(`New customer created: ${name} (${id})`);
  };

  const filteredCustomers = customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <AddCustomerDialog
        open={isAddCustomerDialogOpen}
        onOpenChange={setAddCustomerDialogOpen}
        onCustomerCreated={handleCustomerCreated}
      />
      <div className="flex items-center mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">Customers</h1>
        <div className="ml-auto flex items-center gap-2">
          {isAdmin && (
            <>
              <Button size="sm" variant="outline" className="h-8 gap-1">
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Export
                </span>
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1"
                onClick={() => setAddCustomerDialogOpen(true)}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Customer
                </span>
              </Button>
            </>
          )}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
          <CardDescription>
            View and manage all customer organizations in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input 
              placeholder="Search for a customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
           {isLoading ? (
             <div className="flex items-center justify-center p-10">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading customers...</p>
            </div>
           ) : (
             <div className="space-y-4">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map(customer => {
                  const customerAssets = assets.filter(a => a.customerId === customer.id);
                  const customerWorkOrders = workOrders.filter(wo => wo.customerId === customer.id);
                  return (
                    <Card key={customer.id}>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold">{customer.name}</h3>
                          <p className="text-sm text-muted-foreground">{customer.address}</p>
                           <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <HardDrive className="h-4 w-4" />
                              <span>{customerAssets.length} Assets</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Wrench className="h-4 w-4" />
                              <span>{customerWorkOrders.length} Work Orders</span>
                            </div>
                          </div>
                        </div>
                         <Button variant="outline" size="sm" asChild>
                            <Link href={`/dashboard/customers/${customer.id}`}>
                                View Details <ChevronRight className="h-4 w-4 ml-2" />
                            </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <p>No customers found.</p>
                </div>
              )}
            </div>
           )}
        </CardContent>
      </Card>
    </>
  );
}
