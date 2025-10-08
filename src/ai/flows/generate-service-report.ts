
'use server';

/**
 * @fileOverview Implements a flow to generate a professional service report from a technician's questionnaire answers.
 *
 * - generateServiceReport - A function that takes questionnaire answers and generates a detailed service report.
 * - GenerateServiceReportInput - The input type for the generateServiceReport function.
 * - GenerateServiceReportOutput - The return type for the generateServiceReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { ServiceReportQuestionnaireSchema } from '@/lib/schemas';
import { findPartNumber } from './find-part-number';


const GenerateServiceReportInputSchema = ServiceReportQuestionnaireSchema.extend({
    workOrderTitle: z.string().describe('The title of the work order.'),
    assetName: z.string().describe('The name of the asset that was serviced.'),
    companyName: z.string().describe('The name of the engineering/service company.'),
    companyAddress: z.string().describe('The address of the engineering/service company.'),
    companyPhone: z.string().describe('The phone number of the engineering/service company.'),
    companyEmail: z.string().describe('The email of the engineering/service company.'),
    clientName: z.string().describe('The name of the client company.'),
    clientContact: z.string().describe('The name of the contact person at the client company.'),
    clientAddress: z.string().describe('The address of the client.'),
    preparedBy: z.string().describe("The name of the engineer who prepared the report."),
    workOrderId: z.string().describe("The ID of the work order."),
});
export type GenerateServiceReportInput = z.infer<typeof GenerateServiceReportInputSchema>;


const GenerateServiceReportOutputSchema = z.object({
  report: z.string().describe('The full, professionally formatted service report text, written in markdown.'),
});
export type GenerateServiceReportOutput = z.infer<typeof GenerateServiceReportOutputSchema>;


export async function generateServiceReport(input: GenerateServiceReportInput): Promise<GenerateServiceReportOutput> {
  return generateServiceReportFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateServiceReportPrompt',
  input: { schema: GenerateServiceReportInputSchema },
  output: { schema: GenerateServiceReportOutputSchema },
  tools: [findPartNumber],
  prompt: `You are an expert technical writer for a field service company. Your task is to generate a comprehensive and elegantly formatted service report in Markdown based on the provided data.
The report must be clean, professional, and easy to read.
**Crucially, you must not use any markdown tables.** Use headings, bolded labels, and paragraphs.

**Report Data:**

*   **Report ID:** ESR-{{{workOrderId}}}
*   **Date:** Today's Date (Format: MM/DD/YYYY)

**Formatting Instructions:**

1.  **Main Header:**
    *   Start with a main heading: \`# Engineering Service Report\`
    *   On the next line, add: \`**CONFIDENTIAL** | **Rev. 1.0**\`
    *   On the next line, add: \`Report ID: ESR-{{{workOrderId}}} | Date: \` followed by today's date.
    *   Add a horizontal rule (\`---\`) after this header block.

2.  **Information Sections (Do NOT use tables):**
    *   Create a section with the heading: \`## Company Information\`
        *   List the following details using bold labels: \`**Company Name:** {{{companyName}}}\`, \`**Address:** {{{companyAddress}}}\`, \`**Phone:** {{{companyPhone}}}\`, \`**Email:** {{{companyEmail}}}\`.
    *   Create a section with the heading: \`## Client Information\`
        *   List the following details using bold labels: \`**Client Name:** {{{clientName}}}\`, \`**Contact Person:** {{{clientContact}}}\`, \`**Client Address:** {{{clientAddress}}}\`.
    *   Create a section with the heading: \`## Service & Asset Information\`
        *   List the following details using bold labels: \`**Work Order Title:** {{{workOrderTitle}}}\`, \`**Asset Serviced:** {{{assetName}}}\`, \`**Service Start Date:** {{{timeWorkStarted}}}\`, \`**Service Completion Date:** {{{timeWorkCompleted}}}\`, \`**Service Type:** {{{type}}}\`, \`**Prepared By:** {{{preparedBy}}}\`.

3.  **Detailed Report Section:**
    *   Create a main heading: \`## Service Details\`
    *   Under this, create subsections using \`###\` for each of the following: "Summary of Work Performed", "Root Cause Analysis", "Parts Consumed", and "Final Observations & Recommendations".
    *   For "Summary of Work Performed", use the content from \`{{{workPerformed}}}\`.
    *   For "Root Cause Analysis", state the cause and failure code: "The identified root cause for the issue was **{{{rootCause}}}**. (Failure Code: {{{failureCode}}})".
    *   For "Parts Consumed", use the content from \`{{{partsUsed}}}\`. If the 'findPartNumber' tool returns a valid part number, include it in parentheses next to the part name. If no parts were used, state "None".
    *   For "Final Observations & Recommendations", use the content from \`{{{finalObservations}}}\`.
    *   If \`{{{followUpNeeded}}}\` is true, create a final subsection "### Required Follow-Up Actions" and describe what is needed.

**Example of a correctly formatted section:**

## Client Information
**Client Name:** St. Mary's Hospital
**Contact Person:** Dr. Eleanor Vance
**Client Address:** 456 Health Ave, Meditown

This format is professional and easy to read. Do not use tables.`,
});

const generateServiceReportFlow = ai.defineFlow(
  {
    name: 'generateServiceReportFlow',
    inputSchema: GenerateServiceReportInputSchema,
    outputSchema: GenerateServiceReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
