import { ExtractedPatientData } from '@/types/patient';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export async function analyzePatientData(
  text: string,
  source: string
): Promise<ExtractedPatientData[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `
You are a medical data extraction AI specializing in ophthalmology patient records. Analyze the following text from ${source} and extract ALL patient information entries.

Text to analyze:
${text}

FOR EACH PATIENT ENTRY, extract the following information:

1. Patient Name (full name)
2. Age (numeric value only)
3. Sex/Gender (Male/Female/Other)
4. EB Number (Eye Bank registration number if present)
5. Address (complete address with all details)
6. Contact Numbers (extract ALL phone numbers found for this patient as an array)
7. Diagnosis with Eye (e.g., "RE: Corneal Opacity" or "LE: Keratoconus")
   - diagnosis_eye: "RE" or "LE" or "BE" (both eyes)
   - diagnosis: the actual diagnosis text
8. Second Eye Diagnosis if bilateral condition
   - diagnosis_eye_left: "RE" or "LE"
   - diagnosis_left: diagnosis for other eye
9. Surgical Plan (the planned surgery like PK, DALK, DSAEK, TPK, etc.)
10. Surgery Eye (RE or LE or BE for both eyes)
11. IOL Option (with IOL, without IOL, ±IOL)
12. Date of Surgery (extract in format: DD/MM/YYYY or as mentioned)
13. Surgeon Name (name of the surgeon who performed/will perform surgery)
14. Remarks (any additional notes, complications, special instructions)

CRITICAL INSTRUCTIONS:
- Analyze EACH entry thoroughly and extract ALL entries from the text
- For contact numbers, extract ALL phone numbers mentioned for each patient
- If surgery details mention "done by Dr. X on date Y", extract both surgeon_name and surgery_date
- Be thorough - don't miss any patient entries
- Maintain accuracy of medical terminology

RETURN ONLY A VALID JSON ARRAY with this exact structure:
[
  {
    "patient_name": "string",
    "age": number,
    "sex": "Male" | "Female" | "Other",
    "eb_number": "string",
    "address": "string",
    "contact_numbers": ["string", "string"],
    "diagnosis_eye": "RE" | "LE" | "BE",
    "diagnosis": "string",
    "diagnosis_eye_left": "RE" | "LE",
    "diagnosis_left": "string",
    "surgery_eye": "RE" | "LE" | "BE",
    "surgical_plan": "string",
    "surgery_custom": "string",
    "iol_option": "with IOL" | "without IOL" | "±IOL",
    "surgery_date": "string",
    "surgeon_name": "string",
    "remarks": "string"
  }
]

IMPORTANT:
- Return ONLY the JSON array, no other text or markdown
- If a field is not found, use null for nullable fields or empty string ""
- Extract ALL contact numbers for each patient into the array
- Be thorough in extracting all patient entries from the text
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Clean the response to extract JSON
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }
    
    // Remove any trailing text after the JSON array
    const arrayEndIndex = jsonText.lastIndexOf(']');
    if (arrayEndIndex !== -1) {
      jsonText = jsonText.substring(0, arrayEndIndex + 1);
    }
    
    // Parse the JSON
    const extractedData: ExtractedPatientData[] = JSON.parse(jsonText);
    
    // Validate and clean the data
    return extractedData.map(patient => ({
      patient_name: patient.patient_name || '',
      age: patient.age || null,
      sex: patient.sex || null,
      eb_number: patient.eb_number || '',
      address: patient.address || '',
      contact_numbers: Array.isArray(patient.contact_numbers) 
        ? patient.contact_numbers.filter(Boolean) 
        : [],
      diagnosis_eye: patient.diagnosis_eye || null,
      diagnosis: patient.diagnosis || '',
      diagnosis_eye_left: patient.diagnosis_eye_left || null,
      diagnosis_left: patient.diagnosis_left || '',
      surgery_eye: patient.surgery_eye || null,
      surgical_plan: patient.surgical_plan || '',
      surgery_custom: patient.surgery_custom || '',
      iol_option: patient.iol_option || null,
      surgery_date: patient.surgery_date || '',
      surgeon_name: patient.surgeon_name || '',
      remarks: patient.remarks || '',
    }));
  } catch (error) {
    console.error('Error analyzing patient data:', error);
    throw new Error('Failed to analyze patient data with AI. Please check your API key and try again.');
  }
}
