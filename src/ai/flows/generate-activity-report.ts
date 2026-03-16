
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ActivityReportInputSchema = z.object({
  activities: z.array(z.any()).describe("An array of raw activity log objects."),
  userName: z.string().describe("The name of the user the report is for."),
  period: z.string().describe("A string describing the reporting period (e.g., 'this week')."),
});

const ReportSectionSchema = z.object({
  title: z.string().describe("The title of this report section (e.g., 'Key Meetings & Outcomes')."),
  summary: z.string().describe("A brief, one-paragraph summary of the activities in this section."),
  items: z.array(z.string()).optional().describe("A bulleted list of key activities or outcomes for this section."),
});

const ActivityReportOutputSchema = z.object({
  reportTitle: z.string().describe("A professional title for the report."),
  executiveSummary: z.string().describe("A high-level overview of the week's activities, achievements, and key interactions. Should be a single paragraph."),
  kpi: z.object({
    totalActivities: z.number().describe("Total number of all activities logged."),
    meetings: z.number().describe("Total number of meetings."),
    calls: z.number().describe("Total number of calls."),
    emails: z.number().describe("Total number of emails."),
    tasksCompleted: z.number().describe("Total number of tasks marked as completed."),
  }),
  sections: z.array(ReportSectionSchema).describe("An array of structured sections for the report body."),
});

export async function generateActivityReport(input: z.infer<typeof ActivityReportInputSchema>): Promise<z.infer<typeof ActivityReportOutputSchema>> {
  return generateActivityReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateActivityReportPrompt',
  input: { schema: ActivityReportInputSchema },
  output: { schema: ActivityReportOutputSchema },
  prompt: `You are a professional business analyst. Your task is to generate a concise and professional activity report for a sales executive named {{{userName}}} covering the period of {{{period}}}.

The report should be structured for a CEO or HR manager. Focus on clarity, achievements, and key interactions.

Here are the raw activity logs:
---
{{#each activities}}
- Type: {{this.type}}
  Title: {{this.title}}
  Date: {{this.time}}
  Description: {{this.description}}
  {{#if this.company}}Company: {{this.company}}{{/if}}
  {{#if this.contactPerson}}Contact: {{this.contactPerson}}{{/if}}
  {{#if this.discussion}}Discussion: {{this.discussion}}{{/if}}
  {{#if this.personMet}}Met With: {{this.personMet}} ({{this.personMetProfession}}){{/if}}
  Status: {{this.status}}
---
{{/each}}

Based on these logs, generate a report with the following structure:
1.  **Report Title**: Something like "Weekly Activity Report for {{{userName}}}".
2.  **Executive Summary**: A brief, high-level paragraph summarizing the key activities and outcomes for the period. Mention key companies and people met.
3.  **KPIs**: Calculate the total number of all activities, total meetings, total calls, total emails, and total completed tasks.
4.  **Key Sections**: Create sections for "Key Meetings & Outcomes", "Prospecting & Communication" (for calls/emails), and "Tasks & Deadlines". For each section, provide a brief summary and a bulleted list of the most important items.
    - For meetings, summarize the discussion and outcome. Mention the company and who was met.
    - For calls/emails, mention the key people/companies contacted.
    - For tasks, list the key completed tasks and upcoming deadlines.

The tone should be professional, data-driven, and concise. Do not invent information not present in the logs.
`,
});

const generateActivityReportFlow = ai.defineFlow({
  name: 'generateActivityReportFlow',
  inputSchema: ActivityReportInputSchema,
  outputSchema: ActivityReportOutputSchema,
}, async (input) => {
  const { output } = await prompt(input);
  if (!output) {
      throw new Error("The AI failed to generate an activity report.");
  }
  return output;
});
