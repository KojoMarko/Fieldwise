
'use server';
/**
 * @fileOverview A flow for updating an existing customer.
 *
 * - updateCustomer - A function that handles the customer update process.
 * - UpdateCustomerInput - The input type for the updateCustomer function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { UpdateCustomerInputSchema } from '@/lib/schemas';

export type UpdateCustomerInput = z.infer<typeof UpdateCustomerInputSchema>;

export async function updateCustomer(input: UpdateCustomerInput): Promise<void> {
  return updateCustomerFlow(input);
}

const updateCustomerFlow = ai.defineFlow(
  {
    name: 'updateCustomerFlow',
    inputSchema: UpdateCustomerInputSchema,
    outputSchema: z.void(),
    auth: (auth) => {
      if (!auth) throw new Error('Authorization required.');
    },
  },
  async (input) => {
    // The schema includes the ID, but we don't want to save it inside the document itself.
    const { id, ...dataToUpdate } = input;
    const customerRef = db.collection('customers').doc(id);
    await customerRef.update(dataToUpdate);
  }
);
