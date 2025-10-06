
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
import { Server, CheckCircle } from 'lucide-react';

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
      role: 'Engineer',
      companyId: adminUser?.companyId,
    },
  });

  async function onSubmit(data: AddUserFormValues) {
    if (!adminUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to add users.' });
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
            description: `An account for ${result.email} has been created and their credentials have been emailed to them.`,
        });

        setNewUser({
            email: result.email,
        });
        form.reset();

    } catch (error) {
        console.error('Error creating user:', error);
        toast({
            variant: 'destructive',
            title: 'Failed to Create User',
            description: 'An error occurred while creating the user. Please try again.',
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
                <p>The new user will receive an email shortly with instructions on how to log in.</p>
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
                            <SelectItem value="Engineer">Engineer</SelectItem>
                            <SelectItem value="Customer">Customer</SelectItem>
                             <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
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
