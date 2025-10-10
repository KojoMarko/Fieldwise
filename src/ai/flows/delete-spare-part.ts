
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

export type DeleteSparePartInput = z.infer<typeof DeleteSparePartInputSchema>;

export async function deleteSparePart(input: DeleteSparePartInput): Promise<void> {
  return deleteSparePartFlow(input);
}

const deleteSparePartFlow = ai.defineFlow(
  {
    name: 'deleteSparePartFlow',
    inputSchema: DeleteSparePartInputSchema,
    outputSchema: z.void(),
    auth: (auth) => {
      if (!auth) throw new Error('Authorization required.');
    },
  },
  async (input) => {
    const sparePartRef = db.collection('spare-parts').doc(input.partId);

    await sparePartRef.delete();
  }
);
