import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileSpreadsheet, FileText, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

type DataType = 'patients' | 'donors';

interface ExtractedPatient {
  patient_name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  eb_number?: string;
  address?: string;
  contact_numbers?: string[];
  diagnosis?: string;
  diagnosis_eye?: 'RE' | 'LE';
  surgical_plan?: string;
  surgery_eye?: 'RE' | 'LE';
  iol_option?: string;
  operation_date?: string;
  surgeon_name?: string;
  remarks?: string;
  selected?: boolean;
}

interface ExtractedDonor {
  donor_name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  cause_of_death?: string;
  retrieval_date?: string;
  death_to_retrieval_hours?: number;
  death_to_retrieval_minutes?: number;
  eye_number_left?: string;
  eye_number_right?: string;
  address?: string;
  source_of_awareness?: string;
  selected?: boolean;
}

export function FileUpload() {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [dataType, setDataType] = useState<DataType>('patients');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedPatients, setExtractedPatients] = useState<ExtractedPatient[]>([]);
  const [extractedDonors, setExtractedDonors] = useState<ExtractedDonor[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const fileType = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? 'excel' : 'text';
    
    setIsAnalyzing(true);
    
    try {
      let fileContent = '';
      
      if (fileType === 'excel') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Process ALL sheets in the workbook
        const allSheetsContent: string[] = [];
        workbook.SheetNames.forEach((sheetName, index) => {
          const sheet = workbook.Sheets[sheetName];
          const sheetCsv = XLSX.utils.sheet_to_csv(sheet);
          allSheetsContent.push(`=== SHEET ${index + 1}: ${sheetName} ===\n${sheetCsv}`);
        });
        fileContent = allSheetsContent.join('\n\n');
      } else {
        fileContent = await file.text();
      }

      const { data, error } = await supabase.functions.invoke('analyze-file', {
        body: { fileContent, fileType, dataType }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      if (dataType === 'patients') {
        setExtractedPatients((data.data.patients || []).map((p: ExtractedPatient) => ({ ...p, selected: true })));
      } else {
        setExtractedDonors((data.data.donors || []).map((d: ExtractedDonor) => ({ ...d, selected: true })));
      }
      
      setShowPreview(true);
      toast({ title: 'File analyzed', description: `Found ${dataType === 'patients' ? data.data.patients?.length : data.data.donors?.length} records` });
    } catch (error) {
      console.error('Error analyzing file:', error);
      toast({ 
        title: 'Analysis failed', 
        description: error instanceof Error ? error.message : 'Failed to analyze file',
        variant: 'destructive' 
      });
    } finally {
      setIsAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveData = async () => {
    setIsSaving(true);
    
    try {
      if (dataType === 'patients') {
        const selectedPatients = extractedPatients.filter(p => p.selected);
        
        for (const patient of selectedPatients) {
          const { error } = await supabase.from('patients').insert({
            patient_name: patient.patient_name,
            age: patient.age,
            sex: patient.sex,
            eb_number: patient.eb_number || null,
            address: patient.address || null,
            contact_numbers: patient.contact_numbers || [],
            diagnosis: patient.diagnosis || null,
            diagnosis_eye: patient.diagnosis_eye || null,
            surgery_type: patient.surgical_plan as any || null,
            surgery_eye: patient.surgery_eye || null,
            iol_option: patient.iol_option as any || null,
            operation_date: patient.operation_date || null,
            surgeon_name: patient.surgeon_name || null,
            is_operated: !!patient.operation_date,
            remarks: patient.remarks || null,
            created_by: user?.id || null,
          });
          
          if (error) throw error;
        }
        
        toast({ title: 'Success', description: `Imported ${selectedPatients.length} patients` });
      } else {
        const selectedDonors = extractedDonors.filter(d => d.selected);
        
        for (const donor of selectedDonors) {
          const eyeNumberLeft = donor.eye_number_left || `EB-${Date.now()}-L`;
          const eyeNumberRight = donor.eye_number_right || `EB-${Date.now()}-R`;
          
          const { data: donorData, error: donorError } = await supabase.from('donors').insert({
            donor_name: donor.donor_name,
            age: donor.age,
            sex: donor.sex,
            cause_of_death: donor.cause_of_death || null,
            retrieval_date: donor.retrieval_date || new Date().toISOString().split('T')[0],
            death_to_retrieval_hours: donor.death_to_retrieval_hours || 0,
            death_to_retrieval_minutes: donor.death_to_retrieval_minutes || 0,
            eye_number_left: eyeNumberLeft,
            eye_number_right: eyeNumberRight,
            address: donor.address || null,
            source_of_awareness: donor.source_of_awareness || null,
            created_by: user?.id || null,
          }).select().single();
          
          if (donorError) throw donorError;
          
          await supabase.from('donor_eyes').insert([
            { donor_id: donorData.id, eye_number: eyeNumberLeft, eye_side: 'LE' as const },
            { donor_id: donorData.id, eye_number: eyeNumberRight, eye_side: 'RE' as const }
          ]);
        }
        
        toast({ title: 'Success', description: `Imported ${selectedDonors.length} donors` });
      }
      
      setShowPreview(false);
      setExtractedPatients([]);
      setExtractedDonors([]);
      setIsOpen(false);
    } catch (error) {
      console.error('Error saving data:', error);
      toast({ 
        title: 'Save failed', 
        description: error instanceof Error ? error.message : 'Failed to save data',
        variant: 'destructive' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelection = (index: number) => {
    if (dataType === 'patients') {
      setExtractedPatients(prev => prev.map((p, i) => i === index ? { ...p, selected: !p.selected } : p));
    } else {
      setExtractedDonors(prev => prev.map((d, i) => i === index ? { ...d, selected: !d.selected } : d));
    }
  };

  const toggleAll = (selected: boolean) => {
    if (dataType === 'patients') {
      setExtractedPatients(prev => prev.map(p => ({ ...p, selected })));
    } else {
      setExtractedDonors(prev => prev.map(d => ({ ...d, selected })));
    }
  };

  const selectedCount = dataType === 'patients' 
    ? extractedPatients.filter(p => p.selected).length 
    : extractedDonors.filter(d => d.selected).length;

  const totalCount = dataType === 'patients' ? extractedPatients.length : extractedDonors.length;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="flex items-center gap-2">
        <Upload className="w-4 h-4" />
        Import Data
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Data from File
            </DialogTitle>
          </DialogHeader>

          {!showPreview ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Type</label>
                <Select value={dataType} onValueChange={(v: DataType) => setDataType(v)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="patients">Patients</SelectItem>
                    <SelectItem value="donors">Donors</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="border-dashed">
                <CardContent className="py-8">
                  <div className="flex flex-col items-center gap-4">
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-muted-foreground">Analyzing all sheets with AI...</p>
                      </>
                    ) : (
                      <>
                        <div className="flex gap-4">
                          <FileSpreadsheet className="w-12 h-12 text-green-600" />
                          <FileText className="w-12 h-12 text-red-600" />
                        </div>
                        <p className="text-muted-foreground text-center">
                          Upload an Excel (.xlsx) or text file<br />
                          AI will analyze ALL sheets and extract {dataType} data
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv,.txt"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Button onClick={() => fileInputRef.current?.click()}>
                          Select File
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0">
              <div className="flex items-center justify-between py-2 flex-shrink-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{fileName}</span>
                  <span>•</span>
                  <span>{selectedCount}/{totalCount} selected</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleAll(true)}>Select All</Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleAll(false)}>Deselect All</Button>
                </div>
              </div>

              {/* Horizontally and vertically scrollable table */}
              <div className="flex-1 border rounded-md overflow-auto min-h-0">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-12 sticky left-0 bg-background z-20"></TableHead>
                      <TableHead className="sticky left-12 bg-background z-20 min-w-[150px]">Name</TableHead>
                      <TableHead className="min-w-[60px]">Age</TableHead>
                      <TableHead className="min-w-[80px]">Sex</TableHead>
                      {dataType === 'patients' ? (
                        <>
                          <TableHead className="min-w-[100px]">EB Number</TableHead>
                          <TableHead className="min-w-[200px]">Address</TableHead>
                          <TableHead className="min-w-[150px]">Contact Numbers</TableHead>
                          <TableHead className="min-w-[150px]">Diagnosis</TableHead>
                          <TableHead className="min-w-[80px]">Diag. Eye</TableHead>
                          <TableHead className="min-w-[120px]">Surgical Plan</TableHead>
                          <TableHead className="min-w-[80px]">Surg. Eye</TableHead>
                          <TableHead className="min-w-[100px]">IOL Option</TableHead>
                          <TableHead className="min-w-[120px]">Operation Date</TableHead>
                          <TableHead className="min-w-[150px]">Surgeon Name</TableHead>
                          <TableHead className="min-w-[150px]">Remarks</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead className="min-w-[150px]">Cause of Death</TableHead>
                          <TableHead className="min-w-[120px]">Retrieval Date</TableHead>
                          <TableHead className="min-w-[80px]">D-R Hours</TableHead>
                          <TableHead className="min-w-[80px]">D-R Mins</TableHead>
                          <TableHead className="min-w-[120px]">Eye No. Left</TableHead>
                          <TableHead className="min-w-[120px]">Eye No. Right</TableHead>
                          <TableHead className="min-w-[200px]">Address</TableHead>
                          <TableHead className="min-w-[150px]">Source</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataType === 'patients' 
                      ? extractedPatients.map((patient, index) => (
                          <TableRow key={index} className={!patient.selected ? 'opacity-50' : ''}>
                            <TableCell className="sticky left-0 bg-background">
                              <Checkbox 
                                checked={patient.selected} 
                                onCheckedChange={() => toggleSelection(index)} 
                              />
                            </TableCell>
                            <TableCell className="sticky left-12 bg-background font-medium">{patient.patient_name}</TableCell>
                            <TableCell>{patient.age}</TableCell>
                            <TableCell>{patient.sex}</TableCell>
                            <TableCell>{patient.eb_number || '-'}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={patient.address}>{patient.address || '-'}</TableCell>
                            <TableCell>{patient.contact_numbers?.join(', ') || '-'}</TableCell>
                            <TableCell>{patient.diagnosis || '-'}</TableCell>
                            <TableCell>{patient.diagnosis_eye || '-'}</TableCell>
                            <TableCell>{patient.surgical_plan || '-'}</TableCell>
                            <TableCell>{patient.surgery_eye || '-'}</TableCell>
                            <TableCell>{patient.iol_option || '-'}</TableCell>
                            <TableCell>{patient.operation_date || '-'}</TableCell>
                            <TableCell>{patient.surgeon_name || '-'}</TableCell>
                            <TableCell className="max-w-[150px] truncate" title={patient.remarks}>{patient.remarks || '-'}</TableCell>
                          </TableRow>
                        ))
                      : extractedDonors.map((donor, index) => (
                          <TableRow key={index} className={!donor.selected ? 'opacity-50' : ''}>
                            <TableCell className="sticky left-0 bg-background">
                              <Checkbox 
                                checked={donor.selected} 
                                onCheckedChange={() => toggleSelection(index)} 
                              />
                            </TableCell>
                            <TableCell className="sticky left-12 bg-background font-medium">{donor.donor_name}</TableCell>
                            <TableCell>{donor.age}</TableCell>
                            <TableCell>{donor.sex}</TableCell>
                            <TableCell>{donor.cause_of_death || '-'}</TableCell>
                            <TableCell>{donor.retrieval_date || '-'}</TableCell>
                            <TableCell>{donor.death_to_retrieval_hours ?? '-'}</TableCell>
                            <TableCell>{donor.death_to_retrieval_minutes ?? '-'}</TableCell>
                            <TableCell>{donor.eye_number_left || '-'}</TableCell>
                            <TableCell>{donor.eye_number_right || '-'}</TableCell>
                            <TableCell className="max-w-[200px] truncate" title={donor.address}>{donor.address || '-'}</TableCell>
                            <TableCell>{donor.source_of_awareness || '-'}</TableCell>
                          </TableRow>
                        ))
                    }
                  </TableBody>
                </Table>
              </div>

              {/* Import button at the end of table area */}
              <div className="flex items-center justify-between pt-4 flex-shrink-0 border-t mt-2">
                <Button variant="outline" onClick={() => { setShowPreview(false); setExtractedPatients([]); setExtractedDonors([]); }}>
                  Upload Different File
                </Button>
                <Button onClick={handleSaveData} disabled={isSaving || selectedCount === 0} size="lg">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    `Import ${selectedCount} Records`
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
