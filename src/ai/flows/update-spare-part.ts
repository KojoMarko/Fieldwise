
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
    auth: (auth) => !!auth?.uid,
  },
  async (input, context) => {
    const { id, ...dataToUpdate } = input;
    const sparePartRef = db.collection('spare-parts').doc(id);
    const sparePartDoc = await sparePartRef.get();

    if (!sparePartDoc.exists) {
        throw new Error("Spare part not found");
    }
    const sparePartData = sparePartDoc.data();

    await sparePartRef.update(dataToUpdate);

    // Log audit event
    const adminAuth = getAuth();
    const user = await adminAuth.getUser(context.auth!.uid);

    await db.collection('audit-log').add({
        user: {
            id: context.auth?.uid,
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
