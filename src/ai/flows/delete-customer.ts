
'use server';
/**
 * @fileOverview A flow for deleting a customer.
 *
 * - deleteCustomer - A function that handles the customer deletion process.
 * - DeleteCustomerInput - The input type for the deleteCustomer function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { DeleteCustomerInputSchema } from '@/lib/schemas';

export type DeleteCustomerInput = z.infer<typeof DeleteCustomerInputSchema>;

export async function deleteCustomer(input: DeleteCustomerInput): Promise<void> {
  return deleteCustomerFlow(input);
}

const deleteCustomerFlow = ai.defineFlow(
  {
    name: 'deleteCustomerFlow',
    inputSchema: DeleteCustomerInputSchema,
    outputSchema: z.void(),
    auth: (auth) => {
      if (!auth) throw new Error('Authorization required.');
    },
  },
  async (input) => {
    const customerRef = db.collection('customers').doc(input.customerId);
    
    await customerRef.delete();
  }
);
