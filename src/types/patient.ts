export interface ExtractedPatientData {
  patient_name: string;
  age: number | null;
  sex: 'Male' | 'Female' | 'Other' | null;
  eb_number: string;
  address: string;
  contact_numbers: string[];
  diagnosis_eye: 'RE' | 'LE' | 'BE' | null;
  diagnosis: string;
  diagnosis_eye_left: 'RE' | 'LE' | null;
  diagnosis_left: string;
  surgery_eye: 'RE' | 'LE' | 'BE' | null;
  surgical_plan: string;  // Changed from surgery_type
  surgery_custom: string;
  iol_option: 'with IOL' | 'without IOL' | '±IOL' | null;
  surgery_date: string;
  surgeon_name: string;
  remarks: string;
}
