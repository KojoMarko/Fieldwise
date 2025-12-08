
'use server';
/**
 * @fileOverview A flow for deleting a location.
 *
 * - deleteLocation - A function that handles the location deletion process.
 * - DeleteLocationInput - The input type for the deleteLocation function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';

const DeleteLocationInputSchema = z.object({
    locationId: z.string().min(1, 'Location ID is required'),
});

export type DeleteLocationInput = z.infer<typeof DeleteLocationInputSchema>;

export async function deleteLocation(input: DeleteLocationInput): Promise<void> {
  return deleteLocationFlow(input);
}

const deleteLocationFlow = ai.defineFlow(
  {
    name: 'deleteLocationFlow',
    inputSchema: DeleteLocationInputSchema,
    outputSchema: z.void(),
    auth: (auth) => {
      if (!auth) throw new Error('Authorization required.');
    },
  },
  async (input) => {
    const locationRef = db.collection('locations').doc(input.locationId);
    await locationRef.delete();
  }
);
