
'use server';
/**
 * @fileOverview A flow for creating a new customer.
 *
 * - createCustomer - A function that handles the customer creation process.
 * - CreateCustomerInput - The input type for the createCustomer function.
 * - CreateCustomerOutput - The return type for the createCustomer function.
 */
import { config } from 'dotenv';
config();

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import type { Customer } from '@/lib/types';
import { CreateCustomerInputSchema } from '@/lib/schemas';

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

export type CreateCustomerInput = z.infer<typeof CreateCustomerInputSchema>;

const CreateCustomerOutputSchema = z.object({
  id: z.string().describe('The newly created customer ID.'),
  name: z.string().describe('The name of the newly created customer.'),
});
export type CreateCustomerOutput = z.infer<typeof CreateCustomerOutputSchema>;

export async function createCustomer(input: CreateCustomerInput): Promise<CreateCustomerOutput> {
  return createCustomerFlow(input);
}

const createCustomerFlow = ai.defineFlow(
  {
    name: 'createCustomerFlow',
    inputSchema: CreateCustomerInputSchema,
    outputSchema: CreateCustomerOutputSchema,
  },
  async (input) => {
    const customerRef = db.collection('customers').doc();
    const newCustomer: Customer = {
        ...input,
        id: customerRef.id,
    };

    await customerRef.set(newCustomer);
    
    return {
      id: customerRef.id,
      name: newCustomer.name,
    };
  }
);
