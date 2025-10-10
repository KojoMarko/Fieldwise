
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
    auth: (auth) => {
      if (!auth) throw new Error('Authorization required.');
    },
  },
  async (input, { auth }) => {
    const { id, ...dataToUpdate } = input;
    const userRef = db.collection('users').doc(id);

    // Firestore does not accept 'undefined' values. We need to clean the object.
    Object.keys(dataToUpdate).forEach(key => {
        const typedKey = key as keyof typeof dataToUpdate;
        if (dataToUpdate[typedKey] === undefined) {
            delete dataToUpdate[typedKey];
        }
    });

    await userRef.update(dataToUpdate);
  }
);
