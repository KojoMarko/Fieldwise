
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-spare-parts.ts';
import '@/ai/flows/generate-service-report.ts';
import '@/ai/flows/find-part-number.ts';
import '@/ai/flows/create-user.ts';
