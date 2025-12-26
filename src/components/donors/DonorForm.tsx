import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface DonorFormProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function DonorForm({ onBack, onSuccess }: DonorFormProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Add Donor</h1>
      </div>
      <p className="text-muted-foreground">Donor form coming soon...</p>
    </div>
  );
}