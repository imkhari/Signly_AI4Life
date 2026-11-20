import React from 'react';
import { Activity, AlertTriangle, Check, Edit3, HelpCircle, Pill, MapPin, Clock, ListPlus } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { TTSButton } from '../../../ui/TTSButton';
import { TriageSummary } from '../../../types';
import type { SymptomTab } from './SymptomsStep';
import { complaintLabels, regionLabels } from '../../../i18n/intakeLabels';
import { vi } from '../../../i18n/vi';

export interface ConfirmStepProps {
  summary: TriageSummary | null;
  loadingSummary: boolean;
  error?: string;
  connected?: boolean;
  onEditField?: (target: SymptomTab | 'allergy') => void;
  onConfirm: () => void;
  onEdit: () => void;
  onUnsure: () => void;
}

export const ConfirmStep: React.FC<ConfirmStepProps> = ({
  summary,
  loadingSummary,
  error,
  connected = true,
  onEditField,
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

      {frame && (
        <div aria-label={vi.intake.review} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([
            { target: 'complaint', label: vi.intake.main, icon: Activity,
              value: frame.chief_complaint.label_vi || vi.intake.unknown },
            { target: 'pain_body', label: vi.intake.pain, icon: MapPin,
              value: frame.pain.present === false ? vi.intake.noPain :
                frame.pain.present === true ?
                  `${vi.intake.hasPain} — ${frame.pain.body_regions.map(code => regionLabels[code] || code).join(', ') || vi.intake.unknown}` : vi.intake.unknown },
            { target: 'pain_scale', label: vi.intake.severity, icon: Activity,
              value: frame.pain.severity == null ? vi.intake.unknown : `${frame.pain.severity}/10` },
            { target: 'onset', label: vi.intake.onset, icon: Clock,
              value: frame.pain.onset?.value == null || !frame.pain.onset.unit ? vi.intake.unknown :
                `${frame.pain.onset.value} ${vi.intake.units[frame.pain.onset.unit]}` },
            { target: 'extras', label: vi.intake.extras, icon: ListPlus,
              value: frame.extra_symptoms.map(code => complaintLabels[code] || code).join(', ') || vi.intake.noExtras },
            { target: 'allergy', label: 'Tiền sử dị ứng', icon: Pill,
              value: frame.allergy.has_allergy === false ? 'Không có dị ứng' :
                frame.allergy.has_allergy === true ? frame.allergy.items.map(item => item.name).join(', ') || 'Có dị ứng' : 'Chưa rõ tiền sử dị ứng' },
          ] as const).map(row => <div key={row.target} className="p-4 rounded-2xl bg-paper border-2 space-y-3">
            <row.icon aria-hidden="true" className="w-8 h-8 text-action" />
            <p className="font-bold text-lg">{row.label}</p>
            <p className="text-xl font-bold text-ink">{row.value}</p>
            {onEditField && <Button variant="secondary" aria-label={`Sửa ${row.label}`}
              onClick={() => onEditField(row.target)}>{vi.intake.edit}</Button>}
          </div>)}
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

      {error && <p role="alert" className="font-semibold text-danger">{error}</p>}
      {!connected && <p role="status">Mất kết nối. Đang chờ kết nối lại để xác nhận.</p>}
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
          disabled={!summary || !connected}
          icon={<HelpCircle className="w-6 h-6" />}
          className="min-h-[72px] text-lg font-bold border-2 border-gray-300 hover:bg-canvas"
        >
          Không chắc
        </Button>

        <Button
          variant="primary"
          onClick={onConfirm}
          disabled={!summary || !connected}
          icon={<Check className="w-6 h-6" />}
          className="min-h-[72px] text-xl font-black bg-ok hover:opacity-90 border-ok"
        >
          Đúng, xác nhận
        </Button>
      </div>
    </div>
  );
};
