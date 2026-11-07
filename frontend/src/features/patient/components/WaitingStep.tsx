import React from 'react';
import { CheckCircle, Clock, Stethoscope } from 'lucide-react';
import { vi } from '../../../i18n/vi';

export interface WaitingStepProps {
  queueNumber?: number | null;
  intakeCode?: string | null;
}

export const WaitingStep: React.FC<WaitingStepProps> = ({
  queueNumber,
  intakeCode,
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto py-10 text-center space-y-6">
      {queueNumber ? (
        <div className="bg-paper p-8 rounded-3xl border-2 border-ok/40 shadow-sm w-full space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-ok/10 text-ok rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div>
            <span className="block text-sm font-bold text-mute uppercase tracking-widest mb-1">
              Số thứ tự của bạn (STT)
            </span>
            <span className="text-7xl font-black text-ok font-mono">{queueNumber}</span>
          </div>

          <div className="py-3 px-6 bg-canvas rounded-xl inline-block border border-gray-200">
            <span className="text-sm font-semibold text-mute">Mã tiếp nhận: </span>
            <span className="text-lg font-bold text-ink">{intakeCode || 'AC-0042'}</span>
          </div>

          <div className="p-4 bg-ok-bg text-ok rounded-2xl border border-ok/20 font-bold text-lg">
            Điều dưỡng đã duyệt phiếu tiếp nhận. Vui lòng ngồi ghế chờ và nhìn màn hình gọi số.
          </div>
        </div>
      ) : (
        <div className="bg-paper p-8 rounded-3xl border border-gray-200 shadow-sm w-full space-y-6">
          <div className="w-20 h-20 bg-action/10 text-action rounded-full flex items-center justify-center mx-auto animate-pulse">
            <Clock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-extrabold text-ink">
              Đã gửi thông tin cho điều dưỡng
            </h2>
            <p className="text-mute text-lg max-w-md mx-auto">
              Điều dưỡng đang kiểm tra phiếu khai của bạn và sẽ cấp số thứ tự ngay.
            </p>
          </div>

          <div className="p-4 bg-canvas rounded-xl border border-gray-200 text-sm text-mute">
            {vi.app.privacyNotice}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 text-mute text-sm">
        <Stethoscope className="w-5 h-5 text-action" />
        <span>Bác sĩ sẽ kiểm tra lại kỹ lưỡng khi đến lượt bạn vào phòng khám.</span>
      </div>
    </div>
  );
};
