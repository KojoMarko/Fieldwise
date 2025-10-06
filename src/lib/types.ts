
import type { z } from 'zod';
import type { ServiceReportQuestionnaireSchema } from './schemas';

export type UserRole = 'Admin' | 'Engineer' | 'Customer';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  companyId: string; // New field
  location?: {
    lat: number;
    lng: number;
  };
};

export type Customer = {
  id: string;
  name: string;
  contactPerson: string;
  contactEmail: string;
  address: string;
  phone: string;
  companyId: string; // New field
};

export type LifecycleEvent = {
  date?: string;
  note: string;
  type: 'PPM' | 'Corrective' | 'Event';
};

export type Asset = {
  id:string;
  name: string;
  model: string;
  serialNumber: string;
  customerId: string;
  location: string;
  installationDate: string;
  companyId: string; // New field
  ppmFrequency?: number; // In months
  lastPpmDate?: string;
  lifecycleNotes?: LifecycleEvent[];
  status: 'Operational' | 'Down' | 'Maintenance';
  purchaseDate?: string;
  vendor?: string;
  warrantyExpiry?: string;
};

export type SparePart = {
    id: string;
    name: string;
    partNumber: string;
    quantity: number;
    location: string;
    assetModel: string;
    // companyId will be inferred from the asset model's company
}

export type AllocatedPart = SparePart & { status: 'Allocated' | 'Used' | 'Returned' };

export type WorkOrderStatus =
  | 'Draft'
  | 'Scheduled'
  | 'In-Progress'
  | 'On-Hold'
  | 'Completed'
  | 'Invoiced'
  | 'Cancelled';
export type WorkOrderPriority = 'Low' | 'Medium' | 'High';

export type WorkOrder = {
  id: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  type: 'Preventive' | 'Corrective' | 'Emergency' | 'Installation' | 'Other';
  assetId: string;
  customerId: string;
  technicianId?: string;
  scheduledDate: string;
  completedDate?: string;
  createdAt: string;
  technicianNotes?: string;
  companyId: string; // New field
  cost?: number;
  duration?: number; // Duration in hours
};

export type ServiceReportQuestionnaire = z.infer<typeof ServiceReportQuestionnaireSchema>;


export type Company = {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
}
