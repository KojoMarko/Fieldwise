
'use client';

import { useState, useRef, forwardRef, useEffect } from 'react';
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
  CalendarIcon,
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
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


const DateTimePicker = ({ value, onChange }: { value?: Date; onChange: (date?: Date) => void }) => {
    const [date, setDate] = useState<Date | undefined>(value);

    useEffect(() => {
        setDate(value);
    }, [value]);
    
    const handleDateSelect = (day: Date | undefined) => {
        if (!day) {
            setDate(undefined);
            onChange(undefined);
            return;
        }

        const newDate = new Date(day);
        if (date) {
            newDate.setHours(date.getHours());
            newDate.setMinutes(date.getMinutes());
        }

        setDate(newDate);
        onChange(newDate);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value;
        if (!time) return;

        const [hours, minutes] = time.split(':').map(Number);
        
        const newDate = date ? new Date(date) : new Date(); // default to today if no date is set
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
  allocatedParts: AllocatedPart[],
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


  const handleDownloadPdf = async () => {
    toast({
        title: "Generating PDF...",
        description: "Please wait while your report is being created.",
    });

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let finalY = margin + 20;

    // --- Safely get data and format dates ---
    const safe = (val: any, fallback = 'N/A') => val || fallback;
    const formatDate = (date: any, includeTime = false) => {
        try {
            if (!date) return 'N/A';
            const d = date instanceof Date ? date : parseISO(date);
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
                    reject(e);
                }
            });
            finalY += 15;
        } catch (e) { console.error("Error adding company logo to PDF:", e)}
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Alos Paraklet Healthcare Limited", margin, finalY + 12);
    doc.text("GW-0988-6564, JMP8+P3F FH948", margin, finalY + 24);
    doc.text("OXYGEN STREET, Oduman", margin, finalY + 36);


    const titleText = "Engineering Service Report";
    const reportIdText = `Report ID: ESR-5nhWCAdO`;
    const dateText = `Date: October 15th, 2025`;

    const titleWidth = doc.getTextWidth(titleText);
    const rightAlignX = pageWidth - margin;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(titleText, rightAlignX, finalY, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(reportIdText, rightAlignX, finalY + 15, { align: 'right' });
    doc.text(dateText, rightAlignX, finalY + 30, { align: 'right' });
    
    finalY += 60;
    
    // --- CUSTOMER & EQUIPMENT INFORMATION ---
    (doc as any).autoTable({
        startY: finalY,
        body: [
            [
                { content: 'Customer Name', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
                { content: 'Contact', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
                { content: 'Phone', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
                { content: 'Address', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
            ],
            [
                safe(customer?.name),
                safe(customer?.contactPerson),
                safe(customer?.phone),
                safe(customer?.address),
            ],
             [
                { content: 'Equipment', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
                { content: 'Model', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
                { content: 'Serial Number', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
                { content: 'Location', styles: { fontStyle: 'bold', fillColor: [220, 220, 220], textColor: [0, 0, 0] } },
            ],
            [
                safe(asset?.name),
                safe(asset?.model),
                safe(asset?.serialNumber),
                safe(asset?.location),
            ]
        ],
        theme: 'grid',
        styles: {
            lineColor: [0, 0, 0],
            lineWidth: 0.5,
        }
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;
    
    const addSection = (title: string, data: [string, string][]) => {
        (doc as any).autoTable({
            startY: finalY,
            head: [[{ content: title, colSpan: 2, styles: { halign: 'left' } }]],
            body: data,
            theme: 'grid',
            styles: { lineColor: [0, 0, 0], lineWidth: 0.5, cellPadding: 5 },
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', cellPadding: 5 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 150 },
                1: { cellWidth: 'auto' },
            }
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
    };


    // --- MALFUNCTION / SERVICE REQUEST INFORMATION ---
    addSection('MALFUNCTION / SERVICE REQUEST INFORMATION', [
        ['Reported Problem:', safe(questionnaireData.reportedProblem)],
        ['Symptom Summary:', safe(questionnaireData.symptomSummary)],
        ['Problem Summary / Root Cause:', safe(questionnaireData.problemSummary)]
    ]);
    
    // --- ENGINEER'S REPORT ---
    addSection('ENGINEER\'S REPORT (CORRECTIVE ACTION TAKEN)', [
        ['Resolution Summary:', safe(questionnaireData.resolutionSummary)],
        ['Verification of Activity:', safe(questionnaireData.verificationOfActivity)],
        ['Final Instrument Condition:', safe(questionnaireData.instrumentCondition)]
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
                { content: `Customer Name: ${safe(questionnaireData.signingPerson)}`, styles: { valign: 'bottom', minCellHeight: 80 } },
                { content: `Engineer Name: ${safe(technician?.name)}`, styles: { valign: 'bottom' } }
            ]
        ],
        theme: 'grid',
        styles: {
            lineColor: [0, 0, 0],
            lineWidth: 0.5,
        },
        columnStyles: {
            0: { cellWidth: (pageWidth - margin * 2) / 2 },
            1: { cellWidth: (pageWidth - margin * 2) / 2 },
        }
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.save(`ServiceReport-INV-${workOrder.id.substring(0, 8)}.pdf`);
    toast({
        title: "Download Ready",
        description: "Your PDF invoice has been downloaded.",
    });
  };

  useEffect(() => {
    if (workOrder.status === 'Completed' && user?.role === 'Engineer' && !workOrder.technicianNotes) {
      setQuestionnaireOpen(true);
    }
  }, [workOrder, user]);


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

  const isEngineerView = user?.role === 'Engineer';
  
  const ServiceReport = () => {
    if (!workOrder.technicianNotes) return null;

    let reportData;
    try {
        reportData = JSON.parse(workOrder.technicianNotes);
    } catch (e) {
        // If it's not JSON, it might be the old plain text format.
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Engineer's Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">{workOrder.technicianNotes}</div>
                </CardContent>
            </Card>
        )
    }
    
    const Section = ({ title, data }: { title: string, data: Record<string, string>}) => (
        <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary mb-2 border-b pb-1">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                {Object.entries(data).map(([key, value]) => (
                    <div key={key}>
                        <p className="font-medium text-muted-foreground">{key}</p>
                        <p>{value}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Service Report</CardTitle>
                    <CardDescription>
                        Generated on {workOrder.completedDate ? format(parseISO(workOrder.completedDate), 'PPP p') : 'N/A'} by {reportData.workOrder.performedBy}
                    </CardDescription>
                </div>
                <Button onClick={handleDownloadPdf}><Download className="mr-2" /> Download PDF</Button>
            </CardHeader>
            <CardContent>
                <Section title="Service Details" data={{
                    'Reported Problem': reportData.summary.reportedProblem,
                    'Symptom Summary': reportData.summary.symptomSummary,
                    'Problem Summary': reportData.summary.problemSummary,
                    'Resolution Summary': reportData.summary.resolutionSummary,
                    'Verification of Activity': reportData.summary.verificationOfActivity,
                    'Final Instrument Condition': reportData.workOrder.instrumentCondition,
                }}/>
                <Section title="Labor Information" data={{
                    'Service Start': reportData.labor[0].startDate ? format(parseISO(reportData.labor[0].startDate), 'PPP p') : 'N/A',
                    'Service End': reportData.labor[0].endDate ? format(parseISO(reportData.labor[0].endDate), 'PPP p') : 'N/A',
                    'Labor Hours': reportData.labor[0].hours,
                    'Agreement Type': reportData.agreement.type,
                }} />

                <h3 className="text-lg font-semibold text-primary mt-6 mb-2 border-b pb-1">Parts Used</h3>
                {reportData.parts.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-sm">
                        {reportData.parts.map((part: any, index: number) => (
                            <li key={index}>{part.description} (PN: {part.partNumber})</li>
                        ))}
                    </ul>
                ) : <p className="text-sm text-muted-foreground">No parts were used for this service.</p>}

            </CardContent>
        </Card>
    );
  }

  const EngineerActions = () => {
    return <h1>Placeholder</h1>
  }

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
      
        {isGeneratingReport ? (
            <Card className="lg:col-span-2">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <LoaderCircle className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="font-medium">Generating Service Report...</p>
                    <p className="text-sm text-muted-foreground">The AI is structuring your report data.</p>
                </CardContent>
            </Card>
        ) : (
             <>
                 {isEngineerView && <EngineerActions />}
                 {(workOrder.status === 'Completed' || workOrder.status === 'Invoiced') && workOrder.technicianNotes ? (
                    <div className="xl:col-span-2"><ServiceReport /></div>
                ) : (
                    <div className={isEngineerView ? 'xl:col-span-1' : 'xl:col-span-2'}>
                        <Card>
                            <CardHeader><CardTitle>Engineer's Report</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center text-sm text-muted-foreground border p-3 rounded-md">
                                    A service report will be available once the engineer completes the work.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </>
        )}
      </div>
    </>
  );
}

    