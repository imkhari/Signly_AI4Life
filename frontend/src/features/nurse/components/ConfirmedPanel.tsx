import React from 'react';
import { CheckCircle2, Clock, Bot, ShieldCheck } from 'lucide-react';
import { SemanticFrame, SessionStatus, TriageSummary } from '../../../types';
import { vi } from '../../../i18n/vi';

interface ConfirmedPanelProps {
  status: SessionStatus;
  frame: SemanticFrame;
  summary: TriageSummary | null;
}

export const ConfirmedPanel: React.FC<ConfirmedPanelProps> = ({ status, frame, summary }) => {
  const isConfirmed = status === 'patient_confirmed' || status === 'nurse_verified';

  // Format chief complaint
  const complaintText = frame.chief_complaint.label_vi || frame.chief_complaint.code || 'Chưa chọn';

  // Format pain
  const painText =
    frame.pain.present === false
      ? 'Không đau'
      : frame.pain.present === true
      ? `Có đau (Mức ${frame.pain.severity ?? '?'}/10)`
      : 'Chưa khai báo';

  const regionsText =
    frame.pain.body_regions && frame.pain.body_regions.length > 0
      ? frame.pain.body_regions.join(', ')
      : 'Chưa chọn vùng';

  const onsetText = frame.pain.onset
    ? `${frame.pain.onset.value} ${frame.pain.onset.unit}`
    : 'Chưa rõ thời gian';

  // Format allergy
  const allergyText =
    frame.allergy.has_allergy === false
      ? 'Không có dị ứng'
      : frame.allergy.has_allergy === true
      ? `Có dị ứng (${frame.allergy.items.map((i) => i.name).join(', ') || 'Chưa ghi tên'})`
      : 'Chưa khai báo';

  // Natural language summary and source badge
  const nlSummary = summary?.nl_text_vi || null;
  const isLLM = summary?.nl_source === 'llm';

  return (
    <div
      data-testid="confirmed-panel"
      className={`rounded-2xl border p-6 transition-all duration-300 shadow-sm flex flex-col h-full ${
        isConfirmed
          ? 'bg-status-success/5 border-status-success/40'
          : 'bg-canvas/60 border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200/80 mb-5">
        <div className="flex items-center gap-2.5">
          {isConfirmed ? (
            <div className="w-8 h-8 rounded-full bg-status-success/15 text-status-success flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-mute/15 text-mute flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          )}
          <div>
            <h2
              className={`text-lg font-bold ${
                isConfirmed ? 'text-status-success' : 'text-mute'
              }`}
            >
              {isConfirmed ? vi.nurse.confirmedSection : vi.nurse.patientEditing}
            </h2>
            <p className="text-xs text-mute">
              {isConfirmed
                ? 'Thông tin đã được người bệnh kiểm tra và bấm xác nhận tại Kiosk'
                : 'Thông tin đang được người bệnh thao tác và chưa xác nhận'}
            </p>
          </div>
        </div>

        {/* Source Badge if summary ready */}
        {summary && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
              isLLM
                ? 'bg-brand/10 text-brand-dark border-brand/30'
                : 'bg-status-warning/10 text-status-warning border-status-warning/30'
            }`}
            data-testid="summary-source-badge"
          >
            {isLLM ? (
              <>
                <Bot className="w-3.5 h-3.5" />
                <span>{vi.nurse.sourceLLM}</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{vi.nurse.sourceFallback}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Symptoms list */}
      <div className="space-y-3.5 flex-1">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-paper/80 border border-gray-200/60">
          <span className="text-sm font-semibold text-mute min-w-[110px]">Lý do khám:</span>
          <span className="text-sm font-bold text-ink">{complaintText}</span>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-paper/80 border border-gray-200/60">
          <span className="text-sm font-semibold text-mute min-w-[110px]">Tình trạng đau:</span>
          <div className="space-y-1">
            <p className="text-sm font-bold text-ink">{painText}</p>
            {frame.pain.present && (
              <div className="text-xs text-mute space-y-0.5">
                <p>• Vị trí: <span className="font-semibold text-ink">{regionsText}</span></p>
                <p>• Bắt đầu: <span className="font-semibold text-ink">{onsetText}</span></p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-xl bg-paper/80 border border-gray-200/60">
          <span className="text-sm font-semibold text-mute min-w-[110px]">Tiền sử dị ứng:</span>
          <span className="text-sm font-bold text-ink">{allergyText}</span>
        </div>

        {/* Natural Language Summary */}
        {nlSummary && (
          <div className="mt-4 p-4 rounded-xl bg-paper border border-gray-200 shadow-sm">
            <span className="text-xs font-bold text-mute uppercase tracking-wider block mb-1">
              Bản tóm tắt triệu chứng
            </span>
            <p className="text-sm text-ink leading-relaxed font-medium italic">
              &ldquo;{nlSummary}&rdquo;
            </p>
          </div>
        )}
      </div>

      {/* Confirmation prompt / footer */}
      {!isConfirmed && (
        <div className="mt-4 pt-3 border-t border-gray-200/60 text-xs text-mute flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0 text-mute" />
          <span>Vùng này sẽ tự động chuyển màu xanh khi người bệnh hoàn tất xác nhận tại bước 4.</span>
        </div>
      )}
    </div>
  );
};
