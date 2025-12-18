
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportKpiCard } from './components/report-kpi-card';
import {
  Package,
  Layers,
  PackagePlus,
  ShieldAlert,
  LoaderCircle,
  CalendarDays,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Asset } from '@/lib/types';
import { format, parseISO, isThisMonth, differenceInYears, isValid } from 'date-fns';

function ReportPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center h-96">
        <CalendarDays className="h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Report Coming Soon</h3>
        <p className="mt-1 text-sm text-muted-foreground">This report view is under construction. Check back later for updates!</p>
    </div>
  )
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    const assetsQuery = query(
      collection(db, 'assets'),
      where('companyId', '==', user.companyId)
    );
    const unsubscribe = onSnapshot(assetsQuery, (snapshot) => {
      const assetsData: Asset[] = [];
      snapshot.forEach((doc) =>
        assetsData.push({ id: doc.id, ...doc.data() } as Asset)
      );
      setAssets(assetsData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const assetCategories = useMemo(() => {
    const categoryCount: Record<string, number> = {};
    assets.forEach((asset) => {
      categoryCount[asset.name] = (categoryCount[asset.name] || 0) + 1;
    });
    return Object.entries(categoryCount)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [assets]);

  const newAssetsThisMonth = useMemo(
    () =>
      assets.filter((asset) => {
        if (!asset.installationDate) return false;
        const date = parseISO(asset.installationDate);
        return isValid(date) && isThisMonth(date);
      }),
    [assets]
  );
  
  const assetsNearEOL = useMemo(() => {
    const now = new Date();
    // Assets older than 5 years or with expired warranty
    return assets.filter(asset => {
        if (!asset.installationDate) return false;
        const installDate = parseISO(asset.installationDate);
        if (!isValid(installDate)) return false;

        const warrantyDate = asset.warrantyExpiry ? parseISO(asset.warrantyExpiry) : null;
        
        const isOld = differenceInYears(now, installDate) >= 5;
        const isWarrantyExpired = warrantyDate && isValid(warrantyDate) ? now > warrantyDate : false;
        
        return isOld || isWarrantyExpired;
    })
  }, [assets]);


  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
      </div>

       <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <ReportKpiCard
                title="Total Assets"
                value={assets.length.toString()}
                change=""
                Icon={Package}
                changeType="increase"
              />
              <ReportKpiCard
                title="Asset Categories"
                value={assetCategories.length.toString()}
                change=""
                Icon={Layers}
                changeType="increase"
              />
              <ReportKpiCard
                title="New This Month"
                value={newAssetsThisMonth.length.toString()}
                change=""
                Icon={PackagePlus}
                changeType="increase"
              />
              <ReportKpiCard
                title="Nearing End-of-Life"
                value={assetsNearEOL.length.toString()}
                change=""
                Icon={ShieldAlert}
                changeType="decrease"
              />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 mt-6">
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Asset Category Distribution</CardTitle>
                  <CardDescription>
                    A breakdown of all managed assets by their category.
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
                    New equipment onboarded this month.
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
                      {newAssetsThisMonth.length > 0 ? (
                        newAssetsThisMonth.map((asset) => (
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
                            No new assets added this month.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
        </TabsContent>
        <TabsContent value="monthly" className="mt-6">
          <ReportPlaceholder />
        </TabsContent>
        <TabsContent value="quarterly" className="mt-6">
          <ReportPlaceholder />
        </TabsContent>
        <TabsContent value="yearly" className="mt-6">
          <ReportPlaceholder />
        </TabsContent>
       </Tabs>
    </div>
  );
}
