
'use server';
/**
 * @fileOverview A flow for updating a user's profile information.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { UpdateUserInputSchema } from '@/lib/schemas';

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export async function updateUser(input: UpdateUserInput): Promise<void> {
  return updateUserFlow(input);
}

const updateUserFlow = ai.defineFlow(
  {
    name: 'updateUserFlow',
    inputSchema: UpdateUserInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const { id, ...dataToUpdate } = input;
    const userRef = db.collection('users').doc(id);

    await userRef.update(dataToUpdate);
  }
);
