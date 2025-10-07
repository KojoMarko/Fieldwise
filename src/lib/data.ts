
import {
  User,
  Customer,
  Asset,
  WorkOrder,
  SparePart,
  Company,
  Resource
} from '@/lib/types';
import { subDays, formatISO } from 'date-fns';

const defaultCompanyId = 'alos-paraklet';

export const companies: Company[] = [
    { id: defaultCompanyId, name: 'Alos Paraklet Healthcare Limited' }
]

export const users: User[] = [];
export const customers: Customer[] = [];
export const workOrders: WorkOrder[] = [];


const now = new Date();

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

export let resources: Resource[] = [
    {
      id: 'res-1',
      title: 'Vitros 5600 Service Manual',
      equipment: 'Vitros 5600',
      description: 'Complete service and maintenance procedures for Vitros 5600 series integrated systems.',
      category: 'Chemistry',
      type: 'Manual',
      pages: 248,
      version: 'Rev. 4.2',
      updatedDate: '2024-01-15',
      fileUrl: '#',
      uploaderName: 'Admin',
    },
    {
      id: 'res-2',
      title: 'DxH 900 Programming Guide',
      equipment: 'Beckman Coulter DxH 900',
      description: 'Programming reference and troubleshooting guide for the DxH 900 hematology analyzer.',
      category: 'Hematology',
      type: 'Guide',
      pages: 156,
      version: 'v3.1',
      updatedDate: '2024-02-20',
      fileUrl: '#',
      uploaderName: 'Harriet Tubman',
    },
    {
      id: 'res-3',
      title: 'Diapro Elisa Analyzer Maintenance Handbook',
      equipment: 'Diapro Elisa Analyzer',
      description: 'Preventive maintenance schedules and repair procedures for industrial compressors.',
      category: 'Immunology',
      type: 'Manual',
      pages: 92,
      version: 'Rev. 2.0',
      updatedDate: '2023-11-08',
      fileUrl: '#',
      uploaderName: 'Admin',
    },
    {
      id: 'res-4',
      title: 'Electrical Safety Standards for Medical Equipment',
      equipment: 'All Equipment',
      description: 'OSHA-compliant electrical safety procedures and lockout/tagout protocols for medical devices.',
      category: 'Safety',
      type: 'Standard',
      pages: 64,
      version: 'v5.0',
      updatedDate: '2024-03-01',
      fileUrl: '#',
      uploaderName: 'Sojourner Truth',
    },
    {
      id: 'res-5',
      title: 'Ismart Electrolyte Analyzer Installation Guide',
      equipment: 'Ismart Electrolyte Analyzer',
      description: 'Step-by-step installation and alignment procedures for Ismart electrolyte analyzer systems.',
      category: 'Chemistry',
      type: 'Guide',
      pages: 128,
      version: 'Rev. 3.5',
      updatedDate: '2024-01-30',
      fileUrl: '#',
      uploaderName: 'Harriet Tubman',
    },
    {
      id: 'res-6',
      title: 'PLC Troubleshooting Reference',
      equipment: 'PLC Controllers',
      description: 'Diagnostic procedures and error code reference for programmable logic controllers in medical equipment.',
      category: 'Automation',
      type: 'Reference',
      pages: 184,
      version: 'v4.0',
      updatedDate: '2024-02-15',
      fileUrl: '#',
      uploaderName: 'Sojourner Truth',
    }
  ];

  export function addResource(resource: Omit<Resource, 'id' | 'updatedDate'>) {
    const newResource: Resource = {
      ...resource,
      id: `res-${Math.random().toString(36).substr(2, 9)}`,
      updatedDate: new Date().toISOString().split('T')[0],
    };
    resources.unshift(newResource);
    return newResource;
  }
