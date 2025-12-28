import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Search, Loader2, User, Phone, Hash, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PatientEditForm } from './PatientEditForm';
import type { Patient } from '@/types/database';

interface PatientSearchProps {
  onBack: () => void;
}

export function PatientSearch({ onBack }: PatientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const searchPatients = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const isNumeric = /^\d+$/.test(query);
      
      let data: Patient[] = [];
      
      if (isNumeric) {
        // Search by WL number or contact number
        const { data: wlResults, error: wlError } = await supabase
          .from('patients')
          .select('*')
          .eq('wl_number', parseInt(query))
          .limit(20);
        
        if (wlError) throw wlError;
        
        const { data: contactResults, error: contactError } = await supabase
          .from('patients')
          .select('*')
          .contains('contact_numbers', [query])
          .limit(20);
        
        if (contactError) throw contactError;
        
        // Merge and deduplicate
        const merged = [...(wlResults || []), ...(contactResults || [])];
        const unique = merged.filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i);
        data = unique;
      } else {
        // Search by name
        const { data: nameResults, error } = await supabase
          .from('patients')
          .select('*')
          .ilike('patient_name', `%${query}%`)
          .order('wl_number', { ascending: false })
          .limit(20);
        
        if (error) throw error;
        data = nameResults || [];
      }
      
      setResults(data);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const debounce = setTimeout(() => {
      searchPatients(searchQuery);
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, searchPatients]);

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditOpen(false);
    setSelectedPatient(null);
    searchPatients(searchQuery);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Search Patient</h1>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, WL#, or contact number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          autoFocus
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search Tips */}
      {!searchQuery && (
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><User className="w-3 h-3" /> Name</span>
          <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> WL Number</span>
          <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> Contact</span>
        </div>
      )}

      {/* Results */}
      <div className="space-y-2">
        {results.map((patient) => (
          <Card
            key={patient.id}
            className="p-3 cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => handleEdit(patient)}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{patient.patient_name}</span>
                  <Badge variant="outline" className="text-xs">WL# {patient.wl_number}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {patient.age}y / {patient.sex} • {patient.diagnosis || 'No diagnosis'}
                </div>
                {patient.contact_numbers && patient.contact_numbers.length > 0 && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {patient.contact_numbers[0]}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {patient.is_operated ? (
                  <Badge className="bg-success text-success-foreground text-xs">Operated</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Waiting</Badge>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {searchQuery && !isSearching && results.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">No patients found for "{searchQuery}"</p>
          </Card>
        )}
      </div>

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
    </div>
  );
}
