
'use client';

import { useState, useRef, forwardRef } from 'react';
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
  Calendar as CalendarIcon,
  PlusCircle,
  Trash2,
  Download,
} from 'lucide-react';
import { suggestSpareParts } from '@/ai/flows/suggest-spare-parts';
import { generateServiceReport } from '@/ai/flows/generate-service-report';
import type { ServiceReportQuestionnaire, AllocatedPart } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { WorkOrder, Customer, User, Asset, Company } from '@/lib/types';
import { format, parseISO } from 'date-fns';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type jsPDF from 'jspdf';
import type html2canvas from 'html2canvas';

// New component to isolate the ref and the content
const ReportBody = forwardRef<HTMLDivElement, { htmlContent: string }>(({ htmlContent }, ref) => {
    return (
        <div ref={ref} className="p-6 bg-background">
             <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-card-foreground prose-p:text-muted-foreground prose-strong:text-card-foreground">
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
             </div>
        </div>
    );
});
ReportBody.displayName = 'ReportBody';


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
  allocatedParts: AllocatedPart[],
  company?: Company,
}) {
  const { user } = useAuth();
  const [currentWorkOrder, setCurrentWorkOrder] = useState<WorkOrder>(workOrder);
  const { toast } = useToast();
  const [isQuestionnaireOpen, setQuestionnaireOpen] = useState(false);
  const [isHoldDialogOpen, setHoldDialogOpen] = useState(false);
  const [questionnaireData, setQuestionnaireData] = useState<Partial<ServiceReportQuestionnaire>>({
      workPerformed: '',
      partsUsed: '',
      finalObservations: '',
      customerFeedback: '',
      rootCause: 'Other',
      failureCode: '',
      followUpNeeded: false
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [consumedParts, setConsumedParts] = useState<string[]>([]);
  const [customPart, setCustomPart] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);


  const handleDownloadPdf = async () => {
    const reportElement = reportRef.current;
    if (!reportElement) return;

    toast({
        title: 'Generating PDF...',
        description: 'Please wait while the report is being prepared for download.',
    });

    try {
        const { default: jsPDF } = await import('jspdf');
        const { default: html2canvas } = await import('html2canvas');

        const canvas = await html2canvas(reportElement, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`ServiceReport-ESR-${workOrder.id}.pdf`);

        toast({
            title: 'Download Ready',
            description: 'Your PDF report has been downloaded.',
        });
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        toast({
            variant: 'destructive',
            title: 'PDF Generation Failed',
            description: 'Could not generate the PDF at this time.',
        });
    }
  };

  // Open questionnaire when status changes to 'Completed'
  useState(() => {
    if (workOrder.status === 'Completed' && user?.role === 'Engineer' && !workOrder.technicianNotes) {
      setQuestionnaireOpen(true);
    }
  }, [workOrder.status, user]);


  const handlePutOnHold = async (reason: string) => {
    try {
      const workOrderRef = doc(db, 'work-orders', currentWorkOrder.id);
      const newNotes = `${currentWorkOrder.technicianNotes || ''}\n\nWork put on hold. Reason: ${reason}`;
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

  const handleQuestionnaireSubmit = async () => {
    setQuestionnaireOpen(false);
    setIsGeneratingReport(true);
    try {
        const partsList = [...consumedParts];
        if (customPart) {
            partsList.push(customPart);
        }
        
        const result = await generateServiceReport({
            ...(questionnaireData as ServiceReportQuestionnaire),
            partsUsed: partsList.join(', '),
            workOrderTitle: currentWorkOrder.title,
            assetName: asset?.name || 'N/A',
            companyName: company?.name || 'FieldWise Inc.',
            companyAddress: company?.address || '123 Service Lane, Tech City',
            companyEmail: company?.email || 'contact@fieldwise.com',
            companyPhone: company?.phone || '555-010-3452',
            clientName: customer?.name || 'N/A',
            clientContact: customer?.contactPerson || 'N/A',
            clientAddress: customer?.address || 'N/A',
            preparedBy: technician?.name || user?.name || 'N/A',
            workOrderId: currentWorkOrder.id,
            type: currentWorkOrder.type,
            currentDate: format(new Date(), 'MM/dd/yyyy'),
        });

        const workOrderRef = doc(db, 'work-orders', currentWorkOrder.id);
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

  const isEngineerView = user?.role === 'Engineer';

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
          <Button variant="outline" size="sm" onClick={handleDownloadPdf}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ReportBody 
            ref={reportRef} 
            htmlContent={workOrder.technicianNotes?.replace(/\n/g, '<br />').replace(/---/g, '<hr />') || ''} 
        />
        <Separator />
        <div className="p-6">
           <h4 className="font-medium mb-2 text-card-foreground">Customer Approval</h4>
           <div className="mt-4 border bg-muted rounded-lg h-32 flex items-center justify-center">
                <p className="text-sm text-muted-foreground italic">Customer Signature</p>
           </div>
           <div className="mt-2 text-sm">
                <p>Signed by: {customer?.contactPerson}</p>
                <p className="text-muted-foreground">Date: {workOrder.completedDate ? format(new Date(workOrder.completedDate), 'PPP') : 'N/A'}</p>
           </div>
        </div>
      </CardContent>
    </Card>
  );

  const EngineerActions = () => (
    <Card>
        <CardHeader>
            <CardTitle>Engineer Controls</CardTitle>
            <CardDescription>Update the work order status.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
            {(workOrder.status === 'In-Progress' || workOrder.status === 'On-Site') && (
                 <Button onClick={() => setQuestionnaireOpen(true)}>
                    <Check className="mr-2" /> Complete & Generate Report
                </Button>
            )}
            {(workOrder.status === 'On-Hold') && (
                <Button onClick={() => {
                  const workOrderRef = doc(db, 'work-orders', workOrder.id);
                  updateDoc(workOrderRef, { status: 'In-Progress' });
                }}>
                    <Play className="mr-2" /> Resume Work
                </Button>
            )}
             {workOrder.status === 'In-Progress' && (
                <Button variant="outline" onClick={() => setHoldDialogOpen(true)}>
                    <Pause className="mr-2" /> Put on Hold
                </Button>
            )}
        </CardContent>
    </Card>
  )

  const DateTimePicker = ({ value, onChange }: { value: any, onChange: (date: Date) => void }) => (
    <Popover>
        <PopoverTrigger asChild>
            <Button
            variant={'outline'}
            className={cn(
                'w-full justify-start text-left font-normal',
                !value && 'text-muted-foreground'
            )}
            >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(new Date(value), 'PPP p') : <span>Pick a date</span>}
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
            <Calendar
                mode="single"
                selected={value}
                onSelect={(day) => {
                    const newDate = new Date(day || '');
                    const oldTime = value ? new Date(value) : new Date();
                    newDate.setHours(oldTime.getHours(), oldTime.getMinutes());
                    onChange(newDate);
                }}
            />
            <div className="p-3 border-t border-border">
                <Input
                    type="time"
                    value={value ? format(new Date(value), 'HH:mm') : ''}
                    onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = value ? new Date(value) : new Date();
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        onChange(newDate);
                    }}
                />
            </div>
        </PopoverContent>
    </Popover>
  );

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
                  <DialogTitle>Engineer Completion & Sign-Off</DialogTitle>
                  <DialogDescription>To be filled by the Engineer</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto px-1">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                           <Label>Time On-Site</Label>
                           <DateTimePicker value={questionnaireData.timeOnSite} onChange={date => setQuestionnaireData({...questionnaireData, timeOnSite: date})} />
                        </div>
                        <div className="space-y-2">
                           <Label>Time Work Started</Label>
                           <DateTimePicker value={questionnaireData.timeWorkStarted} onChange={date => setQuestionnaireData({...questionnaireData, timeWorkStarted: date})} />
                        </div>
                        <div className="space-y-2">
                           <Label>Time Work Completed</Label>
                           <DateTimePicker value={questionnaireData.timeWorkCompleted} onChange={date => setQuestionnaireData({...questionnaireData, timeWorkCompleted: date})} />
                        </div>
                   </div>
                   <div className="space-y-2">
                      <Label htmlFor="q-work-performed">Actual Work Performed</Label>
                      <Textarea id="q-work-performed" value={questionnaireData.workPerformed} onChange={e => setQuestionnaireData({...questionnaireData, workPerformed: e.target.value})} placeholder="Detail diagnosis, steps taken, and troubleshooting path..." />
                  </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Root Cause of Failure</Label>
                             <Select value={questionnaireData.rootCause} onValueChange={(value) => setQuestionnaireData({...questionnaireData, rootCause: value})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select cause" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Electrical Fault">Electrical Fault</SelectItem>
                                    <SelectItem value="Mechanical Wear">Mechanical Wear</SelectItem>
                                    <SelectItem value="Operator Error">Operator Error</SelectItem>
                                    <SelectItem value="Software Issue">Software Issue</SelectItem>
                                    <SelectItem value="Environmental">Environmental</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Failure Code</Label>
                            <Input value={questionnaireData.failureCode} onChange={e => setQuestionnaireData({...questionnaireData, failureCode: e.target.value})} placeholder="e.g., C-403"/>
                        </div>
                   </div>
                    <div className="space-y-2">
                      <Label htmlFor="q-parts-used">Parts Consumed</Label>
                      <div className="p-3 border rounded-md space-y-3">
                        {allocatedParts.map(part => (
                            <div key={part.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`part-${part.id}`} 
                                    checked={consumedParts.includes(`${part.name} (x${part.quantity})`)}
                                    onCheckedChange={(checked) => {
                                        const partString = `${part.name} (x${part.quantity})`;
                                        if(checked) {
                                            setConsumedParts(prev => [...prev, partString]);
                                        } else {
                                            setConsumedParts(prev => prev.filter(p => p !== partString));
                                        }
                                    }}
                                />
                                <Label htmlFor={`part-${part.id}`}>{part.name} ({part.partNumber}) - {part.quantity} unit(s)</Label>
                            </div>
                        ))}
                        <Separator />
                        <div className="flex items-center gap-2">
                           <PlusCircle className="h-4 w-4"/>
                           <Input 
                            placeholder="Add part purchased on-field..."
                            value={customPart}
                            onChange={(e) => setCustomPart(e.target.value)}
                            className="h-8"
                           />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Select from allocated parts or add one purchased on the field.</p>
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="q-observations">Final Observations & Recommendations</Label>
                      <Textarea id="q-observations" value={questionnaireData.finalObservations} onChange={e => setQuestionnaireData({...questionnaireData, finalObservations: e.target.value})} placeholder="Any notes for the customer or for future service?" />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="q-customer-feedback">Customer On-Site Feedback</Label>
                      <Textarea id="q-customer-feedback" value={questionnaireData.customerFeedback} onChange={e => setQuestionnaireData({...questionnaireData, customerFeedback: e.target.value})} placeholder="Any comments or feedback from the customer?" />
                  </div>
                   <div className="flex items-center space-x-2">
                        <Checkbox id="follow-up" checked={questionnaireData.followUpNeeded} onCheckedChange={(checked) => setQuestionnaireData({...questionnaireData, followUpNeeded: !!checked})} />
                        <Label htmlFor="follow-up">Follow-Up Needed?</Label>
                    </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setQuestionnaireOpen(false)}>Cancel</Button>
                  <Button onClick={handleQuestionnaireSubmit}>Generate Report</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    
      <div className="grid gap-4 xl:grid-cols-2">
      
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
                {isEngineerView && <EngineerActions />}

                {(workOrder.status === 'Completed' || workOrder.status === 'Invoiced') && workOrder.technicianNotes ? (
                    <div className="xl:col-span-2"><ServiceReport /></div>
                ) : (
                  <>
                    { (workOrder.status !== 'In-Progress' || !isEngineerView) &&
                      <Card className={isEngineerView ? 'xl:col-span-1' : 'xl:col-span-2'}>
                        <CardHeader>
                            <CardTitle>Engineer's Report</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center text-sm text-muted-foreground border p-3 rounded-md">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                A service report will be available once the engineer completes the work.
                            </div>
                        </CardContent>
                      </Card>
                    }
                  </>
                )}
            </>
        )}
      </div>
    </>
  );
}
