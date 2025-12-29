/**
 * File Parser Module
 * Handles parsing of Excel (.xlsx, .xls) and PDF files for patient data extraction
 */

import * as XLSX from 'xlsx';
import * as pdfParse from 'pdf-parse';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Interface for parsed patient data
 */
export interface PatientData {
  id?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
  address?: string;
  medicalHistory?: string;
  currentMedications?: string[];
  allergies?: string[];
  diagnosis?: string;
  [key: string]: any;
}

/**
 * Interface for file parsing result
 */
export interface ParseResult {
  success: boolean;
  data: PatientData[];
  error?: string;
  fileType: 'excel' | 'pdf' | 'unknown';
  parsedAt: Date;
  recordCount: number;
}

/**
 * File Parser Class
 * Handles parsing of different file types and extracts patient data
 */
export class FileParser {
  private supportedExcelFormats = ['.xlsx', '.xls', '.csv'];
  private supportedPdfFormat = ['.pdf'];

  /**
   * Parse a file and extract patient data
   * @param filePath - Path to the file to parse
   * @returns ParseResult with extracted patient data
   */
  async parseFile(filePath: string): Promise<ParseResult> {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();

      // Validate file exists
      await fs.access(filePath);

      if (this.supportedExcelFormats.includes(fileExtension)) {
        return await this.parseExcelFile(filePath);
      } else if (this.supportedPdfFormat.includes(fileExtension)) {
        return await this.parsePdfFile(filePath);
      } else {
        throw new Error(`Unsupported file format: ${fileExtension}`);
      }
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        fileType: 'unknown',
        parsedAt: new Date(),
        recordCount: 0,
      };
    }
  }

  /**
   * Parse Excel file (.xlsx, .xls, .csv)
   * @param filePath - Path to the Excel file
   * @returns ParseResult with extracted patient data
   */
  private async parseExcelFile(filePath: string): Promise<ParseResult> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON
      const rawData = XLSX.utils.sheet_to_json(worksheet);

      // Parse and normalize the data
      const patientData = this.normalizePatientData(rawData);

      return {
        success: true,
        data: patientData,
        fileType: 'excel',
        parsedAt: new Date(),
        recordCount: patientData.length,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to parse Excel file',
        fileType: 'excel',
        parsedAt: new Date(),
        recordCount: 0,
      };
    }
  }

  /**
   * Parse PDF file
   * @param filePath - Path to the PDF file
   * @returns ParseResult with extracted patient data
   */
  private async parsePdfFile(filePath: string): Promise<ParseResult> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const pdfData = await pdfParse(fileBuffer);

      // Extract text content
      const textContent = pdfData.text;

      // Parse patient data from PDF text
      const patientData = this.extractPatientDataFromText(textContent);

      return {
        success: true,
        data: patientData,
        fileType: 'pdf',
        parsedAt: new Date(),
        recordCount: patientData.length,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to parse PDF file',
        fileType: 'pdf',
        parsedAt: new Date(),
        recordCount: 0,
      };
    }
  }

  /**
   * Normalize patient data from raw Excel data
   * Maps common column headers to standard PatientData fields
   * @param rawData - Raw data from Excel sheet
   * @returns Array of normalized PatientData
   */
  private normalizePatientData(rawData: any[]): PatientData[] {
    const commonHeaderMappings: { [key: string]: string } = {
      // ID mappings
      'patient id': 'id',
      'patientid': 'id',
      'pid': 'id',
      'id': 'id',

      // Name mappings
      'first name': 'firstName',
      'firstname': 'firstName',
      'given name': 'firstName',
      'last name': 'lastName',
      'lastname': 'lastName',
      'surname': 'lastName',

      // DOB mappings
      'date of birth': 'dateOfBirth',
      'dob': 'dateOfBirth',
      'birth date': 'dateOfBirth',

      // Contact mappings
      'email': 'email',
      'e-mail': 'email',
      'phone': 'phone',
      'phone number': 'phone',
      'contact': 'phone',

      // Address mappings
      'address': 'address',
      'street': 'address',

      // Medical mappings
      'medical history': 'medicalHistory',
      'history': 'medicalHistory',
      'medications': 'currentMedications',
      'current medications': 'currentMedications',
      'allergies': 'allergies',
      'known allergies': 'allergies',
      'diagnosis': 'diagnosis',
      'diagnoses': 'diagnosis',
    };

    return rawData.map((row) => {
      const normalizedPatient: PatientData = {};

      for (const [originalKey, value] of Object.entries(row)) {
        const lowerKey = originalKey.toLowerCase().trim();
        const mappedKey = commonHeaderMappings[lowerKey] || originalKey;

        // Handle array fields
        if (['currentMedications', 'allergies'].includes(mappedKey)) {
          if (typeof value === 'string') {
            normalizedPatient[mappedKey] = value
              .split(/[,;|]/)
              .map((item) => item.trim())
              .filter((item) => item.length > 0);
          } else if (Array.isArray(value)) {
            normalizedPatient[mappedKey] = value;
          }
        } else {
          normalizedPatient[mappedKey] = value;
        }
      }

      return normalizedPatient;
    });
  }

  /**
   * Extract patient data from PDF text content
   * Uses pattern matching to identify and extract patient information
   * @param textContent - Text extracted from PDF
   * @returns Array of PatientData (usually single record for PDF)
   */
  private extractPatientDataFromText(textContent: string): PatientData[] {
    const patientData: PatientData = {};

    // Pattern matching for common patient data formats
    const patterns = {
      id: /(?:Patient ID|PID|ID\s*[:=])\s*([^\n]+)/i,
      firstName: /(?:First Name|Given Name)\s*[:=]\s*([^\n]+)/i,
      lastName: /(?:Last Name|Surname)\s*[:=]\s*([^\n]+)/i,
      dateOfBirth: /(?:Date of Birth|DOB|Birth Date)\s*[:=]\s*([^\n]+)/i,
      email: /(?:Email|E-mail)\s*[:=]\s*([^\n@]+@[^\n]+)/i,
      phone: /(?:Phone|Contact|Telephone)\s*[:=]\s*([^\n]+)/i,
      address: /(?:Address|Street)\s*[:=]\s*([^\n]+)/i,
      diagnosis: /(?:Diagnosis|Diagnoses)\s*[:=]\s*([^\n]+)/i,
      allergies: /(?:Allergies|Known Allergies)\s*[:=]\s*([^\n]+)/i,
    };

    // Apply pattern matching
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = textContent.match(pattern);
      if (match && match[1]) {
        if (['allergies'].includes(key)) {
          patientData[key] = match[1]
            .split(/[,;|]/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
        } else {
          patientData[key as keyof PatientData] = match[1].trim();
        }
      }
    }

    // Return empty array if no data extracted
    if (Object.keys(patientData).length === 0) {
      return [];
    }

    return [patientData];
  }

  /**
   * Validate patient data
   * @param patient - Patient data to validate
   * @returns Validation result with any error messages
   */
  static validatePatientData(
    patient: PatientData
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate email format if present
    if (patient.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(patient.email)) {
        errors.push('Invalid email format');
      }
    }

    // Validate phone format if present
    if (patient.phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(patient.phone)) {
        errors.push('Invalid phone number format');
      }
    }

    // Validate date format if present
    if (patient.dateOfBirth) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{2}\/\d{2}\/\d{4}$/;
      if (!dateRegex.test(patient.dateOfBirth)) {
        errors.push('Invalid date format (expected YYYY-MM-DD or MM/DD/YYYY)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get list of supported file formats
   * @returns Array of supported file extensions
   */
  getSupportedFormats(): string[] {
    return [...this.supportedExcelFormats, ...this.supportedPdfFormat];
  }
}

/**
 * Utility function to parse file and return patient data
 * @param filePath - Path to the file to parse
 * @returns ParseResult with extracted patient data
 */
export async function parsePatientFile(filePath: string): Promise<ParseResult> {
  const parser = new FileParser();
  return parser.parseFile(filePath);
}

/**
 * Utility function to validate multiple patient records
 * @param patients - Array of patient data to validate
 * @returns Validation results for each patient
 */
export function validatePatients(
  patients: PatientData[]
): Array<{ patient: PatientData; validation: { isValid: boolean; errors: string[] } }> {
  return patients.map((patient) => ({
    patient,
    validation: FileParser.validatePatientData(patient),
  }));
}
