
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, File, LoaderCircle, Warehouse, DatabaseZap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Location } from '@/lib/types';
import * as xlsx from 'xlsx';
import { AddLocationDialog } from './add-location-dialog';
import { LocationsDataTable } from './locations-data-table';
import { locationsColumns } from './locations-columns';
import { migrateLocations } from '@/ai/flows/migrate-locations';
import { useToast } from '@/hooks/use-toast';

export function LocationsTab() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'Admin';
  const canAddLocations = user?.role === 'Admin';
  const [isAddLocationDialogOpen, setAddLocationDialogOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (!user?.companyId) {
      setIsLoadingData(false);
      return;
    }

    const locationsQuery = query(collection(db, "locations"), where("companyId", "==", user.companyId));
    
    const unsubscribe = onSnapshot(locationsQuery, (snapshot) => {
      const locationsData: Location[] = [];
      snapshot.forEach((doc) => {
        locationsData.push({ id: doc.id, ...doc.data() } as Location);
      });
      locationsData.sort((a, b) => a.name.localeCompare(b.name));
      setLocations(locationsData);
      setIsLoadingData(false);
    });

    return () => unsubscribe();
  }, [user, isAuthLoading]);
  
  const handleExport = () => {
    const dataToExport = locations.map(l => ({
        'Location ID': l.id,
        'Location Name': l.name,
        'Type': l.type,
        'Address': l.address,
    }));
    const worksheet = xlsx.utils.json_to_sheet(dataToExport);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Locations");
    
    const excelBuffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

    const url = URL.createObjectURL(data);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Locations_List.xlsx');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleMigration = async () => {
    if (!user?.companyId) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not determine your company to run migration.'
        });
        return;
    }
    setIsMigrating(true);
    toast({
        title: 'Starting Migration',
        description: 'Scanning your inventory for existing location names...',
    });
    try {
        const result = await migrateLocations({ companyId: user.companyId });
        toast({
            title: 'Migration Complete',
            description: `${result.migratedCount} new locations were created from your inventory data.`,
        });
    } catch(error: any) {
        console.error("Migration failed", error);
        toast({
            variant: 'destructive',
            title: 'Migration Failed',
            description: error.message || 'Could not migrate locations at this time.',
        });
    } finally {
        setIsMigrating(false);
    }
  }


  return (
    <>
      <AddLocationDialog
        open={isAddLocationDialogOpen}
        onOpenChange={setAddLocationDialogOpen}
      />
      <Card className="mt-6">
        <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle>Storage Locations</CardTitle>
                    <CardDescription>
                        View and manage all warehouses, vans, and site locations.
                    </CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    {isAdmin && (
                        <Button size="sm" variant="outline" className="h-9 gap-1" onClick={handleExport}>
                            <File className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Export
                            </span>
                        </Button>
                    )}
                    {canAddLocations && (
                        <Button
                            size="sm"
                            className="h-9 gap-1"
                            onClick={() => setAddLocationDialogOpen(true)}
                        >
                            <PlusCircle className="h-3.5 w-3.5" />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Location
                            </span>
                        </Button>
                    )}
                 </div>
            </div>
        </CardHeader>
        <CardContent>
           {isLoadingData ? (
             <div className="flex items-center justify-center p-10">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading locations...</p>
            </div>
           ) : locations.length > 0 ? (
            <LocationsDataTable columns={locationsColumns} data={locations} />
           ) : (
             <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <Warehouse className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No Locations Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first parts location, or migrate existing ones.</p>
                <Button className="mt-4" onClick={handleMigration} disabled={isMigrating}>
                    {isMigrating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
                    {isMigrating ? 'Migrating...' : 'Migrate from Inventory'}
                </Button>
            </div>
           )}
        </CardContent>
      </Card>
    </>
  );
}
