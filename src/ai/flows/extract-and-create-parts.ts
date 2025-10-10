
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
{{{documentText}}}
`,
});

const extractAndCreatePartsFlow = ai.defineFlow(
  {
    name: 'extractAndCreatePartsFlow',
    inputSchema: ExtractAndCreatePartsInputSchema,
    outputSchema: z.object({ count: z.number() }),
    auth: (auth) => {
      if (!auth) throw new Error('Authorization required.');
    },
  },
  async ({ fileDataUri, companyId }, { auth }) => {

    const mimeType = fileDataUri.substring(fileDataUri.indexOf(':') + 1, fileDataUri.indexOf(';'));
    let documentText = '';

    if (mimeType.includes('spreadsheetml') || mimeType.includes('excel')) {
        const base64Data = fileDataUri.substring(fileDataUri.indexOf(',') + 1);
        const buffer = Buffer.from(base64Data, 'base64');
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        
        let allSheetsText = '';
        workbook.SheetNames.forEach(sheetName => {
            allSheetsText += `Sheet: ${sheetName}\n\n`;
            const sheet = workbook.Sheets[sheetName];
            const sheetCsv = xlsx.utils.sheet_to_csv(sheet);
            allSheetsText += sheetCsv + '\n\n';
        });
        documentText = allSheetsText;

    } else {
        // For other document types, pass the data URI directly to the model
        // This is a simplified approach; ideally, we'd extract text for other formats too.
        const { output } = await ai.generate({
            prompt: `Extract all text content from the following document: {{media url="${fileDataUri}"}}`,
        });
        documentText = output.text;
    }

    // Step 1: Extract parts from the document using the LLM
    const { output } = await prompt({ documentText });

    if (!output || !output.parts || output.parts.length === 0) {
      return { count: 0 };
    }
    
    // Step 2: Ensure uniqueness based on partNumber
    const uniqueParts = new Map<string, z.infer<typeof SparePartFromDocSchema>>();
    output.parts.forEach((part) => {
        if (part.partNumber && !uniqueParts.has(part.partNumber)) {
            uniqueParts.set(part.partNumber, part);
        }
    });

    // Step 3: Iterate and create each unique part directly in Firestore
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
            quantity: 0, // Default to 0, can be adjusted later
            location: 'Unspecified', // Default location
        };
        batch.set(sparePartRef, newSparePart);
    });

    // Step 4: Commit the batch
    await batch.commit();

    return {
      count: uniqueParts.size,
    };
  }
);
