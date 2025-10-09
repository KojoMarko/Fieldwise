
'use server';
/**
 * @fileOverview A flow for extracting assets from a document and creating them.
 *
 * - extractAndCreateAssets - A function that handles the asset extraction and creation process.
 * - ExtractAndCreateAssetsInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import type { Asset } from '@/lib/types';
import { formatISO } from 'date-fns';

const AssetFromDocSchema = z.object({
  name: z.string().describe('The common name of the asset or equipment.'),
  model: z.string().describe('The specific model number or name of the asset.'),
  serialNumber: z.string().describe('The unique serial number of the asset.'),
  location: z.string().describe('The physical location where the asset is installed (e.g., "Main Lab", "Room 204").'),
});

const ExtractAndCreateAssetsInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A document containing a list of assets, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  companyId: z.string().describe('The ID of the company to associate the assets with.'),
  customerId: z.string().optional().describe('An optional customer ID to assign all extracted assets to.'),
});
export type ExtractAndCreateAssetsInput = z.infer<typeof ExtractAndCreateAssetsInputSchema>;

const ExtractAndCreateAssetsOutputSchema = z.object({
  assets: z.array(AssetFromDocSchema),
});
export type ExtractAndCreateAssetsOutput = z.infer<typeof ExtractAndCreateAssetsOutputSchema>;

export async function extractAndCreateAssets(input: ExtractAndCreateAssetsInput): Promise<{ count: number }> {
  return extractAndCreateAssetsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractAssetsFromDocPrompt',
  input: { schema: z.object({ fileDataUri: z.string() }) },
  output: { schema: ExtractAndCreateAssetsOutputSchema },
  prompt: `You are an expert at analyzing inventory lists and technical documents.
Analyze the following document and extract a list of all assets mentioned.
For each asset, identify its name, model, serial number, and its location.
Return the data as a list of asset objects.

Document: {{media url=fileDataUri}}`,
});

const extractAndCreateAssetsFlow = ai.defineFlow(
  {
    name: 'extractAndCreateAssetsFlow',
    inputSchema: ExtractAndCreateAssetsInputSchema,
    outputSchema: z.object({ count: z.number() }),
  },
  async ({ fileDataUri, companyId, customerId }) => {
    let output;
    try {
      // Step 1: Extract assets from the document using the LLM
      const result = await prompt({ fileDataUri });
      output = result.output;
    } catch (error: any) {
      console.error(`[AI Asset Extraction Error]: ${error.message}`);
      // Re-throw a more user-friendly error to be caught by the frontend.
      throw new Error("The AI model is currently overloaded or unavailable. Please try again in a few moments.");
    }

    if (!output || !output.assets || output.assets.length === 0) {
      return { count: 0 };
    }

    // Step 2: Iterate and create each asset in Firestore
    const batch = db.batch();
    const assetsCollection = db.collection('assets');
    
    // In a real-world scenario, you might want to check for existing serial numbers
    // to avoid duplicates, but for now, we'll create them directly.

    output.assets.forEach((asset) => {
        const assetRef = assetsCollection.doc();
        const newAsset: Omit<Asset, 'id'> = {
            name: asset.name,
            model: asset.model,
            serialNumber: asset.serialNumber,
            location: asset.location,
            companyId: companyId,
            customerId: customerId || 'unassigned', // Assign to a specific customer or mark as unassigned
            status: 'Operational', // Default status
            installationDate: formatISO(new Date()), // Default to now
        };
        batch.set(assetRef, { ...newAsset, id: assetRef.id });
    });

    // Step 3: Commit the batch
    await batch.commit();

    return {
      count: output.assets.length,
    };
  }
);
