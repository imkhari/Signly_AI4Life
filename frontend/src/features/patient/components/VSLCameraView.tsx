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
  IconHeartbeat,
  IconLungs,
  IconSparkles,
  IconTemperature,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import { useCamera } from '../../../hooks/useCamera';
import { mediaPipeDetector } from '../../../services/vsl/MediaPipeHandDetector';
import { drawHandLandmarks } from '../../../services/vsl/drawHandSkeleton';
import { HandData, restApi, VSLPredictionResponse } from '../../../services/api/rest';
import { GestureStabilizer, StabilizationResult } from '../../../services/vsl/GestureStabilizer';
import { RecognizedGloss } from '../../../services/vsl/types';
import { Button } from '../../../ui/Button';

interface VSLCameraViewProps {
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
  onApplyGlosses,
  onSwitchToTouchMode,
}) => {
  const { status, errorMessage, isActive, start, stop, bindVideoRef } = useCamera();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stabilizerRef = useRef<GestureStabilizer>(
    new GestureStabilizer({
      minStabilityDurationMs: 500,
      minConfidence: 0.7,
      minStableFrames: 3,
      cooldownMs: 2000,
    })
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

  const lastPredictionTimeRef = useRef<number>(0);

  // 1. Khởi động MediaPipe Hand Landmarker
  useEffect(() => {
    let isMounted = true;

    async function initDetector() {
      try {
        setIsAiLoading(true);
        setAiError(null);
        await mediaPipeDetector.initialize();
        if (isMounted) {
          setIsAiLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[VSLCameraView] Failed to initialize MediaPipe:', err);
          setAiError('Không thể tải mô hình nhận diện ngón tay. Vui lòng kiểm tra quyền camera.');
          setIsAiLoading(false);
        }
      }
    }

    const stabilizer = stabilizerRef.current;
    initDetector();

    return () => {
      isMounted = false;
      mediaPipeDetector.stop();
      stabilizer.reset();
    };
  }, []);

  // 2. Khởi động Camera stream
  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, [start, stop]);

  // Xử lý gửi landmark sang Backend AI_model và áp dụng bộ lọc ổn định
  const handleDetectHands = useCallback(
    async (hands: HandData[]) => {
      const now = performance.now();
      // Throttle: Gọi API tối đa 1 lần mỗi 180ms để đảm bảo mượt và không nghẽn mạng
      if (now - lastPredictionTimeRef.current < 180) {
        return;
      }
      lastPredictionTimeRef.current = now;

      try {
        const res = await restApi.predictVSL(hands);
        setLivePrediction(res);

        // Đưa qua bộ lọc ổn định cử chỉ (yêu cầu giữ >= 800ms, confidence >= 70%)
        const stabResult = stabilizerRef.current.process(res, Date.now());
        setStabilization(stabResult);

        // Chỉ tạo candidate khi bộ lọc xác nhận cử chỉ đã giữ ổn định đủ lâu
        if (stabResult.candidate) {
          const cand = stabResult.candidate;
          const cleanGloss = cand.gloss.replace('MỨC-', '');
          const meta = GLOSS_METADATA[cand.gloss] || GLOSS_METADATA[cleanGloss] || {
            category: cand.gloss.startsWith('MỨC-') ? 'severity' : 'symptom',
            maps_to: cand.gloss.startsWith('MỨC-')
              ? {
                  field: 'pain.severity',
                  value: parseInt(cleanGloss) || 5,
                }
              : undefined,
          };

          const recognized: RecognizedGloss = {
            gloss: cand.gloss,
            label_vi: cand.label_vi,
            category: meta.category,
            confidence: cand.confidence,
            timestamp: Date.now(),
            maps_to: meta.maps_to,
          };

          setCandidates((prev) => {
            // Không thêm trùng từ đang có trong hàng đợi chờ xác nhận
            if (prev.some((c) => c.gloss === cand.gloss)) {
              return prev;
            }
            return [recognized, ...prev.slice(0, 3)];
          });
        }
      } catch (err) {
        console.warn('[VSLCameraView] Predict error:', err);
      }
    },
    []
  );

  // 3. Kết nối luồng Video với MediaPipe & Canvas vẽ khung xương ngón tay
  const handleVideoLoadedMetadata = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    mediaPipeDetector.start(video);

    const unsub = mediaPipeDetector.onResults((result) => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawHandLandmarks(ctx, result.landmarks || [], canvas.width, canvas.height);
      }

      const handsFound = result.landmarks?.length || 0;
      setHandCount(handsFound);

      if (handsFound > 0 && result.landmarks) {
        const handsData: HandData[] = result.landmarks.map((lmList, idx) => ({
          handedness:
            result.handednesses?.[idx]?.[0]?.categoryName === 'Left' ? 'Left' : 'Right',
          landmarks: lmList.map((pt) => ({ x: pt.x, y: pt.y, z: pt.z })),
        }));
        handleDetectHands(handsData);
      } else {
        const idleStab = stabilizerRef.current.process(null, Date.now());
        setStabilization(idleStab);
        setLivePrediction(null);
      }
    });

    return () => {
      unsub();
      mediaPipeDetector.stop();
    };
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
    mediaPipeDetector.stop();
    stop();
    stabilizerRef.current.reset();
    onSwitchToTouchMode?.();
  }, [stop, onSwitchToTouchMode]);

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
    <div className="w-full bg-paper rounded-2xl border border-gray-200 p-3 sm:p-4 shadow-xs">
      {/* Header trạng thái thu gọn */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
            <IconCamera className="w-4 h-4" stroke={2} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-ink flex items-center gap-2">
              Nhận dạng Ký hiệu Ngôn ngữ (VSL Studio)
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-status-success/20 text-status-success flex items-center gap-1">
                <IconBolt className="w-3 h-3" stroke={2.5} /> Camera Trực tiếp
              </span>
            </h3>
            <p className="text-[11px] text-mute">
              Đưa tay trước camera: Hệ thống tự động theo dõi ngón tay và nhận diện triệu chứng theo thời gian thực.
            </p>
          </div>
        </div>

        {onSwitchToTouchMode && (
          <button
            type="button"
            onClick={handleSwitchToTouch}
            className="px-3 py-1.5 rounded-xl bg-canvas hover:bg-gray-200 text-ink font-bold text-xs border border-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <IconHandClick className="w-3.5 h-3.5 text-mute" stroke={2} />
            <span>Chuyển sang Chạm</span>
          </button>
        )}
      </div>

      {/* Layout 2 cột: BÊN TRÁI LÀ CAMERA TO RỘNG (8/12), BÊN PHẢI LÀ KẾT QUẢ & XÁC NHẬN (4/12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* CỘT TRÁI (8 / 12 CỘT): MÀN HÌNH CAMERA VÀ KHUNG XƯƠNG NGÓN TAY CỰC TO */}
        <div className="lg:col-span-8 flex flex-col gap-2">
          <div className="relative aspect-[16/10] sm:aspect-video lg:h-[480px] w-full rounded-2xl overflow-hidden bg-black shadow-lg border-2 border-gray-800">
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
              className="absolute inset-0 w-full h-full object-cover -scale-x-100 pointer-events-none"
            />

            {/* HUD trạng thái trực tiếp trên màn hình camera */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
              {/* Badge số bàn tay */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-bold border border-white/20">
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
                  <div className="px-2.5 py-1.5 rounded-xl bg-amber-500/80 backdrop-blur-md text-white text-xs font-bold border border-amber-300/40 flex items-center gap-1.5 animate-pulse">
                    <IconAlertTriangle className="w-3.5 h-3.5 text-amber-200" stroke={2.5} />
                    <span>Chưa chắc chắn</span>
                  </div>
                )}
                {stabilization.status === 'holding' && (
                  <div className="px-2.5 py-1.5 rounded-xl bg-brand/80 backdrop-blur-md text-white text-xs font-bold border border-white/20 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <span>Giữ yên {stabilization.progressPercent}%</span>
                  </div>
                )}
                <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-emerald-400 text-xs font-bold border border-white/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                  <span>Sẵn sàng nhận diện</span>
                </div>
              </div>
            </div>

            {/* Banner hiển thị từ đang nhận diện ngay tại chân màn Camera */}
            {livePrediction && livePrediction.gloss !== 'UNKNOWN' && (
              <div className="absolute bottom-3 left-3 right-3 bg-black/85 backdrop-blur-md border border-brand/50 px-3.5 py-2.5 rounded-xl flex flex-col gap-2 text-white animate-fade-in pointer-events-none z-10 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center font-bold">
                      <IconHandLoveYou className="w-5 h-5 text-white" stroke={2} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-brand-light">
                          {livePrediction.label_vi || livePrediction.gloss}
                        </span>
                        <span className="text-xs font-mono text-gray-300">[{livePrediction.gloss}]</span>
                      </div>
                      <span className="text-xs text-status-success font-bold">
                        Độ tin cậy: {Math.round(livePrediction.confidence * 100)}% · {livePrediction.latency_ms}ms
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-lg font-bold ${
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
                        : `Đang giữ (${stabilization.progressPercent}%)`}
                  </span>
                </div>

                {/* Thanh tiến trình giữ yên cử chỉ (0.8s hold progress) */}
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
                <h4 className="text-sm font-bold text-ink mb-1">
                  {aiError || errorMessage || 'Đang chờ cấp quyền truy cập Camera'}
                </h4>
                <p className="text-xs text-mute max-w-sm mb-3">
                  Trình duyệt cần quyền truy cập webcam để nhận dạng cử chỉ ngón tay của bạn.
                </p>
                <button
                  type="button"
                  onClick={() => start()}
                  className="px-3.5 py-1.5 rounded-xl bg-action text-white font-bold text-xs shadow-xs hover:bg-action-dark transition-colors cursor-pointer"
                >
                  Bật lại Camera
                </button>
              </div>
            )}

            {/* Trạng thái tải mô hình ban đầu */}
            {isAiLoading && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center text-white z-20">
                <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs font-bold">Đang nạp mô hình nhận dạng ngón tay...</p>
                <p className="text-[10px] text-gray-300 mt-0.5">Xử lý cục bộ trên thiết bị (Offline 100%)</p>
              </div>
            )}
          </div>

          {/* 4 THẺ HƯỚNG DẪN CỬ CHỈ TRỰC QUAN CHO NGƯỜI ĐIẾC (VSL Visual Guides - Offline 100%) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-canvas border border-gray-200 hover:border-brand/40 transition-all flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-danger/10 text-danger flex items-center justify-center shrink-0">
                <IconHeartbeat className="w-5 h-5" stroke={2} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-ink block leading-snug">Đau ngực</span>
                <span className="text-[10px] text-mute leading-tight block">Áp/nắm tay trước ngực</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-canvas border border-gray-200 hover:border-brand/40 transition-all flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-warning-bg text-warning flex items-center justify-center shrink-0">
                <IconTemperature className="w-5 h-5" stroke={2} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-ink block leading-snug">Sốt cao</span>
                <span className="text-[10px] text-mute leading-tight block">Áp lòng tay lên trán</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-canvas border border-gray-200 hover:border-brand/40 transition-all flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                <IconHandLoveYou className="w-5 h-5" stroke={2} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-ink block leading-snug">Đau bụng</span>
                <span className="text-[10px] text-mute leading-tight block">Ôm/xoa nhẹ vùng bụng</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-canvas border border-gray-200 hover:border-brand/40 transition-all flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                <IconLungs className="w-5 h-5" stroke={2} />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-ink block leading-snug">Khó thở</span>
                <span className="text-[10px] text-mute leading-tight block">Hai tay chéo trước ngực</span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (4 / 12 CỘT): TỪ CHỜ XÁC NHẬN & DANH SÁCH TRIỆU CHỨNG ĐÃ CHỌN */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3 lg:h-[480px]">
          {/* Box 1: Từ AI vừa nhận diện được (Awaiting Confirmation) */}
          <div className="bg-canvas p-3 rounded-xl border border-gray-200 flex flex-col gap-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <IconSparkles className="w-3.5 h-3.5 text-brand" stroke={2} />
                Cử chỉ vừa bắt được ({candidates.length})
              </span>
              <span className="text-[10px] text-mute">Bấm ✔ để nhận</span>
            </div>

            {candidates.length === 0 ? (
              <div className="py-6 px-2 rounded-lg border border-dashed border-gray-300 text-center text-mute">
                <IconHandFinger className="w-7 h-7 mx-auto mb-1 text-mute/50" stroke={1.5} />
                <p className="text-xs font-semibold">Chưa có cử chỉ nào</p>
                <p className="text-[10px] text-mute/80 mt-0.5">
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
                        <span className="text-sm font-black text-ink truncate">{cand.label_vi}</span>
                        <span className="text-[10px] font-mono font-bold text-mute shrink-0">[{cand.gloss}]</span>
                      </div>
                      <span className="text-[11px] font-bold text-status-success block">
                        Độ tin cậy: {Math.round(cand.confidence * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleConfirmCandidate(cand, idx)}
                        className="px-2.5 py-1.5 rounded-lg bg-status-success text-white hover:bg-status-success/90 font-bold text-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95 shadow-2xs"
                        title="Xác nhận từ này"
                      >
                        <IconCheck className="w-3.5 h-3.5" stroke={2.5} />
                        <span>Nhận</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismissCandidate(idx)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-danger-bg hover:text-danger text-mute transition-colors cursor-pointer"
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
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <IconCircleCheck className="w-3.5 h-3.5 text-status-success" stroke={2.5} />
                Triệu chứng đã chốt ({confirmedGlosses.length})
              </span>
              {confirmedGlosses.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmedGlosses([])}
                  className="text-[10px] text-danger hover:underline font-semibold cursor-pointer"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {confirmedGlosses.length === 0 ? (
              <p className="text-xs text-mute italic py-3 text-center">
                Chưa có triệu chứng nào được chốt. Bấm &quot;Nhận&quot; ở trên.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                {confirmedGlosses.map((g, idx) => (
                  <div
                    key={`${g.gloss}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-paper border border-gray-200 text-ink text-xs font-bold shadow-2xs"
                  >
                    <span>{g.label_vi}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveConfirmed(idx)}
                      className="text-mute hover:text-danger transition-colors cursor-pointer"
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
            className="w-full !min-h-[48px] !py-2.5 text-sm md:text-base font-extrabold shadow-md cursor-pointer"
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
