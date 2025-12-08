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
import type { SparePart, Location } from '@/lib/types';
import * as xlsx from 'xlsx';

const SparePartFromDocSchema = z.object({
  name: z.string().describe('The descriptive name of the spare part.'),
  partNumber: z.string().describe('The unique manufacturer part number.'),
  assetModel: z.string().describe('The equipment model these parts are for (e.g., "Vitros 5600", "Diapro Elisa Analyzer").'),
});

const ExtractAndCreatePartsInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A document containing spare parts, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'"
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
  input: { schema: z.object({ documentText: z.string() }) },
  output: { schema: ExtractAndCreatePartsOutputSchema },
  prompt: `You are an expert at analyzing technical documents, service manuals and spreadsheets.
Analyze the following document content and extract a list of all spare parts mentioned.
The document may contain thousands of records. Be thorough and extract every single one.
For each part, identify its name, its corresponding part number, and the specific equipment model it is for.
Return the data as a list of objects.

Document Content:
{{{documentText}}}`,
});

const extractAndCreatePartsFlow = ai.defineFlow(
  {
    name: 'extractAndCreatePartsFlow',
    inputSchema: ExtractAndCreatePartsInputSchema,
    outputSchema: z.object({ count: z.number() }),
  },
  async ({ fileDataUri, companyId }) => {
    
    let documentText = '';
    const mimeType = fileDataUri.substring(fileDataUri.indexOf(':') + 1, fileDataUri.indexOf(';'));
    const base64Data = fileDataUri.substring(fileDataUri.indexOf(',') + 1);

    if (
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
        mimeType === 'application/vnd.ms-excel' // .xls
    ) {
        const buffer = Buffer.from(base64Data, 'base64');
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        documentText = xlsx.utils.sheet_to_csv(worksheet);
    } else {
         // For other supported types like PDF, doc, txt, the LLM can handle it.
        // We re-wrap it in a new data URI to be passed to a different prompt that expects a `media` field.
         const mediaPrompt = ai.definePrompt({
          name: 'extractPartsFromMediaPrompt',
          input: { schema: z.object({ fileDataUri: z.string() }) },
          output: { schema: ExtractAndCreatePartsOutputSchema },
          prompt: `You are an expert at analyzing technical documents and service manuals.
        Analyze the following document and extract a list of all spare parts mentioned.
        For each part, identify its name, its corresponding part number, and the specific equipment model it is for.
        Return the data as a list of objects.

        Document: {{media url=fileDataUri}}`,
        });

        const { output } = await mediaPrompt({ fileDataUri });
        
        if (!output || !output.parts || output.parts.length === 0) {
          return { count: 0 };
        }
        documentText = JSON.stringify(output.parts); // Convert to string to reuse logic below
    }


    let output;
    try {
        const result = await prompt({ documentText });
        output = result.output;
    } catch (error: any) {
        console.error(`[AI Part Extraction Error]: ${error.message}`);
        throw new Error("The AI model could not process the document's content.");
    }
    

    if (!output || !output.parts || output.parts.length === 0) {
      return { count: 0 };
    }
    
    // Find a default location for the imported parts
    const locationsRef = db.collection('locations');
    const locationsQuery = await locationsRef.where('companyId', '==', companyId).get();
    let defaultLocation = 'Unspecified';
    if (!locationsQuery.empty) {
        const locations = locationsQuery.docs.map(doc => doc.data() as Location);
        const centralWarehouse = locations.find(loc => loc.name.toLowerCase() === 'central warehouse');
        const firstWarehouse = locations.find(loc => loc.type === 'Warehouse');
        if (centralWarehouse) {
            defaultLocation = centralWarehouse.name;
        } else if (firstWarehouse) {
            defaultLocation = firstWarehouse.name;
        } else {
            defaultLocation = locations[0].name; // fallback to the first location found
        }
    }


    // Filter for unique parts based on partNumber
    const uniqueParts = new Map<string, z.infer<typeof SparePartFromDocSchema>>();
    output.parts.forEach((part) => {
        const uniqueKey = `${part.partNumber}-${part.assetModel}`.toLowerCase();
        if (part.partNumber && !uniqueParts.has(uniqueKey)) {
            uniqueParts.set(uniqueKey, part);
        }
    });

    // Create a batch write to Firestore
    const batch = db.batch();
    const sparePartsCollection = db.collection('spare-parts');
    
    uniqueParts.forEach((part) => {
        const sparePartRef = sparePartsCollection.doc();
        const newSparePart: SparePart = {
            id: sparePartRef.id,
            name: part.name,
            partNumber: part.partNumber,
            assetModel: part.assetModel,
            companyId: companyId,
            quantity: 0, 
            location: defaultLocation,
        };
        batch.set(sparePartRef, newSparePart);
    });

    await batch.commit();

    return {
      count: uniqueParts.size,
    };
  }
);
