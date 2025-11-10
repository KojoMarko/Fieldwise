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
import { ResourceSchema } from '@/lib/schemas';
import { db } from '@/lib/firebase-admin';

export type CreateResourceInput = z.infer<typeof ResourceSchema>;

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
    inputSchema: ResourceSchema,
    outputSchema: CreateResourceOutputSchema,
  },
  async (input) => {
    const resourceRef = db.collection('resources').doc();
    
    // The schema includes an optional ID, but we want Firestore to generate it.
    const { id, ...resourceData } = input;
    
    const newResource = {
        ...resourceData,
        id: resourceRef.id,
    };

    // Firestore does not accept 'undefined' values. We need to clean the object.
    Object.keys(newResource).forEach(key => {
        const typedKey = key as keyof typeof newResource;
        if (newResource[typedKey] === undefined) {
            delete (newResource as any)[typedKey];
        }
    });

    await resourceRef.set(newResource);
    
    return {
      id: resourceRef.id,
    };
  }
);
