

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
import { formatISO } from 'date-fns';
import { getAuth } from 'firebase-admin/auth';

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
  async (input, { auth }) => {
    const customerRef = db.collection('customers').doc(input.customerId);
    const customerDoc = await customerRef.get();
    if (!customerDoc.exists) {
        throw new Error("Customer not found");
    }
    const customerData = customerDoc.data();

    await customerRef.delete();

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
        action: 'DELETE',
        entity: 'Customer',
        entityId: input.customerId,
        entityName: customerData?.name || 'Unknown Customer',
        companyId: customerData?.companyId,
        timestamp: formatISO(new Date()),
    });
  }
);

    