
'use server';
/**
 * @fileOverview A flow for updating an existing location.
 *
 * - updateLocation - A function that handles the location update process.
 * - UpdateLocationInput - The input type for the updateLocation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { UpdateLocationInputSchema } from '@/lib/schemas';

export type UpdateLocationInput = z.infer<typeof UpdateLocationInputSchema>;

export async function updateLocation(input: UpdateLocationInput): Promise<void> {
  return updateLocationFlow(input);
}

const updateLocationFlow = ai.defineFlow(
  {
    name: 'updateLocationFlow',
    inputSchema: UpdateLocationInputSchema,
    outputSchema: z.void(),
    auth: (auth) => {
      if (!auth) throw new Error('Authorization required.');
    },
  },
  async (input) => {
    const { id, ...dataToUpdate } = input;
    const locationRef = db.collection('locations').doc(id);
    await locationRef.update(dataToUpdate);
  }
);
