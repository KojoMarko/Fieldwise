
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
    auth: (auth, input) => {
        if (!auth) {
            throw new Error("Not authorized.");
        }
    }
  },
  async (input, { auth }) => {
    const assetRef = db.collection('assets').doc(input.id);

    // The schema includes the ID, but we don't want to save it inside the document itself.
    const { id, ...assetData } = input;
    
    const dataToUpdate: any = {
        ...assetData,
        // Ensure dates are in the correct string format for Firestore
        installationDate: assetData.installationDate ? formatISO(new Date(assetData.installationDate)) : undefined,
        purchaseDate: assetData.purchaseDate ? formatISO(new Date(assetData.purchaseDate)) : undefined,
        warrantyExpiry: assetData.warrantyExpiry ? formatISO(new Date(assetData.warrantyExpiry)) : undefined,
        lastPpmDate: assetData.lastPpmDate ? formatISO(new Date(assetData.lastPpmDate)) : undefined,
        lifecycleNotes: assetData.lifecycleNotes ? assetData.lifecycleNotes.map(note => ({
            ...note,
            date: note.date ? formatISO(new Date(note.date)) : undefined,
        })) : [],
    };

    // Firestore does not accept 'undefined' values. We need to clean the object.
    Object.keys(dataToUpdate).forEach(key => {
        if (dataToUpdate[key] === undefined) {
            delete dataToUpdate[key];
        }
        // Clean nested objects in lifecycleNotes
        if (key === 'lifecycleNotes' && Array.isArray(dataToUpdate[key])) {
            dataToUpdate[key].forEach((note: any) => {
                Object.keys(note).forEach(noteKey => {
                    if (note[noteKey] === undefined) {
                        delete note[noteKey];
                    }
                });
            });
        }
    });


    await assetRef.update(dataToUpdate);
  }
);
