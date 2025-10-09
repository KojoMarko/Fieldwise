
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
import { formatISO } from 'date-fns';
import { getAuth } from 'firebase-admin/auth';

export type DeleteAssetInput = z.infer<typeof DeleteAssetInputSchema>;

export async function deleteAsset(input: DeleteAssetInput): Promise<void> {
  return deleteAssetFlow(input);
}

const deleteAssetFlow = ai.defineFlow(
  {
    name: 'deleteAssetFlow',
    inputSchema: DeleteAssetInputSchema,
    outputSchema: z.void(),
    auth: (auth) => auth,
  },
  async (input, auth) => {
    const assetRef = db.collection('assets').doc(input.assetId);
    const assetDoc = await assetRef.get();
    
    if (!assetDoc.exists) {
        throw new Error("Asset not found");
    }
    const assetData = assetDoc.data();

    await assetRef.delete();

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
        action: 'DELETE',
        entity: 'Asset',
        entityId: input.assetId,
        entityName: assetData?.name || 'Unknown Asset',
        companyId: assetData?.companyId,
        timestamp: formatISO(new Date()),
    });
  }
);
