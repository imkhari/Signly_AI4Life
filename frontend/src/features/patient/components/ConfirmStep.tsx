import React from 'react';
import { Activity, AlertTriangle, Check, Edit3, HelpCircle, Pill } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { TTSButton } from '../../../ui/TTSButton';
import { TriageSummary } from '../../../types';
import { vi } from '../../../i18n/vi';

export interface ConfirmStepProps {
  summary: TriageSummary | null;
  loadingSummary: boolean;
  onConfirm: () => void;
  onEdit: () => void;
  onUnsure: () => void;
}

export const ConfirmStep: React.FC<ConfirmStepProps> = ({
  summary,
  loadingSummary,
  onConfirm,
  onEdit,
  onUnsure,
}) => {
  const nlText = summary?.nl_text_vi || 'Đang tạo câu tóm tắt triệu chứng của bạn...';
  const frame = summary?.frame;

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-ink mb-2">
          {vi.wizard.step4}
        </h2>
        <p className="text-mute text-base">
          {vi.wizard.reviewPrompt}
        </p>
      </div>

      {/* Bản tóm tắt ngôn ngữ tự nhiên */}
      <div className="bg-paper p-8 rounded-2xl border-2 border-action/40 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <span className="font-bold text-sm tracking-wide text-action uppercase">
            Bản tóm tắt khai báo
          </span>
          <TTSButton text={nlText} />
        </div>

        {loadingSummary ? (
          <div className="py-8 text-center text-mute font-medium text-lg animate-pulse">
            Đang tổng hợp thông tin và kiểm tra an toàn...
          </div>
        ) : (
          <p className="text-2xl font-bold text-ink leading-relaxed">
            {nlText}
          </p>
        )}

        <p className="text-xs text-mute italic pt-2">
          {vi.app.disclaimer}
        </p>
      </div>

      {/* Chi tiết từng mục */}
      {frame && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-paper rounded-xl border border-gray-200 flex items-start gap-3">
            <Activity className="w-6 h-6 text-action flex-shrink-0 mt-0.5" />
            <div>
              <span className="block font-bold text-sm text-mute">Lý do & Triệu chứng đau:</span>
              <span className="font-bold text-base text-ink">
                {frame.chief_complaint.label_vi || 'Đau'}
                {frame.pain.present && (
                  <>
                    {' '}· Mức {frame.pain.severity ?? 'chưa rõ'}/10 ({frame.pain.body_regions.join(', ') || 'chưa rõ vùng'})
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="p-4 bg-paper rounded-xl border border-gray-200 flex items-start gap-3">
            <Pill className="w-6 h-6 text-action flex-shrink-0 mt-0.5" />
            <div>
              <span className="block font-bold text-sm text-mute">Tiền sử dị ứng:</span>
              <span className="font-bold text-base text-ink">
                {frame.allergy.has_allergy === false
                  ? 'Không có dị ứng'
                  : frame.allergy.has_allergy === true
                    ? frame.allergy.items.map((i) => i.name).join(', ') || 'Có dị ứng'
                    : 'Chưa rõ tiền sử dị ứng'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cảnh báo nếu có */}
      {summary && summary.alerts && summary.alerts.length > 0 && (
        <div className="p-4 rounded-xl bg-warn-bg border border-warn/40 text-warn flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <span className="font-semibold text-sm">
            Hệ thống phát hiện một số thông tin cần y tá hỏi lại để đảm bảo chính xác.
          </span>
        </div>
      )}

      {/* 3 Nút quyết định lớn */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <Button
          variant="secondary"
          onClick={onEdit}
          icon={<Edit3 className="w-6 h-6" />}
          className="min-h-[72px] text-lg font-bold"
        >
          Sửa lại
        </Button>

        <Button
          variant="ghost"
          onClick={onUnsure}
          icon={<HelpCircle className="w-6 h-6" />}
          className="min-h-[72px] text-lg font-bold border-2 border-gray-300 hover:bg-canvas"
        >
          Không chắc
        </Button>

        <Button
          variant="primary"
          onClick={onConfirm}
          icon={<Check className="w-6 h-6" />}
          className="min-h-[72px] text-xl font-black bg-ok hover:opacity-90 border-ok"
        >
          Đúng, xác nhận
        </Button>
      </div>
    </div>
  );
};
