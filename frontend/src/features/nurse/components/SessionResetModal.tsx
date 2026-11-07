import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';
import { vi } from '../../../i18n/vi';

interface SessionResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const SessionResetModal: React.FC<SessionResetModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vi.nurse.reset.modalTitle}
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-status-danger/10 border border-status-danger/30 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-status-danger shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-status-danger">Hành động này không thể hoàn tác</p>
            <p className="text-xs text-ink/80 leading-relaxed">
              {vi.nurse.reset.warningMessage}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} className="min-h-[48px] py-2 text-base">
            {vi.nurse.reset.cancelButton}
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirmReset();
              onClose();
            }}
            className="min-h-[48px] py-2 text-base"
          >
            <Trash2 className="w-4 h-4" />
            <span>{vi.nurse.reset.confirmButton}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
