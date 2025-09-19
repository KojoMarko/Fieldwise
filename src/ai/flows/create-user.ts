
'use server';
/**
 * @fileOverview A flow for creating a new user.
 * This is an admin-only action. It creates a user in Firebase Auth and
 * saves their profile to Firestore.
 *
 * - createUser - A function that handles the user creation process.
 * - CreateUserInput - The input type for the createUser function.
 * - CreateUserOutput - The return type for the createUser function.
 */
import { config } from 'dotenv';
config();

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { CreateUserInputSchema } from '@/lib/schemas';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import type { User } from '@/lib/types';

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

const auth = getAuth();
const db = getFirestore();

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

const CreateUserOutputSchema = z.object({
  uid: z.string().describe('The newly created user ID.'),
  email: z.string().describe('The email of the new user.'),
  tempPassword: z.string().describe('The temporary password for the new user.'),
});
export type CreateUserOutput = z.infer<typeof CreateUserOutputSchema>;

export async function createUser(input: CreateUserInput): Promise<CreateUserOutput> {
  return createUserFlow(input);
}

// A simple password generator
function generatePassword() {
  const length = 8;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let retVal = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * n));
  }
  return retVal;
}


const createUserFlow = ai.defineFlow(
  {
    name: 'createUserFlow',
    inputSchema: CreateUserInputSchema,
    outputSchema: CreateUserOutputSchema,
  },
  async (input) => {
    const tempPassword = generatePassword();

    // 1. Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email: input.email,
      password: tempPassword,
      displayName: input.name,
      emailVerified: true,
      disabled: false,
    });

    // 2. Create user profile in Firestore
    const newUser: User = {
        id: userRecord.uid,
        name: input.name,
        email: input.email,
        role: input.role,
        companyId: input.companyId,
        avatarUrl: `https://picsum.photos/seed/${userRecord.uid}/100/100`,
    };

    await db.collection('users').doc(userRecord.uid).set(newUser);
    
    return {
      uid: userRecord.uid,
      email: userRecord.email!,
      tempPassword,
    };
  }
);
