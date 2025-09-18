'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  LoaderCircle,
  Wrench,
  AlertCircle,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { suggestSpareParts } from '@/ai/flows/suggest-spare-parts';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import type { WorkOrder, Customer, User } from '@/lib/types';
import { format } from 'date-fns';

export function WorkOrderClientSection({
  workOrder,
  customer,
  technician,
}: {
  workOrder: WorkOrder;
  customer?: Customer;
  technician?: User;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const { toast } = useToast();

  const handleSuggestParts = async () => {
    setIsLoading(true);
    setSuggestions([]);
    try {
      const result = await suggestSpareParts({
        workOrderDescription: workOrder.description,
      });
      if (result.suggestedSpareParts) {
        setSuggestions(result.suggestedSpareParts);
      }
    } catch (error) {
      console.error('Error suggesting spare parts:', error);
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Failed',
        description: 'Could not fetch spare part suggestions at this time.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ServiceReport = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Service Report</CardTitle>
            <CardDescription>
              Work Order: {workOrder.id}
            </CardDescription>
          </div>
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Customer</p>
              <p className="text-muted-foreground">{customer?.name}</p>
              <p className="text-muted-foreground">{customer?.address}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">Completed Date</p>
              <p className="text-muted-foreground">
                {workOrder.completedDate
                  ? format(new Date(workOrder.completedDate), 'PPP')
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <Separator />
        <div className="p-6">
          <h4 className="font-medium mb-2">Technician Notes</h4>
          <p className="text-sm text-muted-foreground">
            {workOrder.technicianNotes}
          </p>
        </div>
        <Separator />
        <div className="p-6">
          <h4 className="font-medium mb-2">Parts Used</h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            <li>Filter Kit (PN: FIL-HEPA-1212)</li>
            <li>Main Bearing Bolt (PN: BLT-M8-25)</li>
          </ul>
        </div>
        <Separator />
        <div className="p-6">
           <h4 className="font-medium mb-2">Customer Approval</h4>
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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {workOrder.status === 'Completed' && workOrder.technicianNotes ? (
        <ServiceReport />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Technician Report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Enter observations, work performed, and any issues..."
                className="min-h-[120px]"
              />
            </div>
            <Button>Submit Report</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>AI Spare Part Suggester</span>
            <Sparkles className="h-5 w-5 text-primary" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Get AI-powered suggestions for spare parts based on the work order
            description.
          </p>
          <Button
            onClick={handleSuggestParts}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wrench className="mr-2 h-4 w-4" />
            )}
            Suggest Spare Parts
          </Button>

          {isLoading && (
            <div className="flex items-center text-sm text-muted-foreground">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Analyzing work order...
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Suggested Parts:
              </h4>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((part, index) => (
                  <Badge key={index} variant="secondary">
                    {part}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {!isLoading && suggestions.length === 0 && (
            <div className="flex items-center text-sm text-muted-foreground border p-3 rounded-md">
              <AlertCircle className="h-4 w-4 mr-2" />
              Click the button to generate suggestions.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
