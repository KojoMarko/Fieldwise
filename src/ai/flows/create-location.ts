
'use server';
/**
 * @fileOverview A flow for creating a new location.
 *
 * - createLocation - A function that handles the location creation process.
 * - CreateLocationInput - The input type for the createLocation function.
 * - CreateLocationOutput - The return type for the createLocation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Location } from '@/lib/types';
import { CreateLocationInputSchema } from '@/lib/schemas';
import { db } from '@/lib/firebase-admin';

export type CreateLocationInput = z.infer<typeof CreateLocationInputSchema>;

const CreateLocationOutputSchema = z.object({
  id: z.string().describe('The newly created location ID.'),
});
export type CreateLocationOutput = z.infer<typeof CreateLocationOutputSchema>;

export async function createLocation(input: CreateLocationInput): Promise<CreateLocationOutput> {
  return createLocationFlow(input);
}

const createLocationFlow = ai.defineFlow(
  {
    name: 'createLocationFlow',
    inputSchema: CreateLocationInputSchema,
    outputSchema: CreateLocationOutputSchema,
  },
  async (input) => {
    const locationRef = db.collection('locations').doc();
    const newLocation: Location = {
        ...input,
        id: locationRef.id,
    };

    await locationRef.set(newLocation);
    
    return {
      id: locationRef.id,
    };
  }
);
