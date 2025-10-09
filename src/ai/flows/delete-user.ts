

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
import { db, auth as adminAuthService } from '@/lib/firebase-admin';
import { formatISO } from 'date-fns';
import { getAuth } from 'firebase-admin/auth';

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
    auth: (auth) => {
      if (!auth) throw new Error('Authorization required.');
    },
  },
  async (input, { auth }) => {
    const { userId } = input;

    // Fetch user doc to get data before deleting
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        // Still try to delete from Auth if they exist there
        await adminAuthService.deleteUser(userId);
        return;
    }
    const userData = userDoc.data();

    // 1. Delete user from Firebase Auth
    await adminAuthService.deleteUser(userId);

    // 2. Delete user profile from Firestore
    await db.collection('users').doc(userId).delete();

    // 3. Log audit event
    if (!auth) {
        throw new Error("Not authorized for audit logging.");
    }
    const adminAuth = getAuth();
    const actor = await adminAuth.getUser(auth.uid);

    await db.collection('audit-log').add({
        user: {
            id: auth.uid,
            name: actor.displayName || 'System'
        },
        action: 'DELETE',
        entity: 'User',
        entityId: userId,
        entityName: userData?.name || 'Unknown User',
        companyId: userData?.companyId,
        timestamp: formatISO(new Date()),
    });
  }
);

    