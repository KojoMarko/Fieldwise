
'use server';
/**
 * @fileOverview A flow for creating a new customer.
 *
 * - createCustomer - A function that handles the customer creation process.
 * - CreateCustomerInput - The input type for the createCustomer function.
 * - CreateCustomerOutput - The return type for the createCustomer function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Customer } from '@/lib/types';
import { CreateCustomerInputSchema } from '@/lib/schemas';
import { db } from '@/lib/firebase-admin';

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
    // Check for duplicate customer name within the same company
    const customersRef = db.collection('customers');
    const existingCustomerQuery = await customersRef
      .where('name', '==', input.name)
      .where('companyId', '==', input.companyId)
      .limit(1)
      .get();

    if (!existingCustomerQuery.empty) {
      throw new Error(`A customer with the name "${input.name}" already exists.`);
    }

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
