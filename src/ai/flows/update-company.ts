
'use server';
/**
 * @fileOverview A flow for updating company information.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { UpdateCompanyInputSchema } from '@/lib/schemas';
import { formatISO } from 'date-fns';
import { getAuth } from 'firebase-admin/auth';

export type UpdateCompanyInput = z.infer<typeof UpdateCompanyInputSchema>;

export async function updateCompany(input: UpdateCompanyInput): Promise<void> {
  return updateCompanyFlow(input);
}

const updateCompanyFlow = ai.defineFlow(
  {
    name: 'updateCompanyFlow',
    inputSchema: UpdateCompanyInputSchema,
    outputSchema: z.void(),
    auth: (auth) => {
      if (!auth) throw new Error('Authorization required.');
    },
  },
  async (input, { auth }) => {
    const { id, ...dataToUpdate } = input;
    const companyRef = db.collection('companies').doc(id);

    await companyRef.update(dataToUpdate);

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
        entity: 'Company',
        entityId: id,
        entityName: dataToUpdate.name,
        companyId: id, // For company updates, the companyId is the entityId
        timestamp: formatISO(new Date()),
    });
  }
);
