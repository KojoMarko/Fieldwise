
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
import { formatISO } from 'date-fns';

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
    
    const newAsset: Omit<Asset, 'id'> = {
        ...input,
        installationDate: formatISO(input.installationDate ? new Date(input.installationDate) : new Date()),
        purchaseDate: input.purchaseDate ? formatISO(new Date(input.purchaseDate)) : undefined,
        warrantyExpiry: input.warrantyExpiry ? formatISO(new Date(input.warrantyExpiry)) : undefined,
        lastPpmDate: input.lastPpmDate ? formatISO(new Date(input.lastPpmDate)) : undefined,
        lifecycleNotes: input.lifecycleNotes ? input.lifecycleNotes.map(note => ({
            ...note,
            date: note.date ? formatISO(new Date(note.date)) : undefined,
        })) : [],
    };

    await assetRef.set({
      ...newAsset,
      id: assetRef.id
    });
    
    return {
      id: assetRef.id,
    };
  }
);
