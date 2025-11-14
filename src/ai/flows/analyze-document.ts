
'use server';
/**
 * @fileOverview A flow for analyzing an uploaded document to extract metadata.
 *
 * - analyzeDocument - A function that handles the document analysis process.
 * - AnalyzeDocumentInput - The input type for the analyzeDocument function.
 * - AnalyzeDocumentOutput - The return type for the analyzeDocument function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const AnalyzeDocumentInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The document file to be analyzed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
type AnalyzeDocumentInput = z.infer<typeof AnalyzeDocumentInputSchema>;


const AnalyzeDocumentOutputSchema = z.object({
  title: z.string().describe('The clear and concise title of the document.'),
  equipment: z.string().describe('The specific equipment model or name this document pertains to. If it applies to all, use "All Equipment".'),
  description: z.string().describe('A brief, one-sentence summary of the document\'s content.'),
  category: z.string().describe('A relevant category for the document (e.g., Chemistry, Hematology, Safety, Automation).'),
  type: z.enum(['Manual', 'Guide', 'Procedure', 'Reference', 'Standard']).describe('The type of document.'),
  pages: z.number().describe('The total number of pages in the document.'),
  version: z.string().describe('The version number or revision of the document (e.g., "Rev. 4.2", "v3.1").'),
});
type AnalyzeDocumentOutput = z.infer<typeof AnalyzeDocumentOutputSchema>;


export async function analyzeDocument(input: AnalyzeDocumentInput): Promise<AnalyzeDocumentOutput> {
  return analyzeDocumentFlow(input);
}

const prompt = ai.definePrompt({
    name: 'analyzeDocumentPrompt',
    input: { schema: AnalyzeDocumentInputSchema },
    output: { schema: AnalyzeDocumentOutputSchema },
    prompt: `You are an expert technical librarian. Analyze the following document and extract the required metadata.

Document: {{media url=fileDataUri}}

Based on the content of the document, provide the following information:
- Title: A clear and concise title.
- Equipment: The specific equipment model or name this document is for.
- Description: A brief summary of what the document contains.
- Category: The most relevant category for the document from options like Chemistry, Hematology, Safety, etc.
- Type: The type of document (Manual, Guide, etc.).
- Pages: The total number of pages.
- Version: The version number or revision.`,
});


const analyzeDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeDocumentFlow',
    inputSchema: AnalyzeDocumentInputSchema,
    outputSchema: AnalyzeDocumentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
