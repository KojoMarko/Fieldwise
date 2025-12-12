
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { WorkOrder, Asset, Customer } from '@/lib/types';
import { LoaderCircle, Search as SearchIcon, Wrench, Building, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

type SearchResult = 
    | { type: 'Work Order'; data: WorkOrder }
    | { type: 'Asset'; data: Asset }
    | { type: 'Customer'; data: Customer };


function SearchResults() {
    const searchParams = useSearchParams();
    const q = searchParams.get('q');
    const { user } = useAuth();
    const db = useFirestore();
    
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const performSearch = async () => {
            if (!q || !user?.companyId || !db) {
                setResults([]);
                return;
            }

            setIsLoading(true);
            const lowerCaseQuery = q.toLowerCase();
            const allResults: SearchResult[] = [];

            try {
                // Search Work Orders
                const workOrdersRef = collection(db, 'work-orders');
                const workOrdersQuery = query(workOrdersRef, where('companyId', '==', user.companyId));
                const workOrdersSnapshot = await getDocs(workOrdersQuery);
                workOrdersSnapshot.forEach(doc => {
                    const data = doc.data() as WorkOrder;
                    if (data.title.toLowerCase().includes(lowerCaseQuery) || data.description?.toLowerCase().includes(lowerCaseQuery)) {
                        allResults.push({ type: 'Work Order', data });
                    }
                });

                // Search Assets
                const assetsRef = collection(db, 'assets');
                const assetsQuery = query(assetsRef, where('companyId', '==', user.companyId));
                const assetsSnapshot = await getDocs(assetsQuery);
                assetsSnapshot.forEach(doc => {
                    const data = doc.data() as Asset;
                    if (data.name.toLowerCase().includes(lowerCaseQuery) || data.model.toLowerCase().includes(lowerCaseQuery) || data.serialNumber.toLowerCase().includes(lowerCaseQuery)) {
                        allResults.push({ type: 'Asset', data });
                    }
                });

                // Search Customers
                const customersRef = collection(db, 'customers');
                const customersQuery = query(customersRef, where('companyId', '==', user.companyId));
                const customersSnapshot = await getDocs(customersQuery);
                customersSnapshot.forEach(doc => {
                    const data = doc.data() as Customer;
                    if (data.name.toLowerCase().includes(lowerCaseQuery) || data.contactPerson.toLowerCase().includes(lowerCaseQuery)) {
                        allResults.push({ type: 'Customer', data });
                    }
                });
                
                setResults(allResults);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
    }, [q, user?.companyId, db]);

    const resultIcons = {
        'Work Order': <Wrench className="h-5 w-5 text-muted-foreground" />,
        'Asset': <Package className="h-5 w-5 text-muted-foreground" />,
        'Customer': <Building className="h-5 w-5 text-muted-foreground" />,
    }

    const getResultLink = (result: SearchResult) => {
        switch (result.type) {
            case 'Work Order': return `/dashboard/work-orders/${result.data.id}`;
            case 'Asset': return `/dashboard/assets/${result.data.id}`;
            case 'Customer': return `/dashboard/customers/${result.data.id}`;
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Search Results for "{q}"</h1>
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <LoaderCircle className="h-10 w-10 animate-spin" />
                </div>
            ) : results.length > 0 ? (
                <ul className="space-y-4">
                    {results.map((result, index) => (
                         <li key={`${result.type}-${result.data.id}-${index}`}>
                            <Link href={getResultLink(result)} className="block p-4 border rounded-lg hover:bg-muted transition-colors">
                                <div className="flex items-start gap-4">
                                    {resultIcons[result.type]}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <p className="font-semibold">
                                                {result.type === 'Work Order' ? result.data.title : result.data.name}
                                            </p>
                                            <Badge variant="outline">{result.type}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">
                                             {result.type === 'Work Order' && `ID: ${result.data.id}`}
                                             {result.type === 'Asset' && `S/N: ${result.data.serialNumber}`}
                                             {result.type === 'Customer' && `Contact: ${result.data.contactPerson}`}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                         </li>
                    ))}
                </ul>
            ) : (
                <Card className="text-center py-20">
                    <CardHeader>
                        <SearchIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <CardTitle>No Results Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Your search for "{q}" did not return any results.</p>
                        <p className="text-sm text-muted-foreground mt-2">Try searching for a different term.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )

}


export default function SearchPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center py-20"><LoaderCircle className="h-10 w-10 animate-spin" /></div>}>
            <SearchResults />
        </Suspense>
    )
}
