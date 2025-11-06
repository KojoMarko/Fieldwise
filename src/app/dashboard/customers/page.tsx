
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, File } from 'lucide-react';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { AddCustomerDialog } from './components/add-customer-dialog';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Customer } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';

export default function CustomersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const canAddCustomers = user?.role === 'Admin' || user?.role === 'Sales Rep';
  const [isAddCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const customersQuery = query(collection(db, "customers"), where("companyId", "==", user.companyId));
    
    const unsubscribe = onSnapshot(customersQuery, (snapshot) => {
      const customersData: Customer[] = [];
      snapshot.forEach((doc) => {
        customersData.push({ id: doc.id, ...doc.data() } as Customer);
      });
      setCustomers(customersData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.companyId]);


  return (
    <>
      <AddCustomerDialog
        open={isAddCustomerDialogOpen}
        onOpenChange={setAddCustomerDialogOpen}
        onCustomerCreated={() => {
            // No action needed here, onSnapshot will handle the update
        }}
      />
      <div className="flex items-center mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">Customers</h1>
        <div className="ml-auto flex items-center gap-2">
          {isAdmin && (
              <Button size="sm" variant="outline" className="h-8 gap-1">
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Export
                </span>
              </Button>
          )}
          {canAddCustomers && (
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
          )}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
          <CardDescription>
            View and manage all customer organizations.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
             <div className="flex items-center justify-center p-10">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading customers...</p>
            </div>
           ) : (
            <DataTable columns={columns} data={customers} />
           )}
        </CardContent>
      </Card>
    </>
  );
}
