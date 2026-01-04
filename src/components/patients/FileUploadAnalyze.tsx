import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Upload, Loader2, FileSpreadsheet, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { analyzePatientData } from '@/lib/aiAnalyzer';
import { ExtractedPatientData } from '@/types/patient';
import { DataTable } from './DataTable';

interface FileUploadAnalyzeProps {
  onBack: () => void;
  onImport: (data: ExtractedPatientData[]) => void;
}

export function FileUploadAnalyze({ onBack, onImport }: FileUploadAnalyzeProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedPatientData[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (!['xlsx', 'xls', 'pdf'].includes(fileExtension || '')) {
        toast.error('Please upload an Excel (.xlsx, .xls) or PDF file');
        return;
      }
      setFile(selectedFile);
      setExtractedData([]);
      setAnalysisComplete(false);
    }
  };

  const analyzeFile = async () => {
    if (!file) return;

    setIsAnalyzing(true);
    setExtractedData([]);
    setAnalysisComplete(false);

    const maxRetries = 3;

    try {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const fileExtension = file.name.split('.').pop()?.toLowerCase();

          if (fileExtension === 'pdf') {
            await analyzePDFFile(file);
          } else {
            await analyzeExcelFile(file);
          }

          toast.success('File analyzed successfully!');
          setAnalysisComplete(true);
          return;
        } catch (err: any) {
          const msg = String(err?.message ?? err);
          console.error(`Analysis attempt ${attempt} failed:`, err);

          if (attempt === maxRetries) throw err;

          const delay = 800 * attempt;
          toast.warning(`Analysis failed, retrying... (${attempt}/${maxRetries})`);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    } catch (error: any) {
      console.error('Error analyzing file:', error);
      toast.error(error.message || 'Failed to analyze file');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeExcelFile = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { cellDates: true, cellNF: false, raw: false });

    const allData: ExtractedPatientData[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        defval: '',
        blankrows: false,
      }) as Record<string, any>[];

      if (jsonData.length === 0) {
        console.warn(`Sheet "${sheetName}" is empty, skipping...`);
        continue;
      }

      const headers = Object.keys(jsonData[0] || {});
      const sheetText = [
        `Sheet: ${sheetName}`,
        `Headers: ${headers.join(' | ')}`,
        '',
        ...jsonData.map((row, idx) =>
          `Row ${idx + 1}: ${headers.map((h) => `${h}: ${row[h] ?? ''}`).join(' | ')}`
        ),
      ].join('\n');

      try {
        const extractedPatients = await analyzePatientData(sheetText, sheetName);
        const validated = extractedPatients.filter((p) => p.patient_name && p.patient_name.trim() !== '');
        allData.push(...validated);
      } catch (err) {
        console.error(`Error analyzing sheet "${sheetName}":`, err);
        toast.error(`Failed to analyze sheet "${sheetName}"`);
      }
    }

    if (allData.length === 0) {
      throw new Error('No valid patient data found in any sheet');
    }

    setExtractedData(allData);
  };

  const analyzePDFFile = async (file: File) => {
    // Dynamic import keeps initial bundle smaller
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const allData: ExtractedPatientData[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const pageText = (textContent.items as any[])
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!pageText) continue;

      const structuredText = [`Page: ${pageNum} of ${pdf.numPages}`, 'Content:', pageText].join('\n');

      try {
        const extractedPatients = await analyzePatientData(structuredText, `PDF Page ${pageNum}`);
        const validated = extractedPatients.filter((p) => p.patient_name && p.patient_name.trim() !== '');
        allData.push(...validated);
      } catch (err) {
        console.error(`Error analyzing page ${pageNum}:`, err);
      }
    }

    if (allData.length === 0) {
      throw new Error('No valid patient data found in PDF');
    }

    setExtractedData(allData);
  };

  const handleImport = () => {
    if (extractedData.length === 0) {
      toast.error('No data to import');
      return;
    }
    onImport(extractedData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Upload & Analyze File</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Excel or PDF File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept=".xlsx,.xls,.pdf"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button
                onClick={analyzeFile}
                disabled={!file || isAnalyzing}
                className="min-w-[120px]"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {file.name.endsWith('.pdf') ? (
                  <FileText className="w-4 h-4" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4" />
                )}
                <span>{file.name}</span>
                <span className="text-xs">({(file.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Instructions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Upload Excel (.xlsx, .xls) or PDF file containing patient data</li>
              <li>All sheets/pages will be analyzed automatically</li>
              <li>AI will extract: Name, Age, Sex, EB Number, Address, Contact Numbers, Diagnosis, Surgery Details</li>
              <li>Review extracted data in the table below</li>
              <li>Click Import to add patients to the database</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {analysisComplete && extractedData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              Extracted Data ({extractedData.length} patients found)
            </CardTitle>
            <Button onClick={handleImport} className="gap-2">
              <Download className="w-4 h-4" />
              Import to Database
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable data={extractedData} />
          </CardContent>
        </Card>
      )}

      {analysisComplete && extractedData.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No patient data found in the uploaded file. Please check the file format and try again.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
