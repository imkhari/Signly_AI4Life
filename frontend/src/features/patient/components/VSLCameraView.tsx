import React, { useEffect, useState } from 'react';
import { Camera, CameraOff, AlertTriangle, Check, X, Sparkles, RefreshCw, Hand } from 'lucide-react';
import { useCamera } from '../../../hooks/useCamera';
import { mockRecognizer, ONTOLOGY_GLOSSES } from '../../../services/vsl/MockRecognizer';
import { RecognizedGloss } from '../../../services/vsl/types';
import { Button } from '../../../ui/Button';

interface VSLCameraViewProps {
  onApplyGlosses: (glosses: RecognizedGloss[]) => void;
  onSwitchToTouchMode?: () => void;
}

export const VSLCameraView: React.FC<VSLCameraViewProps> = ({
  onApplyGlosses,
  onSwitchToTouchMode,
}) => {
  const { status, errorMessage, isActive, start, stop, bindVideoRef } = useCamera();
  const [candidates, setCandidates] = useState<RecognizedGloss[]>([]);
  const [confirmedGlosses, setConfirmedGlosses] = useState<RecognizedGloss[]>([]);

  // Bắt đầu camera và recognizer khi mount
  useEffect(() => {
    start();
    mockRecognizer.start();

    const unsub = mockRecognizer.onGloss((gloss) => {
      setCandidates((prev) => [...prev, gloss]);
    });

    return () => {
      unsub();
      mockRecognizer.stop();
      stop();
    };
  }, [start, stop]);

  // Xác nhận 1 gloss candidate
  const handleConfirmCandidate = (candidate: RecognizedGloss, index: number) => {
    setConfirmedGlosses((prev) => [...prev, candidate]);
    setCandidates((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Loại bỏ 1 candidate
  const handleDismissCandidate = (index: number) => {
    setCandidates((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Xóa 1 gloss đã xác nhận
  const handleRemoveConfirmed = (index: number) => {
    setConfirmedGlosses((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Hoàn tất và gửi mảng gloss
  const handleApply = () => {
    if (confirmedGlosses.length > 0) {
      onApplyGlosses(confirmedGlosses);
    }
  };

  return (
    <div
      data-testid="vsl-camera-view"
      className="bg-paper rounded-2xl border border-gray-200 p-5 shadow-sm space-y-5"
    >
      {/* Top Bar: Title & Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-light text-brand flex items-center justify-center">
            <Hand className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-ink">Nhận dạng Ký hiệu Ngôn ngữ (VSL)</h3>
            <p className="text-xs text-mute">
              Camera cục bộ trên máy — Không tải video lên mạng để bảo vệ quyền riêng tư
            </p>
          </div>
        </div>

        {onSwitchToTouchMode && (
          <Button
            variant="secondary"
            onClick={onSwitchToTouchMode}
            className="min-h-[44px] py-1.5 px-3 text-xs"
          >
            Chuyển sang Chạm
          </Button>
        )}
      </div>

      {/* Video Preview Frame */}
      <div className="relative rounded-xl overflow-hidden bg-black/90 aspect-video max-h-[300px] flex items-center justify-center border border-gray-800">
        <video
          ref={bindVideoRef}
          autoPlay
          playsInline
          muted
          data-testid="vsl-video-element"
          className={`w-full h-full object-cover ${isActive ? 'block' : 'hidden'}`}
        />

        {/* Fallback / Status Overlay if camera not active */}
        {!isActive && (
          <div className="text-center p-6 space-y-3 text-white max-w-md">
            {status === 'denied' ? (
              <>
                <CameraOff className="w-10 h-10 text-status-warning mx-auto" />
                <p className="text-sm font-semibold">{errorMessage}</p>
                {onSwitchToTouchMode && (
                  <Button
                    variant="primary"
                    onClick={onSwitchToTouchMode}
                    className="min-h-[48px] py-2 px-4 text-sm mt-2"
                  >
                    Dùng chế độ Chạm màn hình
                  </Button>
                )}
              </>
            ) : status === 'requesting' ? (
              <>
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm">Đang mở camera...</p>
              </>
            ) : (
              <>
                <Camera className="w-10 h-10 text-gray-400 mx-auto" />
                <p className="text-sm text-gray-300">
                  {errorMessage || 'Đang chuẩn bị nhận diện cử chỉ VSL...'}
                </p>
                <Button
                  variant="secondary"
                  onClick={start}
                  className="min-h-[44px] py-1.5 px-3 text-xs text-white border-white/40"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Thử lại camera
                </Button>
              </>
            )}
          </div>
        )}

        {/* Active Camera Indicator Badge */}
        {isActive && (
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold text-white flex items-center gap-1.5 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span>Camera trực tiếp</span>
          </div>
        )}
      </div>

      {/* Mock VSL Recognizer Controls (Demo Kiosk) */}
      <div className="p-4 rounded-xl bg-canvas/70 border border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand" />
            <span className="text-xs font-bold text-ink uppercase tracking-wider">
              Bảng mô phỏng ký hiệu VSL (Demo Giám khảo)
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => mockRecognizer.runScenario('chest_pain_2h')}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-paper border border-gray-200 text-ink font-semibold hover:bg-brand-light/30 transition-colors"
            >
              Kịch bản: Đau ngực 2 giờ
            </button>
            <button
              type="button"
              onClick={() => mockRecognizer.runScenario('low_confidence_demo')}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-paper border border-gray-200 text-status-warning font-semibold hover:bg-status-warning/10 transition-colors"
            >
              Kịch bản: Độ tin cậy thấp (&lt;60%)
            </button>
          </div>
        </div>

        {/* 15 Gloss Quick Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {ONTOLOGY_GLOSSES.map((g) => (
            <button
              key={g.gloss}
              type="button"
              onClick={() => mockRecognizer.simulateGloss(g.gloss, g.confidence)}
              data-testid={`mock-gloss-btn-${g.gloss}`}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-paper border border-gray-200 text-ink hover:border-brand hover:text-brand hover:bg-brand-light/20 transition-all active:scale-95"
            >
              {g.label_vi} <span className="text-[10px] text-mute">({g.gloss})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recognized Candidate Glosses (Awaiting Patient Confirmation) */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-mute uppercase tracking-wider block">
          Từ vừa nhận diện được (Vui lòng bấm xác nhận từng từ):
        </span>

        {candidates.length === 0 ? (
          <p className="text-xs text-mute italic py-2">
            Chưa có từ nào. Hãy thực hiện cử chỉ trước camera hoặc bấm từ mô phỏng ở trên.
          </p>
        ) : (
          <div className="space-y-2">
            {candidates.map((cand, idx) => {
              const isLowConfidence = cand.confidence < 0.6;
              const confidencePct = Math.round(cand.confidence * 100);

              return (
                <div
                  key={`${cand.gloss}-${idx}`}
                  data-testid={`candidate-gloss-${cand.gloss}`}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isLowConfidence
                      ? 'bg-status-warning/10 border-status-warning/40 text-ink'
                      : 'bg-paper border-brand/30 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isLowConfidence ? (
                      <AlertTriangle className="w-5 h-5 text-status-warning shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-brand-light text-brand flex items-center justify-center font-bold text-xs">
                        VSL
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink">{cand.label_vi}</span>
                        <span className="text-xs text-mute font-mono">[{cand.gloss}]</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isLowConfidence
                              ? 'bg-status-warning/20 text-status-warning'
                              : 'bg-status-success/20 text-status-success'
                          }`}
                        >
                          {confidencePct}%
                        </span>
                      </div>
                      {isLowConfidence && (
                        <p className="text-xs text-status-warning font-medium mt-0.5">
                          Độ tin cậy thấp (&lt; 60%) — Vui lòng ký hiệu lại hoặc bấm hủy
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleConfirmCandidate(cand, idx)}
                      data-testid={`btn-confirm-gloss-${cand.gloss}`}
                      className="p-2 rounded-lg bg-status-success/15 hover:bg-status-success/25 text-status-success transition-colors"
                      title="Xác nhận từ này"
                      aria-label={`Xác nhận từ ${cand.label_vi}`}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDismissCandidate(idx)}
                      data-testid={`btn-dismiss-gloss-${cand.gloss}`}
                      className="p-2 rounded-lg bg-mute/10 hover:bg-status-danger/15 hover:text-status-danger text-mute transition-colors"
                      title="Bỏ qua"
                      aria-label={`Bỏ qua từ ${cand.label_vi}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmed Gloss Sequence */}
      <div className="pt-3 border-t border-gray-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink uppercase tracking-wider">
            Các từ bạn đã xác nhận:
          </span>
          <span className="text-xs text-mute">
            {confirmedGlosses.length} từ đã chọn
          </span>
        </div>

        {confirmedGlosses.length === 0 ? (
          <p className="text-xs text-mute italic">
            Chưa có từ nào được xác nhận.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {confirmedGlosses.map((g, idx) => (
              <span
                key={`${g.gloss}-${idx}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand text-white text-xs font-bold shadow-sm"
              >
                <span>{g.label_vi}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveConfirmed(idx)}
                  className="hover:text-status-danger transition-colors"
                  aria-label={`Xóa từ ${g.label_vi}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Apply Button */}
        {confirmedGlosses.length > 0 && (
          <div className="pt-2 flex justify-end">
            <Button
              variant="primary"
              onClick={handleApply}
              data-testid="btn-apply-vsl-glosses"
              className="min-h-[48px] py-2 px-6 text-sm"
            >
              Áp dụng vào thông tin khám ▶
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
