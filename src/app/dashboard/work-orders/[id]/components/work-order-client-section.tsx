
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  LoaderCircle,
  Wrench,
  AlertCircle,
  CheckCircle,
  FileText,
  Play,
  Check,
  Pause,
} from 'lucide-react';
import { suggestSpareParts } from '@/ai/flows/suggest-spare-parts';
import { generateServiceReport } from '@/ai/flows/generate-service-report';
import type { ServiceReportQuestionnaire } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { WorkOrder, Customer, User, Asset } from '@/lib/types';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { HoldWorkOrderDialog } from './hold-work-order-dialog';

export function WorkOrderClientSection({
  workOrder,
  customer,
  technician,
  asset,
}: {
  workOrder: WorkOrder;
  customer?: Customer;
  technician?: User;
  asset?: Asset;
}) {
  const { user } = useAuth();
  const [currentWorkOrder, setCurrentWorkOrder] = useState<WorkOrder>(workOrder);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();
  const [isQuestionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [isHoldDialogOpen, setHoldDialogOpen] = useState(false);
  const [questionnaireData, setQuestionnaireData] = useState<ServiceReportQuestionnaire>({
      workPerformed: '',
      partsUsed: '',
      finalObservations: '',
      customerFeedback: ''
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleSuggestParts = async () => {
    setIsLoading(true);
    setSuggestions([]);
    try {
      const result = await suggestSpareParts({
        workOrderDescription: currentWorkOrder.description,
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

  const handleStatusChange = (status: WorkOrder['status']) => {
    if (status === 'Completed') {
        setQuestionnaireOpen(true);
    } else if (status === 'On-Hold') {
        setHoldDialogOpen(true);
    } else {
        setCurrentWorkOrder(prev => ({...prev, status}));
        toast({
            title: 'Work Order Updated',
            description: `Status changed to "${status}"`,
        });
    }
  };

  const handlePutOnHold = (reason: string) => {
    setCurrentWorkOrder(prev => ({
      ...prev,
      status: 'On-Hold',
      technicianNotes: `Work put on hold. Reason: ${reason}`,
    }));
    toast({
      variant: 'default',
      title: 'Work Order On Hold',
      description: 'The work order status has been updated.',
    });
    setHoldDialogOpen(false);
  };

  const handleQuestionnaireSubmit = async () => {
    setQuestionnaireOpen(false);
    setIsGeneratingReport(true);
    try {
        const result = await generateServiceReport({
            ...questionnaireData,
            workOrderTitle: currentWorkOrder.title,
            assetName: asset?.name || 'N/A',
        });
        setCurrentWorkOrder(prev => ({
            ...prev,
            status: 'Completed',
            technicianNotes: result.report,
            completedDate: new Date().toISOString(),
        }));
        toast({
            title: 'Service Report Generated',
            description: 'The AI-powered service report has been successfully created.',
        });
    } catch (error) {
        console.error('Error generating report:', error);
         toast({
            variant: 'destructive',
            title: 'Report Generation Failed',
            description: 'Could not generate the service report at this time.',
        });
    } finally {
        setIsGeneratingReport(false);
    }
  }

  const isTechnicianView = user?.role === 'Technician';

  const ServiceReport = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Service Report</CardTitle>
            <CardDescription>
              Work Order: {currentWorkOrder.id}
            </CardDescription>
          </div>
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Customer</p>
              <p className="text-muted-foreground">{customer?.name}</p>
              <p className="text-muted-foreground">{customer?.address}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">Completed Date</p>
              <p className="text-muted-foreground">
                {currentWorkOrder.completedDate
                  ? format(new Date(currentWorkOrder.completedDate), 'PPP')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <Separator />
        <div className="p-6 prose prose-sm max-w-none">
          <h4 className="font-medium mb-2">Technician Report</h4>
          {/* Using dangerouslySetInnerHTML is okay here if we trust the AI output is safe markdown */}
          <div dangerouslySetInnerHTML={{ __html: currentWorkOrder.technicianNotes?.replace(/\n/g, '<br />') || '' }} />
        </div>
        <Separator />
        <div className="p-6">
           <h4 className="font-medium mb-2">Customer Approval</h4>
           <div className="mt-4 border bg-muted rounded-lg h-32 flex items-center justify-center">
                <p className="text-sm text-muted-foreground italic">Customer Signature</p>
           </div>
           <div className="mt-2 text-sm">
                <p>Signed by: {customer?.contactPerson}</p>
                <p className="text-muted-foreground">Date: {currentWorkOrder.completedDate ? format(new Date(currentWorkOrder.completedDate), 'PPP') : 'N/A'}</p>
           </div>
        </div>
      </CardContent>
    </Card>
  );

  const TechnicianActions = () => (
    <Card>
        <CardHeader>
            <CardTitle>Technician Controls</CardTitle>
            <CardDescription>Update the work order status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
            {(currentWorkOrder.status === 'Scheduled' || currentWorkOrder.status === 'On-Hold') && (
                <Button onClick={() => handleStatusChange('In-Progress')}>
                    <Play className="mr-2" /> Start Work
                </Button>
            )}
             {currentWorkOrder.status === 'In-Progress' && (
                <>
                <Button onClick={() => handleStatusChange('Completed')}>
                    <Check className="mr-2" /> Complete Work
                </Button>
                <Button variant="outline" onClick={() => handleStatusChange('On-Hold')}>
                    <Pause className="mr-2" /> Put on Hold
                </Button>
                </>
            )}
            { (currentWorkOrder.status === 'Completed' || currentWorkOrder.status === 'Invoiced') && (
                 <p className="text-sm text-muted-foreground flex items-center"><CheckCircle className="h-4 w-4 mr-2 text-green-500" /> Work completed.</p>
            )}
        </CardContent>
    </Card>
  )

  return (
    <>
      <HoldWorkOrderDialog 
        open={isHoldDialogOpen}
        onOpenChange={setHoldDialogOpen}
        onSubmit={handlePutOnHold}
      />
      <Dialog open={isQuestionnaireOpen} onOpenChange={setQuestionnaireOpen}>
          <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                  <DialogTitle>Service Completion Questionnaire</DialogTitle>
                  <DialogDescription>Please fill out the details of the work performed.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                   <div className="space-y-2">
                      <Label htmlFor="q-work-performed">Summary of Work Performed</Label>
                      <Textarea id="q-work-performed" value={questionnaireData.workPerformed} onChange={e => setQuestionnaireData({...questionnaireData, workPerformed: e.target.value})} placeholder="Describe the service, repairs, and checks you completed..." />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="q-parts-used">Parts Used (comma-separated)</Label>
                      <Input id="q-parts-used" value={questionnaireData.partsUsed} onChange={e => setQuestionnaireData({...questionnaireData, partsUsed: e.target.value})} placeholder="e.g., FIL-HEPA-1212, BLT-M8-25" />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="q-observations">Final Observations & Recommendations</Label>
                      <Textarea id="q-observations" value={questionnaireData.finalObservations} onChange={e => setQuestionnaireData({...questionnaireData, finalObservations: e.target.value})} placeholder="Any notes for the customer or for future service?" />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="q-customer-feedback">Customer On-Site Feedback</Label>
                      <Textarea id="q-customer-feedback" value={questionnaireData.customerFeedback} onChange={e => setQuestionnaireData({...questionnaireData, customerFeedback: e.target.value})} placeholder="Any comments or feedback from the customer?" />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setQuestionnaireOpen(false)}>Cancel</Button>
                  <Button onClick={handleQuestionnaireSubmit}>Generate Report</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    
      <div className="grid gap-4 lg:grid-cols-2">
      
        {isGeneratingReport && (
            <Card className="lg:col-span-2">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <LoaderCircle className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="font-medium">Generating Service Report...</p>
                    <p className="text-sm text-muted-foreground">The AI is writing a professional summary of your work.</p>
                </CardContent>
            </Card>
        )}

        {!isGeneratingReport && (
            <>
                {isTechnicianView && currentWorkOrder.status !== 'Completed' && currentWorkOrder.status !== 'Invoiced' && <TechnicianActions />}

                {(currentWorkOrder.status === 'Completed' || currentWorkOrder.status === 'On-Hold') && currentWorkOrder.technicianNotes ? (
                    <div className="lg:col-span-2"><ServiceReport /></div>
                ) : (
                    <>
                    {/* Hide for technician if work is not completed */}
                    { !isTechnicianView &&
                        <Card>
                        <CardHeader>
                            <CardTitle>Technician Report</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center text-sm text-muted-foreground border p-3 rounded-md">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                A service report will be available once the technician completes the work.
                            </div>
                        </CardContent>
                        </Card>
                    }
                    </>
                )}

                <Card className={(currentWorkOrder.status === 'Completed' || (currentWorkOrder.status !== 'Completed' && !isTechnicianView)) ? 'lg:col-span-2' : ''}>
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
            </>
        )}
      </div>
    </>
  );
}
