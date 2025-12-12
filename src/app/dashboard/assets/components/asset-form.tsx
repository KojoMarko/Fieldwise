
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
import { LoaderCircle, CalendarIcon, PlusCircle, ChevronsUpDown, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Customer, Asset } from '@/lib/types';
import { CreateAssetInputSchema } from '@/lib/schemas';
import { createAsset } from '@/ai/flows/create-asset';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AddCustomerDialog } from '../../customers/components/add-customer-dialog';

type AssetFormValues = z.infer<typeof CreateAssetInputSchema>;

type DiscoveredModel = {
  name: string;
  ppmFrequency?: number;
};

export function AssetForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const db = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isNewModelDialogOpen, setNewModelDialogOpen] = useState(false);
  const [newModelName, setNewModelName] = useState('');

  const [isNewNameDialogOpen, setNewNameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [discoveredNames, setDiscoveredNames] = useState<string[]>([]);
  
  const [isAddCustomerDialogOpen, setAddCustomerDialogOpen] = useState(false);
  
  const [isNameComboboxOpen, setNameComboboxOpen] = useState(false);
  const [isCustomerComboboxOpen, setCustomerComboboxOpen] = useState(false);
  const [isModelComboboxOpen, setModelComboboxOpen] = useState(false);

  const customerIdFromParams = searchParams.get('customerId');

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(CreateAssetInputSchema),
    defaultValues: {
      name: '',
      model: '',
      serialNumber: '',
      customerId: customerIdFromParams || '',
      location: '',
      companyId: user?.companyId,
      lifecycleNotes: [],
      status: 'Operational',
      vendor: '',
      ppmFrequency: undefined,
    },
  });

  const watchedName = form.watch('name');

  useEffect(() => {
    if (!user?.companyId || !db) {
      setIsLoading(false);
      return;
    }

    const customerQuery = query(collection(db, "customers"), where("companyId", "==", user.companyId));
    const unsubscribeCustomers = onSnapshot(customerQuery, (snapshot) => {
      const customersData: Customer[] = [];
      snapshot.forEach((doc) => {
        customersData.push({ id: doc.id, ...doc.data() } as Customer);
      });
      setCustomers(customersData);
    });

    const assetQuery = query(collection(db, "assets"), where("companyId", "==", user.companyId));
    const unsubscribeAssets = onSnapshot(assetQuery, (snapshot) => {
        const assetsData: Asset[] = [];
        snapshot.forEach((doc) => {
            assetsData.push({ id: doc.id, ...doc.data() } as Asset);
        });
        setAllAssets(assetsData);
        setIsLoading(false);
    });

    return () => {
        unsubscribeCustomers();
        unsubscribeAssets();
    }
  }, [user?.companyId, db]);
  
  useEffect(() => {
    const nameSet = new Set<string>();
    allAssets.forEach(asset => {
        if(asset.name) {
            nameSet.add(asset.name);
        }
    });
    setDiscoveredNames(Array.from(nameSet).sort());

  }, [allAssets]);


  const availableModels = useMemo(() => {
    if (!watchedName) return [];
    
    const modelsForName = allAssets
      .filter(asset => asset.name === watchedName)
      .map(asset => ({ name: asset.model, ppmFrequency: asset.ppmFrequency }));
    
    const uniqueModels = Array.from(new Map(modelsForName.map(m => [m.name, m])).values());
    
    return uniqueModels.sort((a,b) => a.name.localeCompare(b.name));
  }, [watchedName, allAssets]);


  async function onSubmit(data: AssetFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createAsset({
        ...data,
        companyId: user.companyId,
      });
      toast({
        title: 'Asset Created',
        description: `The asset "${data.name}" has been successfully created.`,
      });
      router.push('/dashboard/assets');
    } catch (error) {
      console.error('Failed to create asset:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Create Asset',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleModelChange = (modelName: string) => {
      form.setValue('model', modelName);
      const selectedModel = availableModels.find(m => m.name === modelName);
      if (selectedModel && selectedModel.ppmFrequency) {
          form.setValue('ppmFrequency', selectedModel.ppmFrequency);
           toast({
              title: 'PPM Frequency Pre-filled',
              description: `PPM frequency set to ${selectedModel.ppmFrequency} months based on model template.`,
          });
      }
      setModelComboboxOpen(false);
  }

  const handleAddNewModel = () => {
    if(newModelName.trim() && watchedName) {
        // We create a temporary asset object to update the memoized calculation
        const tempAsset: Asset = {
            id: `temp-${Date.now()}`,
            name: watchedName,
            model: newModelName,
            serialNumber: '',
            customerId: '',
            location: '',
            installationDate: '',
            companyId: user?.companyId || '',
            status: 'Operational',
        };
        setAllAssets(prev => [...prev, tempAsset]);
        form.setValue('model', newModelName);
        setNewModelDialogOpen(false);
        setNewModelName('');
    }
  }

  const handleAddNewName = () => {
      if (newName.trim()) {
          if (!discoveredNames.includes(newName)) {
            setDiscoveredNames(prev => [...prev, newName].sort());
          }
          form.setValue('name', newName);
          form.resetField('model');
          setNewNameDialogOpen(false);
          setNewName('');
      }
  }
  
  const handleCustomerCreated = (newCustomerId: string) => {
    form.setValue('customerId', newCustomerId);
  };


  if (isLoading) {
    return <div className="flex justify-center items-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <>
       <AddCustomerDialog
        open={isAddCustomerDialogOpen}
        onOpenChange={setAddCustomerDialogOpen}
        onCustomerCreated={handleCustomerCreated}
      />
      <AlertDialog open={isNewModelDialogOpen} onOpenChange={setNewModelDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Add New Asset Model</AlertDialogTitle>
            <AlertDialogDescription>
                Enter the name for the new model for asset type "{watchedName}".
            </AlertDialogDescription>
            </AlertDialogHeader>
            <Input 
                placeholder="e.g., Beckman Coulter DxH 900"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
            />
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddNewModel} disabled={!watchedName}>Add Model</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isNewNameDialogOpen} onOpenChange={setNewNameDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Add New Asset Name</AlertDialogTitle>
            <AlertDialogDescription>
                Enter the name for the new asset type (e.g., Chemistry Analyzer).
            </AlertDialogDescription>
            </AlertDialogHeader>
            <Input 
                placeholder="e.g., Chemistry Analyzer"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
            />
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddNewName}>Add Name</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
            <FormItem className="flex flex-col">
                <FormLabel>Asset Name</FormLabel>
                 <Popover open={isNameComboboxOpen} onOpenChange={setNameComboboxOpen}>
                    <PopoverTrigger asChild>
                        <FormControl>
                        <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                            )}
                        >
                            {field.value || "Select an existing name or add new"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Search asset name..." />
                            <CommandList>
                            <CommandEmpty>No name found.</CommandEmpty>
                            <CommandGroup>
                                {discoveredNames.map((name) => (
                                <CommandItem
                                    value={name}
                                    key={name}
                                    onSelect={() => {
                                        form.setValue("name", name);
                                        form.resetField('model');
                                        setNameComboboxOpen(false);
                                    }}
                                >
                                    <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        name === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                    />
                                    {name}
                                </CommandItem>
                                ))}
                                 <CommandItem
                                    onSelect={() => setNewNameDialogOpen(true)}
                                    className="text-primary focus:text-primary-foreground focus:bg-primary mt-1"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add New Name...
                                </CommandItem>
                            </CommandGroup>
                             </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                 <FormDescription>
                    The general category of the equipment.
                </FormDescription>
                <FormMessage />
            </FormItem>
            )}
        />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
           <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Asset Model</FormLabel>
                    <Popover open={isModelComboboxOpen} onOpenChange={setModelComboboxOpen}>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                                )}
                                disabled={!watchedName}
                            >
                                {field.value || (!watchedName ? "Select an asset name first" : "Select an existing model or add new")}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search model..." />
                                <CommandList>
                                <CommandEmpty>No model found.</CommandEmpty>
                                <CommandGroup>
                                    {availableModels.map((model) => (
                                    <CommandItem
                                        value={model.name}
                                        key={model.name}
                                        onSelect={() => handleModelChange(model.name)}
                                    >
                                        <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            model.name === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                        />
                                        {model.name}
                                    </CommandItem>
                                    ))}
                                    <CommandItem
                                        onSelect={() => setNewModelDialogOpen(true)}
                                        className="text-primary focus:text-primary-foreground focus:bg-primary mt-1"
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add New Model...
                                    </CommandItem>
                                </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <FormDescription>Select a model to pre-fill template data like PPM frequency.</FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serial Number</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., V5600-001" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
           <FormField
            control={form.control}
            name="installationDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Installation Date</FormLabel>
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
                          format(new Date(field.value), 'PPP')
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
                      disabled={(date) => date > new Date() && date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                 <FormDescription>
                  When was this asset installed?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Lab 1, Main Wing" {...field} />
                </FormControl>
                <FormDescription>
                  Where at the customer's site is this asset located?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
         <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>Customer</FormLabel>
                     <Popover open={isCustomerComboboxOpen} onOpenChange={setCustomerComboboxOpen}>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                                )}
                                disabled={isLoading}
                            >
                                {field.value
                                ? customers.find(c => c.id === field.value)?.name
                                : "Select a customer"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search customer..." />
                                <CommandList>
                                <CommandEmpty>No customer found.</CommandEmpty>
                                <CommandGroup>
                                    {customers.map((customer) => (
                                    <CommandItem
                                        value={customer.name}
                                        key={customer.id}
                                        onSelect={() => {
                                            form.setValue("customerId", customer.id);
                                            setCustomerComboboxOpen(false);
                                        }}
                                    >
                                        <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            customer.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                        />
                                        {customer.name}
                                    </CommandItem>
                                    ))}
                                    <CommandItem
                                        onSelect={() => setAddCustomerDialogOpen(true)}
                                        className="text-primary focus:text-primary-foreground focus:bg-primary mt-1"
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add New Customer
                                    </CommandItem>
                                </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select asset status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Operational">Operational</SelectItem>
                                <SelectItem value="Maintenance">Maintenance</SelectItem>
                                <SelectItem value="Down">Down</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
         <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-md font-medium">Installation & Warranty</h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                 <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Purchase Date</FormLabel>
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
                                format(new Date(field.value), 'PPP')
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
                            disabled={(date) => date > new Date()}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="warrantyExpiry"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Warranty Expiry Date</FormLabel>
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
                                format(new Date(field.value), 'PPP')
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
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="vendor"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Vendor</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Haas Automation" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
         </div>
          <div className="space-y-4 rounded-lg border p-4">
              <h3 className="text-md font-medium">Preventive Maintenance</h3>
               <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="ppmFrequency"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>PPM Frequency (Months)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 6" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} value={field.value ?? ''} />
                        </FormControl>
                        <FormDescription>
                            How often should preventive maintenance be done?
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="lastPpmDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Last PPM Date</FormLabel>
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
                                format(new Date(field.value), 'PPP')
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
                            disabled={(date) => date > new Date()}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <FormDescription>
                            When was the last PPM performed?
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
               </div>
          </div>
           
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Asset'}
          </Button>
        </div>
      </form>
    </Form>
    </>
  );
}
