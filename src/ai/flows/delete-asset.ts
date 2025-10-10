
'use server';
/**
 * @fileOverview A flow for deleting an asset.
 *
 * - deleteAsset - A function that handles the asset deletion process.
 * - DeleteAssetInput - The input type for the deleteAsset function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { DeleteAssetInputSchema } from '@/lib/schemas';

export type DeleteAssetInput = z.infer<typeof DeleteAssetInputSchema>;

export async function deleteAsset(input: DeleteAssetInput): Promise<void> {
  return deleteAssetFlow(input);
}

const deleteAssetFlow = ai.defineFlow(
  {
    name: 'deleteAssetFlow',
    inputSchema: DeleteAssetInputSchema,
    outputSchema: z.void(),
    auth: (auth) => {
      if (!auth) throw new Error('Authorization required.');
    },
  },
  async (input) => {
    const assetRef = db.collection('assets').doc(input.assetId);
    
    await assetRef.delete();
  }
);
