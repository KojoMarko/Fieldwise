
'use server';
/**
 * @fileOverview A flow for extracting maintenance events from a document and logging them against the correct asset.
 *
 * - extractAndLogMaintenance - A function that handles the maintenance extraction and logging process.
 * - ExtractAndLogMaintenanceInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import type { Asset, LifecycleEvent } from '@/lib/types';
import { formatISO } from 'date-fns';

const MaintenanceEventSchema = z.object({
  assetSerialNumber: z.string().describe('The unique serial number of the asset that was serviced.'),
  date: z.string().describe('The date the maintenance was performed (in YYYY-MM-DD format).'),
  note: z.string().describe('A detailed summary of the work performed during the maintenance event.'),
  type: z.enum(['PPM', 'Corrective', 'Event']).describe('The type of maintenance: Preventive (PPM), Corrective, or a general Event.'),
});

const ExtractAndLogMaintenanceInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A maintenance report or service document, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  companyId: z.string().describe('The ID of the company that owns the assets.'),
});
export type ExtractAndLogMaintenanceInput = z.infer<typeof ExtractAndLogMaintenanceInputSchema>;

const ExtractAndLogMaintenanceOutputSchema = z.object({
  events: z.array(MaintenanceEventSchema),
});
export type ExtractAndLogMaintenanceOutput = z.infer<typeof ExtractAndLogMaintenanceOutputSchema>;

export async function extractAndLogMaintenance(input: ExtractAndLogMaintenanceInput): Promise<{ count: number }> {
  return extractAndLogMaintenanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractMaintenanceFromDocPrompt',
  input: { schema: z.object({ fileDataUri: z.string() }) },
  output: { schema: ExtractAndLogMaintenanceOutputSchema },
  prompt: `You are an expert at analyzing technical service reports and maintenance logs.
Analyze the following document and extract all maintenance events mentioned.
For each event, identify the asset's serial number, the date the service occurred, the type of service (PPM, Corrective, or general Event), and a summary of the work performed.
Return the data as a list of maintenance event objects.

Document: {{media url=fileDataUri}}`,
});

const extractAndLogMaintenanceFlow = ai.defineFlow(
  {
    name: 'extractAndLogMaintenanceFlow',
    inputSchema: ExtractAndLogMaintenanceInputSchema,
    outputSchema: z.object({ count: z.number() }),
  },
  async ({ fileDataUri, companyId }) => {
    // Step 1: Extract maintenance events from the document using the LLM
    const { output } = await prompt({ fileDataUri });

    if (!output || !output.events || output.events.length === 0) {
      return { count: 0 };
    }

    // Step 2: Iterate through extracted events and update the corresponding assets
    let updateCount = 0;
    const assetsCollection = db.collection('assets');

    for (const event of output.events) {
      // Find the asset by serial number and company ID
      const assetQuery = await assetsCollection
        .where('serialNumber', '==', event.assetSerialNumber)
        .where('companyId', '==', companyId)
        .limit(1)
        .get();

      if (assetQuery.empty) {
        console.warn(`Asset with serial number "${event.assetSerialNumber}" not found for company "${companyId}".`);
        continue; // Skip to the next event
      }

      const assetDoc = assetQuery.docs[0];
      const asset = assetDoc.data() as Asset;
      const assetRef = assetDoc.ref;

      // Prepare the new lifecycle note
      const newNote: LifecycleEvent = {
        date: formatISO(new Date(event.date)),
        note: event.note,
        type: event.type,
      };
      
      // Get existing notes or initialize as empty array
      const existingNotes = asset.lifecycleNotes || [];

      // Create the data object for the update
      const updateData: {
        lifecycleNotes: LifecycleEvent[];
        lastPpmDate?: string;
      } = {
        lifecycleNotes: [...existingNotes, newNote],
      };
      
      // If the event was a PPM, also update the lastPpmDate field
      if (event.type === 'PPM') {
        updateData.lastPpmDate = formatISO(new Date(event.date));
      }
      
      // Perform the update
      await assetRef.update(updateData);
      updateCount++;
    }

    return {
      count: updateCount,
    };
  }
);
