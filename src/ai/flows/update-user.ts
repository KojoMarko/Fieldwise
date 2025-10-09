
'use server';
/**
 * @fileOverview A flow for updating a user's profile information.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { UpdateUserInputSchema } from '@/lib/schemas';
import { formatISO } from 'date-fns';
import { getAuth } from 'firebase-admin/auth';

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export async function updateUser(input: UpdateUserInput): Promise<void> {
  return updateUserFlow(input);
}

const updateUserFlow = ai.defineFlow(
  {
    name: 'updateUserFlow',
    inputSchema: UpdateUserInputSchema,
    outputSchema: z.void(),
    auth: (auth) => !!auth?.uid,
  },
  async (input, context) => {
    const { id, ...dataToUpdate } = input;
    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new Error("User not found");
    }
    const userData = userDoc.data();

    // Firestore does not accept 'undefined' values. We need to clean the object.
    Object.keys(dataToUpdate).forEach(key => {
        const typedKey = key as keyof typeof dataToUpdate;
        if (dataToUpdate[typedKey] === undefined) {
            delete dataToUpdate[typedKey];
        }
    });

    await userRef.update(dataToUpdate);

    // Log audit event
    const adminAuth = getAuth();
    const actor = await adminAuth.getUser(context.auth!.uid);

    await db.collection('audit-log').add({
        user: {
            id: context.auth?.uid,
            name: actor.displayName || 'System'
        },
        action: 'UPDATE',
        entity: 'User',
        entityId: id,
        entityName: dataToUpdate.name,
        companyId: userData?.companyId,
        timestamp: formatISO(new Date()),
    });
  }
);
