
'use server';
/**
 * @fileOverview A flow for creating a new resource document in Firestore.
 *
 * - createResource - A function that handles the resource creation process.
 * - CreateResourceInput - The input type for the createResource function.
 * - CreateResourceOutput - The return type for the createResource function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Resource } from '@/lib/types';
import { CreateResourceInputSchema } from '@/lib/schemas';
import { db } from '@/lib/firebase-admin';
import { formatISO } from 'date-fns';

export type CreateResourceInput = z.infer<typeof CreateResourceInputSchema>;

const CreateResourceOutputSchema = z.object({
  id: z.string().describe('The newly created resource ID.'),
});
export type CreateResourceOutput = z.infer<typeof CreateResourceOutputSchema>;

export async function createResource(input: CreateResourceInput): Promise<CreateResourceOutput> {
  return createResourceFlow(input);
}

const createResourceFlow = ai.defineFlow(
  {
    name: 'createResourceFlow',
    inputSchema: CreateResourceInputSchema,
    outputSchema: CreateResourceOutputSchema,
  },
  async (input) => {
    const resourceRef = db.collection('resources').doc();
    const newResource: Omit<Resource, 'id'> = {
      ...input,
      updatedDate: formatISO(new Date()),
      fileUrl: '#', // Placeholder for now
    };

    await resourceRef.set({
      ...newResource,
      id: resourceRef.id,
    });
    
    return {
      id: resourceRef.id,
    };
  }
);
