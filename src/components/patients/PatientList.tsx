import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Eye, Edit, Loader2, Calendar, Filter, ChevronLeft, ChevronRight, Mail, Sparkles, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PatientEditForm } from './PatientEditForm';
import { generateThankYouEmail } from '@/lib/aiAnalyzer';
import type { Patient } from '@/types/database';

interface PatientListProps {
  onBack: () => void;
}

const MONTHS = [
  { value: '0', label: 'January' },
  { value: '1', label: 'February' },
  { value: '2', label: 'March' },
  { value: '3', label: 'April' },
  { value: '4', label: 'May' },
  { value: '5', label: 'June' },
  { value: '6', label: 'July' },
  { value: '7', label: 'August' },
  { value: '8', label: 'September' },
  { value: '9', label: 'October' },
  { value: '10', label: 'November' },
  { value: '11', label: 'December' },
];

const ITEMS_PER_PAGE = 20;

export function PatientList({ onBack }: PatientListProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const years = Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString());

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('patients')
        .select('*', { count: 'exact' })
        .order('wl_number', { ascending: false });

      if (selectedYear !== 'all') {
        const yearStart = new Date(parseInt(selectedYear), 0, 1).toISOString();
        const yearEnd = new Date(parseInt(selectedYear) + 1, 0, 1).toISOString();
        query = query.gte('date_of_registration', yearStart).lt('date_of_registration', yearEnd);
      }

      if (selectedMonth !== 'all' && selectedYear !== 'all') {
        const monthStart = new Date(parseInt(selectedYear), parseInt(selectedMonth), 1).toISOString();
        const monthEnd = new Date(parseInt(selectedYear), parseInt(selectedMonth) + 1, 1).toISOString();
        query = query.gte('date_of_registration', monthStart).lt('date_of_registration', monthEnd);
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;
      setPatients(data || []);
      setTotalCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast.error('Failed to load patients');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [selectedMonth, selectedYear, currentPage]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handleView = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsViewOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditOpen(false);
    setSelectedPatient(null);
    fetchPatients();
  };

  const handleGenerateEmail = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEmailDialogOpen(true);
    setIsGeneratingEmail(true);
    setGeneratedEmail('');
    
    try {
      const email = await generateThankYouEmail(
        patient.patient_name,
        'Anonymous Donor',
        patient.surgery_type || 'corneal transplant',
        patient.surgeon_name || 'our surgical team'
      );
      setGeneratedEmail(email);
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate email');
      setIsEmailDialogOpen(false);
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedEmail);
    toast.success('Email copied to clipboard');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Patient List</h1>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedYear} onValueChange={(val) => { setSelectedYear(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={(val) => { setSelectedMonth(val); setCurrentPage(1); }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Months</SelectItem>
              {MONTHS.map((month) => (
                <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground ml-auto">
            {totalCount} patients found
          </span>
        </div>
      </Card>

      {/* Patient Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : patients.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No patients found for the selected filters.</p>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">WL#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-16">Age</TableHead>
                  <TableHead className="w-16">Sex</TableHead>
                  <TableHead>Diagnosis</TableHead>
                  <TableHead>Surgery</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.wl_number}</TableCell>
                    <TableCell>{patient.patient_name}</TableCell>
                    <TableCell>{patient.age}y</TableCell>
                    <TableCell>{patient.sex}</TableCell>
                    <TableCell>
                      {patient.diagnosis && (
                        <span className="text-sm">
                          {patient.diagnosis_eye}: {patient.diagnosis}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {patient.surgery_type && (
                        <span className="text-sm">
                          {patient.surgery_type}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {patient.is_operated ? (
                        <Badge className="bg-success text-success-foreground">Operated</Badge>
                      ) : (
                        <Badge variant="secondary">Waiting</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(patient)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(patient)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Details - WL# {selectedPatient?.wl_number}</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedPatient.patient_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Age / Sex</p>
                  <p className="font-medium">{selectedPatient.age}y / {selectedPatient.sex}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registration Date</p>
                  <p className="font-medium">{format(new Date(selectedPatient.date_of_registration), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">EB Number</p>
                  <p className="font-medium">{selectedPatient.eb_number || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Address</p>
                  <p className="font-medium">{selectedPatient.address || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Contact Numbers</p>
                  <p className="font-medium">{selectedPatient.contact_numbers?.join(', ') || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Diagnosis (Primary)</p>
                  <p className="font-medium">{selectedPatient.diagnosis_eye}: {selectedPatient.diagnosis || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Diagnosis (Secondary)</p>
                  <p className="font-medium">{selectedPatient.diagnosis_eye_left ? `${selectedPatient.diagnosis_eye_left}: ${selectedPatient.diagnosis_left || '-'}` : '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Surgery</p>
                  <p className="font-medium">{selectedPatient.surgery_type || '-'} {selectedPatient.surgery_eye ? `(${selectedPatient.surgery_eye})` : ''}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">IOL Option</p>
                  <p className="font-medium">{selectedPatient.iol_option || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Surgeon</p>
                  <p className="font-medium">{selectedPatient.surgeon_name || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium">{selectedPatient.is_operated ? 'Operated' : 'Waiting'}</p>
                </div>
                {selectedPatient.is_operated && selectedPatient.operation_date && (
                  <div>
                    <p className="text-muted-foreground">Operation Date</p>
                    <p className="font-medium">{format(new Date(selectedPatient.operation_date), 'dd MMM yyyy')}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-muted-foreground">Remarks</p>
                  <p className="font-medium">{selectedPatient.remarks || '-'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => { setIsViewOpen(false); handleEdit(selectedPatient); }} className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Patient
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => { setIsViewOpen(false); handleGenerateEmail(selectedPatient); }}
                  className="flex-1"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Thank You Email
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Patient - WL# {selectedPatient?.wl_number}</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <PatientEditForm patient={selectedPatient} onSuccess={handleEditSuccess} onCancel={() => setIsEditOpen(false)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Email Generation Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              AI Generated Thank You Email
            </DialogTitle>
          </DialogHeader>
          {isGeneratingEmail ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Generating personalized email...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Generated for: <span className="font-medium text-foreground">{selectedPatient?.patient_name}</span>
              </div>
              <Textarea
                value={generatedEmail}
                onChange={(e) => setGeneratedEmail(e.target.value)}
                className="min-h-[300px] text-sm"
                placeholder="Email content will appear here..."
              />
              <div className="flex gap-2">
                <Button onClick={copyToClipboard} className="flex-1">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy to Clipboard
                </Button>
                <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
