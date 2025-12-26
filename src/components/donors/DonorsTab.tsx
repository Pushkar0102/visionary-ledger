import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, Heart, List } from 'lucide-react';
import { DonorSearch } from './DonorSearch';
import { DonorForm } from './DonorForm';
import { DonorList } from './DonorList';

type ViewMode = 'actions' | 'search' | 'add' | 'list';

export function DonorsTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('actions');

  const renderContent = () => {
    switch (viewMode) {
      case 'search':
        return <DonorSearch onBack={() => setViewMode('actions')} />;
      case 'add':
        return <DonorForm onBack={() => setViewMode('actions')} onSuccess={() => setViewMode('list')} />;
      case 'list':
        return <DonorList onBack={() => setViewMode('actions')} />;
      default:
        return (
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-2xl font-bold text-foreground">Donor Data</h1>
            <div className="grid gap-4">
              <button onClick={() => setViewMode('search')} className="action-button">
                <Search className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Search Donor</p>
                  <p className="text-sm text-muted-foreground">Find existing donor records</p>
                </div>
              </button>
              <button onClick={() => setViewMode('add')} className="action-button">
                <Heart className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Add Donor</p>
                  <p className="text-sm text-muted-foreground">Register a new eye donor</p>
                </div>
              </button>
              <button onClick={() => setViewMode('list')} className="action-button">
                <List className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">View Complete List</p>
                  <p className="text-sm text-muted-foreground">Browse all donor records</p>
                </div>
              </button>
            </div>
          </div>
        );
    }
  };

  return renderContent();
}