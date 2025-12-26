export type AppRole = 'admin' | 'surgeon' | 'data_entry' | 'viewer';
export type SexType = 'Male' | 'Female' | 'Other';
export type EyeType = 'RE' | 'LE';
export type SurgeryType = 'PK' | 'Tectonic PK' | 'TPK' | 'DSAEK' | 'DALK' | 'DMEK' | 'Others';
export type IOLOption = 'with IOL' | 'without IOL' | '±IOL';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Patient {
  id: string;
  wl_number: number;
  date_of_registration: string;
  eb_number: string | null;
  patient_name: string;
  age: number;
  sex: SexType;
  address: string | null;
  contact_numbers: string[];
  diagnosis_eye: EyeType | null;
  diagnosis: string | null;
  diagnosis_eye_left: EyeType | null;
  diagnosis_left: string | null;
  surgery_eye: EyeType | null;
  surgery_type: SurgeryType | null;
  surgery_custom: string | null;
  iol_option: IOLOption | null;
  remarks: string | null;
  surgeon_name: string | null;
  is_operated: boolean;
  operation_date: string | null;
  donor_eye_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Donor {
  id: string;
  serial_number: number;
  donor_name: string;
  age: number;
  sex: SexType;
  cause_of_death: string | null;
  address: string | null;
  death_to_retrieval_hours: number;
  death_to_retrieval_minutes: number;
  source_of_awareness: string | null;
  eye_number_right: string;
  eye_number_left: string;
  retrieval_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DonorEye {
  id: string;
  donor_id: string;
  eye_number: string;
  eye_side: EyeType;
  is_assigned: boolean;
  assigned_to_patient_id: string | null;
  assigned_date: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

export interface EyeBankSettings {
  id: string;
  bank_start_date: string;
  bank_name: string;
  created_at: string;
  updated_at: string;
}

export const DIAGNOSIS_OPTIONS = [
  'Adherant LCO',
  'Adherant vascularised LCO',
  'CHED',
  'Corneal abscess',
  'Corneal dystrophy',
  'Failed DSAEK',
  'Failed PK',
  'Healed viral keratitis',
  'Infected graft',
  'LCO',
  'MLCO',
  'MLCO with vascularisation',
  'PBK',
  'Vascularised LCO',
] as const;

export const SURGERY_OPTIONS: SurgeryType[] = [
  'DALK',
  'DMEK',
  'DSAEK',
  'PK',
  'TPK',
  'Tectonic PK',
  'Others',
];

export const IOL_OPTIONS: IOLOption[] = ['with IOL', 'without IOL', '±IOL'];

export const SEX_OPTIONS: SexType[] = ['Male', 'Female', 'Other'];

export const SOURCE_OF_AWARENESS_OPTIONS = [
  'Hospital referral',
  'Family referral',
  'Media',
  'NGO',
  'Self-awareness',
  'Other',
] as const;