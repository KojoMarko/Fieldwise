
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { ServiceCallLog } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface ViewCallLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: ServiceCallLog;
}

const DetailRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="grid grid-cols-3 gap-2 py-2">
        <span className="text-sm font-medium text-muted-foreground col-span-1">{label}</span>
        <div className="text-sm col-span-2">{value}</div>
    </div>
);

export function ViewCallLogDialog({ open, onOpenChange, log }: ViewCallLogDialogProps) {

  const priorityStyles = {
    High: 'bg-red-100 text-red-800 border-red-200',
    Medium: 'bg-yellow-100 text-yellow-800',
    Low: 'bg-gray-200 text-gray-800',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Service Call Details</DialogTitle>
          <DialogDescription>
            Call logged on {format(parseISO(log.reportingTime), 'PPP p')}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
            <DetailRow label="Customer" value={log.customerName} />
            <Separator />
            <DetailRow label="Asset" value={log.assetName} />
            <Separator />
            <DetailRow label="Complainant" value={log.complainant} />
            <Separator />
            <DetailRow label="Logged By" value={log.loggedByName || <span className="text-muted-foreground">N/A</span>} />
            <Separator />
            <DetailRow label="Priority" value={<Badge className={priorityStyles[log.priority]}>{log.priority}</Badge>} />
            <Separator />
            <DetailRow label="Problem Reported" value={<p className="whitespace-pre-wrap">{log.problemReported}</p>} />
            <Separator />
            <DetailRow label="Immediate Action Taken" value={<p className="whitespace-pre-wrap">{log.immediateActionTaken}</p>} />
            <Separator />
            <DetailRow 
                label="Status" 
                value={
                    log.caseResolved ? (
                        <Badge variant="outline" className="bg-green-100 text-green-800">Resolved</Badge>
                    ) : log.fieldVisitRequired ? (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">Field Visit Required</Badge>
                    ) : (
                        <Badge variant="secondary">Open</Badge>
                    )
                } 
            />
        </div>
        <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
