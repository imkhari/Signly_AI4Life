import React from 'react';
import { Printer, ShieldAlert } from 'lucide-react';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';
import { SemanticFrame, TriageSummary } from '../../../types';
import { vi } from '../../../i18n/vi';

interface ExportRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  queueNumber: number;
  intakeCode: string;
  frame: SemanticFrame;
  summary: TriageSummary | null;
  onConfirmExport: () => void;
}

export const ExportRecordModal: React.FC<ExportRecordModalProps> = ({
  isOpen,
  onClose,
  queueNumber,
  intakeCode,
  frame,
  summary,
  onConfirmExport,
}) => {
  const handlePrint = () => {
    onConfirmExport();
    window.print();
  };

  const formattedDate = new Date().toLocaleString('vi-VN');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vi.nurse.export.modalTitle}
    >
      <div className="space-y-4">
        {/* Privacy Notice Banner */}
        <div className="p-3.5 rounded-xl bg-brand-light/30 border border-brand/20 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-brand shrink-0 mt-0.5" />
          <div className="text-xs text-ink space-y-1">
            <p className="font-semibold">{vi.nurse.export.disclaimer}</p>
            <p className="text-mute">{vi.nurse.export.hospitalNotice}</p>
          </div>
        </div>

        {/* Printable Record Sheet */}
        <div
          id="printable-triage-record"
          className="border border-gray-300 rounded-xl p-6 bg-white text-black space-y-4 print:border-none print:p-0"
        >
          {/* Header */}
          <div className="border-b-2 border-black pb-3 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold uppercase tracking-wide">
                Phiếu Tiếp Nhận Ban Đầu
              </h2>
              <p className="text-xs text-gray-600">Hệ thống trợ lý tiếp nhận AI4Care</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-black">
                STT: <span className="underline">{queueNumber}</span>
              </div>
              <p className="text-xs font-mono font-bold text-gray-700">Mã: {intakeCode}</p>
            </div>
          </div>

          <div className="text-xs text-gray-600 flex justify-between">
            <span>Thời gian lập: {formattedDate}</span>
            <span>Hình thức tiếp nhận: Kiosk trợ năng 2 chiều</span>
          </div>

          {/* Section 1: Triệu chứng đã xác nhận */}
          <div className="space-y-2 text-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700 border-b border-gray-200 pb-1">
              1. Triệu chứng khai báo (Đã xác nhận)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-semibold">Lý do khám: </span>
                <span>{frame.chief_complaint.label_vi || frame.chief_complaint.code || 'Chưa rõ'}</span>
              </div>
              <div>
                <span className="font-semibold">Tình trạng đau: </span>
                <span>
                  {frame.pain.present === false
                    ? 'Không đau'
                    : frame.pain.present === true
                    ? `Có đau (Mức ${frame.pain.severity ?? '?'}/10)`
                    : 'Chưa khai báo'}
                </span>
              </div>
              <div>
                <span className="font-semibold">Vị trí đau: </span>
                <span>
                  {frame.pain.body_regions && frame.pain.body_regions.length > 0
                    ? frame.pain.body_regions.join(', ')
                    : 'Không xác định'}
                </span>
              </div>
              <div>
                <span className="font-semibold">Thời gian bắt đầu: </span>
                <span>
                  {frame.pain.onset
                    ? `${frame.pain.onset.value} ${frame.pain.onset.unit}`
                    : 'Không xác định'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Tiền sử dị ứng */}
          <div className="space-y-2 text-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700 border-b border-gray-200 pb-1">
              2. Tiền sử dị ứng
            </h3>
            <p className="text-xs">
              {frame.allergy.has_allergy === false
                ? 'Bệnh nhân khai: Không có tiền sử dị ứng thuốc hay thức ăn.'
                : frame.allergy.has_allergy === true
                ? `Bệnh nhân khai CÓ DỊ ỨNG: ${
                    frame.allergy.items.map((i) => i.name).join(', ') || 'Chưa rõ tên'
                  }`
                : 'Bệnh nhân chưa chắc chắn / chưa khai báo.'}
            </p>
          </div>

          {/* Section 3: Bản tóm tắt tự nhiên */}
          {summary?.nl_text_vi && (
            <div className="space-y-1 text-sm bg-gray-50 p-3 rounded border border-gray-200">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700">
                3. Tóm tắt lâm sàng sơ bộ ({summary.nl_source === 'llm' ? 'Mô hình AI' : 'Mẫu chuẩn'})
              </h3>
              <p className="text-xs italic text-gray-800">&ldquo;{summary.nl_text_vi}&rdquo;</p>
            </div>
          )}

          {/* Section 4: Chữ ký */}
          <div className="pt-6 grid grid-cols-2 text-center text-xs">
            <div>
              <p className="font-semibold">Người bệnh / Người hỗ trợ</p>
              <p className="text-[10px] text-gray-500 italic mt-0.5">(Đã xác nhận điện tử tại Kiosk)</p>
            </div>
            <div>
              <p className="font-semibold">Điều dưỡng tiếp nhận</p>
              <p className="text-[10px] text-gray-500 italic mt-0.5">(Ký và ghi rõ họ tên)</p>
              <div className="h-12" />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} className="min-h-[48px] py-2 text-base">
            {vi.nurse.export.closeButton}
          </Button>
          <Button variant="primary" onClick={handlePrint} className="min-h-[48px] py-2 text-base">
            <Printer className="w-4 h-4" />
            <span>{vi.nurse.export.printButton}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
