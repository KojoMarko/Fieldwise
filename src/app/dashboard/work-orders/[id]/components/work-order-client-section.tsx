'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import type { WorkOrder } from '@/lib/types';

export function WorkOrderClientSection({ workOrder }: { workOrder: WorkOrder }) {
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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {workOrder.status === 'Completed' && workOrder.technicianNotes ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <span>Service Report</span>
            </CardTitle>
            <CardDescription>
              Report submitted by the technician upon work completion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-sm text-muted-foreground">
              <p>{workOrder.technicianNotes}</p>
            </div>
          </CardContent>
        </Card>
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
