
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
  output: { schema: GenerateServiceReportOutputSchema },
  tools: [findPartNumber],
  prompt: `You are an AI assistant that structures technical service data.
Your task is to take the provided JSON input from an engineer's questionnaire and return it as a JSON string within a 'report' field.
**Do not modify, interpret, or summarize the data.**
Simply structure the input data into the specified output format.

**Example Input:**
{
  "reportedProblem": "Machine not powering on.",
  "symptomSummary": "No lights, no response.",
  "problemSummary": "Power supply failure.",
  "resolutionSummary": "Replaced the main power supply unit.",
  ...
}

**Expected Output:**
{
  "report": "{\\"reportedProblem\\":\\"Machine not powering on.\\",\\"symptomSummary\\":\\"No lights, no response.\\",...}"
}

**Input Data:**
{{{json input}}}
`,
});

const generateServiceReportFlow = ai.defineFlow(
  {
    name: 'generateServiceReportFlow',
    inputSchema: GenerateServiceReportInputSchema,
    outputSchema: GenerateServiceReportOutputSchema,
  },
  async (input) => {
     // The AI's only job is to receive the structured data and return it as a JSON string.
    // All formatting will be handled by the React component.
    const reportData = {
        account: {
            name: input.companyName,
            address: input.companyAddress,
        },
        asset: {
            model: input.assetModel,
            serialNumber: input.assetSerial,
            idNumber: 'N/A' // Placeholder
        },
        customer: {
            contact: 'N/A', // Placeholder
            purchaseOrder: 'N/A', // Placeholder
            propertyNumber: 'N/A' // Placeholder
        },
        agreement: {
            type: input.agreementType,
            number: 'N/A', // Placeholder
            effectiveDates: 'N/A' // Placeholder
        },
        case: {
            number: 'N/A', // Placeholder
            createdDate: 'N/A' // Placeholder
        },
        workOrder: {
            number: input.workOrderId,
            completionDate: input.completionDate,
            performedBy: input.preparedBy,
            instrumentCondition: input.instrumentCondition
        },
        summary: {
            reportedProblem: input.reportedProblem,
            symptomSummary: input.symptomSummary,
            problemSummary: input.problemSummary,
            resolutionSummary: input.resolutionSummary,
            verificationOfActivity: input.verificationOfActivity
        },
        labor: [{
            startDate: input.timeWorkStarted,
            endDate: input.timeWorkCompleted,
            description: 'SERVICE LABOR',
            hours: input.laborHours,
            rate: 'N/A', // Placeholder
            total: 'N/A', // Placeholder
            customerCharge: 'N/A' // Placeholder
        }],
        parts: input.partsUsed,
        customerCallOriginator: 'N/A', // Placeholder
        signingPerson: input.signingPerson,
        technicianName: input.preparedBy
    };

    return {
        report: JSON.stringify(reportData)
    }
  }
);

