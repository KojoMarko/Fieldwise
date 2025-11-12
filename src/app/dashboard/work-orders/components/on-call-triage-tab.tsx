
'use client';
import { Button } from '@/components/ui/button';
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
import type { ServiceCallLog } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { LoaderCircle, PhoneIncoming } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, parseISO } from 'date-fns';

const priorityStyles = {
  High: 'bg-red-100 text-red-800 border-red-200',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-gray-200 text-gray-800',
};

type TriageStatusFilter = 'all' | 'resolved' | 'unresolved';

interface OnCallTriageTabProps {
    callLogs: ServiceCallLog[];
    isLoading: boolean;
    searchFilter: string;
    statusFilter: TriageStatusFilter;
}

export function OnCallTriageTab({ callLogs, isLoading, searchFilter, statusFilter }: OnCallTriageTabProps) {

  const filteredData = useMemo(() => {
    return callLogs.filter(log => {
      // Status Filter
      if (statusFilter === 'resolved' && !log.caseResolved) return false;
      if (statusFilter === 'unresolved' && log.caseResolved) return false;
      
      // Search Filter
      const searchString = searchFilter.toLowerCase();
      if (!searchString) return true;

      return (
        log.customerName.toLowerCase().includes(searchString) ||
        log.complainant.toLowerCase().includes(searchString) ||
        log.assetName.toLowerCase().includes(searchString) ||
        log.problemReported.toLowerCase().includes(searchString)
      );
    });
  }, [callLogs, searchFilter, statusFilter]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>On-Call Triage</CardTitle>
              <CardDescription>A log of all service calls received from customers.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-10">
              <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-4 text-muted-foreground">Loading call logs...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer / Asset</TableHead>
                    <TableHead>Reported Problem</TableHead>
                    <TableHead className="hidden md:table-cell">Action Taken</TableHead>
                    <TableHead className="hidden lg:table-cell">Logged By</TableHead>
                    <TableHead className="hidden lg:table-cell">Status</TableHead>
                    <TableHead>Priority</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="font-medium">{log.customerName}</div>
                          <div className="text-sm text-muted-foreground">{log.assetName}</div>
                          <div className="text-xs text-muted-foreground mt-1">{format(parseISO(log.reportingTime), 'PPP p')}</div>
                        </TableCell>
                        <TableCell>
                            <p className="max-w-xs truncate">{log.problemReported}</p>
                            <p className="text-xs text-muted-foreground">Complainant: {log.complainant}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-xs truncate">{log.immediateActionTaken}</TableCell>
                        <TableCell className="hidden lg:table-cell">{log.loggedByName}</TableCell>
                        <TableCell className="hidden lg:table-cell">
                            {log.caseResolved ? (
                                <Badge variant="outline" className="bg-green-100 text-green-800">Resolved</Badge>
                            ) : log.fieldVisitRequired ? (
                                <Badge variant="outline" className="bg-blue-100 text-blue-800">Visit Required</Badge>
                            ) : (
                                <Badge variant="secondary">Open</Badge>
                            )}
                        </TableCell>
                        <TableCell>
                            <Badge className={priorityStyles[log.priority]}>{log.priority}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-48 text-center">
                        <PhoneIncoming className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 font-semibold">No service calls found.</p>
                        <p className="text-sm text-muted-foreground">Click "Log New Call" to add the first one.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
