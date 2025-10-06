
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
  prompt: `You are an expert technical writer specializing in creating professional engineering service reports. Your task is to generate a comprehensive and elegantly formatted service report in Markdown based on the provided data. The report should follow the structure of the example provided.

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

**Project Information:**
*   **Project Name:** {{{workOrderTitle}}}
*   **Asset Serviced:** {{{assetName}}}
*   **Service Start Date:** {{{timeWorkStarted}}}
*   **Service Completion Date:** {{{timeWorkCompleted}}}

**Report Details:**
*   **Service Type:** {{{type}}}
*   **Prepared By:** {{{preparedBy}}}
*   **Time On-Site:** {{{timeOnSite}}}
*   **Actual Work Performed (Summary):** {{{workPerformed}}}
*   **Root Cause Analysis:** {{{rootCause}}} (Failure Code: {{{failureCode}}})
*   **Parts Consumed:** {{{partsUsed}}}
*   **Final Observations & Recommendations:** {{{finalObservations}}}
*   **Customer On-Site Feedback:** {{{customerFeedback}}}
*   **Follow-up Required:** {{{followUpNeeded}}}

**Instructions:**

1.  **Header:** Start with a main heading "Engineering Service Report". Include "CONFIDENTIAL" and "Rev. 1.0" as subheadings. On the top right, include the Report ID and the current date.
2.  **Information Sections:** Create three main sections: "Engineering Firm Information", "Client Information", and "Project Information". Each section should have two columns.
    *   **Engineering Firm Info:** Show Company Name, Address, Phone, and Email.
    *   **Client Info:** Show Client Name, Contact Person, and Client Address.
    *   **Project Info:** Show Project Name (use Work Order Title), Project Number (use Work Order ID), Project Location (use Client Address), Service Start Date, and Service Completion Date.
3.  **Report Details Section:**
    *   Create a section for "Report Details".
    *   Include "Service Type" and "Prepared By".
    *   **Service Summary:** Provide a detailed narrative under a heading like "Summary of Work Performed". This should be based on the "Actual Work Performed" data.
    *   **Root Cause:** Under a heading "Root Cause Analysis", state the identified root cause and the failure code.
    *   **Parts:** Under a heading "Parts Consumed", list all parts from the "Parts Consumed" data. If the 'findPartNumber' tool returns a valid part number for any named part, include it.
    *   **Recommendations:** Under a heading "Final Observations & Recommendations", detail any important observations or recommendations for future maintenance.
    *   **Follow-Up:** If follow-up is needed, create a section "Required Follow-Up Actions" and state what is required.
4.  **Formatting:**
    *   Use Markdown for all formatting.
    *   Use headings (\`##\`, \`###\`) to structure the report.
    *   Use bold (\`**text**\`) for labels (e.g., **Company Name:**).
    *   Use lists for items like parts consumed.

Generate the final report text based on these instructions. The tone must be professional and the formatting clean and readable.`,
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


