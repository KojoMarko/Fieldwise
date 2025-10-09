
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-spare-parts.ts';
import '@/ai/flows/generate-service-report.ts';
import '@/ai/flows/find-part-number.ts';
import '@/ai/flows/create-user.ts';
import '@/ai/flows/delete-user.ts';
import '@/ai/flows/create-work-order.ts';
import '@/ai/flows/update-work-order.ts';
import '@/ai/flows/create-customer.ts';
import '@/ai/flows/update-customer.ts';
import '@/ai/flows/delete-customer.ts';
import '@/ai/flows/create-asset.ts';
import '@/ai/flows/update-asset.ts';
import '@/ai/flows/delete-asset.ts';
import '@/ai/flows/update-user.ts';
import '@/ai/flows/update-company.ts';
import '@/ai/flows/analyze-document.ts';
import '@/ai/flows/create-spare-part.ts';
import '@/ai/flows/update-spare-part.ts';
import '@/ai/flows/extract-and-create-parts.ts';
import '@/ai/flows/delete-spare-part.ts';
import '@/ai/flows/extract-and-log-maintenance.ts';
import '@/ai/flows/extract-and-create-assets.ts';
import '@/ai/flows/update-asset-model.ts';
