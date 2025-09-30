
import { db } from '@/lib/firebase';
import type { WorkOrder } from '@/lib/types';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

/**
 * Fetches work orders from Firestore for a given company.
 * @param companyId The ID of the company to fetch work orders for.
 * @returns A promise that resolves to an array of work orders.
 */
export async function getWorkOrders(companyId: string): Promise<WorkOrder[]> {
  if (!companyId) {
    console.error("Company ID is required to fetch work orders.");
    return [];
  }

  try {
    const workOrdersRef = collection(db, 'work-orders');
    const q = query(
      workOrdersRef, 
      where('companyId', '==', companyId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
        console.log("No work orders found for this company.");
        return [];
    }

    const workOrders: WorkOrder[] = [];
    querySnapshot.forEach(doc => {
      workOrders.push(doc.data() as WorkOrder);
    });

    return workOrders;
  } catch (error) {
    console.error("Error fetching work orders:", error);
    // In case of an error, return an empty array to prevent the app from crashing.
    return [];
  }
}
