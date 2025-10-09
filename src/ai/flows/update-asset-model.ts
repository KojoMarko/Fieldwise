
'use server';
/**
 * @fileOverview A flow for updating an asset model name across all assets.
 *
 * - updateAssetModel - A function that handles the bulk model update process.
 * - UpdateAssetModelInput - The input type for the function.
 * - UpdateAssetModelOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';

const UpdateAssetModelInputSchema = z.object({
  oldModelName: z.string().describe('The current model name to find.'),
  newModelName: z.string().min(1, 'The new model name is required.').describe('The new model name to set.'),
  companyId: z.string().min(1, 'Company ID is required.'),
});
export type UpdateAssetModelInput = z.infer<typeof UpdateAssetModelInputSchema>;

const UpdateAssetModelOutputSchema = z.object({
  updatedCount: z.number().describe('The number of assets that were updated.'),
});
export type UpdateAssetModelOutput = z.infer<typeof UpdateAssetModelOutputSchema>;


export async function updateAssetModel(input: UpdateAssetModelInput): Promise<UpdateAssetModelOutput> {
  return updateAssetModelFlow(input);
}

const updateAssetModelFlow = ai.defineFlow(
  {
    name: 'updateAssetModelFlow',
    inputSchema: UpdateAssetModelInputSchema,
    outputSchema: UpdateAssetModelOutputSchema,
  },
  async ({ oldModelName, newModelName, companyId }) => {
    // 1. Find all assets matching the old model name and company ID.
    const assetsQuery = db.collection('assets')
      .where('companyId', '==', companyId)
      .where('model', '==', oldModelName);
    
    const querySnapshot = await assetsQuery.get();

    if (querySnapshot.empty) {
      return { updatedCount: 0 };
    }

    // 2. Create a batch write to update all found documents.
    const batch = db.batch();
    querySnapshot.forEach(doc => {
      const docRef = db.collection('assets').doc(doc.id);
      batch.update(docRef, { model: newModelName });
    });

    // 3. Commit the batch.
    await batch.commit();

    // 4. Return the number of updated documents.
    return { updatedCount: querySnapshot.size };
  }
);
