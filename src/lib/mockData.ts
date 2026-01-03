import { supabase } from '@/integrations/supabase/client';

const FIRST_NAMES = ['Arun', 'Priya', 'Rajesh', 'Meena', 'Suresh', 'Lakshmi', 'Venkat', 'Kavitha', 'Ramesh', 'Sunitha', 'Kumar', 'Devi', 'Prakash', 'Anitha', 'Srinivas', 'Padma', 'Kiran', 'Geetha', 'Ravi', 'Jaya', 'Mohan', 'Latha', 'Ganesh', 'Radha', 'Vijay', 'Uma', 'Ashok', 'Saroja', 'Manoj', 'Vani'];
const LAST_NAMES = ['Kumar', 'Reddy', 'Sharma', 'Rao', 'Patel', 'Naidu', 'Iyer', 'Singh', 'Verma', 'Gupta', 'Nair', 'Pillai', 'Menon', 'Das', 'Choudhury'];
const DIAGNOSES = ['Corneal Opacity', 'Keratoconus', 'Pseudophakic Bullous Keratopathy', 'Corneal Dystrophy', 'Corneal Ulcer', 'Post-Traumatic Corneal Scar', 'Chemical Burns', 'Herpetic Keratitis', 'Fungal Keratitis', 'Adherent Leucoma'];
const SURGEONS = ['Dr. Rajan K', 'Dr. Suresh P', 'Dr. Priya M', 'Dr. Venkat S', 'Dr. Lakshmi R', 'Dr. Kumar V', 'Dr. Anitha G', 'Dr. Mohan K'];
const CITIES = ['Chennai', 'Hyderabad', 'Bangalore', 'Coimbatore', 'Vijayawada', 'Visakhapatnam', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirupati'];
const STREETS = ['Main Road', 'Gandhi Street', 'Nehru Nagar', 'Rajaji Road', 'Anna Street', 'MG Road', 'Station Road', 'Temple Street'];
const CAUSES_OF_DEATH = ['Cardiac Arrest', 'Road Traffic Accident', 'Natural Causes', 'Stroke', 'Respiratory Failure', 'Kidney Failure', 'Cancer', 'Diabetes Complications'];
const SOURCES = ['Hospital Referral', 'NGO', 'Media Campaign', 'Word of Mouth', 'Eye Bank Awareness Program', 'Pledge Made Previously'];

function randomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomPhone(): string {
  return '9' + Math.floor(100000000 + Math.random() * 900000000).toString();
}

function randomEmail(name: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  return `${cleanName}${Math.floor(Math.random() * 100)}@${randomFromArray(domains)}`;
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function randomAddress(): string {
  const num = Math.floor(1 + Math.random() * 200);
  return `${num}, ${randomFromArray(STREETS)}, ${randomFromArray(CITIES)}`;
}

export async function insertMockPatients(count: number = 100): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  const batchSize = 20;
  const batches = Math.ceil(count / batchSize);

  for (let b = 0; b < batches; b++) {
    const patients = [];
    const batchCount = Math.min(batchSize, count - b * batchSize);

    for (let i = 0; i < batchCount; i++) {
      const firstName = randomFromArray(FIRST_NAMES);
      const lastName = randomFromArray(LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      const sex = Math.random() > 0.5 ? 'Male' : 'Female';
      const isOperated = Math.random() > 0.6;

      patients.push({
        patient_name: name,
        age: Math.floor(15 + Math.random() * 70),
        sex: sex as 'Male' | 'Female',
        address: randomAddress(),
        email: Math.random() > 0.3 ? randomEmail(name) : null,
        contact_numbers: [randomPhone(), ...(Math.random() > 0.5 ? [randomPhone()] : [])],
        diagnosis: randomFromArray(DIAGNOSES),
        diagnosis_eye: Math.random() > 0.5 ? 'RE' : 'LE',
        surgery_type: randomFromArray(['PK', 'DALK', 'DSAEK', 'DMEK', 'TPK'] as const),
        surgery_eye: Math.random() > 0.5 ? 'RE' : 'LE',
        iol_option: randomFromArray(['with IOL', 'without IOL', '±IOL'] as const),
        surgeon_name: randomFromArray(SURGEONS),
        is_operated: isOperated,
        operation_date: isOperated ? randomDate(new Date('2023-01-01'), new Date()) : null,
        remarks: Math.random() > 0.7 ? 'Regular follow-up required' : null,
        date_of_registration: randomDate(new Date('2022-01-01'), new Date()),
      });
    }

    const { error } = await supabase.from('patients').insert(patients as any);
    if (error) {
      console.error('Error inserting patients batch:', error);
      errors += batchCount;
    } else {
      success += batchCount;
    }
  }

  return { success, errors };
}

export async function insertMockDonors(count: number = 100): Promise<{ success: number; errors: number }> {
  let success = 0;
  let errors = 0;

  const batchSize = 20;
  const batches = Math.ceil(count / batchSize);

  for (let b = 0; b < batches; b++) {
    const donors = [];
    const batchCount = Math.min(batchSize, count - b * batchSize);

    for (let i = 0; i < batchCount; i++) {
      const firstName = randomFromArray(FIRST_NAMES);
      const lastName = randomFromArray(LAST_NAMES);
      const name = `${firstName} ${lastName}`;
      const sex = Math.random() > 0.5 ? 'Male' : 'Female';
      const retrievalDate = randomDate(new Date('2022-01-01'), new Date());
      const serialBase = `EB${retrievalDate.replace(/-/g, '').slice(0, 6)}`;

      donors.push({
        donor_name: name,
        age: Math.floor(30 + Math.random() * 50),
        sex: sex as 'Male' | 'Female',
        cause_of_death: randomFromArray(CAUSES_OF_DEATH),
        address: randomAddress(),
        email: Math.random() > 0.4 ? randomEmail(name) : null,
        death_to_retrieval_hours: Math.floor(Math.random() * 6),
        death_to_retrieval_minutes: Math.floor(Math.random() * 60),
        eye_number_right: `${serialBase}-${Math.floor(1000 + Math.random() * 9000)}-RE`,
        eye_number_left: `${serialBase}-${Math.floor(1000 + Math.random() * 9000)}-LE`,
        source_of_awareness: randomFromArray(SOURCES),
        retrieval_date: retrievalDate,
      });
    }

    const { error } = await supabase.from('donors').insert(donors as any);
    if (error) {
      console.error('Error inserting donors batch:', error);
      errors += batchCount;
    } else {
      success += batchCount;
    }
  }

  return { success, errors };
}
