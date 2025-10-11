
'use client';

import { useState, useRef, forwardRef } from 'react';
import { createRoot } from 'react-dom/client';
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
import { marked } from 'marked';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


// New component to isolate the ref and the content
const ReportBody = forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => {
    return (
        <div ref={ref} className="p-6 bg-background">
             {children}
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
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);


  const handleDownloadPdf = async () => {
    toast({
      title: "Generating PDF...",
      description: "Please wait while your report is being created.",
    });
  
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let finalY = 0;
  
    // Safely parse the report data
    let reportData: any = {};
    if (workOrder.technicianNotes) {
        try {
            reportData = JSON.parse(workOrder.technicianNotes);
        } catch (e) {
            console.error("Could not parse technician notes as JSON.");
        }
    }
    
    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("CUSTOMER SUPPORT CALL", 40, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 140, 210); // Blue color for link
    doc.textWithLink("WWW.BECKMANCOULTER.COM", 40, 65, { url: 'http://www.beckmancoulter.com' });
    doc.setTextColor(0); // Reset color
  
    // Customer/Asset Info Table
    autoTable(doc, {
      startY: 80,
      body: [
        [{ content: 'ACCOUNT', styles: { fontStyle: 'bold' } }, { content: 'MODEL', styles: { fontStyle: 'bold' } }, { content: 'SERIAL NUMBER', styles: { fontStyle: 'bold' } }, { content: 'ID NUMBER', styles: { fontStyle: 'bold' } }],
        [reportData.account?.name, reportData.asset?.model, reportData.asset?.serialNumber, reportData.asset?.idNumber],
        [{ content: 'CUSTOMER CONTACT', styles: { fontStyle: 'bold' } }, { content: 'PURCHASE ORDER', styles: { fontStyle: 'bold' } }, { content: 'PROPERTY NUMBER', styles: { fontStyle: 'bold' } }, ''],
        [reportData.customer?.contact, reportData.customer?.purchaseOrder, reportData.customer?.propertyNumber, ''],
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [230, 230, 230], textColor: 0 },
      columnStyles: {
          0: { cellWidth: 150 },
          1: { cellWidth: 120 },
          2: { cellWidth: 120 },
          3: { cellWidth: 120 },
      }
    });

    finalY = (doc as any).lastAutoTable.finalY;

    // Agreement/Case Info Table
    autoTable(doc, {
        startY: finalY + 10,
        body: [
             [{ content: 'AGREEMENT TYPE', styles: { fontStyle: 'bold' } }, { content: 'AGREEMENT NUMBER', styles: { fontStyle: 'bold' } }, { content: 'EFFECTIVE DATES', styles: { fontStyle: 'bold' } }, ''],
             [reportData.agreement?.type, reportData.agreement?.number, reportData.agreement?.effectiveDates, ''],
             [{ content: 'CASE NUMBER', styles: { fontStyle: 'bold' } }, { content: 'CREATED DATE/TIME', styles: { fontStyle: 'bold' } }, { content: 'PERFORMED BY', styles: { fontStyle: 'bold' } }, ''],
             [reportData.case?.number, reportData.case?.createdDate, reportData.workOrder?.performedBy, ''],
             [{ content: 'WORK ORDER NUMBER', styles: { fontStyle: 'bold' } }, { content: 'COMPLETION DATE', styles: { fontStyle: 'bold' } }, { content: 'INSTRUMENT CONDITION', styles: { fontStyle: 'bold' } }, ''],
             [reportData.workOrder?.number, reportData.workOrder?.completionDate, reportData.workOrder?.instrumentCondition, ''],
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [230, 230, 230], textColor: 0 },
        columnStyles: {
            0: { cellWidth: 150 },
            1: { cellWidth: 120 },
            2: { cellWidth: 120 },
            3: { cellWidth: 120 },
        }
    });

    finalY = (doc as any).lastAutoTable.finalY;
  
    // Summary of Work Performed
    autoTable(doc, {
        startY: finalY + 10,
        head: [['SUMMARY OF WORK PERFORMED']],
        body: [
            [`Reported Problem: ${reportData.summary?.reportedProblem || ''}`],
            [`Symptom Summary: ${reportData.summary?.symptomSummary || ''}`],
            [`Problem Summary: ${reportData.summary?.problemSummary || ''}`],
            [`Resolution Summary: ${reportData.summary?.resolutionSummary || ''}`],
            [`Verification of Activity: ${reportData.summary?.verificationOfActivity || ''}`],
        ],
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: 'bold' },
    });
    
    finalY = (doc as any).lastAutoTable.finalY;

    // System Validation Text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const validationText = "SYSTEM VALIDATION: For Medical Devices - Regulatory requirements call for a final validation of instrument repair and system readiness. The final validation of instrument repair and system readiness can only be obtained through a successful QC run using the laboratory's quality control system. This repair record and the laboratory's quality control records comprise the quality documents associated with this instrument repair. Copies of these records may be required by Beckman Coulter or regulatory authorities to complete technical investigations or quality audits. We appreciate your cooperation if requested to provide copies of your QC data related to this repair.";
    const splitText = doc.splitTextToSize(validationText, pageWidth - 80);
    doc.text(splitText, 40, finalY + 20);

    finalY = finalY + 20 + (splitText.length * 12); // Approximate height calculation
  
    // Labor Table
    autoTable(doc, {
      startY: finalY + 10,
      head: [['START DATE', 'END DATE', 'DESCRIPTION', 'HOURS', 'RATE', 'TOTAL LINE PRICE', 'CUSTOMER CHARGE']],
      body: (reportData.labor || []).map((item: any) => [
        item.startDate, item.endDate, item.description, item.hours, item.rate, item.total, item.customerCharge
      ]),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [230, 230, 230], textColor: 0 },
    });
    finalY = (doc as any).lastAutoTable.finalY;
  
    // Parts Table
    autoTable(doc, {
      startY: finalY + 10,
      head: [['PART NUMBER', 'PART DESCRIPTION', 'QTY', 'PRICE', 'TOTAL LINE PRICE', 'CUSTOMER CHARGE']],
      body: (reportData.parts || []).map((p: any) => [p.partNumber, p.description, p.quantity, p.price, '', '']),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [230, 230, 230], textColor: 0 },
    });
    finalY = (doc as any).lastAutoTable.finalY;

    // Footer
    doc.setFontSize(9);
    doc.text(`Customer Call Originator: ${reportData.customerCallOriginator || ''}`, 40, finalY + 30);
    doc.text(`Technician Name: ${reportData.technicianName || ''}`, 40, finalY + 45);
    doc.line(40, finalY + 65, 240, finalY + 65); // Signature line
    doc.text("Customer Signature", 40, finalY + 75);
    doc.line(300, finalY + 65, 500, finalY + 65); // Signature line
    doc.text("Technician Signature", 300, finalY + 75);

    doc.save(`ServiceReport-ESR-${workOrder.id}.pdf`);
    toast({
        title: "Download Ready",
        description: "Your PDF report has been downloaded.",
    });
  };

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
        const partsData = allocatedParts
            .filter(p => p.status === 'Used')
            .map(p => ({
                partNumber: p.partNumber,
                description: p.name,
                quantity: p.quantity,
                price: 0, // Placeholder
            }));
        
        const result = await generateServiceReport({
            ...(questionnaireData as Omit<ServiceReportQuestionnaire, 'partsUsed'>),
            partsUsed: partsData,
            workOrderId: currentWorkOrder.id,
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

  const ServiceReport = () => {
      let jsonReport: any;
      let isJson = true;

      try {
        if (workOrder.technicianNotes) {
            jsonReport = JSON.parse(workOrder.technicianNotes);
        } else {
            jsonReport = {};
        }
      } catch (e) {
          isJson = false;
          console.warn("Could not parse technician notes as JSON. Falling back to plain text display.");
      }

      const reportContent = isJson ? (
         <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-primary">Engineering Service Report</h2>
                    <p className="text-muted-foreground">Report ID: ESR-{jsonReport.workOrder?.number}</p>
                    <p className="text-muted-foreground">Date: {jsonReport.workOrder?.completionDate}</p>
                </div>
                <div className="text-right">
                    <h3 className="font-semibold text-lg">{jsonReport.account?.name}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{jsonReport.account?.address}</p>
                </div>
            </div>

             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                    <h4 className="font-semibold">Client Information</h4>
                    <p className="font-medium">{jsonReport.customer?.contact}</p>
                    <p className="text-sm text-muted-foreground">{jsonReport.customer?.purchaseOrder}</p>
                </div>
                <div className="space-y-1">
                    <h4 className="font-semibold">Asset Serviced</h4>
                    <p className="font-medium">{jsonReport.asset?.model}</p>
                    <p className="text-sm text-muted-foreground">S/N: {jsonReport.asset?.serialNumber}</p>
                </div>
            </div>
            
             <Separator />

            <div className="space-y-4">
                 <div>
                    <h4 className="font-semibold mb-1">Reported Problem</h4>
                    <p className="text-sm text-muted-foreground">{jsonReport.summary?.reportedProblem}</p>
                </div>
                 <div>
                    <h4 className="font-semibold mb-1">Resolution Summary</h4>
                    <p className="text-sm text-muted-foreground">{jsonReport.summary?.resolutionSummary}</p>
                </div>
            </div>

            <Separator />
            
            <div>
                <h4 className="font-semibold mb-2">Parts Consumed</h4>
                {jsonReport.parts && jsonReport.parts.length > 0 ? (
                     <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                            <TableRow>
                                <TableHead>Part Number</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {jsonReport.parts.map((part: any, index: number) => (
                                <TableRow key={index}>
                                    <TableCell>{part.partNumber}</TableCell>
                                    <TableCell>{part.description}</TableCell>
                                    <TableCell className="text-right">{part.quantity}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No parts were consumed for this service.</p>
                )}
            </div>

             <Separator />
            
            <div className="flex justify-between items-end">
                <div>
                     <h4 className="font-semibold mb-2">Technician</h4>
                     <p className="text-sm">{jsonReport.technicianName}</p>
                </div>
                 <div className="text-right">
                    <div className="border-b-2 border-dotted w-48 mb-1"></div>
                    <p className="text-xs text-muted-foreground">Customer Signature ({jsonReport.signingPerson})</p>
                </div>
            </div>
         </div>
      ) : (
        <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: marked.parse(workOrder.technicianNotes || 'No report content.') as string }} />
        </div>
      );

      return (
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
          <CardContent>
            <ReportBody ref={reportRef}>
                {reportContent}
            </ReportBody>
          </CardContent>
        </Card>
      );
  };

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
                           <Label>Time Work Started</Label>
                           <DateTimePicker value={questionnaireData.timeWorkStarted} onChange={date => setQuestionnaireData({...questionnaireData, timeWorkStarted: date})} />
                        </div>
                        <div className="space-y-2">
                           <Label>Time Work Completed</Label>
                           <DateTimePicker value={questionnaireData.timeWorkCompleted} onChange={date => setQuestionnaireData({...questionnaireData, timeWorkCompleted: date})} />
                        </div>
                   </div>
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setQuestionnaireOpen(false)}>Cancel</Button>
                  <Button onClick={handleQuestionnaireSubmit}>Generate Report</Button>
              </DialogFooter>
          </DialogContent>
    
      <div className="grid gap-4 xl:grid-cols-2">
      
        {isGeneratingReport && (
            <Card className="lg:col-span-2">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <LoaderCircle className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="font-medium">Generating Service Report...</p>
                    <p className="text-sm text-muted-foreground">The AI is structuring your report data.</p>
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
