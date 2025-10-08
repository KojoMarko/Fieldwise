
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
  prompt: `You are an expert technical writer specializing in creating professional engineering service reports. Your task is to generate a comprehensive and elegantly formatted service report in Markdown based on the provided data. The report should be clean, readable, and avoid using markdown tables.

**Report Data:**

*   **Report ID:** ESR-{{{workOrderId}}}
*   **Date:** Today's Date (Format: MM/DD/YYYY)

**Engineering Firm Information:**
*   **Company Name:** {{{companyName}}}
*   **Address:** {{{companyAddress}}}
*   **Phone:** {{{companyPhone}}}
*   **Email:** {{{companyEmail}}}

**Client Information:**
*   **Client Name:** {{{clientName}}}
*   **Contact Person:** {{{clientContact}}}
*   **Client Address:** {{{clientAddress}}}

**Service & Asset Information:**
*   **Work Order Title:** {{{workOrderTitle}}}
*   **Asset Serviced:** {{{assetName}}}
*   **Service Start Date:** {{{timeWorkStarted}}}
*   **Service Completion Date:** {{{timeWorkCompleted}}}
*   **Service Type:** {{{type}}}
*   **Prepared By:** {{{preparedBy}}}

**Detailed Report Sections:**
*   **Time On-Site:** {{{timeOnSite}}}
*   **Work Performed Summary:** {{{workPerformed}}}
*   **Root Cause Analysis:** {{{rootCause}}} (Failure Code: {{{failureCode}}})
*   **Parts Consumed:** {{{partsUsed}}}
*   **Final Observations & Recommendations:** {{{finalObservations}}}
*   **Customer On-Site Feedback:** {{{customerFeedback}}}
*   **Follow-up Required:** {{{followUpNeeded}}}

**Formatting Instructions:**

1.  **Main Header:** Start with a main heading "# Engineering Service Report". Add "CONFIDENTIAL" and "Rev. 1.0" on the next line. Then include the Report ID and the current date. Add a horizontal rule (---) after this block.
2.  **Information Sections:** Create three distinct sections using "##" headings: "Company Information", "Client Information", and "Service & Asset Information".
    *   Under each heading, list the details using bold labels followed by the data (e.g., **Company Name:** {{{companyName}}}). Do NOT use tables.
3.  **Detailed Report Section:**
    *   Create a main heading "## Service Details".
    *   Under this, create subsections using "###" for each of the following: "Summary of Work Performed", "Root Cause Analysis", "Parts Consumed", "Final Observations & Recommendations".
    *   For "Parts Consumed", if the 'findPartNumber' tool returns a valid part number, include it in parentheses next to the part name.
    *   If "Follow-up Required" is true, create a final subsection "### Required Follow-Up Actions" and state what is needed.
4.  **Overall Style:** Use clear headings, paragraphs, and lists. The final output must be professional, well-structured, and easy to read. Do not use any markdown tables.`,
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
