

import type { z } from 'zod';
import type { ServiceReportQuestionnaireSchema } from './schemas';

export type UserRole = 'Admin' | 'Engineer' | 'Customer' | 'Sales Rep';

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string; // Added phone number
  role: UserRole;
  avatarUrl: string;
  companyId: string; // New field
  location?: {
    lat: number;
    lng: number;
  };
};

export type Customer = {
  id:string;
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
  // Meta can be used to store client-side computed values, like resolved customer names
  meta?: {
    [key: string]: any;
  }
};

export type FacilityStock = {
  facilityId: string;
  facilityName: string;
  quantity: number;
}

export type SparePart = {
    id: string;
    name: string;
    partNumber: string;
    quantity: number; // This now represents central warehouse stock
    location: string;
    assetModel: string;
    companyId: string;
    facilityStock?: FacilityStock[]; // Stock held at different facilities
}

export type AllocatedPart = SparePart & { 
  status: 'Allocated' | 'Pending Handover' | 'With Engineer' | 'Pending Return' | 'Returned' | 'Used';
  verifiedBy?: string;
};


export type WorkOrderStatus =
  | 'Draft'
  | 'Scheduled'
  | 'Dispatched'
  | 'On-Site'
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
  technicianIds?: string[];
  scheduledDate: string;
  completedDate?: string;
  createdAt: string;
  technicianNotes?: string;
  companyId: string; // New field
  cost?: number;
  duration?: number; // Duration in hours
  allocatedParts?: AllocatedPart[]; // Added field
};

export type ServiceReportQuestionnaire = z.infer<typeof ServiceReportQuestionnaireSchema>;


export type Company = {
    id: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logoUrl?: string;
}

export type Resource = {
  id: string;
  title: string;
  equipment: string;
  description: string;
  category: string;
  type: 'Manual' | 'Guide' | 'Procedure' | 'Reference' | 'Standard';
  pages: number;
  version: string;
  updatedDate: string;
  fileUrl: string;
  uploaderName: string;
  companyId: string;
}

export type Notification = {
  id: string;
  type: 'Verification' | 'Assignment' | 'System' | 'Message';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  author?: string;
  companyId: string;
  recipientRole?: 'Admin' | 'Engineer' | 'All' | 'Sales Rep';
};

export type TransferLogEvent = {
  id: string;
  partId: string;
  partName: string;
  partNumber: string;
  quantity: number;
  fromLocation: string;
  toFacilityId: string;
  toFacilityName: string;
  transferredBy: string;
  transferredById: string;
  timestamp: string;
  companyId: string;
};


export type AuditLogEvent = {
  id: string;
  user: {
    id: string;
    name: string;
  };
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'TRANSFER';
  entity: 'Asset' | 'Work Order' | 'Resource' | 'Spare Part' | 'Customer' | 'User' | 'Company';
  entityId: string;
  entityName: string;
  companyId: string;
  timestamp: string;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  }
};


// Firestore Permission Error Types
export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

export type SecurityRuleError = Error & {
  context: SecurityRuleContext;
};

export type ServiceCallLog = {
  id: string;
  customerId: string;
  assetId: string;
  customerName: string;
  assetName: string;
  reportingTime: string; // ISO string
  complainant: string;
  problemReported: string;
  immediateActionTaken: string;
  caseResolved: boolean;
  fieldVisitRequired: boolean;
  priority: 'High' | 'Medium' | 'Low';
  companyId: string;
  loggedById: string;
  loggedByName: string;
  assignedToId?: string;
  assignedToName?: string;
};

export type Product = {
  id: string;
  name: string;
  category: 'Software License' | 'Hardware' | 'Service' | 'Other';
  unitPrice: number;
  companyId: string;
};

export type Transaction = {
  id: string;
  transactionId: string;
  customerName: string;
  customerId: string;
  date: string; // ISO String
  total: number;
  amountPaid: number;
  paymentStatus: 'Fully Paid' | 'Partial Payment' | 'Pending';
  products: {
      id: string,
      name: string,
      quantity: number,
      unitPrice: number
  }[];
  companyId: string;
  paymentMethod?: 'Cash' | 'Cheque' | 'Transfer';
  bankName?: string;
  remarks?: string;
  ownerId?: string;
};


export type Lead = {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  value: number;
  status: 'Qualified' | 'Contacted' | 'New' | 'Converted';
  source: string;
  lastContact: string;
  companyId: string;
};

export type Opportunity = {
  id: string;
  name: string;
  company: string;
  value: number;
  probability: number;
  stage: 'Discovery' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closing';
  closeDate: string;
  companyId: string;
};

export type Activity = {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'task';
  title: string;
  description: string;
  time: string; // ISO string
  company: string;
  status: 'today' | 'upcoming' | 'overdue' | 'completed';
  companyId: string;
};

export type RepairNote = {
    id: string;
    assetBrand: string;
    note: string;
    authorName: string;
    authorId: string;
    timestamp: string; // ISO string
    companyId: string;
};
