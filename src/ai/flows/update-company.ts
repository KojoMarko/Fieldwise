
'use server';
/**
 * @fileOverview A flow for updating company information.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { UpdateCompanyInputSchema } from '@/lib/schemas';

export type UpdateCompanyInput = z.infer<typeof UpdateCompanyInputSchema>;

export async function updateCompany(input: UpdateCompanyInput): Promise<void> {
  return updateCompanyFlow(input);
}

const updateCompanyFlow = ai.defineFlow(
  {
    name: 'updateCompanyFlow',
    inputSchema: UpdateCompanyInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const { id, ...dataToUpdate } = input;
    const companyRef = db.collection('companies').doc(id);

    await companyRef.update(dataToUpdate);
  }
);
