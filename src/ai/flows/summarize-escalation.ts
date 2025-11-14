
'use server';
/**
 * @fileOverview A flow for summarizing an escalation document (e.g., PDF of emails).
 *
 * - summarizeEscalation - A function that handles the document summarization.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SummarizeEscalationInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "The escalation document to be summarized, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  assetBrand: z.string().describe('The asset brand this escalation pertains to.'),
});
type SummarizeEscalationInput = z.infer<typeof SummarizeEscalationInputSchema>;


const SummarizeEscalationOutputSchema = z.object({
  summary: z.string().describe('A concise, well-written summary of the escalation, suitable for a repair knowledge base.'),
});
type SummarizeEscalationOutput = z.infer<typeof SummarizeEscalationOutputSchema>;


export async function summarizeEscalation(input: SummarizeEscalationInput): Promise<SummarizeEscalationOutput> {
  return summarizeEscalationFlow(input);
}

const prompt = ai.definePrompt({
    name: 'summarizeEscalationPrompt',
    input: { schema: SummarizeEscalationInputSchema },
    output: { schema: SummarizeEscalationOutputSchema },
    prompt: `You are an expert technical writer and senior field service engineer. Your task is to summarize an escalation document regarding a technical issue with a piece of equipment.

The escalation is for a "{{assetBrand}}" machine.

Analyze the entire document, which contains emails, notes, and possibly diagrams. Your summary should be clear, concise, and structured to be useful for future troubleshooting. It must include:
1.  **Problem:** A brief statement of the initial reported problem.
2.  **Troubleshooting Steps:** A summary of the key diagnostic steps taken by the engineers.
3.  **Resolution:** The final solution, fix, or next recommended action.

Format the output as a single, easy-to-read text block. Do not use markdown.

Document to analyze: {{media url=fileDataUri}}
`,
});


const summarizeEscalationFlow = ai.defineFlow(
  {
    name: 'summarizeEscalationFlow',
    inputSchema: SummarizeEscalationInputSchema,
    outputSchema: SummarizeEscalationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error('AI failed to generate a summary for the escalation document.');
    }
    return output;
  }
);
