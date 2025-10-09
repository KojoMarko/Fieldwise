
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
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
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import type { Company } from '@/lib/types';
import { UpdateCompanyInputSchema } from '@/lib/schemas';
import { updateCompany } from '@/ai/flows/update-company';
import { LoaderCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

type SettingsFormValues = z.infer<typeof UpdateCompanyInputSchema>;

export function SettingsForm({ company }: { company: Company }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);


  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(UpdateCompanyInputSchema),
    defaultValues: {
      id: company.id,
      name: company.name,
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
      logoUrl: company.logoUrl || '',
    },
  });

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setLogoPreview(dataUrl);
        form.setValue('logoUrl', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(data: SettingsFormValues) {
    setIsSubmitting(true);
    try {
      await updateCompany(data);
      toast({
        title: 'Settings Updated',
        description: 'Your company settings have been successfully updated.',
      });
      setLogoPreview(null);
    } catch (error) {
      console.error('Failed to update settings:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const currentLogo = logoPreview || company.logoUrl;


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="Your company's name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <div className="flex items-center gap-4">
            {currentLogo ? (
                <Image src={currentLogo} alt="Company Logo" width={64} height={64} className="rounded-md object-contain" />
            ) : (
                <div className='w-16 h-16 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs'>No Logo</div>
            )}
          <div className="grid gap-1.5 flex-1">
            <FormLabel>Company Logo</FormLabel>
            <Input
              type="file"
              accept="image/*"
              className="max-w-xs"
              onChange={handleLogoChange}
            />
            <FormDescription>
              Upload your company logo. This will appear on invoices.
            </FormDescription>
          </div>
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="contact@yourcompany.com" {...field} />
              </FormControl>
              <FormDescription>The primary contact email for your company.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Phone</FormLabel>
              <FormControl>
                <Input placeholder="(123) 456-7890" {...field} />
              </FormControl>
               <FormDescription>The primary contact phone number.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Address</FormLabel>
              <FormControl>
                <Textarea placeholder="123 Main St, Anytown, USA" {...field} />
              </FormControl>
              <FormDescription>The physical address of your company.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
