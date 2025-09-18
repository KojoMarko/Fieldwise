'use server';
/**
 * @fileOverview A tool to find the part number of a spare part.
 * 
 * - findPartNumber - A tool that takes a part name and returns its part number.
 */

import { ai } from '@/ai/genkit';
import { spareParts } from '@/lib/data';
import { z } from 'zod';

export const findPartNumber = ai.defineTool(
    {
        name: 'findPartNumber',
        description: 'Find the part number for a given spare part name.',
        inputSchema: z.object({
            partName: z.string().describe('The name of the part to find.'),
        }),
        outputSchema: z.object({
            partNumber: z.string().describe('The part number found, or "Not Found" if no matching part exists.'),
        }),
    },
    async (input) => {
        const part = spareParts.find(p => p.name.toLowerCase().includes(input.partName.toLowerCase()));
        return {
            partNumber: part ? part.partNumber : 'Not Found',
        };
    }
);
