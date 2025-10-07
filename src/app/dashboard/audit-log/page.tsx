
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
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

type AuditLogEvent = {
  id: string;
  user: {
    name: string;
    avatarUrl: string;
  };
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'Asset' | 'Work Order' | 'Resource' | 'Spare Part' | 'Customer' | 'User';
  entityName: string;
  timestamp: string;
};

// Mock data for demonstration purposes
const mockAuditLogs: AuditLogEvent[] = [
  {
    id: 'log-1',
    user: { name: 'Sojourner Truth', avatarUrl: 'https://picsum.photos/seed/user2/100/100' },
    action: 'CREATE',
    entity: 'Work Order',
    entityName: 'Annual maintenance for Vitros 5600',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'log-2',
    user: { name: 'Admin', avatarUrl: 'https://picsum.photos/seed/user1/100/100' },
    action: 'CREATE',
    entity: 'Asset',
    entityName: 'Ismart Electrolyte Analyzer',
    timestamp: '2024-07-22T10:00:00Z',
  },
  {
    id: 'log-3',
    user: { name: 'Harriet Tubman', avatarUrl: 'https://picsum.photos/seed/user3/100/100' },
    action: 'UPDATE',
    entity: 'Work Order',
    entityName: 'Emergency repair on DxH 900',
    timestamp: '2024-07-22T09:30:00Z',
  },
   {
    id: 'log-4',
    user: { name: 'Admin', avatarUrl: 'https://picsum.photos/seed/user1/100/100' },
    action: 'CREATE',
    entity: 'User',
    entityName: 'Sojourner Truth',
    timestamp: '2024-07-21T15:00:00Z',
  },
    {
    id: 'log-5',
    user: { name: 'Admin', avatarUrl: 'https://picsum.photos/seed/user1/100/100' },
    action: 'CREATE',
    entity: 'Customer',
    entityName: 'St. Mary\'s Hospital',
    timestamp: '2024-07-20T11:00:00Z',
  },
];


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
    User: UserPlus
}

const actionColors: Record<AuditLogEvent['action'], string> = {
  CREATE: 'bg-blue-100 text-blue-800',
  UPDATE: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
}

export default function AuditLogPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    if (!isLoading && user?.role !== 'Admin') {
        router.push('/dashboard');
        return null;
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
              {mockAuditLogs.map((log) => {
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
                            <EntityIcon className="h-5 w-5 text-muted-foreground" />
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
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
