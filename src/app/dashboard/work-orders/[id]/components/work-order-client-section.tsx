
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  LoaderCircle,
  Check,
  Pause,
  Play,
} from 'lucide-react';
import { generateServiceReport } from '@/ai/flows/generate-service-report';
import type { ServiceReportQuestionnaire } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import type { WorkOrder, Customer, User, Asset, Company, WorkOrderStatus, AllocatedPart } from '@/lib/types';
import { format, parseISO, differenceInMinutes } from 'date-fns';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CalendarIcon } from 'lucide-react';
import { ServiceReportDisplay } from './service-report-display';


const DateTimePicker = ({ value, onChange }: { value?: Date; onChange: (date?: Date) => void }) => {
    const [date, setDate] = useState<Date | undefined>(value);

     useEffect(() => {
        if (value) {
            setDate(new Date(value));
        } else {
            setDate(undefined);
        }
    }, [value]);

    const handleDateSelect = (day: Date | undefined) => {
        if (!day) {
            setDate(undefined);
            onChange(undefined);
            return;
        }
        
        const newDate = date ? new Date(date) : new Date();
        newDate.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
        
        setDate(newDate);
        onChange(newDate);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value;
        
        const newDate = date ? new Date(date) : new Date(); // If no date, use today as a base
        if (!time) {
            // Don't set time if input is empty, but keep the date
             setDate(newDate);
             onChange(newDate);
            return;
        }

        const [hours, minutes] = time.split(':').map(Number);
        newDate.setHours(hours, minutes);

        setDate(newDate);
        onChange(newDate);
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={'outline'}
                    className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP p') : <span>Pick a date & time</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateSelect}
                />
                <div className="p-3 border-t border-border">
                    <Label className="text-sm">Time</Label>
                    <Input
                        type="time"
                        value={date ? format(date, 'HH:mm') : ''}
                        onChange={handleTimeChange}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
};

export function WorkOrderClientSection({
  workOrder,
  customer,
  technician,
  asset,
  allocatedParts,
  company,
}: {
  workOrder: WorkOrder;
  customer?: Customer;
  technician?: User;
  asset?: Asset;
  allocatedParts: AllocatedPart[];
  company?: Company,
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isQuestionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [isHoldDialogOpen, setHoldDialogOpen] = useState(false);
  const [questionnaireData, setQuestionnaireData] = useState<Partial<ServiceReportQuestionnaire>>({
      reportedProblem: workOrder.description,
      symptomSummary: '',
      problemSummary: '',
      resolutionSummary: '',
      verificationOfActivity: '',
      instrumentCondition: 'Operational',
      agreementType: 'Warranty',
      laborHours: workOrder.duration || 0,
      signingPerson: customer?.contactPerson || '',
      partsUsed: [],
      timeWorkStarted: undefined,
      timeWorkCompleted: undefined,
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const isEngineerView = user?.role === 'Engineer';

  useEffect(() => {
    // Pre-fill questionnaire from saved notes if they exist
    if (workOrder.technicianNotes && workOrder.technicianNotes.startsWith('{')) {
        try {
            const savedData = JSON.parse(workOrder.technicianNotes);
            setQuestionnaireData({
                reportedProblem: savedData.summary?.reportedProblem,
                symptomSummary: savedData.summary?.symptomSummary,
                problemSummary: savedData.summary?.problemSummary,
                resolutionSummary: savedData.summary?.resolutionSummary,
                verificationOfActivity: savedData.summary?.verificationOfActivity,
                instrumentCondition: savedData.workOrder?.instrumentCondition,
                agreementType: savedData.agreement?.type,
                laborHours: savedData.labor?.[0]?.hours,
                signingPerson: savedData.summary?.signingPerson || savedData.signingPerson,
                timeWorkStarted: savedData.labor?.[0]?.startDate ? parseISO(savedData.labor[0].startDate) : undefined,
                timeWorkCompleted: savedData.labor?.[0]?.endDate ? parseISO(savedData.labor[0].endDate) : undefined,
                partsUsed: savedData.parts || [],
            });
        } catch(e) {
            console.error("Could not parse saved report data.", e);
        }
    }
  }, [workOrder]);

  // Effect to handle automatic updates to the questionnaire form data
  useEffect(() => {
    // Automatically calculate labor hours
    const { timeWorkStarted, timeWorkCompleted } = questionnaireData;
    if (timeWorkStarted && timeWorkCompleted && timeWorkCompleted > timeWorkStarted) {
      const minutes = differenceInMinutes(timeWorkCompleted, timeWorkStarted);
      const hours = parseFloat((minutes / 60).toFixed(2));
      if (questionnaireData.laborHours !== hours) {
        setQuestionnaireData(prev => ({ ...prev, laborHours: hours }));
      }
    }
  }, [questionnaireData.timeWorkStarted, questionnaireData.timeWorkCompleted, questionnaireData.laborHours]);


  const handlePutOnHold = async (reason: string) => {
    try {
      const workOrderRef = doc(db, 'work-orders', workOrder.id);
      const newNotes = `${workOrder.technicianNotes || ''}\n\nWork put on hold. Reason: ${reason}`;
      await updateDoc(workOrderRef, { status: 'On-Hold', technicianNotes: newNotes });
      toast({
        variant: 'default',
        title: 'Work Order On Hold',
        description: 'The work order status has been updated.',
      });
      setHoldDialogOpen(false);
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update the work order status.',
      });
    }
  };
  
    const handleStatusChange = async (newStatus: WorkOrderStatus) => {
    if (!workOrder) return;
    try {
      const workOrderRef = doc(db, 'work-orders', workOrder.id);
      await updateDoc(workOrderRef, { status: newStatus });
      toast({
        title: 'Status Updated',
        description: `Work order status changed to "${newStatus}".`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update the work order status.',
      });
    }
  };


  const handleQuestionnaireSubmit = async () => {
    setQuestionnaireOpen(false);
    setIsGeneratingReport(true);
    try {
        const usedParts = allocatedParts
            .filter(p => p.status === 'Used')
            .map(p => ({
                partNumber: p.partNumber,
                description: p.name,
                quantity: p.quantity,
                price: 0, // Placeholder
            }));
        
        const result = await generateServiceReport({
            ...(questionnaireData as Omit<ServiceReportQuestionnaire, 'partsUsed'>),
            partsUsed: usedParts,
            workOrderId: workOrder.id,
            assetName: asset?.name || 'N/A',
            assetModel: asset?.model || 'N/A',
            assetSerial: asset?.serialNumber || 'N/A',
            companyName: company?.name || 'FieldWise Inc.',
            companyAddress: company?.address || '123 Service Lane, Tech City',
            clientName: customer?.name || 'N/A',
            clientAddress: customer?.address || 'N/A',
            preparedBy: technician?.name || user?.name || 'N/A',
            completionDate: format(new Date(), 'yyyy-MM-dd HH:mm'),
        });

        const workOrderRef = doc(db, 'work-orders', workOrder.id);
        await updateDoc(workOrderRef, {
            status: 'Completed',
            technicianNotes: result.report,
            completedDate: new Date().toISOString(),
        });
        
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

  const hasGeneratedReport = workOrder.technicianNotes?.startsWith('{');
  
  const renderContent = () => {
    if (isGeneratingReport) {
      return (
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
            <LoaderCircle className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="font-medium">Generating Service Report...</p>
            <p className="text-sm text-muted-foreground">The AI is structuring your report data.</p>
          </CardContent>
        </Card>
      );
    }

    if (hasGeneratedReport) {
        return (
            <ServiceReportDisplay 
                workOrder={workOrder} 
                company={company ?? undefined}
                customer={customer ?? undefined}
                asset={asset ?? undefined}
                technician={technician ?? undefined}
                onRegenerate={() => setQuestionnaireOpen(true)}
            />
        )
    }

    const isCompletedStatus = workOrder.status === 'Completed' || workOrder.status === 'Invoiced' || workOrder.status === 'Cancelled';
    
    if (isEngineerView && isCompletedStatus) {
      return (
        <Card>
          <CardHeader><CardTitle>Service Report</CardTitle></CardHeader>
          <CardContent className="space-y-4">
              <div className="flex items-center text-sm text-muted-foreground border p-3 rounded-md">
                  {workOrder.status === 'Cancelled' 
                    ? 'This work order has been cancelled.'
                    : 'This work order is marked as completed but no service report was generated.'}
              </div>
              {workOrder.status !== 'Cancelled' && (
                <Button className="w-full" onClick={() => setQuestionnaireOpen(true)}>
                  <Check className="mr-2" />
                  Generate Service Report
                </Button>
              )}
          </CardContent>
        </Card>
      );
    }

    if (!isEngineerView) {
       return (
        <Card>
          <CardHeader><CardTitle>Service Report</CardTitle></CardHeader>
          <CardContent>
              <div className="flex items-center text-sm text-muted-foreground border p-3 rounded-md">
                  A service report will be available once the engineer completes the work.
              </div>
          </CardContent>
        </Card>
      );
    }
    
    const actions: { [key in WorkOrderStatus]?: { label: string; icon: React.ElementType; nextStatus: WorkOrderStatus; } } = {
      'Scheduled': { label: 'Start Travel', icon: Play, nextStatus: 'Dispatched' },
      'Dispatched': { label: 'Arrive on Site', icon: Play, nextStatus: 'On-Site' },
      'On-Site': { label: 'Start Work', icon: Play, nextStatus: 'In-Progress' },
    };
    const currentAction = actions[workOrder.status];
  
    const inProgressActions = workOrder.status === 'In-Progress' ? (
      <>
        <Button className="w-full" onClick={() => setQuestionnaireOpen(true)}>
          <Check className="mr-2" />
          Mark as Complete
        </Button>
        <Button className="w-full" variant="outline" onClick={() => setHoldDialogOpen(true)}>
          <Pause className="mr-2" />
          Put on Hold
        </Button>
      </>
    ) : null;
  
    return (
      <Card>
        <CardHeader><CardTitle>Engineer Actions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center text-sm text-muted-foreground border p-3 rounded-md">
                Current Status: <span className="font-semibold ml-1">{workOrder.status}</span>
            </div>
             {currentAction ? (
                <Button className="w-full" onClick={() => handleStatusChange(currentAction.nextStatus)}>
                    <currentAction.icon className="mr-2" />
                    {currentAction.label}
                </Button>
            ) : null}
            {inProgressActions}
            {!currentAction && !inProgressActions && workOrder.status === 'On-Hold' && (
              <Button className="w-full" onClick={() => handleStatusChange('In-Progress')}>
                <Play className="mr-2" />
                Resume Work
              </Button>
            )}
        </CardContent>
      </Card>
    );
  };


  return (
    <>
      <HoldWorkOrderDialog 
        open={isHoldDialogOpen}
        onOpenChange={setHoldDialogOpen}
        onSubmit={handlePutOnHold}
      />
      <Dialog open={isQuestionnaireOpen} onOpenChange={setQuestionnaireOpen}>
          <DialogContent className="sm:max-w-3xl">
              <DialogHeader>
                  <DialogTitle>Engineer Service Report Questionnaire</DialogTitle>
                  <DialogDescription>Fill out all fields to generate the final service report.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto px-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Reported Problem</Label>
                        <Textarea value={questionnaireData.reportedProblem} onChange={e => setQuestionnaireData({...questionnaireData, reportedProblem: e.target.value})} />
                      </div>
                       <div className="space-y-2">
                        <Label>Symptom Summary</Label>
                        <Textarea value={questionnaireData.symptomSummary} onChange={e => setQuestionnaireData({...questionnaireData, symptomSummary: e.target.value})} />
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Problem Summary</Label>
                        <Textarea value={questionnaireData.problemSummary} onChange={e => setQuestionnaireData({...questionnaireData, problemSummary: e.target.value})} />
                      </div>
                       <div className="space-y-2">
                        <Label>Resolution Summary</Label>
                        <Textarea value={questionnaireData.resolutionSummary} onChange={e => setQuestionnaireData({...questionnaireData, resolutionSummary: e.target.value})} />
                      </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Verification of Activity</Label>
                        <Input value={questionnaireData.verificationOfActivity} onChange={e => setQuestionnaireData({...questionnaireData, verificationOfActivity: e.target.value})} />
                      </div>
                       <div className="space-y-2">
                        <Label>Instrument Condition</Label>
                        <Select value={questionnaireData.instrumentCondition} onValueChange={(value) => setQuestionnaireData({...questionnaireData, instrumentCondition: value})}>
                           <SelectTrigger><SelectValue /></SelectTrigger>
                           <SelectContent>
                             <SelectItem value="Operational">Operational</SelectItem>
                             <SelectItem value="Operational with Limitations">Operational with Limitations</SelectItem>
                             <SelectItem value="Not Operational">Not Operational</SelectItem>
                           </SelectContent>
                        </Select>
                      </div>
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                           <Label>Agreement Type</Label>
                           <Input value={questionnaireData.agreementType} onChange={e => setQuestionnaireData({...questionnaireData, agreementType: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <Label>Labor Hours</Label>
                           <Input type="number" value={questionnaireData.laborHours} onChange={e => setQuestionnaireData({...questionnaireData, laborHours: parseFloat(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-2">
                           <Label>Person Signing Report</Label>
                           <Input value={questionnaireData.signingPerson} onChange={e => setQuestionnaireData({...questionnaireData, signingPerson: e.target.value})} />
                        </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label>Service Start Date</Label>
                           <DateTimePicker value={questionnaireData.timeWorkStarted} onChange={date => setQuestionnaireData({...questionnaireData, timeWorkStarted: date})} />
                        </div>
                        <div className="space-y-2">
                           <Label>Service Completion Date</Label>
                           <DateTimePicker value={questionnaireData.timeWorkCompleted} onChange={date => setQuestionnaireData({...questionnaireData, timeWorkCompleted: date})} />
                        </div>
                   </div>
                    <div>
                        <Label>Parts Used</Label>
                        <p className="text-sm text-muted-foreground p-3 border rounded-md">
                            Parts marked as 'Used' in the Parts tab will be automatically included.
                        </p>
                    </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setQuestionnaireOpen(false)}>Cancel</Button>
                  <Button onClick={handleQuestionnaireSubmit}>Generate Report</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      {renderContent()}

    </>
  );
}
