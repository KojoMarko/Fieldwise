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

export const ServiceReportQuestionnaireSchema = z.object({
  workPerformed: z.string().describe('A summary of the work that was performed by the technician.'),
  partsUsed: z.string().describe('A comma-separated list of parts that were used during the service.'),
  finalObservations: z.string().describe('Any final observations or recommendations the technician has.'),
  customerFeedback: z.string().describe('Any feedback or comments provided by the customer on-site.'),
});
export type ServiceReportQuestionnaire = z.infer<typeof ServiceReportQuestionnaireSchema>;


const GenerateServiceReportInputSchema = ServiceReportQuestionnaireSchema.extend({
    workOrderTitle: z.string().describe('The title of the work order.'),
    assetName: z.string().describe('The name of the asset that was serviced.'),
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
  prompt: `You are an expert technical writer specializing in creating professional service reports for a field service company. Your task is to generate a comprehensive and well-formatted service report based on the questionnaire answers provided by a technician.

The report should be structured, clear, and written in a professional tone. It will be presented to the customer.

Use the following information from the technician's questionnaire to generate the report. The report should be in Markdown format.

**Work Order:** {{{workOrderTitle}}}
**Asset Serviced:** {{{assetName}}}

**Technician's Responses:**
- **Work Performed:** {{{workPerformed}}}
- **Parts Used:** {{{partsUsed}}}
- **Final Observations/Recommendations:** {{{finalObservations}}}
- **Customer On-Site Feedback:** {{{customerFeedback}}}


**Instructions:**
1.  **Summary of Work:** Start with a clear and concise summary of the work performed.
2.  **Detailed Breakdown:** Elaborate on the steps taken during the service.
3.  **Parts:** If parts were used, list them clearly. If no parts were mentioned, state "No parts were required for this service."
4.  **Technician's Observations:** Detail any important observations or recommendations for future maintenance.
5.  **Conclusion:** Conclude the report professionally.

Generate the final report text based on these instructions.`,
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
