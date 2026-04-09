
'use server';

/**
 * @fileOverview Implements a flow to generate a professional installation report from an engineer's questionnaire.
 *
 * - generateInstallationReport - A function that takes questionnaire answers and generates a detailed installation report.
 * - GenerateInstallationReportInput - The input type for the generateInstallationReport function.
 * - GenerateInstallationReportOutput - The return type for the generateInstallationReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { InstallationReportQuestionnaireSchema } from '@/lib/schemas';

const GenerateInstallationReportInputSchema = InstallationReportQuestionnaireSchema.extend({
    workOrderId: z.string().describe("The ID of the work order."),
    assetName: z.string().describe("The name of the asset that was installed."),
    assetModel: z.string().describe("The model of the asset."),
    assetSerial: z.string().describe("The serial number of the asset."),
    clientName: z.string().describe('The name of the client company.'),
    preparedBy: z.string().describe("The name of the engineer who performed the installation."),
    completionDate: z.string().describe("The date the installation was completed."),
});
export type GenerateInstallationReportInput = z.infer<typeof GenerateInstallationReportInputSchema>;


const ReportDataSchema = z.object({
    workOrder: z.object({
        number: z.string(),
        completionDate: z.string(),
        performedBy: z.string(),
    }),
    summary: z.object({
        preInstallationChecks: z.array(z.object({
            item: z.string(),
            requirements: z.string(),
            actual: z.string(),
            status: z.string(),
        })).describe("A professional summary of pre-installation checks in a structured format."),
        systemConfiguration: z.string().describe("A professional summary of the system configuration process."),
        testingAndValidation: z.string().describe("A clear summary of testing and validation outcomes."),
        customerTraining: z.string().describe("A summary of the training provided to the customer."),
        finalHandoverNotes: z.string().describe("Professional-sounding final handover notes."),
    }),
    signingPerson: z.string(),
});


const GenerateInstallationReportOutputSchema = z.object({
  report: z.string().describe('A JSON string containing the structured installation report data.'),
});
export type GenerateInstallationReportOutput = z.infer<typeof GenerateInstallationReportOutputSchema>;


export async function generateInstallationReport(input: GenerateInstallationReportInput): Promise<GenerateInstallationReportOutput> {
  return generateInstallationReportFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateInstallationReportPrompt',
    input: { schema: GenerateInstallationReportInputSchema },
    output: { schema: ReportDataSchema },
    prompt: `You are an expert technical writer specializing in equipment installation reports.
    Your task is to take the raw notes from an engineer's installation questionnaire and transform them into a professional, well-written report.
    
    Review the following fields from the questionnaire. Correct any grammar or spelling mistakes, improve the phrasing, and ensure the tone is professional and clear for the end customer. Do not change the core meaning of the notes.
    
    --- ENGINEER'S QUESTIONNAIRE INPUT ---
    Work Order ID: {{{workOrderId}}}
    Asset: {{{assetName}}} ({{{assetModel}}} / {{{assetSerial}}})
    Client: {{{clientName}}}
    Engineer: {{{preparedBy}}}
    Completion Date: {{{completionDate}}}

    Pre-installation Checks:
    {{#each preInstallationChecks}}
    - Item: {{this.item}}
      Requirement: {{this.requirements}}
      Actual: {{this.actual}}
      Status: {{this.status}}
    {{/each}}

    System Configuration Notes: {{{systemConfigurationNotes}}}
    Testing & Validation Summary: {{{testingAndValidationSummary}}}
    Customer Training Notes: {{{customerTrainingNotes}}}
    Final Handover Notes: {{{finalHandoverNotes}}}
    
    Signing Person: {{{signingPerson}}}
    --- END OF INPUT ---
    
    Now, generate the final, polished installation report in the required JSON format. The 'preInstallationChecks' in your output should be an array of objects, just like the input, but with professionalized text.
    `,
});


const generateInstallationReportFlow = ai.defineFlow(
  {
    name: 'generateInstallationReportFlow',
    inputSchema: GenerateInstallationReportInputSchema,
    outputSchema: GenerateInstallationReportOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    
    if (!output) {
      throw new Error("AI failed to generate an installation report.");
    }
    
    return {
      report: JSON.stringify(output),
    };
  }
);
