import { ExtractedPatientData } from '@/types/patient';
import { supabase } from '@/integrations/supabase/client';

export async function analyzePatientData(
  text: string,
  source: string
): Promise<ExtractedPatientData[]> {
  try {
    const response = await supabase.functions.invoke('analyze-file', {
      body: { text, source },
    });

    if (response.error) {
      throw new Error(response.error.message || 'AI analysis failed');
    }

    return response.data?.patients || [];
  } catch (error) {
    console.error('Error analyzing patient data:', error);
    throw new Error('Failed to analyze patient data with AI');
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
