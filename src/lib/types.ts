export type UserRole = 'Admin' | 'Technician' | 'Customer';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
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
};

export type Asset = {
  id: string;
  name: string;
  model: string;
  serialNumber: string;
  customerId: string;
  location: string; // Address
};

export type SparePart = {
    id: string;
    name: string;
    partNumber: string;
    quantity: number;
    location: string;
}

export type WorkOrderStatus =
  | 'Draft'
  | 'Scheduled'
  | 'In-Progress'
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
  assetId: string;
  customerId: string;
  technicianId?: string;
  scheduledDate: string;
  completedDate?: string;
  createdAt: string;
  technicianNotes?: string;
};
