import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { customers, workOrders } from '@/lib/data';
import { MoreVertical, CheckCircle, Clock } from 'lucide-react';

export default function CustomersPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Customers</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {customers.map((customer) => {
          const customerWorkOrders = workOrders.filter(
            (wo) => wo.customerId === customer.id
          );
          const completedOrders = customerWorkOrders.filter(
            (wo) => wo.status === 'Completed'
          ).length;
          const openOrders = customerWorkOrders.length - completedOrders;

          return (
            <Card key={customer.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{customer.name}</CardTitle>
                  <CardDescription>{customer.address}</CardDescription>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-4">
                  Contact: {customer.contactPerson} ({customer.contactEmail})
                </div>
                <div className="flex space-x-4 text-sm">
                  <div className="flex items-center">
                    <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                    {completedOrders} Completed
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4 text-yellow-500" />
                    {openOrders} Open
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-4">
                  View Service History
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
