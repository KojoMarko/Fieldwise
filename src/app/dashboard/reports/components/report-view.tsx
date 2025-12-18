
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ReportKpiCard } from './report-kpi-card';
import {
  Package,
  Layers,
  PackagePlus,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useState, useMemo } from 'react';
import type { Asset } from '@/lib/types';
import { format, parseISO, differenceInYears, isValid, isWithinInterval } from 'date-fns';
import { Badge } from '@/components/ui/badge';

type DialogDataType = 'assets' | 'categories';

function DataDisplayDialog({ open, onOpenChange, title, data, type }: { open: boolean, onOpenChange: (open: boolean) => void, title: string, data: any[], type: DialogDataType }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        A list of all items related to this metric for the selected period.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    {type === 'assets' ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset Name</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Serial Number</TableHead>
                                    <TableHead>Installed On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length > 0 ? (
                                    data.map((asset) => (
                                        <TableRow key={asset.id}>
                                            <TableCell>{asset.name}</TableCell>
                                            <TableCell>{asset.model}</TableCell>
                                            <TableCell>{asset.serialNumber}</TableCell>
                                            <TableCell>
                                                {asset.installationDate && isValid(parseISO(asset.installationDate))
                                                    ? format(parseISO(asset.installationDate), 'PPP')
                                                    : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No assets to display for this metric.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    ) : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category Name</TableHead>
                                    <TableHead className="text-right">Asset Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                 {data.length > 0 ? (
                                    data.map((category) => (
                                        <TableRow key={category.name}>
                                            <TableCell>{category.name}</TableCell>
                                            <TableCell className="text-right"><Badge variant="secondary">{category.total}</Badge></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                     <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">
                                            No categories to display.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface ReportViewProps {
    title: string;
    assets: Asset[];
    dateRange: { start: Date; end: Date };
}

export function ReportView({ title, assets, dateRange }: ReportViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogData, setDialogData] = useState<any[]>([]);
  const [dialogType, setDialogType] = useState<DialogDataType>('assets');

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
        if (!asset.installationDate || !isValid(parseISO(asset.installationDate))) return false;
        return isWithinInterval(parseISO(asset.installationDate), dateRange);
    });
  }, [assets, dateRange]);

  const assetCategories = useMemo(() => {
    const categoryCount: Record<string, number> = {};
    filteredAssets.forEach((asset) => {
      categoryCount[asset.name] = (categoryCount[asset.name] || 0) + 1;
    });
    return Object.entries(categoryCount)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [filteredAssets]);

  const assetsNearEOL = useMemo(() => {
    const now = new Date();
    return filteredAssets.filter(asset => {
        if (!asset.installationDate || !isValid(parseISO(asset.installationDate))) return false;
        const installDate = parseISO(asset.installationDate);
        const warrantyDate = asset.warrantyExpiry ? parseISO(asset.warrantyExpiry) : null;
        
        const isOld = differenceInYears(now, installDate) >= 5;
        const isWarrantyExpired = warrantyDate && isValid(warrantyDate) ? now > warrantyDate : false;
        
        return isOld || isWarrantyExpired;
    })
  }, [filteredAssets]);

  const handleKpiClick = (title: string, data: any[], type: DialogDataType) => {
    setDialogTitle(title);
    setDialogData(data);
    setDialogType(type);
    setDialogOpen(true);
  };
  
  return (
    <>
      <DataDisplayDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogTitle}
        data={dialogData}
        type={dialogType}
      />
       <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">{title} ({format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')})</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ReportKpiCard
                title="Total Assets Onboarded"
                value={filteredAssets.length.toString()}
                change=""
                Icon={Package}
                changeType="increase"
                onClick={() => handleKpiClick(`Assets Onboarded in Period`, filteredAssets, 'assets')}
            />
            <ReportKpiCard
                title="Asset Categories Added"
                value={assetCategories.length.toString()}
                change=""
                Icon={Layers}
                changeType="increase"
                onClick={() => handleKpiClick('Asset Categories Added in Period', assetCategories, 'categories')}
            />
            <ReportKpiCard
                title="New Assets"
                value={filteredAssets.length.toString()}
                change=""
                Icon={PackagePlus}
                changeType="increase"
                onClick={() => handleKpiClick(`New Assets in Period`, filteredAssets, 'assets')}
            />
            <ReportKpiCard
                title="Nearing End-of-Life"
                value={assetsNearEOL.length.toString()}
                change=""
                Icon={ShieldAlert}
                changeType="decrease"
                onClick={() => handleKpiClick('Assets Nearing End-of-Life in Period', assetsNearEOL, 'assets')}
            />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 mt-6">
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>Asset Category Distribution</CardTitle>
                    <CardDescription>
                    A breakdown of assets added in this period by category.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={assetCategories}>
                        <XAxis
                        dataKey="name"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        angle={-25}
                        textAnchor="end"
                        height={60}
                        />
                        <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                        }}
                        />
                        <Bar
                        dataKey="total"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Recently Added Assets</CardTitle>
                    <CardDescription>
                    New equipment onboarded in this period.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Asset Name</TableHead>
                        <TableHead>Installed On</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAssets.length > 0 ? (
                        filteredAssets.map((asset) => (
                            <TableRow key={asset.id}>
                            <TableCell>
                                <div className="font-medium">{asset.name}</div>
                                <div className="text-xs text-muted-foreground">{asset.serialNumber}</div>
                            </TableCell>
                            <TableCell>
                                {asset.installationDate && isValid(parseISO(asset.installationDate)) ? format(parseISO(asset.installationDate), 'PPP') : 'N/A'}
                            </TableCell>
                            </TableRow>
                        ))
                        ) : (
                        <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">
                            No new assets added in this period.
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
