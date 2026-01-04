import { ExtractedPatientData } from "@/types/patient";
import { supabase } from "@/integrations/supabase/client";

function normalizePatient(raw: any): ExtractedPatientData {
  return {
    patient_name: String(raw?.patient_name ?? "").trim(),
    age: raw?.age == null || raw?.age === "" ? null : Number(raw.age),
    sex: raw?.sex === "Male" || raw?.sex === "Female" || raw?.sex === "Other" ? raw.sex : "Other",
    eb_number: raw?.eb_number ?? null,
    address: raw?.address ?? null,
    contact_numbers: Array.isArray(raw?.contact_numbers)
      ? raw.contact_numbers.map(String).map((s: string) => s.trim()).filter(Boolean)
      : null,
    diagnosis: raw?.diagnosis ?? null,
    diagnosis_eye: raw?.diagnosis_eye === "RE" || raw?.diagnosis_eye === "LE" ? raw.diagnosis_eye : null,
    diagnosis_eye_left:
      raw?.diagnosis_eye_left === "RE" || raw?.diagnosis_eye_left === "LE" ? raw.diagnosis_eye_left : null,
    diagnosis_left: raw?.diagnosis_left ?? null,
    surgery_eye: raw?.surgery_eye === "RE" || raw?.surgery_eye === "LE" ? raw.surgery_eye : null,
    surgery_type: raw?.surgery_type ?? (raw?.surgical_plan ?? null),
    surgery_custom: raw?.surgery_custom ?? null,
    iol_option: raw?.iol_option ?? null,
    operation_date: raw?.operation_date ?? null,
    surgeon_name: raw?.surgeon_name ?? null,
    remarks: raw?.remarks ?? null,
    // Some parts of the UI use these legacy names:
    surgery_date: raw?.surgery_date ?? raw?.operation_date ?? null,
  } as any;
}

export async function analyzePatientData(text: string, source: string): Promise<ExtractedPatientData[]> {
  // quick sanity check to avoid wasting requests
  if (!text || text.trim().length < 10) return [];

  try {
    const response = await supabase.functions.invoke("analyze-file", {
      body: { fileContent: text, fileType: "text", dataType: "patients", source },
    });

    if (response.error) throw new Error(response.error.message || "AI analysis failed");

    const payload: any = response.data;
    if (payload?.success === false) throw new Error(payload.error || "AI analysis failed");

    const patients = payload?.data?.patients ?? payload?.patients ?? [];
    if (!Array.isArray(patients)) return [];

    return patients.map(normalizePatient).filter((p) => p.patient_name);
  } catch (error: any) {
    console.error("Error analyzing patient data:", error);
    const msg = String(error?.message ?? "Failed to analyze patient data");
    if (msg.includes("Failed to fetch")) throw new Error("Network error: Unable to reach analysis service.");
    throw new Error(msg);
  }
}

export async function generateThankYouEmail(
  patientName: string,
  donorName: string,
  surgeryType: string,
  surgeonName: string
): Promise<string> {
  try {
    const response = await supabase.functions.invoke('generate-thank-you-email', {
      body: { patientName, donorName, surgeryType, surgeonName },
    });

    if (response.error) {
      throw new Error(response.error.message || 'Email generation failed');
    }

    return response.data?.email || '';
  } catch (error) {
    console.error('Error generating thank you email:', error);
    throw new Error('Failed to generate thank you email');
  }
}
