
import { z } from 'zod';

export const ServiceReportQuestionnaireSchema = z.object({
  workPerformed: z.string().describe('A summary of the work that was performed by the technician.'),
  partsUsed: z.string().describe('A comma-separated list of parts that were used during the service.'),
  finalObservations: z.string().describe('Any final observations or recommendations the technician has.'),
  customerFeedback: z.string().describe('Any feedback or comments provided by the customer on-site.'),
});

export const CreateUserInputSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    role: z.enum(['Technician', 'Customer', 'Admin']),
    companyId: z.string().min(1, 'Company ID is required'),
});
