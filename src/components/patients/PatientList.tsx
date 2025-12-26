import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PatientListProps {
  onBack: () => void;
}

export function PatientList({ onBack }: PatientListProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Patient List</h1>
      </div>
      <p className="text-muted-foreground">Patient list coming soon...</p>
    </div>
  );
}