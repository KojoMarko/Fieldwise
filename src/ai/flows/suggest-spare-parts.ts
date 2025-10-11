
'use server';

/**
 * @fileOverview Implements the SuggestSpareParts flow to suggest frequently used spare parts based on the work order description and historical data.
 *
 * - suggestSpareParts - A function that takes a work order description as input and returns a list of suggested spare parts.
 * - SuggestSparePartsInput - The input type for the suggestSpareParts function.
 * - SuggestSparePartsOutput - The return type for the suggestSpareParts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const SuggestSparePartsInputSchema = z.object({
  workOrderDescription: z.string().describe('The description of the work order.'),
});
export type SuggestSparePartsInput = z.infer<typeof SuggestSparePartsInputSchema>;

const SuggestSparePartsOutputSchema = z.object({
  suggestedSpareParts: z
    .array(z.string())
    .describe('A list of suggested spare parts based on the work order description.'),
});
export type SuggestSparePartsOutput = z.infer<typeof SuggestSparePartsOutputSchema>;

export async function suggestSpareParts(input: SuggestSparePartsInput): Promise<SuggestSparePartsOutput> {
  return suggestSparePartsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSparePartsPrompt',
  input: {schema: SuggestSparePartsInputSchema},
  output: {schema: SuggestSparePartsOutputSchema},
  prompt: `You are an expert technician with extensive knowledge of spare parts for biomedical equipment.
  Based on the following work order description, suggest a list of spare parts that are frequently used for similar jobs.
  Return the spare parts as a list of strings.

  Work order description: {{{workOrderDescription}}}
  `,
});

const suggestSparePartsFlow = ai.defineFlow(
  {
    name: 'suggestSparePartsFlow',
    inputSchema: SuggestSparePartsInputSchema,
    outputSchema: SuggestSparePartsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
