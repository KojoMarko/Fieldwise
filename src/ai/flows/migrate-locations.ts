
'use server';
/**
 * @fileOverview A flow for migrating unique location strings from spare parts to the locations collection.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { db } from '@/lib/firebase-admin';
import type { Location, SparePart } from '@/lib/types';

const MigrateLocationsOutputSchema = z.object({
  migratedCount: z.number().describe('The number of new locations created.'),
});
type MigrateLocationsOutput = z.infer<typeof MigrateLocationsOutputSchema>;

export async function migrateLocations(): Promise<MigrateLocationsOutput> {
  return migrateLocationsFlow();
}

const migrateLocationsFlow = ai.defineFlow(
  {
    name: 'migrateLocationsFlow',
    inputSchema: z.void(),
    outputSchema: MigrateLocationsOutputSchema,
  },
  async () => {
    // 1. Get all spare parts
    const sparePartsSnapshot = await db.collection('spare-parts').get();
    if (sparePartsSnapshot.empty) {
      return { migratedCount: 0 };
    }

    // 2. Get all existing locations
    const locationsSnapshot = await db.collection('locations').get();
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
          companyId: 'alos-paraklet' // Assuming a single company for now
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
