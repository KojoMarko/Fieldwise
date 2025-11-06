
'use client';
import { File, PlusCircle, LoaderCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import { AddProductDialog } from './components/add-product-dialog';

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const productsQuery = query(collection(db, "products"), where("companyId", "==", user.companyId));
    
    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const productsData: Product[] = [];
      snapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(productsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.companyId]);

  const canAddProducts = user?.role === 'Admin' || user?.role === 'Sales Rep';

  return (
    <>
      <AddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
      <div className="flex items-center mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">Products</h1>
        <div className="ml-auto flex items-center gap-2">
          {user?.role === 'Admin' && (
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
              </span>
            </Button>
          )}
          {canAddProducts && (
            <Button
              size="sm"
              className="h-8 gap-1"
              onClick={() => setAddDialogOpen(true)}
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Product
              </span>
            </Button>
          )}
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>
            Manage all products and services offered by your company.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center p-10">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading products...</p>
            </div>
           ) : products.length > 0 ? (
            <DataTable columns={columns} data={products} />
           ) : (
            <div className="text-center py-20">
                <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 font-semibold">No Products Found</p>
                <p className="text-sm text-muted-foreground">
                    Click "Add Product" to start building your catalog.
                </p>
            </div>
           )}
        </CardContent>
      </Card>
    </>
  );
}
