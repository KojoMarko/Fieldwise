
'use server';
/**
 * @fileOverview A flow for creating a new asset.
 *
 * - createAsset - A function that handles the asset creation process.
 * - CreateAssetInput - The input type for the createAsset function.
 * - CreateAssetOutput - The return type for the createAsset function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Asset } from '@/lib/types';
import { CreateAssetInputSchema } from '@/lib/schemas';
import { db } from '@/lib/firebase-admin';

export type CreateAssetInput = z.infer<typeof CreateAssetInputSchema>;

const CreateAssetOutputSchema = z.object({
  id: z.string().describe('The newly created asset ID.'),
});
export type CreateAssetOutput = z.infer<typeof CreateAssetOutputSchema>;

export async function createAsset(input: CreateAssetInput): Promise<CreateAssetOutput> {
  return createAssetFlow(input);
}

const createAssetFlow = ai.defineFlow(
  {
    name: 'createAssetFlow',
    inputSchema: CreateAssetInputSchema,
    outputSchema: CreateAssetOutputSchema,
  },
  async (input) => {
    const assetRef = db.collection('assets').doc();
    const newAsset: Asset = {
        ...input,
        id: assetRef.id,
    };

    await assetRef.set(newAsset);
    
    return {
      id: assetRef.id,
    };
  }
);
