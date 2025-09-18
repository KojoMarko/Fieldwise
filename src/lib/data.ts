import {
  User,
  Customer,
  Asset,
  WorkOrder,
  WorkOrderStatus,
  WorkOrderPriority,
  SparePart,
} from '@/lib/types';
import { subDays, formatISO } from 'date-fns';

export const users: User[] = [
  {
    id: 'user-1',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    role: 'Admin',
    avatarUrl: 'https://picsum.photos/seed/avatar1/100/100',
  },
  {
    id: 'user-2',
    name: 'Mike Brown',
    email: 'mike.b@example.com',
    role: 'Technician',
    avatarUrl: 'https://picsum.photos/seed/avatar2/100/100',
    location: { lat: 34.0522, lng: -118.2437 },
  },
  {
    id: 'user-3',
    name: 'Jessica Williams',
    email: 'jess.w@example.com',
    role: 'Technician',
    avatarUrl: 'https://picsum.photos/seed/avatar3/100/100',
    location: { lat: 34.06, lng: -118.25 },
  },
  {
    id: 'user-4',
    name: 'David Miller',
    email: 'david.m@example.com',
    role: 'Customer',
    avatarUrl: 'https://picsum.photos/seed/avatar4/100/100',
  },
];

export const customers: Customer[] = [
  {
    id: 'cust-1',
    name: 'City General Hospital',
    contactPerson: 'Dr. Evans',
    contactEmail: 'evans@cgh.com',
    address: '123 Health St, Los Angeles, CA',
    phone: '555-0101',
  },
  {
    id: 'cust-2',
    name: 'Downtown Medical Clinic',
    contactPerson: 'Maria Garcia',
    contactEmail: 'm.garcia@dmc.com',
    address: '456 Wellness Ave, Los Angeles, CA',
    phone: '555-0102',
  },
];

export const assets: Asset[] = [
  {
    id: 'asset-1',
    name: 'MRI Machine',
    model: 'Siemens Magnetom Skyra',
    serialNumber: 'SN-MRI-001',
    customerId: 'cust-1',
    location: 'Radiology Dept, Floor 2',
  },
  {
    id: 'asset-2',
    name: 'Blood Analyzer',
    model: 'Roche Cobas 8000',
    serialNumber: 'SN-BA-002',
    customerId: 'cust-2',
    location: 'Lab Room 101',
  },
  {
    id: 'asset-3',
    name: 'Ventilator',
    model: 'Dräger Evita V500',
    serialNumber: 'SN-VENT-003',
    customerId: 'cust-1',
    location: 'ICU, Bed 5',
  },
];

export const spareParts: SparePart[] = [
    {
        id: 'sp-1',
        name: 'MRI Cooling Pump',
        partNumber: 'PMP-50-23-A',
        quantity: 3,
        location: 'Warehouse A, Shelf 14'
    },
    {
        id: 'sp-2',
        name: 'Blood Analyzer Sample Needle',
        partNumber: 'N-ROC-8000-S',
        quantity: 25,
        location: 'Warehouse B, Bin 3'
    },
    {
        id: 'sp-3',
        name: 'Ventilator Oxygen Sensor',
        partNumber: 'SEN-O2-DR-V500',
        quantity: 12,
        location: 'Warehouse A, Shelf 8'
    },
    {
        id: 'sp-4',
        name: 'HEPA Filter 12x12',
        partNumber: 'FIL-HEPA-1212',
        quantity: 50,
        location: 'Warehouse C, Shelf 1'
    },
    {
        id: 'sp-5',
        name: 'Main Bearing for Patient Table',
        partNumber: 'BRG-PT-S-900',
        quantity: 8,
        location: 'Warehouse A, Shelf 3'
    },
    {
        id: 'sp-6',
        name: 'M8x25mm Bolt',
        partNumber: 'BLT-M8-25',
        quantity: 200,
        location: 'Warehouse C, Bin 45'
    }
]

const now = new Date();
export const workOrders: WorkOrder[] = [
  {
    id: 'WO-001',
    title: 'MRI Machine Annual Maintenance',
    description: 'Perform annual preventive maintenance on the Siemens Magnetom Skyra MRI. Check magnet cooling system, inspect gradients and RF coils. The patient table is reported to be making a slight grinding noise on movement. Requires helium level check.',
    status: 'Completed',
    priority: 'Medium',
    assetId: 'asset-1',
    customerId: 'cust-1',
    technicianId: 'user-2',
    scheduledDate: formatISO(subDays(now, 10)),
    completedDate: formatISO(subDays(now, 9)),
    createdAt: formatISO(subDays(now, 15)),
    technicianNotes: `
### Service Report

**Work Order:** MRI Machine Annual Maintenance
**Asset Serviced:** MRI Machine

**Summary of Work:**
Completed annual preventive maintenance on the Siemens Magnetom Skyra MRI. The primary issue reported was a grinding noise from the patient table, which has been resolved. All systems are now operating within normal parameters.

**Detailed Breakdown:**
1.  **Patient Table Inspection:** Inspected the patient table movement mechanism. Identified a loose bolt on the main bearing assembly.
2.  **Repair:** Tightened the main bearing bolt to the manufacturer's specified torque. Tested table movement; the grinding noise is no longer present.
3.  **System Checks:** Performed standard annual checks on all major systems.
    *   Verified magnet cooling system is stable.
    *   Inspected gradient and RF coils; no issues found.
    *   Checked helium level, which is currently at 95%.

**Parts Used:**
*   **M8x25mm Bolt:** Part #BLT-M8-25 (1 used)
*   **Loctite 242:** Part #ADH-LT-242 (1 used)


**Technician's Observations:**
The loose bolt on the patient table appears to be due to normal operational vibrations over time. Recommend checking the torque on all table mounting bolts during the next service cycle as a preventive measure.

**Conclusion:**
The annual maintenance is complete, and the reported issue has been rectified. The asset is fully operational and ready for clinical use.
`,
  },
  {
    id: 'WO-002',
    title: 'Blood Analyzer Calibration',
    description: 'Calibrate Roche Cobas 8000. Reagent levels are low.',
    status: 'Scheduled',
    priority: 'High',
    assetId: 'asset-2',
    customerId: 'cust-2',
    technicianId: 'user-3',
    scheduledDate: formatISO(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)), // 2 days from now
    createdAt: formatISO(subDays(now, 1)),
  },
  {
    id: 'WO-003',
    title: 'Ventilator Filter Replacement',
    description: 'Replace air and oxygen filters on Dräger Evita V500.',
    status: 'In-Progress',
    priority: 'High',
    assetId: 'asset-3',
    customerId: 'cust-1',
    technicianId: 'user-2',
    scheduledDate: formatISO(now),
    createdAt: formatISO(subDays(now, 2)),
  },
  {
    id: 'WO-004',
    title: 'Emergency Repair: MRI Noise',
    description: 'Patient table on Magnetom Skyra is making loud grinding noises.',
    status: 'Scheduled',
    priority: 'High',
    assetId: 'asset-1',
    customerId: 'cust-1',
    technicianId: 'user-2',
    scheduledDate: formatISO(new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000)), // Tomorrow
    createdAt: formatISO(now),
  },
  {
    id: 'WO-005',
    title: 'Quarterly Checkup - Blood Analyzer',
    description: 'Routine quarterly inspection and cleaning of Cobas 8000.',
    status: 'Scheduled',
    priority: 'Low',
    assetId: 'asset-2',
    customerId: 'cust-2',
    technicianId: 'user-3',
    scheduledDate: formatISO(new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)), // 5 days from now
    createdAt: formatISO(subDays(now, 3)),
  },
];
