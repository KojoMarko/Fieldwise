
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
import {
  User,
  History,
  FilePlus,
  FilePen,
  Trash2,
  Package,
  Wrench,
  Book,
  Building,
  UserPlus,
  LoaderCircle,
  ShieldAlert,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { AuditLogEvent } from '@/lib/types';

const actionIcons: Record<AuditLogEvent['action'], React.ElementType> = {
  CREATE: FilePlus,
  UPDATE: FilePen,
  DELETE: Trash2,
};

const entityIcons: Record<AuditLogEvent['entity'], React.ElementType> = {
    Asset: Package,
    'Work Order': Wrench,
    Resource: Book,
    'Spare Part': Wrench,
    Customer: Building,
    User: UserPlus,
    Company: Building,
    Location: Building,
}

const actionColors: Record<AuditLogEvent['action'], string> = {
  CREATE: 'bg-blue-100 text-blue-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
}

export default function AuditLogPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const router = useRouter();
    const db = useFirestore();
    const [auditLogs, setAuditLogs] = useState<AuditLogEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isAuthLoading) return;

        if (!user || user.role !== 'Admin') {
            router.push('/dashboard');
            return;
        }

        if (!user.companyId || !db) {
            setIsLoading(false);
            return;
        }

        const logsQuery = query(
            collection(db, 'audit-log'), 
            where("companyId", "==", user.companyId)
        );

        const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
            const logsData: AuditLogEvent[] = [];
            snapshot.forEach((doc) => {
                logsData.push({ id: doc.id, ...doc.data() } as AuditLogEvent);
            });
            // Sort client-side to avoid needing a composite index
            logsData.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
            setAuditLogs(logsData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching audit logs:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user, isAuthLoading, router, db]);

    if (isAuthLoading || isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <LoaderCircle className="h-10 w-10 animate-spin" />
            </div>
        );
    }
    
    if (user?.role !== 'Admin') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 p-4">
                <Card className='max-w-md'>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-2 justify-center'>
                            <ShieldAlert className="h-6 w-6 text-destructive" />
                            Access Denied
                        </CardTitle>
                        <CardDescription>
                            You must be an administrator to view the audit log.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        )
    }

  return (
    <>
      <div className="flex items-center mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">Audit Log</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
          <CardDescription>
            A log of all significant activities performed by users in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[250px]'>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className='text-right'>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length > 0 ? auditLogs.map((log) => {
                const ActionIcon = actionIcons[log.action];
                const EntityIcon = entityIcons[log.entity];

                return (
                <TableRow key={log.id}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <div className="font-medium">{log.user.name}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className={actionColors[log.action]}>
                            <ActionIcon className="h-3 w-3 mr-1.5" />
                            {log.action}
                        </Badge>
                    </TableCell>
                     <TableCell>
                        <div className="flex items-center gap-3">
                            {EntityIcon && <EntityIcon className="h-5 w-5 text-muted-foreground" />}
                            <div>
                                <div className="font-medium text-muted-foreground">{log.entity}</div>
                                <div className="text-sm">{log.entityName}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                        {formatDistanceToNow(parseISO(log.timestamp), { addSuffix: true })}
                    </TableCell>
                </TableRow>
                )
              }) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No audit log events found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
