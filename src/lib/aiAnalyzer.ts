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
You are a medical data extraction AI. Analyze the following text from ${source} and extract patient information.

Text to analyze:
${text}

Extract the following information for EACH patient entry found:
- Patient Name (full name)
- Age (numeric value)
- Sex/Gender (Male/Female/Other)
- EB Number (Eye Bank number if present)
- Address (complete address)
- Contact Numbers (ALL phone numbers found - extract as array)
- Diagnosis (eye diagnosis, include eye designation RE/LE if mentioned)
- Diagnosis for second eye if bilateral (include eye designation)
- Surgical Plan (surgery type like PK, DALK, DSAEK, etc.)
- Surgery Eye (RE or LE)
- IOL Option (with IOL, without IOL, ±IOL)
- Date of Surgery (if mentioned)
- Surgeon Name (if mentioned)
- Any remarks or additional notes

RETURN ONLY A VALID JSON ARRAY with the following structure:
[
  {
    "patient_name": "string",
    "age": number,
    "sex": "Male" | "Female" | "Other",
    "eb_number": "string",
    "address": "string",
    "contact_numbers": ["string"],
    "diagnosis_eye": "RE" | "LE",
    "diagnosis": "string",
    "diagnosis_eye_left": "RE" | "LE",
    "diagnosis_left": "string",
    "surgery_eye": "RE" | "LE",
    "surgery_type": "PK" | "Tectonic PK" | "TPK" | "DSAEK" | "DALK" | "DMEK" | "Others",
    "surgery_custom": "string",
    "iol_option": "with IOL" | "without IOL" | "±IOL",
    "surgery_date": "string",
    "surgeon_name": "string",
    "remarks": "string"
  }
]

IMPORTANT:
- Return ONLY the JSON array, no other text
- If a field is not found, use null or empty string
- Extract ALL contact numbers for each patient
- Be thorough in extracting all patient entries
- Maintain data accuracy
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Clean the response to extract JSON
    let jsonText = responseText.trim();
    
    // Remove markdown code blocks if present
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
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
      surgery_type: patient.surgery_type || null,
      surgery_custom: patient.surgery_custom || '',
      iol_option: patient.iol_option || null,
      surgery_date: patient.surgery_date || '',
      surgeon_name: patient.surgeon_name || '',
      remarks: patient.remarks || '',
    }));
  } catch (error) {
    console.error('Error analyzing patient data:', error);
    throw new Error('Failed to analyze patient data with AI');
  }
}
