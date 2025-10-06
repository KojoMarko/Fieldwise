
'use server';
/**
 * @fileOverview A flow for deleting a user.
 * This is an admin-only action. It deletes a user from Firebase Auth and
 * their profile from Firestore.
 *
 * - deleteUser - A function that handles the user deletion process.
 * - DeleteUserInput - The input type for the deleteUser function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db, auth } from '@/lib/firebase-admin';

const DeleteUserInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;

export async function deleteUser(input: DeleteUserInput): Promise<void> {
  return deleteUserFlow(input);
}

const deleteUserFlow = ai.defineFlow(
  {
    name: 'deleteUserFlow',
    inputSchema: DeleteUserInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const { userId } = input;

    // 1. Delete user from Firebase Auth
    await auth.deleteUser(userId);

    // 2. Delete user profile from Firestore
    await db.collection('users').doc(userId).delete();
  }
);
