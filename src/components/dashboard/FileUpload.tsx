import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileSpreadsheet, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import * as XLSX from 'xlsx';

type DataType = 'patients' | 'donors';

interface ExtractedPatient {
  patient_name: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  address?: string;
  contact_numbers?: string[];
  diagnosis?: string;
  diagnosis_eye?: 'RE' | 'LE';
  surgery_type?: string;
  surgery_eye?: 'RE' | 'LE';
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
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        fileContent = XLSX.utils.sheet_to_csv(sheet);
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
            address: patient.address || null,
            contact_numbers: patient.contact_numbers || [],
            diagnosis: patient.diagnosis || null,
            diagnosis_eye: patient.diagnosis_eye || null,
            surgery_type: patient.surgery_type as any || null,
            surgery_eye: patient.surgery_eye || null,
            surgeon_name: patient.surgeon_name || null,
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
          
          // Create donor eyes
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

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)} className="flex items-center gap-2">
        <Upload className="w-4 h-4" />
        Import Data
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
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
                  <SelectTrigger>
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
                        <p className="text-muted-foreground">Analyzing file with AI...</p>
                      </>
                    ) : (
                      <>
                        <div className="flex gap-4">
                          <FileSpreadsheet className="w-12 h-12 text-green-600" />
                          <FileText className="w-12 h-12 text-red-600" />
                        </div>
                        <p className="text-muted-foreground text-center">
                          Upload an Excel (.xlsx) or text file<br />
                          AI will extract {dataType} data automatically
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
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{fileName}</span>
                  <span>•</span>
                  <span>
                    {dataType === 'patients' 
                      ? `${extractedPatients.filter(p => p.selected).length}/${extractedPatients.length} selected`
                      : `${extractedDonors.filter(d => d.selected).length}/${extractedDonors.length} selected`
                    }
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => toggleAll(true)}>Select All</Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleAll(false)}>Deselect All</Button>
                </div>
              </div>

              <ScrollArea className="flex-1 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Sex</TableHead>
                      {dataType === 'patients' ? (
                        <>
                          <TableHead>Diagnosis</TableHead>
                          <TableHead>Surgery</TableHead>
                        </>
                      ) : (
                        <>
                          <TableHead>Cause of Death</TableHead>
                          <TableHead>Retrieval Date</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataType === 'patients' 
                      ? extractedPatients.map((patient, index) => (
                          <TableRow key={index} className={!patient.selected ? 'opacity-50' : ''}>
                            <TableCell>
                              <Checkbox 
                                checked={patient.selected} 
                                onCheckedChange={() => toggleSelection(index)} 
                              />
                            </TableCell>
                            <TableCell className="font-medium">{patient.patient_name}</TableCell>
                            <TableCell>{patient.age}</TableCell>
                            <TableCell>{patient.sex}</TableCell>
                            <TableCell>{patient.diagnosis || '-'}</TableCell>
                            <TableCell>{patient.surgery_type || '-'}</TableCell>
                          </TableRow>
                        ))
                      : extractedDonors.map((donor, index) => (
                          <TableRow key={index} className={!donor.selected ? 'opacity-50' : ''}>
                            <TableCell>
                              <Checkbox 
                                checked={donor.selected} 
                                onCheckedChange={() => toggleSelection(index)} 
                              />
                            </TableCell>
                            <TableCell className="font-medium">{donor.donor_name}</TableCell>
                            <TableCell>{donor.age}</TableCell>
                            <TableCell>{donor.sex}</TableCell>
                            <TableCell>{donor.cause_of_death || '-'}</TableCell>
                            <TableCell>{donor.retrieval_date || '-'}</TableCell>
                          </TableRow>
                        ))
                    }
                  </TableBody>
                </Table>
              </ScrollArea>

              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => { setShowPreview(false); setExtractedPatients([]); setExtractedDonors([]); }}>
                  Upload Different File
                </Button>
                <Button onClick={handleSaveData} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    `Import ${dataType === 'patients' 
                      ? extractedPatients.filter(p => p.selected).length 
                      : extractedDonors.filter(d => d.selected).length
                    } Records`
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
