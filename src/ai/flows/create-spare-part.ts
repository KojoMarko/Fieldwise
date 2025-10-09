
'use server';
/**
 * @fileOverview A flow for creating a new spare part.
 *
 * - createSparePart - A function that handles the spare part creation process.
 * - CreateSparePartInput - The input type for the createSparePart function.
 * - CreateSparePartOutput - The return type for the createSparePart function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { SparePart } from '@/lib/types';
import { CreateSparePartInputSchema } from '@/lib/schemas';
import { db } from '@/lib/firebase-admin';
import { formatISO } from 'date-fns';
import { getAuth } from 'firebase-admin/auth';

export type CreateSparePartInput = z.infer<typeof CreateSparePartInputSchema>;

const CreateSparePartOutputSchema = z.object({
  id: z.string().describe('The newly created spare part ID.'),
});
export type CreateSparePartOutput = z.infer<typeof CreateSparePartOutputSchema>;

export async function createSparePart(input: CreateSparePartInput): Promise<CreateSparePartOutput> {
  return createSparePartFlow(input);
}

const createSparePartFlow = ai.defineFlow(
  {
    name: 'createSparePartFlow',
    inputSchema: CreateSparePartInputSchema,
    outputSchema: CreateSparePartOutputSchema,
    auth: (auth) => !!auth?.uid,
  },
  async (input, context) => {
    const sparePartRef = db.collection('spare-parts').doc();
    const newSparePart: SparePart = {
        ...input,
        id: sparePartRef.id,
    };

    await sparePartRef.set(newSparePart);

    // Log audit event
    const adminAuth = getAuth();
    const user = await adminAuth.getUser(context.auth!.uid);

    await db.collection('audit-log').add({
        user: {
            id: context.auth?.uid,
            name: user.displayName || 'System'
        },
        action: 'CREATE',
        entity: 'Spare Part',
        entityId: sparePartRef.id,
        entityName: newSparePart.name,
        companyId: newSparePart.companyId,
        timestamp: formatISO(new Date()),
    });
    
    return {
      id: sparePartRef.id,
    };
  }
);
