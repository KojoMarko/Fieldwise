
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
import { formatISO } from 'date-fns';
import { getAuth } from 'firebase-admin/auth';

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
    auth: (auth) => {
      if (!auth) throw new Error('Authorization required.');
    },
  },
  async (input, { auth }) => {
    const customerRef = db.collection('customers').doc();
    const newCustomer: Customer = {
        ...input,
        id: customerRef.id,
    };

    await customerRef.set(newCustomer);

    // Log audit event
    if (!auth) {
        throw new Error("Not authorized for audit logging.");
    }
    const adminAuth = getAuth();
    const user = await adminAuth.getUser(auth.uid);
    
    await db.collection('audit-log').add({
        user: {
            id: auth.uid,
            name: user.displayName || 'System'
        },
        action: 'CREATE',
        entity: 'Customer',
        entityId: customerRef.id,
        entityName: newCustomer.name,
        companyId: newCustomer.companyId,
        timestamp: formatISO(new Date()),
    });
    
    return {
      id: customerRef.id,
      name: newCustomer.name,
    };
  }
);
