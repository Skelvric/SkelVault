'use client';

import { useTheme } from 'next-themes';
import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  const { resolvedTheme } = useTheme();

  return (
    <SonnerToaster
      theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast bg-card! text-card-foreground! border! border-border! shadow-lg! rounded-xl!',
          description: 'text-muted-foreground!',
          actionButton: 'bg-primary! text-primary-foreground!',
          cancelButton: 'bg-muted! text-muted-foreground!',
        },
      }}
    />
  );
}
