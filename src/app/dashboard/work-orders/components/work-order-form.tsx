
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { customers, assets } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const workOrderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  customerId: z.string().min(1, 'Customer is required'),
  assetId: z.string().min(1, 'Asset is required'),
  priority: z.enum(['Low', 'Medium', 'High']),
  scheduledDate: z.date({
    required_error: 'A scheduled date is required.',
  }),
});

type WorkOrderFormValues = z.infer<typeof workOrderSchema>;

export function WorkOrderForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const customerProfile = user?.role === 'Customer' ? customers.find(c => c.contactEmail === user.email) : undefined;

  const form = useForm<WorkOrderFormValues>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      priority: 'Medium',
      customerId: customerProfile?.id || '',
    },
  });

  function onSubmit(data: WorkOrderFormValues) {
    console.log('New Work Order Submitted:', data);
    toast({
      title: user?.role === 'Customer' ? 'Service Request Submitted' : 'Work Order Created',
      description: `The request "${data.title}" has been successfully submitted.`,
    });
    router.push('/dashboard/work-orders');
  }
  
  const isCustomer = user?.role === 'Customer';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Title</FormLabel>
              <FormControl>
                <Input placeholder="E.g., Machine is making a strange noise" {...field} />
              </FormControl>
               <FormDescription>
                  Provide a brief, clear title for your service request.
                </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Problem Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please provide as much detail as possible about the issue..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FormField
            control={form.control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isCustomer}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="assetId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Which equipment needs service?</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an asset" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {assets
                      .filter(
                        (asset) =>
                          !form.watch('customerId') ||
                          asset.customerId === form.watch('customerId')
                      )
                      .map((asset) => (
                        <SelectItem key={asset.id} value={asset.id}>
                          {asset.name} ({asset.serialNumber})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Assets are filtered by the selected customer.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Urgency</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Low">Low - Routine check-up</SelectItem>
                    <SelectItem value="Medium">Medium - Affecting performance</SelectItem>
                    <SelectItem value="High">High - Out of service</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="scheduledDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Preferred Service Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date() || date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                 <FormDescription>
                  This is a preferred date and is subject to availability.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">{isCustomer ? 'Submit Request' : 'Create Work Order'}</Button>
        </div>
      </form>
    </Form>
  );
}
