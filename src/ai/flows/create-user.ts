
'use server';
/**
 * @fileOverview A flow for creating a new user.
 * This is an admin-only action. It creates a user in Firebase Auth and
 * saves their profile to Firestore.
 *
 * - createUser - A function that handles the user creation process.
 * - CreateUserInput - The input type for the createUser function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { User } from '@/lib/types';
import { CreateUserInputSchema } from '@/lib/schemas';
import { db, auth } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email/send-email';

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

const CreateUserOutputSchema = z.object({
  uid: z.string().describe('The new user ID.'),
  email: z.string().describe('The email of the new user.'),
});
export type CreateUserOutput = z.infer<typeof CreateUserOutputSchema>;

export async function createUser(input: CreateUserInput): Promise<CreateUserOutput> {
  return createUserFlow(input);
}

const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: CreateUserOutputSchema,
  },
  async (input) => {
    try {
        // 1. Check if user already exists in Firestore
        const usersRef = db.collection('users');
        const existingUserQuery = await usersRef.where('email', '==', input.email).limit(1).get();

        if (!existingUserQuery.empty) {
            throw new Error(`A user with the email address "${input.email}" already exists in the database.`);
        }

        // 2. Create a temporary password
        const tempPassword = Math.random().toString(36).slice(-8);

        // 3. Create the user in Firebase Auth
        const userRecord = await auth.createUser({
            email: input.email,
            password: tempPassword,
            displayName: input.name,
        });

        // 4. Create the user profile in Firestore
        const userDocRef = db.collection('users').doc(userRecord.uid);
        const newUser: User = {
            id: userRecord.uid,
            name: input.name,
            email: input.email,
            role: input.role,
            companyId: input.companyId,
            avatarUrl: `https://picsum.photos/seed/${userRecord.uid}/100/100`, // Generate a consistent avatar
        };

        await userDocRef.set(newUser);
        
        // 5. Send welcome email with credentials
        await sendEmail(
            newUser.email,
            "Welcome to FieldWise - Your Account is Ready",
            newUser.name,
            tempPassword
        );


        return {
            uid: userRecord.uid,
            email: userRecord.email!,
        };
    } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
            throw new Error(`A user with the email address "${input.email}" already exists.`);
        }
        // Re-throw other errors, including our custom one
        throw error;
    }
  }
);
