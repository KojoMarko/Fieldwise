
'use server';
/**
 * @fileOverview A flow for creating a new product.
 *
 * - createProduct - A function that handles the product creation process.
 * - CreateProductInput - The input type for the createProduct function.
 * - CreateProductOutput - The return type for the createProduct function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { Product } from '@/lib/types';
import { CreateProductInputSchema } from '@/lib/schemas';
import { db } from '@/lib/firebase-admin';

export type CreateProductInput = z.infer<typeof CreateProductInputSchema>;

const CreateProductOutputSchema = z.object({
  id: z.string().describe('The newly created product ID.'),
});
export type CreateProductOutput = z.infer<typeof CreateProductOutputSchema>;

export async function createProduct(input: CreateProductInput): Promise<CreateProductOutput> {
  return createProductFlow(input);
}

const createProductFlow = ai.defineFlow(
  {
    name: 'createProductFlow',
    inputSchema: CreateProductInputSchema,
    outputSchema: CreateProductOutputSchema,
  },
  async (input) => {
    const productRef = db.collection('products').doc();
    const newProduct: Product = {
        ...input,
        id: productRef.id,
    };

    await productRef.set(newProduct);
    
    return {
      id: productRef.id,
    };
  }
);
