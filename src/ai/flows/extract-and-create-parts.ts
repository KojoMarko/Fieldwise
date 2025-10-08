
'use server';
/**
 * @fileOverview A flow for extracting spare parts from a document and creating them.
 *
 * - extractAndCreateParts - A function that handles the part extraction and creation process.
 * - ExtractAndCreatePartsInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import type { SparePart } from '@/lib/types';

const SparePartFromDocSchema = z.object({
  name: z.string().describe('The descriptive name of the spare part.'),
  partNumber: z.string().describe('The unique manufacturer part number.'),
  assetModel: z.string().describe('The equipment model these parts are for (e.g., "Vitros 5600", "Diapro Elisa Analyzer").'),
});

const ExtractAndCreatePartsInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A document containing spare parts, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  companyId: z.string().describe('The ID of the company to associate the parts with.'),
});
export type ExtractAndCreatePartsInput = z.infer<typeof ExtractAndCreatePartsInputSchema>;

const ExtractAndCreatePartsOutputSchema = z.object({
  parts: z.array(SparePartFromDocSchema),
});
export type ExtractAndCreatePartsOutput = z.infer<typeof ExtractAndCreatePartsOutputSchema>;

export async function extractAndCreateParts(input: ExtractAndCreatePartsInput): Promise<{ count: number }> {
  return extractAndCreatePartsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractPartsFromDocPrompt',
  input: { schema: z.object({ fileDataUri: z.string() }) },
  output: { schema: ExtractAndCreatePartsOutputSchema },
  prompt: `You are an expert at analyzing technical documents and service manuals.
Analyze the following document and extract a list of all spare parts mentioned.
For each part, identify its name, its corresponding part number, and the specific equipment model it is for.
Return the data as a list of objects.

Document: {{media url=fileDataUri}}`,
});

const extractAndCreatePartsFlow = ai.defineFlow(
  {
    name: 'extractAndCreatePartsFlow',
    inputSchema: ExtractAndCreatePartsInputSchema,
    outputSchema: z.object({ count: z.number() }),
  },
  async ({ fileDataUri, companyId }) => {
    // Step 1: Extract parts from the document using the LLM
    const { output } = await prompt({ fileDataUri });

    if (!output || !output.parts || output.parts.length === 0) {
      return { count: 0 };
    }

    // Step 2: Iterate and create each part directly in Firestore
    const batch = db.batch();
    const sparePartsCollection = db.collection('spare-parts');
    
    output.parts.forEach((part) => {
        const sparePartRef = sparePartsCollection.doc();
        const newSparePart: SparePart = {
            id: sparePartRef.id,
            name: part.name,
            partNumber: part.partNumber,
            assetModel: part.assetModel,
            companyId: companyId,
            quantity: 0, // Default to 0, can be adjusted later
            location: 'Unspecified', // Default location
        };
        batch.set(sparePartRef, newSparePart);
    });

    // Step 3: Commit the batch
    await batch.commit();

    return {
      count: output.parts.length,
    };
  }
);
