
'use server';
/**
 * @fileOverview A flow for updating an existing asset.
 *
 * - updateAsset - A function that handles the asset update process.
 * - UpdateAssetInput - The input type for the updateAsset function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { UpdateAssetInputSchema } from '@/lib/schemas';
import { formatISO } from 'date-fns';

export type UpdateAssetInput = z.infer<typeof UpdateAssetInputSchema>;

export async function updateAsset(input: UpdateAssetInput): Promise<void> {
  return updateAssetFlow(input);
}

const updateAssetFlow = ai.defineFlow(
  {
    name: 'updateAssetFlow',
    inputSchema: UpdateAssetInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const assetRef = db.collection('assets').doc(input.id);

    // The schema includes the ID, but we don't want to save it inside the document itself.
    const { id, ...assetData } = input;
    
    const dataToUpdate = {
        ...assetData,
        // Ensure the date is in the correct string format for Firestore
        installationDate: formatISO(assetData.installationDate ? new Date(assetData.installationDate) : new Date()),
        lastPpmDate: assetData.lastPpmDate ? formatISO(new Date(assetData.lastPpmDate)) : undefined,
    };

    await assetRef.update(dataToUpdate);
  }
);
