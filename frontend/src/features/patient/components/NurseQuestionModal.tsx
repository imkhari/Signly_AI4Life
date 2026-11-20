import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Button } from '../../../ui/Button';
import { TTSButton } from '../../../ui/TTSButton';
import { NurseQuestionPayload } from '../../../types';

export interface NurseQuestionModalProps {
  question: NurseQuestionPayload | null;
  connected?: boolean;
  error?: string;
  onAnswer: (answer: string) => void;
  onClose: () => void;
}

export const NurseQuestionModal: React.FC<NurseQuestionModalProps> = ({
  question,
  connected = true,
  error,  onAnswer,
}) => {
  if (!question) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="nurse-q-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-paper rounded-3xl shadow-2xl border-2 border-action max-w-lg w-full p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-action/10 text-action flex items-center justify-center mx-auto">
          <MessageSquare className="w-8 h-8" />
        </div>

        <div>
          <span className="block text-sm font-bold text-action uppercase tracking-wider mb-2">
            Điều dưỡng gửi câu hỏi cho bạn
          </span>
          <h3 id="nurse-q-title" className="text-3xl font-extrabold text-ink leading-tight">
            {question.text_vi}
          </h3>
        </div>

        <div className="flex justify-center">
          <TTSButton text={question.text_vi} label="Nghe câu hỏi" />
        </div>

        {error && <p role="alert">{error}</p>}
        {!connected && <p role="status">Đang chờ kết nối lại.</p>}
        {/* Các nút bấm trả lời chạm lớn */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Button
            variant="primary"
            disabled={!connected}
            onClick={() => onAnswer('Có')}
            className="min-h-[64px] text-xl font-bold bg-ok hover:opacity-90 border-ok"
          >
            Có
          </Button>

          <Button
            variant="secondary"
            disabled={!connected}
            onClick={() => onAnswer('Không')}
            className="min-h-[64px] text-xl font-bold"
          >
            Không
          </Button>

          <Button
            variant="ghost"
            disabled={!connected}
            onClick={() => onAnswer('Không chắc')}
            className="min-h-[64px] text-xl font-bold border-2 border-gray-300 hover:bg-canvas"
          >
            Không chắc
          </Button>
        </div>

        <div className="pt-2">
          <button
            type="button"
            disabled={!connected}
            onClick={() => onAnswer('Không chắc')}
            className="text-mute text-sm underline hover:text-ink cursor-pointer"
          >
            Chưa rõ, cần hỏi lại
          </button>
        </div>
      </div>
    </div>
  );
};
