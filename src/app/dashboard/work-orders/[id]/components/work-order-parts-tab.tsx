'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Sparkles,
  LoaderCircle,
  Wrench,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  Undo2,
  PackageCheck,
  ShieldCheck,
  UserCheck,
  ArchiveRestore,
  HandHelping,
  Trash2,
} from 'lucide-react';
import { suggestSpareParts } from '@/ai/flows/suggest-spare-parts';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { WorkOrder, SparePart, AllocatedPart } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { AddPartsDialog } from './add-parts-dialog';
import { VerifyPartUsageDialog } from './verify-part-usage-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';


export function WorkOrderPartsTab({ workOrder }: { workOrder: WorkOrder }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAddPartsDialogOpen, setAddPartsDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [partToVerify, setPartToVerify] = useState<AllocatedPart | null>(null);
  const { toast } = useToast();
  const [allocatedParts, setAllocatedParts] = useState<AllocatedPart[]>(workOrder.allocatedParts || []);
  
  // Keep local state in sync with Firestore document
  useEffect(() => {
    setAllocatedParts(workOrder.allocatedParts || []);
  }, [workOrder.allocatedParts]);

  const updatePartsInFirestore = async (parts: AllocatedPart[]) => {
    const workOrderRef = doc(db, 'work-orders', workOrder.id);
    try {
      await updateDoc(workOrderRef, { allocatedParts: parts });
    } catch (error) {
      console.error("Failed to update parts in Firestore:", error);
      toast({
        variant: 'destructive',
        title: 'Sync Error',
        description: 'Could not save parts changes to the database.',
      });
    }
  };
  
  const handleSuggestParts = async () => {
    setIsLoading(true);
    setSuggestions([]);
    try {
      const result = await suggestSpareParts({
        workOrderDescription: workOrder.description,
      });
      if (result.suggestedSpareParts) {
        setSuggestions(result.suggestedSpareParts);
      }
    } catch (error) {
      console.error('Error suggesting spare parts:', error);
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Failed',
        description: 'Could not fetch spare part suggestions at this time.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddParts = (newParts: SparePart[]) => {
    const newAllocatedParts = newParts.map(p => ({...p, status: 'Allocated' as const, quantity: 1}));
    const updatedParts = [...allocatedParts, ...newAllocatedParts];
    setAllocatedParts(updatedParts);
    updatePartsInFirestore(updatedParts);
  }
  
  const handlePartStatusChange = (partId: string, status: AllocatedPart['status']) => {
    const updatedParts = allocatedParts.map(p => p.id === partId ? {...p, status} : p);
    setAllocatedParts(updatedParts);
    updatePartsInFirestore(updatedParts);
    toast({
        title: 'Part Status Updated',
        description: `Part status changed to "${status}"`,
    });
  }

  const handleVerificationRequest = (part: AllocatedPart, type: 'take' | 'return') => {
    const newStatus = type === 'take' ? 'Pending Handover' : 'Pending Return';
    handlePartStatusChange(part.id, newStatus);
    toast({
        title: 'Verification Required',
        description: `Action for ${part.name} needs to be verified by another team member.`
    })
  }

  const openVerifyDialog = (part: AllocatedPart) => {
      setPartToVerify(part);
      setVerifyDialogOpen(true);
  }

  const handleVerification = (partId: string, verifierName: string) => {
    const updatedParts = allocatedParts.map(p => {
        if (p.id === partId) {
            const finalStatus = p.status === 'Pending Handover' ? 'With Engineer' : 'Returned';
            return { ...p, status: finalStatus, verifiedBy: verifierName };
        }
        return p;
    });
    setAllocatedParts(updatedParts);
    updatePartsInFirestore(updatedParts);
    setVerifyDialogOpen(false);
    setPartToVerify(null);
  }

  const handleQuantityChange = (partId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      toast({
        variant: 'destructive',
        title: 'Invalid Quantity',
        description: 'Quantity must be at least 1. To remove a part, use the delete action.',
      })
      return;
    }
    const updatedParts = allocatedParts.map(p => p.id === partId ? {...p, quantity: newQuantity} : p);
    setAllocatedParts(updatedParts);
    updatePartsInFirestore(updatedParts);
  }

  const handleRemovePart = (partId: string) => {
    const updatedParts = allocatedParts.filter(p => p.id !== partId);
    setAllocatedParts(updatedParts);
    updatePartsInFirestore(updatedParts);
    toast({
      title: 'Part Removed',
      description: 'The part has been removed from this work order.',
    });
  }


  const statusBadge: Record<AllocatedPart['status'], React.ReactNode> = {
    Allocated: <Badge variant="secondary">Allocated</Badge>,
    'Pending Handover': <Badge variant="outline" className="border-orange-500 text-orange-600">Pending Handover</Badge>,
    'Pending Return': <Badge variant="outline" className="border-blue-500 text-blue-600">Pending Return</Badge>,
    'With Engineer': <Badge variant="default" className="bg-blue-500">With Engineer</Badge>,
    Returned: <Badge variant="outline" className="bg-gray-200 text-gray-800">Returned</Badge>,
    Used: <Badge variant="default" className="bg-green-600">Used</Badge>,
  }


  return (
    <>
    <AddPartsDialog open={isAddPartsDialogOpen} onOpenChange={setAddPartsDialogOpen} onAddParts={handleAddParts}/>
    {partToVerify && <VerifyPartUsageDialog open={isVerifyDialogOpen} onOpenChange={setVerifyDialogOpen} part={partToVerify} onVerify={handleVerification} />}
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-3 mt-4">
      <div className="grid auto-rows-max items-start gap-4 lg:col-span-2">
        <Card>
          <CardHeader className='flex-row items-center justify-between'>
            <div>
              <CardTitle>Parts for Work Order</CardTitle>
              <CardDescription>
                Manage spare parts allocated to this job.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setAddPartsDialogOpen(true)}>
              <PlusCircle className="mr-2" /> Add Parts
            </Button>
          </CardHeader>
          <CardContent>
             <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Part Name</TableHead>
                        <TableHead className='hidden md:table-cell w-[120px]'>Quantity</TableHead>
                        <TableHead className='hidden md:table-cell'>Status</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {allocatedParts.length > 0 ? allocatedParts.map(part => (
                    <TableRow key={part.id}>
                        <TableCell>
                            <div className="font-medium">{part.name}</div>
                            <div className="text-sm text-muted-foreground">{part.partNumber}</div>
                             <div className="md:hidden mt-2 space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-xs">Qty:</span>
                                    <Input
                                        type="number"
                                        value={part.quantity}
                                        onChange={(e) => handleQuantityChange(part.id, parseInt(e.target.value, 10))}
                                        disabled={part.status !== 'Allocated'}
                                        className="w-20 h-8"
                                        min={1}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                     <span className="font-medium text-xs">Status:</span>
                                     {statusBadge[part.status]}
                                </div>
                            </div>
                        </TableCell>
                         <TableCell className="hidden md:table-cell">
                            <Input
                                type="number"
                                value={part.quantity}
                                onChange={(e) => handleQuantityChange(part.id, parseInt(e.target.value, 10))}
                                disabled={part.status !== 'Allocated'}
                                className="w-20"
                                min={1}
                            />
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-2">
                                {statusBadge[part.status]}
                                {(part.status === 'With Engineer' || part.status === 'Returned' || part.status === 'Used') && part.verifiedBy && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <UserCheck className="h-4 w-4 text-green-600"/>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Verified by {part.verifiedBy}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                        </TableCell>
                        <TableCell className="text-right">
                           {part.status === 'Allocated' && (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleVerificationRequest(part, 'take')}>
                                        <HandHelping className="mr-2" /> Take Part
                                    </DropdownMenuItem>
                                     <DropdownMenuSeparator />
                                     <DropdownMenuItem className="text-destructive" onClick={() => handleRemovePart(part.id)}>
                                        <Trash2 className="mr-2" /> Remove Part
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                           )}
                           {part.status === 'With Engineer' && (
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                     <DropdownMenuItem onClick={() => handlePartStatusChange(part.id, 'Used')}>
                                        <CheckCircle className="mr-2" /> Mark as Used
                                     </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => handleVerificationRequest(part, 'return')}>
                                        <ArchiveRestore className="mr-2" /> Return Part
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                           )}
                           {(part.status === 'Pending Handover' || part.status === 'Pending Return') && (
                               <Button variant="outline" size="sm" onClick={() => openVerifyDialog(part)}>
                                   <ShieldCheck className="mr-2 h-4 w-4" />
                                   Verify
                               </Button>
                           )}
                        </TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            No parts have been added to this work order.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid auto-rows-max items-start gap-4 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>AI Spare Part Suggester</span>
              <Sparkles className="h-5 w-5 text-primary" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Get AI-powered suggestions for spare parts based on the work order
              description.
            </p>
            <Button
              onClick={handleSuggestParts}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wrench className="mr-2 h-4 w-4" />
              )}
              Suggest Spare Parts
            </Button>

            {isLoading && (
              <div className="flex items-center text-sm text-muted-foreground">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Analyzing work order...
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Suggested Parts:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((part, index) => (
                    <Badge key={index} variant="secondary">
                      {part}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && suggestions.length === 0 && (
              <div className="flex items-center text-sm text-muted-foreground border p-3 rounded-md">
                <AlertCircle className="h-4 w-4 mr-2" />
                Click the button to generate suggestions.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </>
  );
}
