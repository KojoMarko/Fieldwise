
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
  async (input) => {
    const { id, ...dataToUpdate } = input;
    const sparePartRef = db.collection('spare-parts').doc(id);

    const cleanData = Object.fromEntries(Object.entries(dataToUpdate).filter(([_, v]) => v !== undefined));

    await sparePartRef.update(cleanData);
  }
);
