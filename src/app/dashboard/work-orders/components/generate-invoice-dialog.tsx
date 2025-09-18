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
import type { WorkOrder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { customers, assets } from '@/lib/data';
import { Separator } from '@/components/ui/separator';

interface GenerateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder;
}

export function GenerateInvoiceDialog({
  open,
  onOpenChange,
  workOrder,
}: GenerateInvoiceDialogProps) {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);

  const customer = customers.find((c) => c.id === workOrder.customerId);
  const asset = assets.find((a) => a.id === workOrder.assetId);

  // Reset state when dialog is closed
  useEffect(() => {
    if (!open) {
      setShowPreview(false);
    }
  }, [open]);

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
            <div className="p-6 border rounded-lg bg-background">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-primary">INVOICE</h2>
                  <p className="text-muted-foreground">
                    Invoice #: INV-{workOrder.id.replace('WO-', '')}
                  </p>
                  <p className="text-muted-foreground">Date: {today}</p>
                </div>
                <div className="text-right">
                  <h3 className="font-semibold text-lg">FieldWise</h3>
                  <p className="text-sm text-muted-foreground">
                    123 Service Lane
                    <br />
                    Anytown, USA 12345
                  </p>
                </div>
              </div>

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

              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-semibold">
                        Description
                      </th>
                      <th className="text-right py-2 font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">
                        <p className="font-medium">
                          Service for: {asset?.name} (
                          {asset?.serialNumber})
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {workOrder.title}
                        </p>
                      </td>
                      <td className="text-right py-2">$450.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">
                        <p className="font-medium">Replacement Parts</p>
                        <p className="text-muted-foreground text-xs">
                          Filter Kit, Lubricant
                        </p>
                      </td>
                      <td className="text-right py-2">$75.50</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="text-right py-2 font-semibold">Total</td>
                      <td className="text-right py-2 font-bold text-lg">
                        $525.50
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {showPreview ? (
            <Button onClick={handleSendInvoice}>Send Invoice to Customer</Button>
          ) : (
            <Button onClick={() => setShowPreview(true)}>Preview Invoice</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
