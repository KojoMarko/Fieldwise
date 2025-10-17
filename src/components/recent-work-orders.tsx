
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { WorkOrder, WorkOrderStatus, Customer, User } from '@/lib/types';
import { useEffect, useState } from 'react';
import { AssignTechnicianDialog } from '@/app/dashboard/work-orders/components/assign-technician-dialog';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';


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


export function RecentWorkOrders() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [recentOrders, setRecentOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [users, setUsers] = useState<Record<string, User>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  useEffect(() => {
    if (isAuthLoading || !user) return;

    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const baseQuery = query(
      collection(db, 'work-orders'),
      where('companyId', '==', user.companyId)
    );

    let ordersQuery;
    if (user.role === 'Admin') {
      ordersQuery = baseQuery;
    } else if (user.role === 'Engineer') {
      ordersQuery = query(baseQuery, where('technicianIds', 'array-contains', user.id));
    } else if (user.role === 'Customer') {
      const customerQuery = query(collection(db, 'customers'), where('contactEmail', '==', user.email), where('companyId', '==', user.companyId), limit(1));
      onSnapshot(customerQuery, (customerSnapshot) => {
        if (!customerSnapshot.empty) {
          const customerId = customerSnapshot.docs[0].id;
          const customerOrdersQuery = query(baseQuery, where('customerId', '==', customerId));
          subscribeToOrders(customerOrdersQuery);
        } else {
          setIsLoading(false);
        }
      });
      return; // Handled in the onSnapshot callback
    } else {
        ordersQuery = baseQuery;
    }

    const subscribeToOrders = (q: any) => {
        return onSnapshot(q, (snapshot) => {
            const orders: WorkOrder[] = [];
            snapshot.forEach(doc => orders.push({ ...doc.data(), id: doc.id } as WorkOrder));
            orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRecentOrders(orders.slice(0, 5));
            setIsLoading(false);
        }, (error) => {
            console.error("RecentWorkOrders - Permission Error:", {
                code: error?.code,
                message: error?.message,
                name: error?.name,
                fullError: error,
                userId: user?.id,
                userRole: user?.role,
                companyId: user?.companyId
            });
            setIsLoading(false);
        });
    }
    
    let unsubscribeOrders: () => void = () => {};
    if (ordersQuery) {
        unsubscribeOrders = subscribeToOrders(ordersQuery);
    }
    
    const customersQuery = query(collection(db, 'customers'), where('companyId', '==', user.companyId));
    const usersQuery = query(collection(db, 'users'), where('companyId', '==', user.companyId));

    const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
        const custs: Record<string, Customer> = {};
        snapshot.forEach(doc => custs[doc.id] = { ...doc.data(), id: doc.id } as Customer);
        setCustomers(custs);
    });

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
        const usrs: Record<string, User> = {};
        snapshot.forEach(doc => usrs[doc.id] = { ...doc.data(), id: doc.id } as User);
        setUsers(usrs);
    });


    return () => {
        unsubscribeOrders();
        unsubscribeCustomers();
        unsubscribeUsers();
    };
  }, [user, isAuthLoading]);

  const handleAssignClick = (order: WorkOrder) => {
    setSelectedOrder(order);
    setAssignDialogOpen(true);
  }

  return (
    <>
    {selectedOrder && (
        <AssignTechnicianDialog
            open={isAssignDialogOpen}
            onOpenChange={setAssignDialogOpen}
            workOrder={selectedOrder}
        />
    )}
    <Card>
      <CardHeader>
        <CardTitle>Recent Work Orders</CardTitle>
        <CardDescription>A list of the most recent work orders.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Engineer(s)</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">Loading recent orders...</TableCell>
                </TableRow>
            ) : recentOrders.length > 0 ? (
                recentOrders.map((order) => {
                    const customer = customers[order.customerId];
                    const technicians = order.technicianIds?.map(id => users[id]?.name).filter(Boolean).join(', ') || 'Unassigned';
                    return (
                        <TableRow key={order.id}>
                        <TableCell>
                            <div className="font-medium">{customer?.name || 'N/A'}</div>
                            <div className="hidden text-sm text-muted-foreground md:inline">
                            {order.title}
                            </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                            <Badge className={cn("hover:bg-none", statusStyles[order.status])} variant="outline">
                            {order.status}
                            </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            {technicians}
                        </TableCell>
                        <TableCell className="text-right">
                            {new Date(order.scheduledDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                <Link href={`/dashboard/work-orders/${order.id}`}>View Details</Link>
                                </DropdownMenuItem>
                                {user?.role === 'Admin' && 
                                    <DropdownMenuItem onClick={() => handleAssignClick(order)}>Assign Engineer</DropdownMenuItem>
                                }
                                <DropdownMenuItem>Mark as Completed</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    );
                })
            ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">No recent work orders found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </>
  );
}
