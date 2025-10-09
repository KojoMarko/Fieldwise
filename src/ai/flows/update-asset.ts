
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
import { getAuth } from 'firebase-admin/auth';

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
        return !!auth.uid;
    }
  },
  async (input, context) => {
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
    
    const assetDoc = await assetRef.get();
    const asset = assetDoc.data();

    // Log audit event
    if (!context.auth) {
        throw new Error("Not authorized for audit logging.");
    }
    const adminAuth = getAuth();
    const user = await adminAuth.getUser(context.auth.uid);

    await db.collection('audit-log').add({
        user: {
            id: context.auth.uid,
            name: user.displayName || 'System'
        },
        action: 'UPDATE',
        entity: 'Asset',
        entityId: id,
        entityName: dataToUpdate.name,
        companyId: asset?.companyId,
        timestamp: formatISO(new Date()),
    });
  }
);
