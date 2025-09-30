
'use server';
/**
 * @fileOverview A flow for creating a new user.
 * This is an admin-only action. It creates a user in Firebase Auth and
 * saves their profile to Firestore.
 *
 * - createUser - A function that handles the user creation process.
 * - CreateUserInput - The input type for the createUser function
 */
import { config } from 'dotenv';
config();

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { User } from '@/lib/types';
import { CreateUserInputSchema } from '@/lib/schemas';

// Ensure Firebase Admin is initialized
if (!getApps().length) {
  const serviceAccountJson = process.env.FIREBASE_ADMIN_CREDENTIAL;
  if (!serviceAccountJson) {
    throw new Error(
      'FIREBASE_ADMIN_CREDENTIAL environment variable is not set. Please add it to your .env file.'
    );
  }
  try {
    // Sometimes, the env var can have escaped newlines.
    const sanitizedJson = serviceAccountJson.replace(/\\n/g, '\n');
    initializeApp({
      credential: cert(JSON.parse(sanitizedJson)),
    });
  } catch (error: any) {
    throw new Error(
      `Failed to parse FIREBASE_ADMIN_CREDENTIAL. Make sure it is a valid JSON string. Original error: ${error.message}`
    );
  }
}

const db = getFirestore();
const auth = getAuth();

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

const CreateUserOutputSchema = z.object({
  uid: z.string().describe('The new user ID.'),
  email: z.string().describe('The email of the new user.'),
  tempPassword: z.string().optional().describe('A temporary password for the new user.'),
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
    // 1. Create a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);

    // 2. Create the user in Firebase Auth
    const userRecord = await auth.createUser({
      email: input.email,
      password: tempPassword,
      displayName: input.name,
    });

    // 3. Create the user profile in Firestore
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

    return {
      uid: userRecord.uid,
      email: userRecord.email!,
      tempPassword: tempPassword,
    };
  }
);
