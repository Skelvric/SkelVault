'use client';

import { estimatePasswordStrength } from '@/lib/passwordStrength';
import { cn } from '@/lib/cn';

const BAR_COLORS: Record<number, string> = {
  0: 'bg-destructive',
  1: 'bg-destructive',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-success',
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  const { score, label, warnings } = estimatePasswordStrength(password);

  return (
    <div className="space-y-1.5 mt-1.5" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full bg-muted transition-colors duration-300',
              i <= score - 1 && score > 0 && BAR_COLORS[score]
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {warnings.length > 0 && (
        <p className="text-xs text-muted-foreground">{warnings[0]}</p>
      )}
    </div>
  );
}
