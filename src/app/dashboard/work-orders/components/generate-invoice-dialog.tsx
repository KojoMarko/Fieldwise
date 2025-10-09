
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { WorkOrder, Company, Customer, Asset } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useRef } from 'react';
import { Separator } from '@/components/ui/separator';
import { Download } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';

interface GenerateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder;
  company: Company;
}

export function GenerateInvoiceDialog({
  open,
  onOpenChange,
  workOrder,
  company,
}: GenerateInvoiceDialogProps) {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [asset, setAsset] = useState<Asset | null>(null);

  useEffect(() => {
    if (open) {
      const fetchDetails = async () => {
        if (workOrder.customerId) {
          const customerSnap = await getDoc(doc(db, "customers", workOrder.customerId));
          if(customerSnap.exists()) setCustomer(customerSnap.data() as Customer);
        }
        if (workOrder.assetId) {
          const assetSnap = await getDoc(doc(db, "assets", workOrder.assetId));
          if(assetSnap.exists()) setAsset(assetSnap.data() as Asset);
        }
      }
      fetchDetails();
    }
  }, [open, workOrder]);

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      setShowPreview(false);
    }
  }, [open]);

  const handleDownloadPdf = async () => {
    toast({
        title: 'Generating PDF...',
        description: 'Please wait while the invoice is being prepared.',
    });

    try {
        const { default: jsPDF } = await import('jspdf');
        const { default: html2canvas } = await import('html2canvas');

        if (!invoiceRef.current) {
            throw new Error("Invoice content is not available.");
        }

        const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`Invoice-INV-${workOrder.id.replace('WO-', '')}.pdf`);

        toast({
            title: 'Download Ready',
            description: 'Your PDF invoice has been downloaded.',
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


  const handleSendInvoice = () => {
    console.log(`Generating invoice for ${workOrder.id}`);
    toast({
      title: 'Invoice Sent',
      description: `An invoice for work order ${workOrder.id} has been sent to ${customer?.name}.`,
    });
    onOpenChange(false);
  };

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Example of splitting the name. In a real app, this might come from two fields.
  const companyNameParts = company.name.split(' ');
  const firstLine = companyNameParts.slice(0, 2).join(' ');
  const secondLine = companyNameParts.slice(2).join(' ');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {showPreview ? 'Invoice Preview' : 'Generate Invoice'}
          </DialogTitle>
          <DialogDescription>
            {showPreview
              ? `Review the invoice for work order ${workOrder.id} below.`
              : `This will generate an invoice for work order ${workOrder.id}.`}
          </DialogDescription>
        </DialogHeader>

        {showPreview ? (
          <div className="max-h-[60vh] overflow-y-auto p-1">
            <div ref={invoiceRef} className="p-6 border rounded-lg bg-background text-foreground">
                <table className="w-full mb-6">
                    <tbody>
                        <tr>
                            <td className="w-1/2 align-top">
                                <h2 className="text-2xl font-bold text-primary">INVOICE</h2>
                                <p className="text-muted-foreground">
                                    Invoice #: INV-{workOrder.id.replace('WO-', '')}
                                </p>
                                <p className="text-muted-foreground">Date: {today}</p>
                            </td>
                            <td className="w-1/2 align-top text-right">
                                <div className="flex justify-end items-center gap-2 mb-2">
                                  {company.logoUrl && (
                                    <Image src={company.logoUrl} alt={company.name} width={40} height={40} className="object-contain" />
                                  )}
                                  <div className="text-left">
                                      <h3 className="font-semibold text-base">{firstLine}</h3>
                                      <h3 className="font-semibold text-base">{secondLine}</h3>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground whitespace-pre-line text-right">
                                    {company.address}
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </table>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-1">Bill To:</h4>
                <p className="font-medium">{customer?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {customer?.address}
                </p>
                <p className="text-sm text-muted-foreground">
                  {customer?.contactEmail}
                </p>
              </div>

              <Separator className="my-4" />

              <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-semibold">
                        Description
                      </th>
                      <th className="text-right py-2 font-semibold w-[100px]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 align-top">
                        <p className="font-medium">
                          Service for: {asset?.name} ({asset?.serialNumber})
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {workOrder.title}
                        </p>
                      </td>
                      <td className="text-right py-2 align-top">$450.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 align-top">
                        <p className="font-medium">Replacement Parts</p>
                        <p className="text-muted-foreground text-xs">
                          Filter Kit, Lubricant
                        </p>
                      </td>
                      <td className="text-right py-2 align-top">$75.50</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="text-right py-4 font-semibold">Total</td>
                      <td className="text-right py-4 font-bold text-lg">
                        $525.50
                      </td>
                    </tr>
                  </tfoot>
                </table>

              <p className="text-xs text-muted-foreground mt-6">
                Thank you for your business! Please pay within 30 days.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You can preview the invoice before sending it to the customer.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {showPreview ? (
            <>
              <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={handleSendInvoice}>Send Invoice to Customer</Button>
            </>
          ) : (
            <Button onClick={() => setShowPreview(true)}>Preview Invoice</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
