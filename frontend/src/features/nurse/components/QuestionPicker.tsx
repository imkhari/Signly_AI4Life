import React, { useState } from 'react';
import { Pill, Clock, Thermometer, Wind, Heart, Send, Check } from 'lucide-react';
import { vi } from '../../../i18n/vi';

export interface QuestionTemplate {
  templateCode: string;
  textVi: string;
  iconName: string;
  icon: React.ComponentType<{ className?: string }>;
}

const QUESTION_TEMPLATES: QuestionTemplate[] = [
  {
    templateCode: 'ASK_DRUG_ALLERGY',
    textVi: vi.nurse.questions.askDrugAllergy,
    iconName: 'pill',
    icon: Pill,
  },
  {
    templateCode: 'ASK_PAIN_DURATION',
    textVi: vi.nurse.questions.askPainDuration,
    iconName: 'clock',
    icon: Clock,
  },
  {
    templateCode: 'ASK_FEVER',
    textVi: vi.nurse.questions.askFever,
    iconName: 'thermometer',
    icon: Thermometer,
  },
  {
    templateCode: 'ASK_BREATHING',
    textVi: vi.nurse.questions.askBreathing,
    iconName: 'wind',
    icon: Wind,
  },
  {
    templateCode: 'ASK_PREGNANT',
    textVi: vi.nurse.questions.askPregnant,
    iconName: 'heart',
    icon: Heart,
  },
];

interface QuestionPickerProps {
  onSendQuestion: (template: QuestionTemplate) => void;
  disabled?: boolean;
}

export const QuestionPicker: React.FC<QuestionPickerProps> = ({
  onSendQuestion,
  disabled = false,
}) => {
  const [recentlySent, setRecentlySent] = useState<string | null>(null);

  const handleSend = (template: QuestionTemplate) => {
    if (disabled) return;
    onSendQuestion(template);
    setRecentlySent(template.templateCode);
    setTimeout(() => {
      setRecentlySent((curr) => (curr === template.templateCode ? null : curr));
    }, 2500);
  };

  return (
    <div
      data-testid="question-picker"
      className="bg-paper rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col"
    >
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
        <h2 className="text-base font-bold text-ink">{vi.nurse.supplementaryQuestions}</h2>
        {recentlySent && (
          <span className="text-xs font-semibold text-status-success bg-status-success/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            {vi.nurse.questionSentSuccess}
          </span>
        )}
      </div>

      <p className="text-xs text-mute mb-3">
        Bấm 1 chạm để gửi ngay câu hỏi kèm hình minh họa tới màn hình Kiosk của người bệnh:
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {QUESTION_TEMPLATES.map((tmpl) => {
          const IconComp = tmpl.icon;
          const isSent = recentlySent === tmpl.templateCode;

          return (
            <button
              key={tmpl.templateCode}
              type="button"
              disabled={disabled}
              onClick={() => handleSend(tmpl)}
              data-testid={`btn-question-${tmpl.templateCode}`}
              className={`p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                isSent
                  ? 'bg-status-success/10 border-status-success text-status-success font-semibold'
                  : 'bg-canvas hover:bg-brand-light/30 border-gray-200 hover:border-brand/40 text-ink'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSent
                      ? 'bg-status-success text-white'
                      : 'bg-paper border border-gray-200 text-brand'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-ink leading-tight">
                  {tmpl.textVi}
                </span>
              </div>
              <Send
                className={`w-4 h-4 shrink-0 ${
                  isSent ? 'text-status-success' : 'text-mute'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
