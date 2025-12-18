'use server';
/**
 * @fileOverview A flow for answering questions about operational data.
 *
 * - queryData - A function that takes a user's question and returns an answer based on available data.
 * - QueryDataInput - The input type for the queryData function.
 * - QueryDataOutput - The return type for the queryData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import type { Asset, WorkOrder, Customer, SparePart } from '@/lib/types';
import { format } from 'date-fns';

const QueryDataInputSchema = z.object({
  question: z.string().describe('The user\'s question about their operational data.'),
  companyId: z.string().describe('The ID of the company the data belongs to.'),
});
export type QueryDataInput = z.infer<typeof QueryDataInputSchema>;

const QueryDataOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user\'s question.'),
});
export type QueryDataOutput = z.infer<typeof QueryDataOutputSchema>;

export async function queryData(input: QueryDataInput): Promise<QueryDataOutput> {
  return queryDataFlow(input);
}

// Data fetching function
async function getCompanyData(companyId: string) {
    const assetsSnapshot = await db.collection('assets').where('companyId', '==', companyId).limit(100).get();
    const assets = assetsSnapshot.docs.map(doc => doc.data() as Asset);

    const workOrdersSnapshot = await db.collection('work-orders').where('companyId', '==', companyId).limit(100).get();
    const workOrders = workOrdersSnapshot.docs.map(doc => doc.data() as WorkOrder);
    
    const customersSnapshot = await db.collection('customers').where('companyId', '==', companyId).limit(100).get();
    const customers = customersSnapshot.docs.map(doc => doc.data() as Customer);

    // Simplify data to send to the LLM to save tokens
    const simplifiedAssets = assets.map(a => ({ name: a.name, model: a.model, status: a.status, installationDate: a.installationDate, customerId: a.customerId }));
    const simplifiedWorkOrders = workOrders.map(wo => ({ title: wo.title, status: wo.status, priority: wo.priority, type: wo.type, scheduledDate: wo.scheduledDate, customerId: wo.customerId }));
    const simplifiedCustomers = customers.map(c => ({ name: c.name, id: c.id }));

    return {
        assets: simplifiedAssets,
        workOrders: simplifiedWorkOrders,
        customers: simplifiedCustomers,
        summary: {
            totalAssets: assets.length,
            totalWorkOrders: workOrders.length,
            totalCustomers: customers.length,
            currentDate: format(new Date(), 'yyyy-MM-dd'),
        }
    };
}


const prompt = ai.definePrompt({
    name: 'queryDataPrompt',
    input: { schema: z.object({ question: z.string(), context: z.any() }) },
    output: { schema: QueryDataOutputSchema },
    prompt: `You are a helpful AI assistant for a field service management app called FieldWise. Your role is to answer questions based *only* on the data provided in the context. Do not make up information. If the answer is not in the data, say that you don't have enough information to answer.

    Today's Date: {{{context.summary.currentDate}}}

    Data Context:
    ---
    Customers:
    {{#each context.customers}}
    - Name: {{this.name}} (ID: {{this.id}})
    {{/each}}

    Assets ({{context.summary.totalAssets}} total):
    {{#each context.assets}}
    - Name: {{this.name}}, Model: {{this.model}}, Status: {{this.status}}, Installed: {{this.installationDate}}, CustomerID: {{this.customerId}}
    {{/each}}

    Work Orders ({{context.summary.totalWorkOrders}} total):
    {{#each context.workOrders}}
    - Title: {{this.title}}, Status: {{this.status}}, Priority: {{this.priority}}, Type: {{this.type}}, Scheduled: {{this.scheduledDate}}, CustomerID: {{this.customerId}}
    {{/each}}
    ---

    User's Question: "{{{question}}}"

    Based on the data above, provide a clear and concise answer.`,
});


const queryDataFlow = ai.defineFlow(
  {
    name: 'queryDataFlow',
    inputSchema: QueryDataInputSchema,
    outputSchema: QueryDataOutputSchema,
  },
  async ({ question, companyId }) => {
    // Step 1: Fetch the relevant data from Firestore
    const dataContext = await getCompanyData(companyId);

    // Step 2: Pass the question and data to the LLM
    const { output } = await prompt({ question, context: dataContext });

    if (!output) {
      throw new Error("The AI failed to generate an answer.");
    }
    
    return output;
  }
);
