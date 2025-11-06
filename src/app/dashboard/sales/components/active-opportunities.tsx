
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const opportunities = [
    { company: 'Acme Corp', contact: 'John Doe', amount: 45000, stage: 'Proposal', probability: '60%' },
    { company: 'TechStact', contact: 'Jane Smith', amount: 80000, stage: 'Negotiation', probability: '75%' },
    { company: 'Innovate LLC', contact: 'Peter Jones', amount: 22000, stage: 'Discovery', probability: '40%' },
    { company: 'Solutions Inc.', contact: 'Mary Johnson', amount: 110000, stage: 'Closing', probability: '90%' },
];

const stageColors: Record<string, string> = {
    Discovery: 'bg-blue-100 text-blue-800',
    Proposal: 'bg-yellow-100 text-yellow-800',
    Negotiation: 'bg-orange-100 text-orange-800',
    Closing: 'bg-green-100 text-green-800',
}

export function ActiveOpportunitiesTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Opportunities</CardTitle>
        <CardDescription>Your current sales pipeline</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Probability</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opp, index) => (
              <TableRow key={index}>
                <TableCell>
                    <div className="font-medium">{opp.company}</div>
                    <div className="text-sm text-muted-foreground">{opp.contact}</div>
                </TableCell>
                <TableCell>GH₵{opp.amount.toLocaleString()}</TableCell>
                <TableCell>
                    <Badge variant="outline" className={stageColors[opp.stage]}>{opp.stage}</Badge>
                </TableCell>
                <TableCell className="text-right">{opp.probability}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
