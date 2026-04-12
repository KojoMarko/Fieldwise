
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Download,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { WorkOrder, Customer, User, Asset, Company } from '@/lib/types';
import { format, isValid, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';


export function InstallationReportDisplay({
  workOrder,
  customer,
  technician,
  asset,
  company,
  onRegenerate,
}: {
  workOrder: WorkOrder;
  customer?: Customer;
  technician?: User;
  asset?: Asset;
  company?: Company;
  onRegenerate: () => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();

  const handleDownloadPdf = async () => {
    toast({
        title: "Generating PDF...",
        description: "Please wait while your installation report is being created.",
    });

    let reportData: any;
    try {
        reportData = JSON.parse(workOrder.technicianNotes || '{}');
    } catch (e) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not parse report data.' });
        return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    (doc as any).autoTableSetDefaults({
        styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap',
        }
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let finalY = margin + 20;

    const safe = (val: any, fallback = 'N/A') => val || fallback;

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
                img.onerror = (e) => reject(e);
            });
        } catch (e) { console.error("Error adding company logo to PDF:", e)}
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const defaultAddress = ['GW-0988-6564, JMP8+P3F FH948', 'OXYGEN STREET, Oduman'];
    const companyAddress = company?.address ? company.address.split('\n') : defaultAddress;
    
    doc.text(company?.name || "Alos Paraklet Healthcare Limited", margin + 50, logoY + 12);
    doc.text(companyAddress, margin + 50, logoY + 24);

    const titleText = "Equipment Installation Report";
    const reportIdText = `Report ID: INR-${workOrder.id.substring(0,8)}`;
    const dateText = `Date: ${format(new Date(), 'MMMM do, yyyy')}`;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(titleText, pageWidth - margin, logoY + 12, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(reportIdText, pageWidth - margin, logoY + 27, { align: 'right' });
    doc.text(dateText, pageWidth - margin, logoY + 42, { align: 'right' });
    
    finalY += 60;
    
    // --- CUSTOMER & EQUIPMENT INFORMATION ---
    (doc as any).autoTable({
        startY: finalY,
        body: [
            [
                { content: 'Customer Name', styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
                { content: 'Equipment', styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
                { content: 'Model', styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
                { content: 'Serial Number', styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } },
            ],
            [
                safe(customer?.name),
                safe(asset?.name),
                safe(asset?.model),
                safe(asset?.serialNumber),
            ]
        ],
        theme: 'grid'
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;
    
    // --- PRE-INSTALLATION CHECKS ---
    const preInstallChecks = reportData.summary?.preInstallationChecks || [];
    (doc as any).autoTable({
        startY: finalY,
        head: [[{ content: 'Pre-Installation Checks', colSpan: 4 }]],
        theme: 'grid',
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    if (preInstallChecks.length > 0) {
        (doc as any).autoTable({
            startY: (doc as any).lastAutoTable.finalY,
            head: [['Item', 'Requirements', 'Actual Conditions', 'Status']],
            body: preInstallChecks.map((check: any) => [check.item, check.requirements, check.actual, check.status]),
            theme: 'grid',
            headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0] }
        });
    } else {
        (doc as any).autoTable({
            startY: (doc as any).lastAutoTable.finalY,
            body: [['No pre-installation checks were recorded.']],
            theme: 'grid'
        });
    }
    finalY = (doc as any).lastAutoTable.finalY + 10;
    
    
    const addSectionWithAutoWrap = (title: string, content: string) => {
        const maxWidth = pageWidth - (margin * 2);
        (doc as any).autoTable({
            startY: finalY,
            head: [[title]],
            body: [[content]],
            theme: 'grid',
            headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
            tableWidth: maxWidth,
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
    };
    
    // --- Other Installation Sections ---
    addSectionWithAutoWrap('System Configuration', safe(reportData.summary?.systemConfiguration));

    // --- Testing & Validation ---
    const validationChecks = reportData.summary?.testingAndValidation || [];
    (doc as any).autoTable({
        startY: finalY,
        head: [[{ content: 'Testing & Validation', colSpan: 2 }]],
        theme: 'grid',
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    if (validationChecks.length > 0) {
        (doc as any).autoTable({
            startY: (doc as any).lastAutoTable.finalY,
            head: [['Item', 'Status']],
            body: validationChecks.map((check: any) => [check.item, check.status]),
            theme: 'grid',
            headStyles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: [0, 0, 0] }
        });
    } else {
        (doc as any).autoTable({
            startY: (doc as any).lastAutoTable.finalY,
            body: [['No testing & validation checks were recorded.']],
            theme: 'grid'
        });
    }
    finalY = (doc as any).lastAutoTable.finalY + 10;


    addSectionWithAutoWrap('Customer Training', safe(reportData.summary?.customerTraining));
    addSectionWithAutoWrap('Final Handover Notes', safe(reportData.summary?.finalHandoverNotes));

    // --- Signatures ---
    (doc as any).autoTable({
        startY: finalY,
        body: [
             [
                { content: `Customer Sign-off: ${safe(reportData.signingPerson)}`, styles: { valign: 'bottom', minCellHeight: 80 } },
                { content: `Engineer Signature: ${safe(reportData.workOrder?.performedBy)}`, styles: { valign: 'bottom' } }
            ]
        ],
        theme: 'grid',
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.save(`InstallationReport-INR-${workOrder.id.substring(0, 8)}.pdf`);
    toast({
        title: "Download Ready",
        description: "Your PDF installation report has been downloaded.",
    });
  };

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="mb-6">
        <h3 className="text-lg font-semibold text-primary mb-2 border-b pb-1">{title}</h3>
        {children}
    </div>
  );

  let reportData;
  try {
      reportData = JSON.parse(workOrder.technicianNotes || '{}');
  } catch (e) {
      // Fallback if notes are not JSON
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
  
  const isEngineerView = user?.role === 'Engineer';

  const statusColors: Record<string, string> = {
    Passed: 'bg-green-100 text-green-800',
    Failed: 'bg-red-100 text-red-800',
    'N/A': 'bg-gray-100 text-gray-800',
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
              <CardTitle>Installation Report</CardTitle>
              <CardDescription>
                  Generated on {workOrder.completedDate ? format(parseISO(workOrder.completedDate), 'PPP p') : 'N/A'} by {reportData.workOrder?.performedBy || 'N/A'}
              </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleDownloadPdf}><Download className="mr-2" /> PDF</Button>
            {isEngineerView && <Button onClick={onRegenerate}><RefreshCw className="mr-2" /> Regenerate</Button>}
          </div>
      </CardHeader>
      <CardContent>
          <Section title="Pre-Installation Checks">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Requirements</TableHead>
                  <TableHead>Actual Conditions</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reportData.summary?.preInstallationChecks || []).map((check: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{check.item}</TableCell>
                    <TableCell>{check.requirements}</TableCell>
                    <TableCell>{check.actual}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[check.status]}>{check.status}</Badge></TableCell>
                  </TableRow>
                ))}
                 {(reportData.summary?.preInstallationChecks?.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center h-24">No checks recorded.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </Section>
          <Section title="System Configuration"><p className="text-sm text-muted-foreground whitespace-pre-wrap">{reportData.summary?.systemConfiguration || 'N/A'}</p></Section>
          <Section title="Testing & Validation">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(reportData.summary?.testingAndValidation || []).map((check: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{check.item}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColors[check.status]}>{check.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {(reportData.summary?.testingAndValidation?.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={2} className="text-center h-24">No checks recorded.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </Section>
          <Section title="Customer Training"><p className="text-sm text-muted-foreground whitespace-pre-wrap">{reportData.summary?.customerTraining || 'N/A'}</p></Section>
          <Section title="Final Handover Notes"><p className="text-sm text-muted-foreground whitespace-pre-wrap">{reportData.summary?.finalHandoverNotes || 'N/A'}</p></Section>
      </CardContent>
    </Card>
  );
}
