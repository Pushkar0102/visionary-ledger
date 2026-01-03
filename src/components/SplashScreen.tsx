import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<'fadeIn' | 'visible' | 'fadeOut'>('fadeIn');

  useEffect(() => {
    // Phase 1: Fade in (0.5s)
    const fadeInTimer = setTimeout(() => {
      setPhase('visible');
    }, 500);

    // Phase 2: Stay visible (1.5s)
    const visibleTimer = setTimeout(() => {
      setPhase('fadeOut');
    }, 2000);

    // Phase 3: Complete after fade out (0.5s)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(visibleTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        phase === 'fadeIn' ? 'opacity-0' : phase === 'fadeOut' ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-in zoom-in-50 duration-500">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
            <Eye className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Eye Bank Management
          </h1>
          <p className="mt-2 text-muted-foreground">
            Secure Patient & Donor Registry
          </p>
        </div>
      </div>
    </div>
  );
}
