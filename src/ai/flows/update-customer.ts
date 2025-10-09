

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
import { formatISO } from 'date-fns';
import { getAuth } from 'firebase-admin/auth';

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
  async (input, { auth }) => {
    const customerRef = db.collection('customers').doc(input.id);
    const customerDoc = await customerRef.get();
    if (!customerDoc.exists) {
        throw new Error("Customer not found");
    }
    const customerData = customerDoc.data();

    // The schema includes the ID, but we don't want to save it inside the document itself.
    const { id, ...dataToUpdate } = input;

    await customerRef.update(dataToUpdate);

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
        action: 'UPDATE',
        entity: 'Customer',
        entityId: id,
        entityName: dataToUpdate.name,
        companyId: customerData?.companyId,
        timestamp: formatISO(new Date()),
    });
  }
);

    