
'use client';
import { useState } from 'react';
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
  UserCheck
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
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { AddPartsDialog } from './add-parts-dialog';
import { VerifyPartUsageDialog } from './verify-part-usage-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


export function WorkOrderPartsTab({ workOrder, allocatedParts, setAllocatedParts }: { workOrder: WorkOrder, allocatedParts: AllocatedPart[], setAllocatedParts: (parts: AllocatedPart[] | ((prev: AllocatedPart[]) => AllocatedPart[])) => void }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isAddPartsDialogOpen, setAddPartsDialogOpen] = useState(false);
  const [isVerifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [partToVerify, setPartToVerify] = useState<AllocatedPart | null>(null);
  const { toast } = useToast();

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
    setAllocatedParts(prev => [...prev, ...newAllocatedParts]);
  }

  const handlePartStatusChange = (partId: string, status: AllocatedPart['status']) => {
    setAllocatedParts(prev => prev.map(p => p.id === partId ? {...p, status} : p));
     toast({
        title: 'Part Status Updated',
        description: `Part status changed to "${status}"`,
    });
  }

  const handleVerificationRequest = (part: AllocatedPart) => {
    handlePartStatusChange(part.id, 'Pending Verification');
    toast({
        title: 'Verification Required',
        description: `Usage of ${part.name} needs to be verified by another team member.`
    })
  }

  const openVerifyDialog = (part: AllocatedPart) => {
      setPartToVerify(part);
      setVerifyDialogOpen(true);
  }

  const handleVerification = (partId: string) => {
    if(!user) return;
    setAllocatedParts(prev => prev.map(p => p.id === partId ? {...p, status: 'Used', verifiedBy: user.name } : p));
    setVerifyDialogOpen(false);
    setPartToVerify(null);
  }

  const statusBadge: Record<AllocatedPart['status'], React.ReactNode> = {
    Allocated: <Badge variant="secondary">Allocated</Badge>,
    'Pending Verification': <Badge variant="outline" className="border-orange-500 text-orange-600">Pending Verification</Badge>,
    Used: <Badge variant="default" className="bg-green-600">Used</Badge>,
    Returned: <Badge variant="outline">Returned</Badge>,
  }


  return (
    <>
    <AddPartsDialog open={isAddPartsDialogOpen} onOpenChange={setAddPartsDialogOpen} onAddParts={handleAddParts}/>
    {partToVerify && <VerifyPartUsageDialog open={isVerifyDialogOpen} onOpenChange={setVerifyDialogOpen} part={partToVerify} onVerify={handleVerification} />}
    <div className="grid gap-4 xl:grid-cols-3 xl:gap-8 mt-4">
      <div className="xl:col-span-2 grid auto-rows-max items-start gap-4">
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
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Part Name</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {allocatedParts.length > 0 ? allocatedParts.map(part => (
                    <TableRow key={part.id}>
                        <TableCell>
                            <div className="font-medium">{part.name}</div>
                            <div className="text-sm text-muted-foreground">{part.partNumber}</div>
                        </TableCell>
                        <TableCell>{part.quantity}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                {statusBadge[part.status]}
                                {part.status === 'Used' && part.verifiedBy && (
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
                                    <DropdownMenuItem onClick={() => handleVerificationRequest(part)}>
                                        <PackageCheck className="mr-2" /> Mark as Used
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handlePartStatusChange(part.id, 'Returned')}>
                                        <Undo2 className="mr-2" /> Mark as Returned
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                           )}
                           {part.status === 'Pending Verification' && (
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
          </CardContent>
        </Card>
      </div>

      <div className="grid auto-rows-max items-start gap-4">
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
