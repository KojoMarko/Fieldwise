
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
import { getAuth } from 'firebase-admin/auth';

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
    auth: (auth, input) => { // Auth policy
        if (!auth) {
            throw new Error("Not authorized.");
        }
        if (auth.uid) { // We can check claims here: (auth.claims.premium)
            return auth;
        }
        return false;
    }
  },
  async (input, auth) => {
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

    // Firestore does not accept 'undefined' values. We need to clean the object.
    Object.keys(newAsset).forEach(key => {
        const typedKey = key as keyof typeof newAsset;
        if (newAsset[typedKey] === undefined) {
            delete newAsset[typedKey];
        }
    });

    await assetRef.set({
      ...newAsset,
      id: assetRef.id
    });
    
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
        action: 'CREATE',
        entity: 'Asset',
        entityId: assetRef.id,
        entityName: newAsset.name,
        companyId: newAsset.companyId,
        timestamp: formatISO(new Date()),
    });

    return {
      id: assetRef.id,
    };
  }
);
