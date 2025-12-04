// [COMPONENT] DetailPanel - Sliding panel for details

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface DetailPanelProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: 'md' | 'lg' | 'xl';
}

export function DetailPanel({
  title,
  open,
  onClose,
  children,
  width = 'lg',
}: DetailPanelProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Panel */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full bg-background border-l border-border shadow-lg z-50 overflow-hidden flex flex-col',
          {
            'w-[400px]': width === 'md',
            'w-[500px]': width === 'lg',
            'w-[600px]': width === 'xl',
          }
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </>
  );
}
