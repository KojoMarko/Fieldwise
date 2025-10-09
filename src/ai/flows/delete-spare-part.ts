
'use server';
/**
 * @fileOverview A flow for deleting a spare part.
 *
 * - deleteSparePart - A function that handles the spare part deletion process.
 * - DeleteSparePartInput - The input type for the deleteSparePart function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { DeleteSparePartInputSchema } from '@/lib/schemas';
import { formatISO } from 'date-fns';
import { getAuth } from 'firebase-admin/auth';

export type DeleteSparePartInput = z.infer<typeof DeleteSparePartInputSchema>;

export async function deleteSparePart(input: DeleteSparePartInput): Promise<void> {
  return deleteSparePartFlow(input);
}

const deleteSparePartFlow = ai.defineFlow(
  {
    name: 'deleteSparePartFlow',
    inputSchema: DeleteSparePartInputSchema,
    outputSchema: z.void(),
    auth: (auth) => auth,
  },
  async (input, auth) => {
    const sparePartRef = db.collection('spare-parts').doc(input.partId);
    const sparePartDoc = await sparePartRef.get();
    if (!sparePartDoc.exists) {
        throw new Error("Spare part not found");
    }
    const sparePartData = sparePartDoc.data();

    await sparePartRef.delete();

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
        action: 'DELETE',
        entity: 'Spare Part',
        entityId: input.partId,
        entityName: sparePartData?.name || 'Unknown Part',
        companyId: sparePartData?.companyId,
        timestamp: formatISO(new Date()),
    });
  }
);
