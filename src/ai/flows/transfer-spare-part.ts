
'use server';
/**
 * @fileOverview A flow for transferring a spare part to a facility.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import type { SparePart, FacilityStock, TransferLogEvent } from '@/lib/types';
import { FieldValue } from 'firebase-admin/firestore';
import { formatISO } from 'date-fns';

const TransferSparePartInputSchema = z.object({
  partId: z.string().min(1, 'Part ID is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  toLocationId: z.string().min(1, 'Destination location is required'),
  toLocationName: z.string().min(1, 'Destination location name is required'),
  companyId: z.string().min(1, 'Company ID is required'),
  transferredById: z.string().min(1, 'User ID is required'),
  transferredBy: z.string().min(1, 'User name is required'),
});

export type TransferSparePartInput = z.infer<typeof TransferSparePartInputSchema>;

export async function transferSparePart(input: TransferSparePartInput): Promise<void> {
  return transferSparePartFlow(input);
}

const transferSparePartFlow = ai.defineFlow(
  {
    name: 'transferSparePartFlow',
    inputSchema: TransferSparePartInputSchema,
    outputSchema: z.void(),
    auth: (auth) => {
      if (!auth) throw new Error('Authorization required.');
    },
  },
  async (input) => {
    const { partId, quantity, toLocationId, toLocationName, companyId, transferredById, transferredBy } = input;
    const partRef = db.collection('spare-parts').doc(partId);

    await db.runTransaction(async (transaction) => {
        const partDoc = await transaction.get(partRef);
        if (!partDoc.exists) {
            throw new Error(`Spare part with ID ${partId} not found.`);
        }

        const part = partDoc.data() as SparePart;

        if (part.quantity < quantity) {
            throw new Error(`Not enough stock in central warehouse. Available: ${part.quantity}, Requested: ${quantity}.`);
        }

        // Decrement central warehouse stock
        transaction.update(partRef, {
            quantity: FieldValue.increment(-quantity)
        });

        // Update facility stock
        const currentFacilityStock = part.facilityStock || [];
        const facilityIndex = currentFacilityStock.findIndex(f => f.facilityId === toLocationId);

        if (facilityIndex > -1) {
            // Increment existing facility stock
            const newQuantity = currentFacilityStock[facilityIndex].quantity + quantity;
            currentFacilityStock[facilityIndex].quantity = newQuantity;
            transaction.update(partRef, { facilityStock: currentFacilityStock });
        } else {
            // Add new facility stock record
            const newFacilityStock: FacilityStock = {
                facilityId: toLocationId,
                facilityName: toLocationName,
                quantity: quantity
            };
            transaction.update(partRef, {
                facilityStock: FieldValue.arrayUnion(newFacilityStock)
            });
        }
        
        // Log the transfer event
        const logRef = db.collection('transfer-log').doc();
        const logEvent: Omit<TransferLogEvent, 'id'> = {
            partId: part.id,
            partName: part.name,
            partNumber: part.partNumber,
            quantity,
            fromLocation: 'Central Warehouse',
            toFacilityId: toLocationId,
            toFacilityName: toLocationName,
            transferredBy,
            transferredById,
            timestamp: formatISO(new Date()),
            companyId,
        };
        transaction.set(logRef, { ...logEvent, id: logRef.id });
    });
  }
);
