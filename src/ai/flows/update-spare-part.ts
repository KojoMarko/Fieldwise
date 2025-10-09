

'use server';
/**
 * @fileOverview A flow for updating a spare part's quantity.
 *
 * - updateSparePart - A function that handles updating the stock quantity.
 * - UpdateSparePartInput - The input type for the updateSparePart function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { UpdateSparePartInputSchema } from '@/lib/schemas';
import { formatISO } from 'date-fns';
import { getAuth } from 'firebase-admin/auth';

export type UpdateSparePartInput = z.infer<typeof UpdateSparePartInputSchema>;

export async function updateSparePart(input: UpdateSparePartInput): Promise<void> {
  return updateSparePartFlow(input);
}

const updateSparePartFlow = ai.defineFlow(
  {
    name: 'updateSparePartFlow',
    inputSchema: UpdateSparePartInputSchema,
    outputSchema: z.void(),
    auth: (auth) => {
      if (!auth) throw new Error('Authorization required.');
    },
  },
  async (input, { auth }) => {
    const { id, ...dataToUpdate } = input;
    const sparePartRef = db.collection('spare-parts').doc(id);
    const sparePartDoc = await sparePartRef.get();

    if (!sparePartDoc.exists) {
        throw new Error("Spare part not found");
    }
    const sparePartData = sparePartDoc.data();

    await sparePartRef.update(dataToUpdate);

    // Log audit event
    if (!auth) {
        throw new Error("Not authorized for audit logging.");
    }
    const adminAuth = getAuth();
    const user = await adminAuth.getUser(auth.uid);

    await db.collection('audit-log').add({
        user: {
            id: auth.uid,
            name: user.displayName || 'System'
        },
        action: 'UPDATE',
        entity: 'Spare Part',
        entityId: id,
        entityName: sparePartData?.name || 'Unknown Part',
        companyId: sparePartData?.companyId,
        timestamp: formatISO(new Date()),
    });
  }
);

    