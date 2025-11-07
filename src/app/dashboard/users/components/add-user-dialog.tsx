
'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { CreateUserInputSchema } from '@/lib/schemas';
import type { z } from 'zod';
import { createUser } from '@/ai/flows/create-user';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Server, CheckCircle, Mail, MessageSquare } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

type AddUserFormValues = z.infer<typeof CreateUserInputSchema>;

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddUserDialog({ open, onOpenChange }: AddUserDialogProps) {
  const { toast } = useToast();
  const { user: adminUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState<{ email: string } | null>(null);

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(CreateUserInputSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      role: 'Engineer',
      companyId: adminUser?.companyId,
      deliveryMethod: 'email',
    },
  });

  const deliveryMethod = form.watch('deliveryMethod');

  async function onSubmit(data: AddUserFormValues) {
    if (!adminUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to add users.' });
        return;
    }
    
    if (data.deliveryMethod === 'whatsapp' && !data.phone) {
        form.setError('phone', {
            type: 'manual',
            message: 'Phone number is required for WhatsApp delivery.'
        });
        return;
    }

    setIsSubmitting(true);
    try {
        const result = await createUser({
            ...data,
            companyId: adminUser.companyId,
        });

        toast({
            title: 'User Created Successfully',
            description: `An account for ${result.email} has been created and their credentials have been sent.`,
        });

        setNewUser({
            email: result.email,
        });
        form.reset();

    } catch (error: any) {
        console.error('Error creating user:', error);
        toast({
            variant: 'destructive',
            title: 'Failed to Create User',
            description: error.message || 'An error occurred while creating the user. Please try again.',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleClose = () => {
    onOpenChange(false);
    // Delay resetting state to avoid flash of content
    setTimeout(() => {
        setNewUser(null);
        form.reset();
    }, 300);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{newUser ? 'User Created Successfully' : 'Add a New User'}</DialogTitle>
           <DialogDescription>
            {newUser ? `An email with login credentials has been sent to ${newUser.email}.` : 'Enter the details for the new user account.'}
          </DialogDescription>
        </DialogHeader>

        {newUser ? (
            <div className='py-4 space-y-4 text-center'>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <p>The new user will receive their login credentials shortly.</p>
                <DialogFooter>
                    <Button onClick={handleClose}>Done</Button>
                </DialogFooter>
            </div>
        ) : (
             <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Jane Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="e.g., jane.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="Admin">Admin</SelectItem>
                            <SelectItem value="Engineer">Engineer</SelectItem>
                            <SelectItem value="Sales Rep">Sales Rep</SelectItem>
                            <SelectItem value="Customer">Customer</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                        control={form.control}
                        name="deliveryMethod"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormLabel>Send Credentials Via</FormLabel>
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                                >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="email" id="r1" />
                                    </FormControl>
                                    <FormLabel className="font-normal flex items-center gap-2"><Mail /> Email</FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                    <RadioGroupItem value="whatsapp" id="r2" />
                                    </FormControl>
                                    <FormLabel className="font-normal flex items-center gap-2"><MessageSquare /> WhatsApp</FormLabel>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    {deliveryMethod === 'whatsapp' && (
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <Input type="tel" placeholder="e.g., +233244123456" {...field} />
                                </FormControl>
                                <FormDescription>Include country code (e.g., +233).</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                     <DialogFooter className='pt-4'>
                        <Button variant="outline" type="button" onClick={handleClose}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating User...' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        )}

      </DialogContent>
    </Dialog>
  );
}
