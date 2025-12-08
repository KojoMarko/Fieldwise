
'use server';
/**
 * @fileOverview A flow for migrating unique location strings from spare parts to the locations collection.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import type { Location, SparePart } from '@/lib/types';

const MigrateLocationsInputSchema = z.object({
  companyId: z.string().min(1, 'Company ID is required'),
});
type MigrateLocationsInput = z.infer<typeof MigrateLocationsInputSchema>;


const MigrateLocationsOutputSchema = z.object({
  migratedCount: z.number().describe('The number of new locations created.'),
});
type MigrateLocationsOutput = z.infer<typeof MigrateLocationsOutputSchema>;

export async function migrateLocations(input: MigrateLocationsInput): Promise<MigrateLocationsOutput> {
  return migrateLocationsFlow(input);
}

const migrateLocationsFlow = ai.defineFlow(
  {
    name: 'migrateLocationsFlow',
    inputSchema: MigrateLocationsInputSchema,
    outputSchema: MigrateLocationsOutputSchema,
  },
  async ({ companyId }) => {
    // 1. Get all spare parts for the specified company
    const sparePartsSnapshot = await db.collection('spare-parts').where('companyId', '==', companyId).get();
    if (sparePartsSnapshot.empty) {
      return { migratedCount: 0 };
    }

    // 2. Get all existing locations for the company
    const locationsSnapshot = await db.collection('locations').where('companyId', '==', companyId).get();
    const existingLocations = new Set(
      locationsSnapshot.docs.map(doc => (doc.data() as Location).name.toLowerCase())
    );

    // 3. Find unique location strings from spare parts
    const locationStrings = new Set<string>();
    sparePartsSnapshot.forEach(doc => {
      const part = doc.data() as SparePart;
      if (part.location) {
        locationStrings.add(part.location);
      }
    });

    let migratedCount = 0;
    const batch = db.batch();

    // 4. For each unique string, if it doesn't exist as a location, create it
    for (const locationName of locationStrings) {
      if (!existingLocations.has(locationName.toLowerCase())) {
        const newLocationRef = db.collection('locations').doc();
        const newLocation: Omit<Location, 'id'> = {
          name: locationName,
          type: 'Warehouse', // Defaulting to Warehouse, can be changed by user later
          address: 'Address not specified',
          companyId: companyId
        };
        batch.set(newLocationRef, { ...newLocation, id: newLocationRef.id });
        migratedCount++;
        // Add to existing set to avoid creating duplicates from the same run (e.g. "Warehouse A" and "warehouse a")
        existingLocations.add(locationName.toLowerCase());
      }
    }

    // 5. Commit the batch
    if (migratedCount > 0) {
      await batch.commit();
    }

    return { migratedCount };
  }
);
