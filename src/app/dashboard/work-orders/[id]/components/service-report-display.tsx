
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Download,
} from 'lucide-react';
import type { ServiceReportQuestionnaire, AllocatedPart } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import type { WorkOrder, Customer, User, Asset, Company } from '@/lib/types';
import { format, isValid, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


export function ServiceReportDisplay({
  workOrder,
  customer,
  technician,
  asset,
  company,
}: {
  workOrder: WorkOrder;
  customer?: Customer;
  technician?: User;
  asset?: Asset;
  company?: Company;
}) {
  const { toast } = useToast();

  const handleDownloadPdf = async () => {
    toast({
        title: "Generating PDF...",
        description: "Please wait while your report is being created.",
    });

    let reportData: any;
    if (workOrder.technicianNotes && workOrder.technicianNotes.startsWith('{')) {
        try {
            reportData = JSON.parse(workOrder.technicianNotes);
        } catch (e) {
             // Fallback for when JSON parsing fails
            reportData = {
                summary: {},
                workOrder: { type: workOrder.type },
                parts: [],
                labor: [{}],
                signingPerson: customer?.contactPerson,
                technicianName: technician?.name,
                agreement: {},
            };
        }
    } else {
         // Fallback for when technicianNotes is not a JSON string
         reportData = {
            summary: {},
            workOrder: { type: workOrder.type },
            parts: [],
            labor: [{}],
            signingPerson: customer?.contactPerson,
            technicianName: technician?.name,
            agreement: { type: 'N/A' },
        };
    }
    
    // Ensure workOrder.type is always used for the service type, overriding if necessary
    if (reportData.workOrder) {
      reportData.workOrder.type = workOrder.type;
    } else {
      reportData.workOrder = { type: workOrder.type };
    }

    const laborInfo = reportData?.labor?.[0] || {};

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    // Add these default settings
    (doc as any).autoTableSetDefaults({
        styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap',
        }
    });

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
    let logoY = finalY;
    if (company?.logoUrl) {
        try {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = company.logoUrl;
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    doc.addImage(img, 'PNG', margin, logoY, 40, 40);
                    resolve(null);
                };
                img.onerror = (e) => {
                    console.error("Could not load company logo for PDF.", e);
                    reject(e);
                }
            });
        } catch (e) { console.error("Error adding company logo to PDF:", e)}
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const defaultAddress = [
        'GW-0988-6564, JMP8+P3F FH948',
        'OXYGEN STREET, Oduman'
    ];
    const companyAddress = company?.address ? company.address.split('\n') : defaultAddress;
    
    doc.text(company?.name || "Alos Paraklet Healthcare Limited", margin + 50, logoY + 12);
    doc.text(companyAddress, margin + 50, logoY + 24);


    const titleText = "Engineering Service Report";
    const reportIdText = `Report ID: ESR-${workOrder.id.substring(0,8)}`;
    const dateText = `Date: ${format(new Date(), 'MMMM do, yyyy')}`;

    const titleWidth = doc.getTextWidth(titleText);
    const rightAlignX = pageWidth - margin;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(titleText, rightAlignX, logoY + 12, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(reportIdText, rightAlignX, logoY + 27, { align: 'right' });
    doc.text(dateText, rightAlignX, logoY + 42, { align: 'right' });
    
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
            cellWidth: 'wrap',
            overflow: 'linebreak',
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 'auto' },
            3: { cellWidth: 'auto' },
        }
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;
    
    const addSectionWithAutoWrap = (title: string, data: Record<string, string>) => {
        (doc as any).autoTable({
            startY: finalY,
            head: [[{ content: title, colSpan: 2 }]],
            body: Object.entries(data).map(([key, value]) => [key, value]),
            theme: 'grid',
            styles: { 
                lineColor: [0,0,0], 
                lineWidth: 0.5, 
                cellPadding: 5,
                overflow: 'linebreak',
                cellWidth: 'wrap',
            },
            headStyles: { 
                fillColor: [220, 220, 220], 
                textColor: [0, 0, 0], 
                fontStyle: 'bold', 
                halign: 'left' 
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 150 },
                1: { cellWidth: 'auto' },
            }
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
    };


    // --- MALFUNCTION / SERVICE REQUEST INFORMATION ---
    addSectionWithAutoWrap('MALFUNCTION / SERVICE REQUEST INFORMATION', {
        'Reported Problem:': safe(reportData.summary?.reportedProblem),
        'Symptom Summary:': safe(reportData.summary?.symptomSummary),
        'Problem Summary / Root Cause:': safe(reportData.summary?.problemSummary)
    });
    
    // --- ENGINEER'S REPORT ---
    addSectionWithAutoWrap('ENGINEER\'S REPORT (CORRECTIVE ACTION TAKEN)', {
        'Resolution Summary:': safe(reportData.summary?.resolutionSummary),
        'Verification of Activity:': safe(reportData.summary?.verificationOfActivity),
        'Final Instrument Condition:': safe(reportData.workOrder?.instrumentCondition || reportData.summary?.instrumentCondition)
    });

    // --- LABOR ---
    (doc as any).autoTable({
        startY: finalY,
        head: [['LABOR']],
        theme: 'grid',
        styles: { lineColor: [0,0,0], lineWidth: 0.5 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'left' }
    });
    (doc as any).autoTable({
        startY: (doc as any).lastAutoTable.finalY,
        head: [['Service Start Date', 'Service End Date', 'Service Type', 'Total Hours']],
        body: [[
            formatDate(laborInfo.startDate, true),
            formatDate(laborInfo.endDate, true),
            safe(reportData.workOrder?.type),
            `${safe(laborInfo.hours, 0)}`
        ]],
        theme: 'grid',
        styles: { lineColor: [0,0,0], lineWidth: 0.5 },
        headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0] }
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // --- SPARE PARTS ---
    const partsData = reportData.parts || [];
    const partsBody = partsData.map((p: any) => [p.partNumber, p.description, p.quantity]);
    (doc as any).autoTable({
        startY: finalY,
        head: [[{ content: 'SPARE PARTS / MATERIALS USED', colSpan: 3 }]],
        theme: 'grid',
        styles: { lineColor: [0,0,0], lineWidth: 0.5 },
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'left' }
    });
    if (partsBody.length > 0) {
        (doc as any).autoTable({
            startY: (doc as any).lastAutoTable.finalY,
            head: [['Part Number', 'Description', 'Quantity']],
            body: partsBody,
            theme: 'grid',
            styles: { lineColor: [0,0,0], lineWidth: 0.5 },
            headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0] }
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
                { content: `Customer Name: ${safe(reportData.summary?.signingPerson || reportData.signingPerson)}`, styles: { valign: 'bottom', minCellHeight: 80 } },
                { content: `Engineer Name: ${safe(reportData.workOrder?.performedBy || reportData.technicianName)}`, styles: { valign: 'bottom' } }
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

  const Section = ({ title, data }: { title: string, data: Record<string, string>}) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-primary mb-2 border-b pb-1">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            {Object.entries(data).map(([key, value]) => (
                <div key={key}>
                    <p className="font-medium text-muted-foreground">{key}</p>
                    <p>{value || 'N/A'}</p>
                </div>
            ))}
        </div>
    </div>
  );

  let reportData;
  try {
      reportData = JSON.parse(workOrder.technicianNotes || '{}');
  } catch (e) {
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <CardTitle>Service Report</CardTitle>
              <CardDescription>
                  Generated on {workOrder.completedDate ? format(parseISO(workOrder.completedDate), 'PPP p') : 'N/A'} by {reportData.workOrder?.performedBy || 'N/A'}
              </CardDescription>
          </div>
          <Button onClick={handleDownloadPdf}><Download className="mr-2" /> Download PDF</Button>
      </CardHeader>
      <CardContent>
          <Section title="Service Details" data={{
              'Reported Problem': reportData.summary?.reportedProblem,
              'Symptom Summary': reportData.summary?.symptomSummary,
              'Problem Summary': reportData.summary?.problemSummary,
              'Resolution Summary': reportData.summary?.resolutionSummary,
              'Verification of Activity': reportData.summary?.verificationOfActivity,
              'Final Instrument Condition': reportData.workOrder?.instrumentCondition,
          }}/>
          <Section title="Labor Information" data={{
              'Service Start': reportData.labor?.[0]?.startDate ? format(parseISO(reportData.labor[0].startDate), 'PPP p') : 'N/A',
              'Service End': reportData.labor?.[0]?.endDate ? format(parseISO(reportData.labor[0].endDate), 'PPP p') : 'N/A',
              'Labor Hours': reportData.labor?.[0]?.hours,
              'Agreement Type': reportData.agreement?.type,
          }} />

          <h3 className="text-lg font-semibold text-primary mt-6 mb-2 border-b pb-1">Parts Used</h3>
          {reportData.parts && reportData.parts.length > 0 ? (
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

    