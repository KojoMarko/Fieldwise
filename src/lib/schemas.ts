
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
    role: z.enum(['Engineer', 'Customer', 'Admin']),
    companyId: z.string().min(1, 'Company ID is required'),
});

export const CreateCustomerInputSchema = z.object({
    name: z.string().min(1, 'Customer name is required'),
    contactPerson: z.string().min(1, 'Contact person is required'),
    contactEmail: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone number is required'),
    address: z.string().min(1, 'Address is required'),
    companyId: z.string().min(1, 'Company ID is required'),
});

export const UpdateCustomerInputSchema = CreateCustomerInputSchema.extend({
    id: z.string().min(1, 'Customer ID is required'),
}).omit({ companyId: true });


export const DeleteCustomerInputSchema = z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
});

export const CreateAssetInputSchema = z.object({
  name: z.string().min(1, 'Asset name is required.'),
  model: z.string().min(1, 'Model is required.'),
  serialNumber: z.string().min(1, 'Serial number is required.'),
  customerId: z.string().min(1, 'A customer must be selected.'),
  location: z.string().min(1, 'Location is required.'),
  installationDate: z.any().transform((val) => (val ? new Date(val) : new Date())),
  companyId: z.string().min(1, 'Company ID is required.'),
  ppmFrequency: z.coerce.number().optional(),
  lastPpmDate: z.any().optional(),
});

export const UpdateAssetInputSchema = CreateAssetInputSchema.extend({
    id: z.string().min(1, 'Asset ID is required'),
}).omit({ companyId: true });

export const DeleteAssetInputSchema = z.object({
    assetId: z.string().min(1, 'Asset ID is required'),
});
