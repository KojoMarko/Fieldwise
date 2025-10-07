
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
  },
  async (input) => {
    const sparePartRef = db.collection('spare-parts').doc();
    const newSparePart: SparePart = {
        ...input,
        id: sparePartRef.id,
    };

    await sparePartRef.set(newSparePart);
    
    return {
      id: sparePartRef.id,
    };
  }
);
