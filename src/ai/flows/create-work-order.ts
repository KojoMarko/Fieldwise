
'use server';
/**
 * @fileOverview A flow for creating a new work order.
 *
 * - createWorkOrder - A function that handles the work order creation process.
 * - CreateWorkOrderInput - The input type for the createWorkOrder function.
 * - CreateWorkOrderOutput - The return type for the createWorkOrder function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { formatISO } from 'date-fns';
import type { WorkOrder } from '@/lib/types';
import { db } from '@/lib/firebase-admin';

const CreateWorkOrderInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  customerId: z.string().min(1, 'Customer is required'),
  assetId: z.string().min(1, 'Asset is required'),
  priority: z.enum(['Low', 'Medium', 'High']),
  scheduledDate: z.date(),
  companyId: z.string().min(1, 'Company ID is required'),
  status: z.enum(['Scheduled', 'Draft']),
});

export type CreateWorkOrderInput = z.infer<typeof CreateWorkOrderInputSchema>;

const CreateWorkOrderOutputSchema = z.object({
  id: z.string().describe('The newly created work order ID.'),
});
export type CreateWorkOrderOutput = z.infer<typeof CreateWorkOrderOutputSchema>;

export async function createWorkOrder(input: CreateWorkOrderInput): Promise<CreateWorkOrderOutput> {
  return createWorkOrderFlow(input);
}

const createWorkOrderFlow = ai.defineFlow(
  {
    name: 'createWorkOrderFlow',
    inputSchema: CreateWorkOrderInputSchema,
    outputSchema: CreateWorkOrderOutputSchema,
  },
  async (input) => {
    const workOrderRef = db.collection('work-orders').doc();
    const newWorkOrder: WorkOrder = {
        ...input,
        id: workOrderRef.id,
        scheduledDate: formatISO(input.scheduledDate),
        createdAt: formatISO(new Date()),
    };

    await workOrderRef.set(newWorkOrder);
    
    return {
      id: workOrderRef.id,
    };
  }
);
