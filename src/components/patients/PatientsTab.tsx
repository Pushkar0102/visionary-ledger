import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, UserPlus, List } from 'lucide-react';
import { PatientSearch } from './PatientSearch';
import { PatientForm } from './PatientForm';
import { PatientList } from './PatientList';

type ViewMode = 'actions' | 'search' | 'add' | 'list';

export function PatientsTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('actions');

  const renderContent = () => {
    switch (viewMode) {
      case 'search':
        return <PatientSearch onBack={() => setViewMode('actions')} />;
      case 'add':
        return <PatientForm onBack={() => setViewMode('actions')} onSuccess={() => setViewMode('list')} />;
      case 'list':
        return <PatientList onBack={() => setViewMode('actions')} />;
      default:
        return (
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-2xl font-bold text-foreground">Waiting List Patients</h1>
            <div className="grid gap-4">
              <button onClick={() => setViewMode('search')} className="action-button">
                <Search className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Search Patient</p>
                  <p className="text-sm text-muted-foreground">Find existing patient records</p>
                </div>
              </button>
              <button onClick={() => setViewMode('add')} className="action-button">
                <UserPlus className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Add Patient</p>
                  <p className="text-sm text-muted-foreground">Register a new patient to the waiting list</p>
                </div>
              </button>
              <button onClick={() => setViewMode('list')} className="action-button">
                <List className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">View Complete List</p>
                  <p className="text-sm text-muted-foreground">Browse all waiting list patients</p>
                </div>
              </button>
            </div>
          </div>
        );
    }
  };

  return renderContent();
}