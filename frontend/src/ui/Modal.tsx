import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { vi } from '../i18n/vi';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = '',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const scroll = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controls = () => Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'
    ) ?? []).filter(element => element.getAttribute('aria-hidden') !== 'true');
    controls()[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const items = controls();
      const first = items[0], last = items[items.length - 1];
      if (!first) { event.preventDefault(); dialogRef.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = scroll;
      if (previous?.isConnected) previous.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={`bg-paper rounded-2xl shadow-xl border border-gray-200 max-w-lg w-full max-h-[90dvh] overflow-y-auto p-4 sm:p-6 relative animate-in fade-in zoom-in-95 duration-150 ${className}`}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
          <h2 id={titleId} className="text-2xl font-bold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-mute hover:bg-canvas hover:text-ink transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label={vi.presentation.closeDialog}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

