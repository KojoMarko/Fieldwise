
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, File } from 'lucide-react';
import { DataTable } from './components/data-table';
import { columns } from './components/columns';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { AddUserDialog } from './components/add-user-dialog';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';

export default function UsersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const usersQuery = query(collection(db, "users"), where("companyId", "==", user.companyId));
    
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      const usersData: User[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ id: doc.id, ...doc.data() } as User);
      });
      setUsers(usersData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.companyId]);


  return (
    <>
      <AddUserDialog
        open={isAddUserDialogOpen}
        onOpenChange={setAddUserDialogOpen}
      />
      <div className="flex items-center mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">Users</h1>
        <div className="ml-auto flex items-center gap-2">
          {isAdmin && (
            <>
              <Button size="sm" variant="outline" className="h-8 gap-1">
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Export
                </span>
              </Button>
              <Button
                size="sm"
                className="h-8 gap-1"
                onClick={() => setAddUserDialogOpen(true)}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add User
                </span>
              </Button>
            </>
          )}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage all user accounts in your company.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
             <div className="flex items-center justify-center p-10">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading users...</p>
            </div>
           ) : (
            <DataTable columns={columns} data={users} />
           )}
        </CardContent>
      </Card>
    </>
  );
}
