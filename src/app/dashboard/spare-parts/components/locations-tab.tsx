
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, File, LoaderCircle, Warehouse, DatabaseZap, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Location, SparePart } from '@/lib/types';
import * as xlsx from 'xlsx';
import { AddLocationDialog } from './add-location-dialog';
import { LocationsDataTable } from './locations-data-table';
import { locationsColumns } from './locations-columns';
import { migrateLocations } from '@/ai/flows/migrate-locations';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

function LocationStockDialog({
  open,
  onOpenChange,
  location,
  parts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location | null;
  parts: SparePart[];
}) {
  const [filter, setFilter] = useState('');

  if (!location) return null;

  const partsInLocation = parts.filter(
    (part) =>
      part.location === location.name ||
      part.facilityStock?.some((fs) => fs.facilityId === location.id)
  );

  const filteredParts = partsInLocation.filter(
    (part) =>
      part.name.toLowerCase().includes(filter.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(filter.toLowerCase())
  );

  const getStockForLocation = (part: SparePart) => {
    if (part.location === location.name) {
      return { quantity: part.quantity, type: 'Central' };
    }
    const facilityStock = part.facilityStock?.find(
      (fs) => fs.facilityId === location.id
    );
    return facilityStock
      ? { quantity: facilityStock.quantity, type: 'Facility' }
      : null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Stock at {location.name}</DialogTitle>
          <DialogDescription>
            All parts and tools currently located here.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Input
            placeholder="Filter parts in this location..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="max-h-[60vh] overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParts.length > 0 ? (
                  filteredParts.map((part) => {
                    const stockInfo = getStockForLocation(part);
                    if (!stockInfo || stockInfo.quantity === 0) return null;
                    return (
                      <TableRow key={part.id}>
                        <TableCell>
                          <div className="font-medium">{part.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {part.partNumber}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={
                              stockInfo.type === 'Central'
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {stockInfo.quantity} in stock
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      No parts found at this location.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function LocationsTab() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'Admin';
  const canAddLocations = user?.role === 'Admin';
  const [isAddLocationDialogOpen, setAddLocationDialogOpen] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isStockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (!user?.companyId) {
      setIsLoadingData(false);
      return;
    }

    const locationsQuery = query(
      collection(db, 'locations'),
      where('companyId', '==', user.companyId)
    );
    const partsQuery = query(
      collection(db, 'spare-parts'),
      where('companyId', '==', user.companyId)
    );

    const unsubLocations = onSnapshot(locationsQuery, (snapshot) => {
      const locationsData: Location[] = [];
      snapshot.forEach((doc) => {
        locationsData.push({ id: doc.id, ...doc.data() } as Location);
      });
      locationsData.sort((a, b) => a.name.localeCompare(b.name));
      setLocations(locationsData);
      if (isLoadingData) setIsLoadingData(false); // Only set loading to false once
    });

    const unsubParts = onSnapshot(partsQuery, (snapshot) => {
      const partsData: SparePart[] = [];
      snapshot.forEach((doc) => {
        partsData.push({ id: doc.id, ...doc.data() } as SparePart);
      });
      setSpareParts(partsData);
    });

    return () => {
      unsubLocations();
      unsubParts();
    };
  }, [user, isAuthLoading]);

  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
    setStockDialogOpen(true);
  };

  const handleExport = () => {
    const dataToExport = locations.map((l) => ({
      'Location ID': l.id,
      'Location Name': l.name,
      Type: l.type,
      Address: l.address,
    }));
    const worksheet = xlsx.utils.json_to_sheet(dataToExport);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Locations');

    const excelBuffer = xlsx.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    const data = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

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
        description: 'Could not determine your company to run migration.',
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
    } catch (error: any) {
      console.error('Migration failed', error);
      toast({
        variant: 'destructive',
        title: 'Migration Failed',
        description: error.message || 'Could not migrate locations at this time.',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <>
      <AddLocationDialog
        open={isAddLocationDialogOpen}
        onOpenChange={setAddLocationDialogOpen}
      />
      <LocationStockDialog
        open={isStockDialogOpen}
        onOpenChange={setStockDialogOpen}
        location={selectedLocation}
        parts={spareParts}
      />
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Storage Locations</CardTitle>
              <CardDescription>
                View and manage all warehouses, vans, and site locations. Click a
                location to see its stock.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 gap-1"
                  onClick={handleExport}
                >
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
            <LocationsDataTable
              columns={locationsColumns({ onLocationClick: handleLocationClick })}
              data={locations}
              onRowDoubleClick={handleLocationClick}
            />
          ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
              <Warehouse className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No Locations Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating your first parts location, or migrate
                existing ones.
              </p>
              <Button
                className="mt-4"
                onClick={handleMigration}
                disabled={isMigrating}
              >
                {isMigrating ? (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <DatabaseZap className="mr-2 h-4 w-4" />
                )}
                {isMigrating ? 'Migrating...' : 'Migrate from Inventory'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
