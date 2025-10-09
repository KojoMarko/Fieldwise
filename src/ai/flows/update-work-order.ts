
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
import { formatISO } from 'date-fns';
import { getAuth } from 'firebase-admin/auth';

const UpdateWorkOrderInputSchema = z.object({
  id: z.string().min(1, 'Work Order ID is required'),
  technicianId: z.string().optional(),
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
    auth: (auth) => !!auth?.uid,
  },
  async (input, context) => {
    const workOrderRef = db.collection('work-orders').doc(input.id);
    const workOrderDoc = await workOrderRef.get();
    if (!workOrderDoc.exists) {
        throw new Error("Work order not found.");
    }
    const workOrderData = workOrderDoc.data();

    const { id, ...dataToUpdate } = input;
    await workOrderRef.update(dataToUpdate);

    // Log audit event
    if (!context.auth) {
        throw new Error("Not authorized for audit logging.");
    }
    const adminAuth = getAuth();
    const user = await adminAuth.getUser(context.auth.uid);

    await db.collection('audit-log').add({
        user: {
            id: context.auth.uid,
            name: user.displayName || 'System'
        },
        action: 'UPDATE',
        entity: 'Work Order',
        entityId: id,
        entityName: workOrderData?.title || 'Unknown Work Order',
        companyId: workOrderData?.companyId,
        timestamp: formatISO(new Date()),
    });
  }
);
