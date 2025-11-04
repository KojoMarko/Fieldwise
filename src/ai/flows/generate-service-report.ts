
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

const GenerateServiceReportInputSchema = ServiceReportQuestionnaireSchema.extend({
    workOrderId: z.string().describe("The ID of the work order."),
    assetName: z.string().describe("The name of the asset that was serviced."),
    assetModel: z.string().describe("The model of the asset."),
    assetSerial: z.string().describe("The serial number of the asset."),
    companyName: z.string().describe('The name of the engineering/service company.'),
    companyAddress: z.string().describe('The address of the engineering/service company.'),
    clientName: z.string().describe('The name of the client company.'),
    clientAddress: z.string().describe('The address of the client.'),
    preparedBy: z.string().describe("The name of the engineer who prepared the report."),
    completionDate: z.string().describe("The date the work was completed."),
});
export type GenerateServiceReportInput = z.infer<typeof GenerateServiceReportInputSchema>;


const ReportDataSchema = z.object({
    account: z.object({ name: z.string(), address: z.string() }),
    asset: z.object({ model: z.string(), serialNumber: z.string(), idNumber: z.string() }),
    customer: z.object({ contact: z.string(), purchaseOrder: z.string(), propertyNumber: z.string() }),
    agreement: z.object({ type: z.string(), number: z.string(), effectiveDates: z.string() }),
    case: z.object({ number: z.string(), createdDate: z.string() }),
    workOrder: z.object({
        number: z.string(),
        completionDate: z.string(),
        performedBy: z.string(),
        instrumentCondition: z.string()
    }),
    summary: z.object({
        reportedProblem: z.string().describe("The problem as reported by the customer, professionally rephrased."),
        symptomSummary: z.string().describe("A clear, professional summary of the observed symptoms."),
        problemSummary: z.string().describe("A clear, professional summary of the identified root cause."),
        resolutionSummary: z.string().describe("A clear, professional summary of the corrective actions taken."),
        verificationOfActivity: z.string().describe("How the resolution was verified, professionally rephrased.")
    }),
    labor: z.array(z.object({
        startDate: z.string(),
        endDate: z.string(),
        description: z.string(),
        hours: z.number(),
        rate: z.string(),
        total: z.string(),
        customerCharge: z.string(),
    })),
    parts: z.array(z.object({
        partNumber: z.string(),
        description: z.string(),
        quantity: z.number(),
        price: z.number(),
    })),
    customerCallOriginator: z.string(),
    signingPerson: z.string(),
    technicianName: z.string(),
});


const GenerateServiceReportOutputSchema = z.object({
  report: z.string().describe('A JSON string containing the structured service report data.'),
});
export type GenerateServiceReportOutput = z.infer<typeof GenerateServiceReportOutputSchema>;


export async function generateServiceReport(input: GenerateServiceReportInput): Promise<GenerateServiceReportOutput> {
  return generateServiceReportFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateServiceReportPrompt',
    input: { schema: GenerateServiceReportInputSchema },
    output: { schema: ReportDataSchema },
    prompt: `You are an expert technical writer for a field service company.
    Your task is to take the raw notes from an engineer's service questionnaire and transform them into a professional, well-written service report.
    
    Review the following fields from the questionnaire:
    - reportedProblem
    - symptomSummary
    - problemSummary
    - resolutionSummary
    - verificationOfActivity

    For each of these fields, correct any grammar or spelling mistakes, improve the phrasing, and ensure the tone is professional and clear for the end customer. Do not change the core meaning of the notes.
    
    Then, assemble all the provided information into the required JSON output format. Fill in placeholders like 'N/A' for any data that is not provided in the input.

    --- ENGINEER'S QUESTIONNAIRE INPUT ---
    Work Order ID: {{{workOrderId}}}
    Asset Name: {{{assetName}}}
    Asset Model: {{{assetModel}}}
    Asset Serial: {{{assetSerial}}}
    Company Name: {{{companyName}}}
    Company Address: {{{companyAddress}}}
    Client Name: {{{clientName}}}
    Client Address: {{{clientAddress}}}
    Engineer: {{{preparedBy}}}
    Completion Date: {{{completionDate}}}

    Reported Problem: {{{reportedProblem}}}
    Symptom Summary: {{{symptomSummary}}}
    Problem Summary/Root Cause: {{{problemSummary}}}
    Resolution Summary: {{{resolutionSummary}}}
    Verification of Activity: {{{verificationOfActivity}}}
    Final Instrument Condition: {{{instrumentCondition}}}
    
    Agreement Type: {{{agreementType}}}
    Labor Hours: {{{laborHours}}}
    Start Time: {{{timeWorkStarted}}}
    End Time: {{{timeWorkCompleted}}}
    
    Parts Used:
    {{#each partsUsed}}
    - Part: {{this.description}} (PN: {{this.partNumber}}), Qty: {{this.quantity}}
    {{/each}}
    
    Signing Person: {{{signingPerson}}}
    --- END OF INPUT ---
    
    Now, generate the final, polished service report in the required JSON format.
    `,
});


const generateServiceReportFlow = ai.defineFlow(
  {
    name: 'generateServiceReportFlow',
    inputSchema: GenerateServiceReportInputSchema,
    outputSchema: GenerateServiceReportOutputSchema,
  },
  async (input) => {
    // The AI will now handle the rephrasing and structuring.
    const { output } = await prompt(input);
    
    if (!output) {
      throw new Error("AI failed to generate a report.");
    }
    
    // The prompt now directly returns the structured data, so we just need to stringify it.
    return {
      report: JSON.stringify(output),
    };
  }
);
