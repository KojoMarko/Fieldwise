'use server';
/**
 * @fileOverview A flow for updating an asset name for all assets of a specific model.
 *
 * - updateAssetNameForModel - A function that handles the bulk asset name update process.
 * - UpdateAssetNameForModelInput - The input type for the function.
 * - UpdateAssetNameForModelOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';

const UpdateAssetNameForModelInputSchema = z.object({
  modelName: z.string().describe('The model name to find and update.'),
  newAssetName: z.string().min(1, 'The new asset name is required.').describe('The new asset name to set.'),
  companyId: z.string().min(1, 'Company ID is required.'),
});
export type UpdateAssetNameForModelInput = z.infer<typeof UpdateAssetNameForModelInputSchema>;

const UpdateAssetNameForModelOutputSchema = z.object({
  updatedCount: z.number().describe('The number of assets that were updated.'),
});
export type UpdateAssetNameForModelOutput = z.infer<typeof UpdateAssetNameForModelOutputSchema>;


export async function updateAssetNameForModel(input: UpdateAssetNameForModelInput): Promise<UpdateAssetNameForModelOutput> {
  return updateAssetNameForModelFlow(input);
}

const updateAssetNameForModelFlow = ai.defineFlow(
  {
    name: 'updateAssetNameForModelFlow',
    inputSchema: UpdateAssetNameForModelInputSchema,
    outputSchema: UpdateAssetNameForModelOutputSchema,
  },
  async ({ modelName, newAssetName, companyId }) => {
    // 1. Find all assets matching the model name and company ID.
    const assetsQuery = db.collection('assets')
      .where('companyId', '==', companyId)
      .where('model', '==', modelName);
    
    const querySnapshot = await assetsQuery.get();

    if (querySnapshot.empty) {
      return { updatedCount: 0 };
    }

    // 2. Create a batch write to update the 'name' field for all found documents.
    const batch = db.batch();
    querySnapshot.forEach(doc => {
      const docRef = db.collection('assets').doc(doc.id);
      batch.update(docRef, { name: newAssetName });
    });

    // 3. Commit the batch.
    await batch.commit();

    // 4. Return the number of updated documents.
    return { updatedCount: querySnapshot.size };
  }
);
