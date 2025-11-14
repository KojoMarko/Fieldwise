
'use server';
/**
 * @fileOverview A flow for creating a new repair note for an asset brand.
 *
 * - createRepairNote - A function that handles the repair note creation process.
 * - CreateRepairNoteInput - The input type for the createRepairNote function.
 * - CreateRepairNoteOutput - The return type for the createRepairNote function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import { formatISO } from 'date-fns';

const CreateRepairNoteInputSchema = z.object({
  assetBrand: z.string().min(1, 'Asset brand is required.'),
  note: z.string().min(1, 'Note content is required.'),
  authorId: z.string().min(1, 'Author ID is required.'),
  authorName: z.string().min(1, 'Author name is required.'),
  companyId: z.string().min(1, 'Company ID is required.'),
});

export type CreateRepairNoteInput = z.infer<typeof CreateRepairNoteInputSchema>;

const CreateRepairNoteOutputSchema = z.object({
  id: z.string().describe('The newly created repair note ID.'),
});
export type CreateRepairNoteOutput = z.infer<typeof CreateRepairNoteOutputSchema>;


export async function createRepairNote(input: CreateRepairNoteInput): Promise<CreateRepairNoteOutput> {
  return createRepairNoteFlow(input);
}

const createRepairNoteFlow = ai.defineFlow(
  {
    name: 'createRepairNoteFlow',
    inputSchema: CreateRepairNoteInputSchema,
    outputSchema: CreateRepairNoteOutputSchema,
    auth: (auth) => {
        if (!auth) throw new Error('Authorization required.');
    }
  },
  async (input) => {
    const noteRef = db.collection('repair-notes').doc();
    
    const newNote = {
        ...input,
        id: noteRef.id,
        timestamp: formatISO(new Date()),
    };

    await noteRef.set(newNote);
    
    return {
      id: noteRef.id,
    };
  }
);
