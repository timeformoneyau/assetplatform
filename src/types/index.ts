export type RecordStatus = 'declared' | 'document' | 'ai' | 'confirmed';

export type RecordType =
  | 'service'
  | 'repair'
  | 'inspection'
  | 'registration'
  | 'warranty'
  | 'tyres'
  | 'battery'
  | 'recall'
  | 'other'
  | 'test';

export type FuelType = 'Petrol' | 'Diesel' | 'Hybrid' | 'Plug-in hybrid' | 'Electric' | 'LPG';
export type BodyType = 'Sedan' | 'Hatchback' | 'Wagon' | 'SUV' | 'Ute' | 'Van' | 'Coupe';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  registration_number: string;
  vin: string | null;
  current_odometer: number;
  ownership_start_date: string;
  variant: string | null;
  fuel_type: FuelType | null;
  body_type: BodyType | null;
  color: string | null;
  purchase_odometer: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface VehicleRecord {
  id: string;
  vehicle_id: string;
  record_type: RecordType;
  record_date: string;
  odometer: number | null;
  provider_name: string | null;
  summary: string;
  notes: string | null;
  cost: number | null;
  status: RecordStatus;
  source_type: 'manual' | 'upload';
  doc_name: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  hcs_transaction_id?: string | null;
  hcs_sequence_number?: number | null;
  hcs_network?: 'testnet' | 'mainnet' | null;
  doc_hash?: string | null;
}

export interface EvidenceDocument {
  id: string;
  vehicle_id: string;
  record_id: string | null;
  file_name: string;
  file_type: 'jpg' | 'png' | 'pdf';
  uploaded_at: string;
  parsing_status: 'pending' | 'parsing' | 'parsed' | 'failed';
  parsed_at: string | null;
}

export interface ParsedField {
  value: string | number;
  confidence: number;
  label: string;
}

export interface ParsedExtraction {
  id: string;
  document_id: string;
  doc_name: string;
  doc_type: string;
  vendor_block: string;
  fields: Record<string, ParsedField>;
  items: string[];
  user_reviewed: boolean;
  user_confirmed: boolean;
  created_at: string;
}

export const STATUS_LABEL: Record<RecordStatus, string> = {
  confirmed: 'User confirmed',
  document: 'Document attached',
  ai: 'AI parsed — review',
  declared: 'Owner declared',
};

export const STATUS_DETAIL: Record<RecordStatus, string> = {
  confirmed: 'You reviewed and confirmed these details. A supporting document is attached.',
  document: 'A supporting document has been attached to this record.',
  ai: 'Details were extracted from an uploaded document. Review before confirming.',
  declared: 'Added by the owner without supporting evidence.',
};

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  service: 'Service',
  repair: 'Repair',
  inspection: 'Inspection',
  registration: 'Registration',
  warranty: 'Warranty',
  tyres: 'Tyres',
  battery: 'Battery',
  recall: 'Recall',
  other: 'Other',
  test: 'Test',
};
