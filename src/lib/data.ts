
import {
  User,
  Customer,
  Asset,
  WorkOrder,
  SparePart,
  Company,
} from '@/lib/types';
import { subDays, formatISO } from 'date-fns';

const defaultCompanyId = 'alos-paraklet';

export const companies: Company[] = [
    { id: defaultCompanyId, name: 'Alos Paraklet Healthcare Limited' }
]

export const users: User[] = [
  {
    id: 'user-1',
    name: 'Harriet',
    email: 'harriet@example.com',
    role: 'Admin',
    avatarUrl: 'https://picsum.photos/seed/avatar1/100/100',
    companyId: defaultCompanyId,
  },
  {
    id: 'user-2',
    name: 'Caleb',
    email: 'caleb@example.com',
    role: 'Engineer',
    avatarUrl: 'https://picsum.photos/seed/avatar2/100/100',
    location: { lat: 34.0522, lng: -118.2437 },
    companyId: defaultCompanyId,
  },
  {
    id: 'user-3',
    name: 'David',
    email: 'david@example.com',
    role: 'Engineer',
    avatarUrl: 'https://picsum.photos/seed/avatar3/100/100',
    location: { lat: 34.06, lng: -118.25 },
    companyId: defaultCompanyId,
  },
   {
    id: 'user-5',
    name: 'Gilbert',
    email: 'gilbert@example.com',
    role: 'Engineer',
    avatarUrl: 'https://picsum.photos/seed/avatar5/100/100',
    location: { lat: 34.07, lng: -118.26 },
    companyId: defaultCompanyId,
  },
  {
    id: 'user-6',
    name: 'Degraft',
    email: 'degraft@example.com',
    role: 'Engineer',
    avatarUrl: 'https://picsum.photos/seed/avatar6/100/100',
    location: { lat: 34.08, lng: -118.27 },
    companyId: defaultCompanyId,
  },
  {
    id: 'user-7',
    name: 'Emma',
    email: 'emma@example.com',
    role: 'Engineer',
    avatarUrl: 'https://picsum.photos/seed/avatar7/100/100',
    location: { lat: 34.09, lng: -118.28 },
    companyId: defaultCompanyId,
  },
  {
    id: 'user-4',
    name: 'Ben',
    email: 'ben@example.com',
    role: 'Customer',
    avatarUrl: 'https://picsum.photos/seed/avatar4/100/100',
    companyId: defaultCompanyId,
  },
];

export const customers: Customer[] = [
    { id: 'cust-1', name: 'Komfo Anokye Hospital Kumasi', contactPerson: 'Ben', contactEmail: 'ben@example.com', address: 'Kumasi', phone: '555-0101', companyId: defaultCompanyId },
    { id: 'cust-2', name: 'Lapay Comunity Hospital', contactPerson: 'Ben', contactEmail: 'ben@example.com', address: 'Accra', phone: '555-0102', companyId: defaultCompanyId },
    { id: 'cust-3', name: 'Korlebu Teaching Hospital', contactPerson: 'Ben', contactEmail: 'ben@example.com', address: 'Accra', phone: '555-0103', companyId: defaultCompanyId },
    { id: 'cust-4', name: 'Tamale Teaching Hospital', contactPerson: 'Ben', contactEmail: 'ben@example.com', address: 'Tamale', phone: '555-0104', companyId: defaultCompanyId },
    { id: 'cust-5', name: '37 Millitary Hospital', contactPerson: 'Ben', contactEmail: 'ben@example.com', address: 'Accra', phone: '555-0105', companyId: defaultCompanyId },
    { id: 'cust-6', name: 'KNUST Hospital', contactPerson: 'Ben', contactEmail: 'ben@example.com', address: 'Kumasi', phone: '555-0106', companyId: defaultCompanyId },
    { id: 'cust-7', name: 'The Bank Hospital', contactPerson: 'Ben', contactEmail: 'ben@example.com', address: 'Accra', phone: '555-0107', companyId: defaultCompanyId },
    { id: 'cust-8', name: 'Tema General Hospital', contactPerson: 'Ben', contactEmail: 'ben@example.com', address: 'Tema', phone: '555-0108', companyId: defaultCompanyId },
    { id: 'cust-9', name: 'Trafaga Ho', contactPerson: 'Ben', contactEmail: 'ben@example.com', address: 'Ho', phone: '555-0109', companyId: defaultCompanyId },
    { id: 'cust-10', name: 'Alma Labs', contactPerson: 'Ben', contactEmail: 'ben@example.com', address: 'Accra', phone: '555-0110', companyId: defaultCompanyId },
    { id: 'cust-11', name: 'Mother of God Hospital', contactPerson: 'Ben', contactEmail: 'ben@example.com', address: 'Tarkwa', phone: '555-0111', companyId: defaultCompanyId },
    { id: 'cust-12', name: 'Ahorgman community Hospital', contactPerson: 'Ben', contactEmail: 'ben@example.com', address: 'Aflao', phone: '555-0112', companyId: defaultCompanyId },
];

export const assets: Asset[] = [
  // Vitros 5600
  { id: 'asset-v5600-1', name: 'Vitros 5600', model: 'Vitros 5600', serialNumber: 'V5600-001', customerId: 'cust-1', location: 'Lab 1', companyId: defaultCompanyId, installationDate: formatISO(subDays(now, 365)) },
  { id: 'asset-v5600-2', name: 'Vitros 5600', model: 'Vitros 5600', serialNumber: 'V5600-002', customerId: 'cust-2', location: 'Main Lab', companyId: defaultCompanyId, installationDate: formatISO(subDays(now, 400)) },
  { id: 'asset-v5600-3', name: 'Vitros 5600', model: 'Vitros 5600', serialNumber: 'V5600-003', customerId: 'cust-3', location: 'Hematology', companyId: defaultCompanyId, installationDate: formatISO(subDays(now, 500)) },
  { id: 'asset-v5600-4', name: 'Vitros 5600', model: 'Vitros 5600', serialNumber: 'V5600-004', customerId: 'cust-4', location: 'Central Lab', companyId: defaultCompanyId, installationDate: formatISO(subDays(now, 600)) },
  { id: 'asset-v5600-5', name: 'Vitros 5600', model: 'Vitros 5600', serialNumber: 'V5600-005', customerId: 'cust-5', location: 'Emergency Lab', companyId: defaultCompanyId, installationDate: formatISO(subDays(now, 700)) },
  { id: 'asset-v5600-6', name: 'Vitros 5600', model: 'Vitros 5600', serialNumber: 'V5600-006', customerId: 'cust-6', location: 'University Lab', companyId: defaultCompanyId, installationDate: formatISO(subDays(now, 800)) },
  // Diapro Elisa Analyzer
  { id: 'asset-dea-1', name: 'Diapro Elisa Analyzer', model: 'Diapro Elisa Analyzer', serialNumber: 'DEA-001', customerId: 'cust-7', location: 'Immunology', companyId: defaultCompanyId, installationDate: formatISO(subDays(now, 200)) },
  { id: 'asset-dea-2', name: 'Diapro Elisa Analyzer', model: 'Diapro Elisa Analyzer', serialNumber: 'DEA-002', customerId: 'cust-8', location: 'Serology Dept', companyId: defaultCompanyId, installationDate: formatISO(subDays(now, 250)) },
  { id: 'asset-dea-3', name: 'Diapro Elisa Analyzer', model: 'Diapro Elisa Analyzer', serialNumber: 'DEA-003', customerId: 'cust-9', location: 'Regional Lab', companyId: defaultCompanyId, installationDate: formatISO(subDays(now, 300)) },
  // Ismart Electrolyte Analyzer
  { id: 'asset-iea-1', name: 'Ismart Electrolyte Analyzer', model: 'Ismart Electrolyte Analyzer', serialNumber: 'IEA-001', customerId: 'cust-10', location: 'Stat Lab', companyId: defaultCompanyId, installationDate: formatISO(subDays(now, 100)) },
  { id: 'asset-iea-2', name: 'Ismart Electrolyte Analyzer', model: 'Ismart Electrolyte Analyzer', serialNumber: 'IEA-002', customerId: 'cust-11', location: 'Main Lab', companyId: defaultCompanyId, installationDate: formatISO(subDays(now, 120)) },
  { id: 'asset-iea-3', name: 'Ismart Electrolyte Analyzer', model: 'Ismart Electrolyte Analyzer', serialNumber: 'IEA-003', customerId: 'cust-12', location: 'Primary Lab', companyId: defaultCompanyId, installationDate: formatISO(subDays(now, 150)) },
  // Beckman Coulter Hematology Analyzer (at all locations)
  ...customers.map((customer, index) => ({
      id: `asset-bcha-${index+1}`,
      name: 'Beckman Coulter Hematology Analyzer',
      model: 'Beckman Coulter DxH 900',
      serialNumber: `BCHA-${String(index+1).padStart(3, '0')}`,
      customerId: customer.id,
      location: `Main Lab at ${customer.name}`,
      companyId: defaultCompanyId,
      installationDate: formatISO(subDays(now, 180 + index * 10))
  }))
];

export const spareParts: SparePart[] = [
    // Vitros 5600
    { id: 'sp-v5600-1', name: 'Cuvette Tray', partNumber: 'V5600-CT-01', quantity: 15, location: 'Warehouse A', assetModel: 'Vitros 5600' },
    { id: 'sp-v5600-2', name: 'Reagent Probe', partNumber: 'V5600-RP-02', quantity: 8, location: 'Warehouse B', assetModel: 'Vitros 5600' },
    // Diapro Elisa Analyzer
    { id: 'sp-dea-1', name: 'Washer Head 8-channel', partNumber: 'DEA-WH-01', quantity: 10, location: 'Warehouse A', assetModel: 'Diapro Elisa Analyzer' },
    { id: 'sp-dea-2', name: 'Halogen Lamp', partNumber: 'DEA-HL-02', quantity: 20, location: 'Warehouse C', assetModel: 'Diapro Elisa Analyzer' },
    // Ismart Electrolyte Analyzer
    { id: 'sp-iea-1', name: 'Reference Electrode', partNumber: 'IEA-RE-01', quantity: 30, location: 'Warehouse B', assetModel: 'Ismart Electrolyte Analyzer' },
    { id: 'sp-iea-2', name: 'Sodium Electrode', partNumber: 'IEA-SE-02', quantity: 25, location: 'Warehouse B', assetModel: 'Ismart Electrolyte Analyzer' },
    // Beckman Coulter Hematology Analyzer
    { id: 'sp-bcha-1', name: 'Sheath Reagent Filter', partNumber: 'BCHA-SRF-01', quantity: 50, location: 'Warehouse C', assetModel: 'Beckman Coulter DxH 900' },
    { id: 'sp-bcha-2', name: 'Aspiration Probe', partNumber: 'BCHA-AP-02', quantity: 12, location: 'Warehouse A', assetModel: 'Beckman Coulter DxH 900' },
    { id: 'sp-bcha-3', name: 'Sample Valve', partNumber: 'BCHA-SV-03', quantity: 18, location: 'Warehouse A', assetModel: 'Beckman Coulter DxH 900' },
    // Generic parts (can be used in multiple models)
    { id: 'sp-gen-1', name: 'HEPA Filter 12x12', partNumber: 'FIL-HEPA-1212', quantity: 50, location: 'Warehouse C', assetModel: 'Multiple' },
    { id: 'sp-gen-2', name: 'M8x25mm Bolt', partNumber: 'BLT-M8-25', quantity: 200, location: 'Warehouse C', assetModel: 'Multiple' },
];


const now = new Date();
export const workOrders: WorkOrder[] = [
  {
    id: 'WO-001',
    title: 'Vitros 5600 Annual Maintenance',
    description: 'Perform annual preventive maintenance on the Vitros 5600. Check reagent probes and cuvette handling system.',
    status: 'Completed',
    priority: 'Medium',
    assetId: 'asset-v5600-1',
    customerId: 'cust-1',
    technicianId: 'user-2',
    scheduledDate: formatISO(subDays(now, 10)),
    completedDate: formatISO(subDays(now, 9)),
    createdAt: formatISO(subDays(now, 15)),
    technicianNotes: `Completed annual maintenance. Replaced a worn reagent probe. System is now fully calibrated and operational.`,
    companyId: defaultCompanyId,
  },
  {
    id: 'WO-002',
    title: 'Beckman Coulter Calibration',
    description: 'Calibrate Beckman Coulter DxH 900 at The Bank Hospital. Customer reports inconsistent CBC results.',
    status: 'Scheduled',
    priority: 'High',
    assetId: 'asset-bcha-7', // Corresponds to The Bank Hospital
    customerId: 'cust-7',
    technicianId: 'user-3',
    scheduledDate: formatISO(new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)), // 2 days from now
    createdAt: formatISO(subDays(now, 1)),
    companyId: defaultCompanyId,
  },
  {
    id: 'WO-003',
    title: 'Ismart Analyzer Electrode Replacement',
    description: 'Replace sodium electrode on Ismart Electrolyte Analyzer at Alma Labs.',
    status: 'In-Progress',
    priority: 'High',
    assetId: 'asset-iea-1',
    customerId: 'cust-10',
    technicianId: 'user-2',
    scheduledDate: formatISO(now),
    createdAt: formatISO(subDays(now, 2)),
    companyId: defaultCompanyId,
  },
];
