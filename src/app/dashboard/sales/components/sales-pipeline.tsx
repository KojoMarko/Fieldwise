
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const pipelineData = [
    { stage: 'Discovery', opportunities: 12, value: 145000, progress: 40 },
    { stage: 'Proposal', opportunities: 8, value: 320000, progress: 60 },
    { stage: 'Negotiation', opportunities: 5, value: 425000, progress: 75 },
    { stage: 'Closing', opportunities: 3, value: 285000, progress: 90 },
];


export function SalesPipeline() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Pipeline</CardTitle>
        <CardDescription>Opportunities by stage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {pipelineData.map(item => (
            <div key={item.stage}>
                <div className="flex justify-between mb-1">
                    <p className="text-sm font-medium">{item.stage}</p>
                    <p className="text-sm text-muted-foreground">{item.progress}%</p>
                </div>
                 <Progress value={item.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                    {item.opportunities} opportunities &bull; GH₵{item.value.toLocaleString()}
                </p>
            </div>
        ))}
      </CardContent>
    </Card>
  );
}
