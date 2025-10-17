
'use server';
/**
 * @fileOverview A flow for updating an existing work order.
 *
 * - updateWorkOrder - A function that handles the work order update process.
 * - UpdateWorkOrderInput - The input type for the updateWorkOrder function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';

const UpdateWorkOrderInputSchema = z.object({
  id: z.string().min(1, 'Work Order ID is required'),
  technicianIds: z.array(z.string()).optional(),
  status: z.enum(['Draft', 'Scheduled', 'In-Progress', 'On-Hold', 'Completed', 'Invoiced', 'Cancelled']).optional(),
  technicianNotes: z.string().optional(),
  completedDate: z.string().optional(),
});

export type UpdateWorkOrderInput = z.infer<typeof UpdateWorkOrderInputSchema>;

export async function updateWorkOrder(input: UpdateWorkOrderInput): Promise<void> {
  return updateWorkOrderFlow(input);
}

const updateWorkOrderFlow = ai.defineFlow(
  {
    name: 'updateWorkOrderFlow',
    inputSchema: UpdateWorkOrderInputSchema,
    outputSchema: z.void(),
    auth: (auth) => {
      if (!auth) throw new Error('Authorization required.');
    },
  },
  async (input) => {
    const workOrderRef = db.collection('work-orders').doc(input.id);
    const { id, ...dataToUpdate } = input;
    await workOrderRef.update(dataToUpdate);
  }
);
