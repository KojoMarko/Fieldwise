
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
import type { Opportunity } from '@/lib/types';
import Link from 'next/link';

const stageColors: Record<string, string> = {
    Discovery: 'bg-blue-100 text-blue-800',
    Proposal: 'bg-yellow-100 text-yellow-800',
    Negotiation: 'bg-orange-100 text-orange-800',
    Closing: 'bg-green-100 text-green-800',
    Qualification: 'bg-purple-100 text-purple-800',
}

export function ActiveOpportunitiesTable({ opportunities }: { opportunities: Opportunity[] }) {
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
              <TableHead>Opportunity</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="text-right">Probability</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.length > 0 ? opportunities.map((opp) => (
              <TableRow key={opp.id}>
                <TableCell>
                    <Link href={`/dashboard/opportunities/${opp.id}`} className="font-medium hover:underline">{opp.name}</Link>
                    <div className="text-sm text-muted-foreground">{opp.company}</div>
                </TableCell>
                <TableCell>GH₵{opp.value.toLocaleString()}</TableCell>
                <TableCell>
                    <Badge variant="outline" className={stageColors[opp.stage]}>{opp.stage}</Badge>
                </TableCell>
                <TableCell className="text-right">{opp.probability}%</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  No active opportunities found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
