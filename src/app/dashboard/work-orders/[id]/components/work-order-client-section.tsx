

'use client';

import { useState, useRef, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  LoaderCircle,
  Check,
  Pause,
  Play,
  Download,
} from 'lucide-react';
import { generateServiceReport } from '@/ai/flows/generate-service-report';
import type { ServiceReportQuestionnaire, AllocatedPart } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import type { WorkOrder, Customer, User, Asset, Company } from '@/lib/types';
import { format, isValid, parseISO } from 'date-fns';
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
import { Calendar, CalendarIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { marked } from 'marked';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


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
      timeWorkStarted: workOrder.createdAt ? new Date(workOrder.createdAt) : new Date(),
      timeWorkCompleted: workOrder.completedDate ? new Date(workOrder.completedDate) : new Date(),
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);


  const handleDownloadPdf = async () => {
    toast({
        title: "Generating PDF...",
        description: "Please wait while your report is being created.",
    });

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let finalY = margin;

    // --- Safely get data and format dates ---
    const safe = (val: any, fallback = 'N/A') => val || fallback;
    const formatDate = (date: any, includeTime = false) => {
        try {
            if (!date) return 'N/A';
            const d = date instanceof Date ? date : new Date(date);
            if (!isValid(d)) return 'N/A';
            return includeTime ? format(d, 'MMM dd, yyyy, p') : format(d, 'MMM dd, yyyy');
        } catch (e) { return 'N/A' }
    };
    
    // --- Header ---
    if (company?.logoUrl) {
        try {
            const img = new Image();
            img.crossOrigin = 'Anonymous'; // Important for cross-origin images
            img.src = company.logoUrl;
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    doc.addImage(img, 'PNG', margin, finalY, 40, 40);
                    resolve(null);
                };
                img.onerror = (e) => {
                    console.error("Could not load company logo for PDF.", e);
                    reject(e); // Reject promise on error
                }
            });
        } catch (e) { console.error("Error adding company logo to PDF:", e)}
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(safe(company?.name), margin + 50, finalY + 15);
    doc.setFont('helvetica', 'normal');

    const addressLines = doc.splitTextToSize(safe(company?.address), 200);
    doc.text(addressLines, margin + 50, finalY + 28);
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("ENGINEER SERVICE REPORT", pageWidth - margin, finalY + 25, { align: 'right' });
    finalY += 70; // Increased space after header
    
    // --- CUSTOMER & EQUIPMENT INFORMATION ---
    (doc as any).autoTable({
        startY: finalY,
        body: [
            // Row 1: Customer Headers
            [
                { content: 'Customer Name', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
                { content: 'Contact', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
                { content: 'Phone', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
                { content: 'Address', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
            ],
            // Row 2: Customer Data
            [
                safe(customer?.name),
                safe(customer?.contactPerson),
                safe(customer?.phone),
                safe(customer?.address),
            ],
            // Row 3: Equipment Headers
             [
                { content: 'Equipment', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
                { content: 'Model', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
                { content: 'Serial Number', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
                { content: 'Location', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
            ],
            // Row 4: Equipment Data
            [
                safe(asset?.name),
                safe(asset?.model),
                safe(asset?.serialNumber),
                safe(asset?.location),
            ]
        ],
        theme: 'grid',
        styles: {
            lineColor: [0, 0, 0], // Black borders
            lineWidth: 0.5,
        }
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // --- Helper function for sections ---
    const addSection = (title: string, data: { label: string, value: string }[]) => {
        (doc as any).autoTable({
            startY: finalY,
            head: [[title]],
            body: data.map(item => [
                { content: item.label, styles: { fontStyle: 'bold' } },
                item.value
            ]),
            theme: 'grid',
            styles: { lineColor: [0,0,0], lineWidth: 0.5, cellPadding: 5 },
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', cellPadding: 5 },
            columnStyles: {
                0: { cellWidth: 150 }
            }
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
    };


    // --- MALFUNCTION / SERVICE REQUEST INFORMATION ---
    addSection('MALFUNCTION / SERVICE REQUEST INFORMATION', [
        { label: 'Reported Problem:', value: safe(questionnaireData.reportedProblem) },
        { label: 'Symptom Summary:', value: safe(questionnaireData.symptomSummary) },
        { label: 'Problem Summary / Root Cause:', value: safe(questionnaireData.problemSummary) }
    ]);
    
    // --- ENGINEER'S REPORT ---
    addSection('ENGINEER\'S REPORT (CORRECTIVE ACTION TAKEN)', [
        { label: 'Resolution Summary:', value: safe(questionnaireData.resolutionSummary) },
        { label: 'Verification of Activity:', value: safe(questionnaireData.verificationOfActivity) },
        { label: 'Final Instrument Condition:', value: safe(questionnaireData.instrumentCondition) }
    ]);

    // --- LABOR ---
    (doc as any).autoTable({
        startY: finalY,
        head: [['LABOR']],
        theme: 'grid',
        styles: { lineColor: [0,0,0], lineWidth: 0.5 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY,
        head: [['Service Start Date', 'Service End Date', 'Service Type', 'Total Hours']],
        body: [[
            formatDate(questionnaireData.timeWorkStarted, true),
            formatDate(questionnaireData.timeWorkCompleted, true),
            safe(workOrder.type),
            `${safe(questionnaireData.laborHours, 0)}`
        ]],
        theme: 'grid',
        styles: { lineColor: [0,0,0], lineWidth: 0.5 },
        headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0] }
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // --- SPARE PARTS ---
    const partsBody = allocatedParts.filter(p => p.status === 'Used').map(p => [p.partNumber, p.name, p.quantity]);
    (doc as any).autoTable({
        startY: finalY,
        head: [['SPARE PARTS / MATERIALS USED']],
        theme: 'grid',
        styles: { lineColor: [0,0,0], lineWidth: 0.5 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    if (partsBody.length > 0) {
        (doc as any).autoTable({
            startY: (doc as any).lastAutoTable.finalY,
            head: [['Part Number', 'Description', 'Quantity']],
            body: partsBody,
            theme: 'grid',
            styles: { lineColor: [0,0,0], lineWidth: 0.5 },
        });
    } else {
         (doc as any).autoTable({
            startY: (doc as any).lastAutoTable.finalY,
            body: [['No parts were used for this service.']],
            theme: 'grid',
            styles: { lineColor: [0,0,0], lineWidth: 0.5 },
        });
    }
    finalY = (doc as any).lastAutoTable.finalY + 10;

    // --- Signatures ---
    (doc as any).autoTable({
        startY: finalY,
        body: [
            [
                { 
                    content: [
                        { content: 'Customer Name: ', styles: { fontStyle: 'bold', textColor: [0, 0, 0] } },
                        { content: safe(questionnaireData.signingPerson), styles: { textColor: [100, 100, 100] } }
                    ],
                    styles: { valign: 'bottom', minCellHeight: 80 }
                },
                { 
                    content: [
                        { content: 'Engineer Name: ', styles: { fontStyle: 'bold', textColor: [0, 0, 0] } },
                        { content: safe(technician?.name), styles: { textColor: [100, 100, 100] } }
                    ],
                    styles: { valign: 'bottom' }
                }
            ]
        ],
        theme: 'grid',
        styles: {
            lineColor: [0, 0, 0],
            lineWidth: 0.5,
        },
        columnStyles: {
            0: { cellWidth: '50%' },
            1: { cellWidth: '50%' },
        }
    });

    finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.save(`ServiceReport-INV-${workOrder.id.substring(0, 8)}.pdf`);
    toast({
        title: "Download Ready",
        description: "Your PDF invoice has been downloaded.",
    });
  };

  useState(() => {
    if (workOrder.status === 'Completed' && user?.role === 'Engineer' && !workOrder.technicianNotes) {
      setQuestionnaireOpen(true);
    }
  });


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
            isJson = false;
        }
      } catch (e) {
          isJson = false;
      }

      const reportContent = isJson && jsonReport ? (
         <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-primary">Engineering Service Report</h2>
                    <p className="text-muted-foreground">Report ID: ESR-{jsonReport.workOrder?.number?.substring(0,8)}</p>
                    <p className="text-muted-foreground">Date: {format(new Date(jsonReport.workOrder?.completionDate), 'PPP')}</p>
                </div>
                <div className="text-right">
                    <h3 className="font-semibold text-lg">{jsonReport.account?.name}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{jsonReport.account?.address}</p>
                </div>
            </div>

             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                    <h4 className="font-semibold">Client Information</h4>
                    <p className="font-medium">{customer?.name}</p>
                    <p className="text-sm text-muted-foreground">{customer?.address}</p>
                </div>
                <div className="space-y-1">
                    <h4 className="font-semibold">Asset Serviced</h4>
                    <p className="font-medium">{asset?.name}</p>
                    <p className="text-sm text-muted-foreground">S/N: {asset?.serialNumber}</p>
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
                {allocatedParts && allocatedParts.filter(p=>p.status === 'Used').length > 0 ? (
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
                            {allocatedParts.filter(p=>p.status === 'Used').map((part: any, index: number) => (
                                <TableRow key={index}>
                                    <TableCell>{part.partNumber}</TableCell>
                                    <TableCell>{part.name}</TableCell>
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

  const DateTimePicker = ({ value, onChange }: { value: any, onChange: (date: Date) => void }) => {
    const dateValue = value ? new Date(value) : null;
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                variant={'outline'}
                className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateValue && 'text-muted-foreground'
                )}
                >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, 'PPP p') : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={dateValue || undefined}
                    onSelect={(day) => {
                        const newDate = new Date(day || '');
                        const oldTime = dateValue || new Date();
                        newDate.setHours(oldTime.getHours(), oldTime.getMinutes());
                        onChange(newDate);
                    }}
                />
                <div className="p-3 border-t border-border">
                    <Input
                        type="time"
                        value={dateValue ? format(dateValue, 'HH:mm') : ''}
                        onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(':').map(Number);
                            const newDateWithTime = dateValue || new Date();
                            newDateWithTime.setHours(hours, minutes);
                            onChange(newDateWithTime);
                        }}
                    />
                </div>
            </PopoverContent>
        </Popover>
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







    

    









    

    

