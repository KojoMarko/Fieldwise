
'use client';
import { ChevronLeft, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { WorkOrderForm } from '../components/work-order-form';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function NewWorkOrderPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isCustomer = user?.role === 'Customer';
  const isAdmin = user?.role === 'Admin';
  const isEngineer = user?.role === 'Engineer';
  const canCreate = isCustomer || isAdmin || isEngineer;

  useEffect(() => {
    if (!isLoading && !canCreate) {
      router.push('/dashboard');
    }
  }, [isLoading, canCreate, router]);

  const pageTitle = isCustomer ? 'Request New Service' : 'Create New Work Order';
  const cardTitle = isCustomer ? 'Service Request Details' : 'Work Order Details';
  const cardDescription = isCustomer ? 'Please fill out the form below to submit a new service request.' : 'Fill out the form below to create a new work order.';

  if (isLoading || !canCreate) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-4">
        <Card className='max-w-md'>
            <CardHeader>
                <CardTitle className='flex items-center gap-2 justify-center'>
                    <ShieldAlert className="h-6 w-6 text-destructive" />
                    Access Denied
                </CardTitle>
                <CardDescription>
                    You do not have permission to create a new work order.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className='text-sm text-muted-foreground'>You are being redirected.</p>
            </CardContent>
        </Card>
    </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-4xl flex-1 auto-rows-max gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/work-orders">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          {pageTitle}
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {cardTitle}
          </CardTitle>
          <CardDescription>
            {cardDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WorkOrderForm />
        </CardContent>
      </Card>
    </div>
  );
}
