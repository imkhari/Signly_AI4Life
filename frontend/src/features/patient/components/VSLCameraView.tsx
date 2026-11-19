import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  IconAlertTriangle,
  IconBolt,
  IconCamera,
  IconCameraOff,
  IconCheck,
  IconCircleCheck,
  IconHandClick,
  IconHandFinger,
  IconHandLoveYou,
  IconSparkles,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useCamera } from '../../../hooks/useCamera';
import { HolisticDetector, HolisticObservation } from '../../../services/vsl/HolisticDetector';
import { drawHandLandmarks } from '../../../services/vsl/drawHandSkeleton';
import { HolisticFrame, restApi, VSLPredictionResponse } from '../../../services/api/rest';
import { GestureStabilizer, StabilizationResult, CAMERA_STABILIZER_OPTIONS } from '../../../services/vsl/GestureStabilizer';
import { RecognizedGloss } from '../../../services/vsl/types';
import { Button } from '../../../ui/Button';
import { vi } from '../../../i18n/vi';

interface VSLCameraViewProps {
  contextStep?: 'symptom' | 'location' | 'severity';
  onApplyGlosses: (glosses: RecognizedGloss[]) => void;
  onSwitchToTouchMode?: () => void;
}

const GLOSS_METADATA: Record<
  string,
  {
    category: RecognizedGloss['category'];
    maps_to?: RecognizedGloss['maps_to'];
  }
> = {
  // 1. Nhóm Triệu chứng (Symptoms) -> maps_to chief_complaint codes
  ĐAU: { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'PAIN' } },
  SỐT: { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'FEVER' } },
  HO: { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'COUGH' } },
  'KHÓ-THỞ': { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'BREATH_DIFFICULTY' } },
  'BUỒN-NÔN': { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'NAUSEA_VOMIT' } },
  'CHÓNG-MẶT': { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'DIZZY' } },
  'MỆT-MỎI': { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'OTHER' } },
  'TIM-ĐẬP-NHANH': { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'OTHER' } },

  // 2. Nhóm Vùng cơ thể (Body regions) -> maps_to pain.body_regions codes
  ĐẦU: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'HEAD' } },
  NGỰC: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'CHEST' } },
  BỤNG: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'ABDOMEN_UPPER' } },
  'BỤNG-DƯỚI': { category: 'region', maps_to: { field: 'pain.body_regions', code: 'ABDOMEN_LOWER' } },
  LƯNG: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'LOWER_BACK' } },
  HỌNG: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'NECK' } },
  TAY: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'ARM_R' } },
  CHÂN: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'LEG_L' } },
  MẮT: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'HEAD' } },
  TAI: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'HEAD' } },

  // 3. Nhóm Thời gian (Time) -> maps_to pain.onset & time_unit
  'HÔM-NAY': { category: 'time', maps_to: { field: 'pain.onset', value: 0, unit: 'day' } },
  'HÔM-QUA': { category: 'time', maps_to: { field: 'pain.onset', value: 1, unit: 'day' } },
  '2-NGÀY': { category: 'time', maps_to: { field: 'pain.onset', value: 2, unit: 'day' } },
  'TỐI-QUA': { category: 'time', maps_to: { field: 'pain.onset', value: 1, unit: 'day' } },
  SÁNG: { category: 'time', maps_to: { field: 'pain.onset', value: 0, unit: 'day' } },
  TỐI: { category: 'time', maps_to: { field: 'pain.onset', value: 0, unit: 'day' } },
  'TUẦN-TRƯỚC': { category: 'time', maps_to: { field: 'pain.onset', value: 7, unit: 'day' } },
  GIỜ: { category: 'time_unit', maps_to: { field: 'time_unit', unit: 'hour' } },
  NGÀY: { category: 'time_unit', maps_to: { field: 'time_unit', unit: 'day' } },

  // 4. Nhóm Mức độ & Số (Severity & Numbers) -> maps_to pain.severity & number
  '1': { category: 'severity', maps_to: { field: 'pain.severity', value: 1 } },
  '2': { category: 'severity', maps_to: { field: 'pain.severity', value: 2 } },
  '3': { category: 'severity', maps_to: { field: 'pain.severity', value: 3 } },
  '4': { category: 'severity', maps_to: { field: 'pain.severity', value: 4 } },
  '5': { category: 'severity', maps_to: { field: 'pain.severity', value: 5 } },
  '6': { category: 'severity', maps_to: { field: 'pain.severity', value: 6 } },
  '7': { category: 'severity', maps_to: { field: 'pain.severity', value: 7 } },
  '8': { category: 'severity', maps_to: { field: 'pain.severity', value: 8 } },
  '9': { category: 'severity', maps_to: { field: 'pain.severity', value: 9 } },
  '10': { category: 'severity', maps_to: { field: 'pain.severity', value: 10 } },
  'MỨC-0': { category: 'severity', maps_to: { field: 'pain.severity', value: 0 } },
  'MỨC-1': { category: 'severity', maps_to: { field: 'pain.severity', value: 1 } },
  'MỨC-2': { category: 'severity', maps_to: { field: 'pain.severity', value: 2 } },
  'MỨC-3': { category: 'severity', maps_to: { field: 'pain.severity', value: 3 } },
  'MỨC-4': { category: 'severity', maps_to: { field: 'pain.severity', value: 4 } },
  'MỨC-5': { category: 'severity', maps_to: { field: 'pain.severity', value: 5 } },
  'MỨC-6': { category: 'severity', maps_to: { field: 'pain.severity', value: 6 } },
  'MỨC-7': { category: 'severity', maps_to: { field: 'pain.severity', value: 7 } },
  'MỨC-8': { category: 'severity', maps_to: { field: 'pain.severity', value: 8 } },
  'MỨC-9': { category: 'severity', maps_to: { field: 'pain.severity', value: 9 } },
  'MỨC-10': { category: 'severity', maps_to: { field: 'pain.severity', value: 10 } },
  HAI: { category: 'number', maps_to: { field: 'number', value: 2 } },
  NẶNG: { category: 'severity', maps_to: { field: 'pain.severity', value: 8 } },
  NHẸ: { category: 'severity', maps_to: { field: 'pain.severity', value: 2 } },

  // 5. Nhóm Định từ & Dị ứng (Modifier & Allergy)
  CÓ: { category: 'modifier', maps_to: { field: 'modifier', value: true } },
  KHÔNG: { category: 'modifier', maps_to: { field: 'modifier', value: false } },
  'DỊ-ỨNG': { category: 'allergy', maps_to: { field: 'allergy.has_allergy', value: true } },
  'KHÔNG-DỊ-ỨNG': { category: 'allergy', maps_to: { field: 'allergy.has_allergy', value: false } },
  THUỐC: { category: 'allergy', maps_to: { field: 'allergy.category', value: 'drug' } },
};

export const VSLCameraView: React.FC<VSLCameraViewProps> = ({
  contextStep,
  onApplyGlosses,
  onSwitchToTouchMode,
}) => {
  const { status, errorMessage, isActive, start, stop, bindVideoRef } = useCamera();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stabilizerRef = useRef<GestureStabilizer>(
    new GestureStabilizer(CAMERA_STABILIZER_OPTIONS)
  );

  const [handCount, setHandCount] = useState<number>(0);
  const [livePrediction, setLivePrediction] = useState<VSLPredictionResponse | null>(null);
  const [stabilization, setStabilization] = useState<StabilizationResult>({
    isStable: false,
    status: 'idle',
    statusMessage: 'Đang chờ cử chỉ...',
    candidate: null,
    currentGloss: null,
    progressPercent: 0,
  });
  const [candidates, setCandidates] = useState<RecognizedGloss[]>([]);
  const [confirmedGlosses, setConfirmedGlosses] = useState<RecognizedGloss[]>([]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(true);
  const [aiError, setAiError] = useState<string | null>(null);

  const detectorRef = useRef<HolisticDetector | null>(null);
  const framesRef = useRef<HolisticFrame[]>([]);
  const requestRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const lastPredictionTimeRef = useRef(-Infinity);
  const lastResultTimeRef = useRef(0);

  const clearSequence = useCallback(() => {
    generationRef.current += 1;
    requestRef.current?.abort();
    requestRef.current = null;
    framesRef.current = [];
    stabilizerRef.current.reset();
    lastResultTimeRef.current = 0;
  }, []);

  const handleObservation = useCallback(async ({frame, hands}: HolisticObservation) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (context && canvas) drawHandLandmarks(context, hands, canvas.width, canvas.height);
    setHandCount(hands.length);
    const previous = framesRef.current.at(-1);
    if (!hands.length || (previous && frame.timestamp_ms - previous.timestamp_ms > 500)) {
      clearSequence();
      setLivePrediction(null);
      setStabilization(stabilizerRef.current.process(null));
      if (!hands.length) return;
    }
    framesRef.current = [...framesRef.current, frame]
      .filter(f => frame.timestamp_ms - f.timestamp_ms <= 6000).slice(-180);
    const frames = framesRef.current;
    if (requestRef.current || frames.length < 24 ||
      frame.timestamp_ms - frames[0].timestamp_ms < 800 ||
      frame.timestamp_ms - lastPredictionTimeRef.current < 450) return;
    const controller = new AbortController();
    requestRef.current = controller;
    lastPredictionTimeRef.current = frame.timestamp_ms;
    const generation = generationRef.current;
    try {
      const res = await restApi.predictVSLSequence(frames, contextStep, controller.signal);
      if (generation !== generationRef.current || controller.signal.aborted) return;
      setLivePrediction(res);
      const now = Date.now();
      // Do not carry stability evidence across a slow/disconnected inference gap.
      if (now - lastResultTimeRef.current > 1500) stabilizerRef.current.reset();
      lastResultTimeRef.current = now;
      const stable = stabilizerRef.current.process(res, now);
      setStabilization(stable);
      if (!stable.candidate) return;
      const candidate = stable.candidate;
      const meta = GLOSS_METADATA[candidate.gloss];
      if (!meta || (contextStep === 'location' ? meta.category !== 'region' : meta.category !== 'symptom')) return;
      const recognized: RecognizedGloss = {
        gloss: candidate.gloss, label_vi: candidate.label_vi, confidence: candidate.confidence,
        category: meta.category, maps_to: meta.maps_to, timestamp: now,
      };
      setCandidates(prev => prev.some(c => c.gloss === recognized.gloss) ? prev : [recognized, ...prev.slice(0,3)]);
    } catch {
      if (!controller.signal.aborted && generation === generationRef.current) {
        stabilizerRef.current.reset();
        setStabilization(stabilizerRef.current.process(null));
        setLivePrediction(null);
      }
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  }, [contextStep, clearSequence]);

  useEffect(() => {
    let active = true;
    const detector = new HolisticDetector();
    detectorRef.current = detector;
    setIsAiLoading(true);
    setAiError(null);
    detector.initialize().then(() => {
      if (active) setIsAiLoading(false);
    }).catch(() => {
      if (active) {
        stop();
        setAiError(vi.camera.unavailable);
        setIsAiLoading(false);
      }
    });
    return () => {
      active = false;
      detector.close();
      detectorRef.current = null;
      clearSequence();
    };
  }, [clearSequence, stop]);

  useEffect(() => {
    const detector = detectorRef.current;
    const unsubscribe = detector?.onResults(handleObservation);
    clearSequence();
    setCandidates([]);
    setConfirmedGlosses([]);
    setLivePrediction(null);
    return () => { unsubscribe?.(); clearSequence(); };
  }, [handleObservation, clearSequence]);

  useEffect(() => { start(); return stop; }, [start, stop]);

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) detectorRef.current?.start(videoRef.current);
  };

  // Gắn stream từ useCamera vào thẻ <video> (Duy trì một MediaStream duy nhất)
  const setVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
      bindVideoRef(el);
    },
    [bindVideoRef]
  );

  // Xử lý chuyển sang chế độ Chạm an toàn: dọn dẹp sạch MediaStream & Detector
  const handleSwitchToTouch = useCallback(() => {
    detectorRef.current?.close();
    clearSequence();
    stop();
    onSwitchToTouchMode?.();
  }, [stop, onSwitchToTouchMode, clearSequence]);

  // Xác nhận 1 gloss candidate
  const handleConfirmCandidate = (candidate: RecognizedGloss, index: number) => {
    setConfirmedGlosses((prev) => {
      if (prev.some((g) => g.gloss === candidate.gloss)) return prev;
      return [...prev, candidate];
    });
    setCandidates((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Bỏ qua candidate
  const handleDismissCandidate = (index: number) => {
    setCandidates((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Xóa 1 từ đã xác nhận
  const handleRemoveConfirmed = (index: number) => {
    setConfirmedGlosses((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Hoàn tất áp dụng các từ đã xác nhận vào form khám
  const handleApply = () => {
    if (confirmedGlosses.length > 0) {
      onApplyGlosses(confirmedGlosses);
    }
  };

  return (
    <div data-testid="vsl-camera-view" className="w-full bg-paper rounded-2xl border border-gray-200 p-3 sm:p-4 shadow-xs">
      {/* Header trạng thái thu gọn */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
            <IconCamera className="w-4 h-4" stroke={2} />
          </div>
          <div>
            <h3 className="text-xl font-black text-ink flex flex-wrap items-center gap-2">
              Gợi ý cử chỉ qua camera
              <span className="text-base font-bold px-2 py-0.5 rounded-full bg-ok-bg text-ok flex items-center gap-1">
                <IconBolt className="w-3 h-3" stroke={2.5} /> {vi.camera.experimental}
              </span>
            </h3>
            <p className="text-base text-mute">
              {vi.camera.instruction}
            </p>
          </div>
        </div>

        {onSwitchToTouchMode && (
          <button
            type="button"
            onClick={handleSwitchToTouch}
            className="min-h-[64px] px-3 py-1.5 rounded-xl bg-canvas hover:bg-gray-200 text-ink font-bold text-base border border-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <IconHandClick className="w-3.5 h-3.5 text-mute" stroke={2} />
            <span>Chuyển sang Chạm</span>
          </button>
        )}
      </div>

      {/* Layout 2 cột: BÊN TRÁI LÀ CAMERA TO RỘNG (8/12), BÊN PHẢI LÀ KẾT QUẢ & XÁC NHẬN (4/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* CỘT TRÁI (8 / 12 CỘT): MÀN HÌNH CAMERA VÀ KHUNG XƯƠNG NGÓN TAY CỰC TO */}
        <div className="lg:col-span-7 flex flex-col gap-2">
          <div className="relative aspect-square w-full max-w-[480px] mx-auto rounded-2xl overflow-hidden bg-black shadow-lg border-2 border-gray-800">
            {/* Thẻ Video phát từ webcam */}
            <video
              ref={setVideoRef}
              data-testid="vsl-video-element"
              onLoadedMetadata={handleVideoLoadedMetadata}
              className="absolute inset-0 w-full h-full object-cover -scale-x-100"
              playsInline
              muted
            />

            {/* Canvas vẽ các khớp và khung xương ngón tay MediaPipe */}
            <canvas
              ref={canvasRef}
              width={360}
              height={360}
              className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none"
            />

            {/* HUD trạng thái trực tiếp trên màn hình camera */}
            <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-2 items-center justify-between pointer-events-none z-10">
              {/* Badge số bàn tay */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-base font-bold border border-white/20">
                <IconHandFinger className={`w-4 h-4 ${handCount > 0 ? 'text-status-success animate-pulse' : 'text-gray-400'}`} stroke={2} />
                <span>
                  {handCount === 0
                    ? 'Đang tìm bàn tay...'
                    : handCount === 1
                      ? 'Đã bắt 1 bàn tay'
                      : 'Đã bắt 2 bàn tay'}
                </span>
              </div>

              {/* Badges trạng thái ổn định / cảnh báo cử chỉ */}
              <div className="flex items-center gap-1.5">
                {stabilization.status === 'uncertain' && (
                  <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/80 backdrop-blur-md text-white text-base font-bold border border-amber-300/40 flex items-center gap-1.5 animate-pulse">
                    <IconAlertTriangle className="w-3.5 h-3.5 text-amber-200" stroke={2.5} />
                    <span>Chưa chắc chắn</span>
                  </div>
                )}
                {stabilization.status === 'holding' && (
                  <div className="px-2.5 py-1.5 rounded-xl bg-brand/80 backdrop-blur-md text-white text-base font-bold border border-white/20 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>Đang kiểm tra {stabilization.progressPercent}%</span>
                  </div>
                )}
                <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-emerald-400 text-base font-bold border border-white/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                  <span>{vi.camera.confirmationHint}</span>
                </div>
              </div>
            </div>

            {/* Banner hiển thị từ đang nhận diện ngay tại chân màn Camera */}
            {livePrediction && livePrediction.gloss !== 'UNKNOWN' && (
              <div className="absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-md border border-brand/50 px-3.5 py-2.5 rounded-xl flex flex-col gap-2 text-white animate-fade-in pointer-events-none z-10 shadow-xl">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center font-bold">
                      <IconHandLoveYou className="w-5 h-5 text-white" stroke={2} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-brand-light">
                          {livePrediction.label_vi || livePrediction.gloss}
                        </span>
                        <span className="text-base font-mono text-gray-300">[{livePrediction.gloss}]</span>
                      </div>
                      <span className="text-base text-status-success font-bold">
                        Gợi ý nhận diện
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-base px-2.5 py-1 rounded-lg font-bold ${
                      stabilization.status === 'uncertain'
                        ? 'bg-amber-500/30 border border-amber-500/50 text-amber-200'
                        : stabilization.status === 'stable'
                          ? 'bg-status-success/30 border border-status-success/50 text-status-success'
                          : 'bg-brand/30 border border-brand/50 text-brand-light'
                    }`}
                  >
                    {stabilization.status === 'uncertain'
                      ? 'Chưa chắc chắn'
                      : stabilization.status === 'stable'
                        ? '✓ Đã nhận diện'
                        : `Đang kiểm tra (${stabilization.progressPercent}%)`}
                  </span>
                </div>

                {/* Tiến trình giữ yên cử chỉ theo cấu hình camera */}
                {stabilization.status === 'holding' && (
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-brand-light h-full rounded-full transition-all duration-100"
                      style={{ width: `${stabilization.progressPercent}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Khi camera chưa mở hoặc bị lỗi */}
            {((status !== 'active' && !isActive) || aiError) && (
              <div className="absolute inset-0 bg-paper/95 flex flex-col items-center justify-center p-6 text-center z-20">
                <IconCameraOff className="w-12 h-12 text-mute mb-2" stroke={1.5} />
                <h4 className="text-lg font-bold text-ink mb-1">
                  {aiError || errorMessage || 'Đang chờ cấp quyền truy cập Camera'}
                </h4>
                <p className="text-base text-mute max-w-sm mb-3">
                  Trình duyệt cần quyền truy cập webcam để nhận dạng câu ký hiệu ngắn.
                </p>
                <button
                  type="button"
                  onClick={() => start()}
                  className="min-h-[64px] px-3.5 py-1.5 rounded-xl bg-action text-white font-bold text-base shadow-xs hover:bg-action-dark transition-colors cursor-pointer"
                >
                  Bật lại Camera
                </button>
              </div>
            )}

            {/* Trạng thái tải mô hình ban đầu */}
            {isAiLoading && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
                <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-base font-bold">{vi.camera.loading}</p>
                <p className="text-base text-gray-300 mt-0.5">{vi.camera.localModel}</p>
              </div>
            )}
          </div>

          <p className="text-lg text-mute p-3 rounded-xl bg-canvas">
            {vi.camera.privacy}
          </p>
          <p className="text-lg text-mute">{vi.camera.touchHint}</p>
        </div>

        {/* CỘT PHẢI (4 / 12 CỘT): TỪ CHỜ XÁC NHẬN & DANH SÁCH TRIỆU CHỨNG ĐÃ CHỌN */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3 lg:h-[320px]">
          {/* Box 1: Từ AI vừa nhận diện được (Awaiting Confirmation) */}
          <div className="bg-canvas p-3 rounded-xl border border-gray-200 flex flex-col gap-2 shadow-2xs">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <span className="text-base font-extrabold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <IconSparkles className="w-3.5 h-3.5 text-brand" stroke={2} />
                Cử chỉ vừa bắt được ({candidates.length})
              </span>
              <span className="text-base text-mute">Bấm ✔ để nhận</span>
            </div>

            {candidates.length === 0 ? (
              <div className="py-6 px-2 rounded-lg border border-dashed border-gray-300 text-center text-mute">
                <IconHandFinger className="w-7 h-7 mx-auto mb-1 text-mute/50" stroke={1.5} />
                <p className="text-base font-semibold">Chưa có cử chỉ nào</p>
                <p className="text-base text-mute/80 mt-0.5">
                  Làm cử chỉ trước ống kính để hệ thống bắt từ vào đây.
                </p>
              </div>
            ) : (
              <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                {candidates.map((cand, idx) => (
                  <div
                    key={`${cand.gloss}-${idx}`}
                    className="p-2.5 bg-paper rounded-xl border border-brand/40 shadow-2xs flex items-center justify-between gap-2 animate-fade-in"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-lg font-black text-ink truncate">{cand.label_vi}</span>
                        <span className="text-base font-mono font-bold text-mute shrink-0">[{cand.gloss}]</span>
                      </div>
                      <span className="text-base font-bold text-status-success block">
                        Kiểm tra trước khi nhận
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleConfirmCandidate(cand, idx)}
                        className="min-h-[64px] px-3 py-2 rounded-lg bg-status-success text-white hover:bg-status-success/90 font-bold text-base flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-2xs"
                        title="Xác nhận từ này"
                      >
                        <IconCheck className="w-3.5 h-3.5" stroke={2.5} />
                        <span>Nhận</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismissCandidate(idx)}
                        aria-label="Bỏ qua gợi ý"
                        className="min-h-[64px] min-w-[64px] grid place-items-center rounded-lg bg-gray-100 hover:bg-danger-bg hover:text-danger text-mute transition-colors cursor-pointer"
                        title="Bỏ qua"
                      >
                        <IconX className="w-3.5 h-3.5" stroke={2.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Box 2: Danh sách các triệu chứng đã xác nhận */}
          <div className="bg-canvas p-3 rounded-xl border border-gray-200 flex flex-col gap-2 shadow-2xs">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <span className="text-base font-extrabold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <IconCircleCheck className="w-3.5 h-3.5 text-status-success" stroke={2.5} />
                Triệu chứng đã chốt ({confirmedGlosses.length})
              </span>
              {confirmedGlosses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmedGlosses([])}
                  className="min-h-[64px] px-3 text-base text-danger hover:underline font-semibold cursor-pointer"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {confirmedGlosses.length === 0 ? (
              <p className="text-base text-mute italic py-3 text-center">
                Chưa có triệu chứng nào được chốt. Bấm &quot;Nhận&quot; ở trên.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                {confirmedGlosses.map((g, idx) => (
                  <div
                    key={`${g.gloss}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-paper border border-gray-200 text-ink text-base font-bold shadow-2xs"
                  >
                    <span>{g.label_vi}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveConfirmed(idx)}
                      aria-label={`Xóa ${g.label_vi}`}
                      className="min-h-[64px] min-w-[64px] grid place-items-center text-mute hover:text-danger transition-colors cursor-pointer"
                      title="Xóa"
                    >
                      <IconTrash className="w-3.5 h-3.5" stroke={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Nút hành động chính: Áp dụng vào hồ sơ */}
          <Button
            variant="primary"
            data-testid="btn-apply-vsl-glosses"
            onClick={handleApply}
            disabled={confirmedGlosses.length === 0}
            className="w-full !min-h-[64px] !py-2.5 text-lg md:text-base font-extrabold shadow-md cursor-pointer"
          >
            {confirmedGlosses.length > 0
              ? `Lưu ${confirmedGlosses.length} triệu chứng & Tiếp tục ➔`
              : 'Hãy nhận ít nhất 1 triệu chứng'}
          </Button>
        </div>
      </div>
    </div>
  );
};
