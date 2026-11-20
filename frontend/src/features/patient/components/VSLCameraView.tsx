import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
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
import { restApi, VSLPredictionResponse } from '../../../services/api/rest';
import { SentenceCapture, SENTENCE_LIMITS, observedGroups, hasValidShoulders, CameraTrialResult, CaptureFailure } from '../../../services/vsl/SentenceCapture';
import { RecognizedGloss } from '../../../services/vsl/types';
import { Button } from '../../../ui/Button';
import { vi } from '../../../i18n/vi';
import type { IntakeSuggestion } from '../../../types/vsl';
import { readIntakeSuggestion, SENTENCE_COMPLAINTS, SENTENCE_REGIONS } from '../sentenceIntake';

interface VSLCameraViewProps {
  contextStep?: 'symptom' | 'location' | 'severity' | 'intake';
  onApplyGlosses: (glosses: RecognizedGloss[]) => void;
  onSwitchToTouchMode?: () => void;
  onTrialResult?: (result:CameraTrialResult) => void;
  captureDisabled?: boolean;
  onApplyIntakeSuggestion?: (suggestion: IntakeSuggestion) => void;
  draftKey?: string;
  connected?: boolean;
  replacementNotice?: string;
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
  onTrialResult,
  captureDisabled = false,
  onApplyIntakeSuggestion,
  draftKey,
  connected = true,
  replacementNotice,
}) => {
  const { status, errorMessage, isActive, start, stop, bindVideoRef } = useCamera();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const captureControlsRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureRef = useRef(new SentenceCapture());
  const [previewAspect,setPreviewAspect] = useState(4/3);
  const [tracking, setTracking] = useState('');
  const [readyToSign,setReadyToSign] = useState(false);
  const recordingStartedRef=useRef(0);
  const [remainingSeconds,setRemainingSeconds]=useState(6);
  const [captureFailure,setCaptureFailure]=useState<CaptureFailure|null>(null);
  const lastObservationRef=useRef<HolisticObservation|null>(null);
  const [captureState,setCaptureState] = useState<'idle'|'recording'|'processing'>('idle');
  const [captureMessage,setCaptureMessage] = useState<string>(vi.camera.ready);
  const [livePrediction,setLivePrediction] = useState<VSLPredictionResponse|null>(null);
  const [candidates, setCandidates] = useState<RecognizedGloss[]>([]);
  const [confirmedGlosses, setConfirmedGlosses] = useState<RecognizedGloss[]>([]);
  const [intakeSuggestion, setIntakeSuggestion] = useState<IntakeSuggestion | null>(null);
  const candidateKeyRef = useRef<string | undefined>();
  const [isAiLoading, setIsAiLoading] = useState<boolean>(true);
  const [aiError, setAiError] = useState<string | null>(null);

  const detectorRef = useRef<HolisticDetector | null>(null);
  const requestRef = useRef<AbortController|null>(null);
  const captureTimerRef = useRef<ReturnType<typeof setTimeout>|null>(null);
  const generationRef = useRef(0);
  const pendingResultRef = useRef<(CameraTrialResult & {finishedAt:number})|null>(null);
  const observerRef = useRef(onTrialResult);
  observerRef.current = onTrialResult;

  const clearSequence = useCallback(() => {
    generationRef.current += 1;
    lastObservationRef.current=null;setReadyToSign(false);setTracking('');
    requestRef.current?.abort(); requestRef.current=null;
    if (captureTimerRef.current!==null) clearTimeout(captureTimerRef.current);
    captureTimerRef.current=null; captureRef.current.cancel(); pendingResultRef.current=null;
  }, []);

  const showFailure = useCallback((failure:CaptureFailure) => {
    if (captureTimerRef.current!==null) clearTimeout(captureTimerRef.current);
    captureTimerRef.current=null;
    setCaptureState('idle'); setCaptureFailure(failure); setCaptureMessage(failure.trackingIssue ? vi.camera.trackingIssues[failure.trackingIssue] : vi.camera.reasons[failure.reason]);
    setLivePrediction(null); setCandidates([]); setIntakeSuggestion(null);
    observerRef.current?.({reason:failure.reason,frame_count:failure.frame_count,
      capture_duration_ms:failure.capture_duration_ms,gloss:'UNKNOWN',candidate_latency_ms:null,
      response_latency_ms:null,model_source:'vsl_v2_learned_translation'});
  }, []);

  const handleObservation = useCallback(({frame,hands}:HolisticObservation) => {
    const canvas=canvasRef.current, context=canvas?.getContext('2d');
    if (canvas && context) drawHandLandmarks(context,hands,canvas.width,canvas.height);
    lastObservationRef.current={frame,hands};
    setTracking(observedGroups(frame).join(' · '));
    setReadyToSign(hands.length>0 && hasValidShoulders(frame) &&
      performance.now()-frame.timestamp_ms<=SENTENCE_LIMITS.maxGapMs);
    const failure=captureRef.current.push(frame);
    if (failure) showFailure(failure);
  }, [showFailure]);

  const beginSentence = () => {
    if (!connected || captureDisabled) return;
    const observation=lastObservationRef.current;
    if (!observation || performance.now()-observation.frame.timestamp_ms>SENTENCE_LIMITS.maxGapMs ||
      !observation.hands.length || !hasValidShoulders(observation.frame)) {
      setReadyToSign(false);setCaptureMessage(vi.camera.waitForTracking);return;
    }
    setCaptureFailure(null);
    clearSequence(); setCandidates([]); setLivePrediction(null); setIntakeSuggestion(null);
    recordingStartedRef.current=performance.now();setRemainingSeconds(6);
    captureRef.current.begin(recordingStartedRef.current);
    setCaptureState('recording'); setCaptureMessage(vi.camera.signNow);
    captureControlsRef.current?.focus({preventScroll:true});
    captureTimerRef.current=setTimeout(() => {
      if (captureRef.current.recording) showFailure(captureRef.current.fail('sequence_limit',performance.now()));
    },SENTENCE_LIMITS.maxMs);
  };

  const finishSentence = useCallback(async () => {
    if (!captureRef.current.recording || requestRef.current) return;
    if (captureTimerRef.current!==null) clearTimeout(captureTimerRef.current);
    captureTimerRef.current=null;
    const finishedAt=performance.now();
    const captured=captureRef.current.finish(finishedAt);
    if ('reason' in captured) { showFailure(captured); return; }
    const controller=new AbortController(), generation=generationRef.current;
    requestRef.current=controller;
    setCaptureState('processing'); setCaptureMessage(vi.camera.processing);
    const timeout=setTimeout(() => controller.abort(),15000);
    try {
      const response=await restApi.predictVSLSequence(captured.frames,contextStep,controller.signal);
      if (generation!==generationRef.current) return;
      if (controller.signal.aborted) throw new Error('timeout');
      const meta=GLOSS_METADATA[response.gloss];
      const suggestion=contextStep==='intake' ? readIntakeSuggestion(response) : null;
      const valid=contextStep==='intake' ? suggestion!==null : response.success && response.model_source==='vsl_v2_learned_translation' &&
        Number.isFinite(response.confidence) && response.confidence>=0.7 && response.confidence<=1 &&
        meta && (contextStep==='location' ? meta.category==='region' : meta.category==='symptom');
      const reason=valid ? 'accepted' : response.suggested_next_step==='worker_unavailable'
        ? 'worker_unavailable' : 'unknown';
      const displayedLabel=suggestion
        ? [suggestion.chief_complaint_code, ...suggestion.body_regions].join('+')
        : valid ? response.gloss : 'UNKNOWN';
      pendingResultRef.current={...captured.summary,gloss:displayedLabel,
        reason,candidate_latency_ms:null,
        response_latency_ms:performance.now()-finishedAt,
        model_source:response.model_source,finishedAt};
      setLivePrediction(valid ? response : null);
      setIntakeSuggestion(suggestion); candidateKeyRef.current=draftKey;
      setCandidates(valid ? [{gloss:response.gloss,label_vi:response.label_vi || response.gloss,
        category:meta.category,maps_to:meta.maps_to,confidence:response.confidence,timestamp:Date.now()}] : []);
      setCaptureMessage(valid ? (contextStep==='intake' ? 'Kiểm tra cả gợi ý. Chỉ bấm Dùng thông tin này khi đúng ý bạn.' : vi.camera.checkSuggestion) : vi.camera.reasons[reason]);
    } catch {
      if (generation!==generationRef.current) return;
      const reason=controller.signal.aborted ? 'inference_timeout' : 'network_error';
      pendingResultRef.current={...captured.summary,gloss:'UNKNOWN',reason,candidate_latency_ms:null,
        response_latency_ms:performance.now()-finishedAt,model_source:'vsl_v2_learned_translation',finishedAt};
      setCandidates([]);setLivePrediction(null);setIntakeSuggestion(null);setCaptureMessage(vi.camera.reasons[reason]);
    } finally {
      clearTimeout(timeout);
      if (requestRef.current===controller) {requestRef.current=null;setCaptureState('idle');}
    }
  },[contextStep,draftKey,showFailure]);

  useEffect(() => {
    if (captureState!=='recording') return;
    const timer=setInterval(() => setRemainingSeconds(Math.max(0,Math.ceil(
      (SENTENCE_LIMITS.maxMs-(performance.now()-recordingStartedRef.current))/1000))),100);
    return () => clearInterval(timer);
  },[captureState]);


  useEffect(() => {
    if (captureState!=='recording') return;
    const finishWithKeyboard = (event:KeyboardEvent) => {
      const target=event.target;
      if (event.code!=='Space' || event.repeat || event.altKey || event.ctrlKey || event.metaKey ||
        event.isComposing || !(target instanceof HTMLElement)) return;
      if (target.isContentEditable || (target.closest('input,textarea,select,button,a,[role="button"]') &&
        !target.closest('[data-vsl-begin]'))) return;
      event.preventDefault();
      void finishSentence();
    };
    document.addEventListener('keydown',finishWithKeyboard);
    return () => document.removeEventListener('keydown',finishWithKeyboard);
  },[captureState,finishSentence]);

  // Observe the DOM commit, never send reference/participant data to inference.
  useEffect(() => {
    const pending=pendingResultRef.current;
    if (!pending) return;
    pendingResultRef.current=null;
    const {finishedAt,...result}=pending;
    observerRef.current?.({...result,candidate_latency_ms:result.gloss==='UNKNOWN' ? null : performance.now()-finishedAt});
  },[candidates]);

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
    lastObservationRef.current=null;setCaptureFailure(null);
    clearSequence();
    setCandidates([]);
    setIntakeSuggestion(null);
    setConfirmedGlosses([]);
    setLivePrediction(null);
    setCaptureState('idle'); setCaptureMessage(vi.camera.ready);
    return () => { unsubscribe?.(); clearSequence(); };
  }, [handleObservation, clearSequence, contextStep, draftKey, connected]);

  useEffect(() => { start(); return stop; }, [start, stop]);
  useEffect(() => {
    const clearTracking = () => {
      lastObservationRef.current=null;
      setTracking('');setReadyToSign(false);
      const canvas=canvasRef.current;
      canvas?.getContext('2d')?.clearRect(0,0,canvas.width,canvas.height);
    };
    if (!isActive) {
      clearTracking();clearSequence();setCaptureState('idle');setLivePrediction(null);setCandidates([]);
      setConfirmedGlosses([]);setIntakeSuggestion(null);
      detectorRef.current?.stop?.();
      return;
    }
    const timer=setInterval(() => {
      const latest=lastObservationRef.current;
      const now=performance.now();
      const lastTime=latest?.frame.timestamp_ms ?? recordingStartedRef.current;
      if (now-lastTime>SENTENCE_LIMITS.maxGapMs) {
        if (latest) clearTracking();
        if (captureRef.current.recording) showFailure(captureRef.current.fail('tracking_gap',now,'frames_delayed'));
      }
    },100);
    return () => clearInterval(timer);
  },[isActive,clearSequence,showFailure]);

  const handleVideoLoadedMetadata = () => {
    const video=videoRef.current;
    if (video) {
      if (video.videoWidth>0 && video.videoHeight>0) setPreviewAspect(video.videoWidth/video.videoHeight);
      detectorRef.current?.start(video);
    }
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
              {contextStep==='intake' ? 'Nhận một câu ký hiệu' : 'Gợi ý cử chỉ qua camera'}
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

      {!connected && <p role="alert" className="text-lg text-warn mb-4">Đang mất kết nối. Gợi ý cũ đã hủy; chờ kết nối lại trước khi ký.</p>}

      <div ref={captureControlsRef} tabIndex={-1} aria-label="Điều khiển câu ký"
        style={{top:'var(--patient-header-height, 0px)'}} className="sticky z-20 bg-paper py-2">
      <div className="flex flex-wrap gap-2 mb-1">
        <Button data-vsl-begin onClick={beginSentence} disabled={!isActive || isAiLoading || !!aiError ||
          !readyToSign || captureDisabled || !connected || captureState!=='idle'}>{vi.camera.begin}</Button>
        <Button onClick={finishSentence} disabled={captureState!=='recording'}>{vi.camera.finish}</Button>
        {captureState==='recording' && <Button variant="secondary" onClick={() => {
          showFailure(captureRef.current.fail('cancelled',performance.now()));
        }}>{vi.common.cancel}</Button>}
      </div>
      <p role="status" className="text-lg">{captureMessage}</p>
      {captureFailure && <p data-testid="vsl-capture-stopped" className="text-xl font-bold text-warn mb-4">
        {vi.camera.stopped((captureFailure.capture_duration_ms/1000).toFixed(1))}
      </p>}
      {captureState==='recording' && <p className="text-base">{vi.camera.keyboardFinish}</p>}
      {captureState==='recording' && <p role="timer" aria-live="off" className="text-2xl font-bold text-action">
        {vi.camera.remaining(remainingSeconds)}
      </p>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
        <div className="min-w-0 xl:col-span-2 flex flex-col gap-2">
          {isActive && <p data-testid="vsl-tracking" className="text-base text-ink">
            <strong>Camera đang thấy</strong> {tracking || 'Đang tìm mặt, vai và bàn tay…'}
          </p>}
          <div style={{aspectRatio:previewAspect, maxWidth:`calc(65dvh * ${previewAspect})`}}
            className="relative w-full mx-auto rounded-2xl overflow-hidden bg-black shadow-lg">
            {/* Thẻ Video phát từ webcam */}
            <video
              ref={setVideoRef}
              data-testid="vsl-video-element"
              onLoadedMetadata={handleVideoLoadedMetadata}
              className="absolute inset-0 w-full h-full object-fill -scale-x-100"
              playsInline
              muted
            />

            {/* Canvas vẽ các khớp và khung xương ngón tay MediaPipe */}
            <canvas
              ref={canvasRef}
              width={360}
              height={360}
              className="absolute inset-0 w-full h-full object-fill -scale-x-100 pointer-events-none"
            />

            {/* Banner hiển thị từ đang nhận diện ngay tại chân màn Camera */}
            {contextStep!=='intake' && livePrediction && livePrediction.gloss !== 'UNKNOWN' && (
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

                </div>
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
          {contextStep==='intake' && <p className="text-base text-mute">
            Thử nghiệm chỉ hỗ trợ một số câu ngắn về đau, ho, sốt và khó thở. Ký một câu, bấm Xong câu rồi kiểm tra cả gợi ý.
          </p>}
        </div>

        {contextStep==='intake' ? <div className="min-w-0 bg-canvas rounded-xl p-4 space-y-4" aria-label="Gợi ý cả câu">
          <h4 className="text-xl font-bold">Thông tin camera đề xuất</h4>
          {intakeSuggestion ? <>
            <dl className="space-y-3 text-xl">
              <div><dt className="text-mute">Lý do khám</dt><dd className="font-bold">{SENTENCE_COMPLAINTS[intakeSuggestion.chief_complaint_code].label}</dd></div>
              <div><dt className="text-mute">Tình trạng đau</dt><dd className="font-bold">{intakeSuggestion.pain_present===true ? 'Có đau' : 'Chưa hỏi'}</dd></div>
              {intakeSuggestion.pain_present===true && <div><dt className="text-mute">Vị trí đau</dt><dd className="font-bold">{intakeSuggestion.body_regions.map(code => SENTENCE_REGIONS[code]).join(', ') || 'Chưa rõ — cần chọn thêm'}</dd></div>}
            </dl>
            <p>Chưa ghi vào phiếu. Mức đau và thời gian cần trả lời thêm bằng Chạm.</p>
            {replacementNotice && <p role="note" className="text-warn font-semibold">{replacementNotice}</p>}
            <div className="flex flex-wrap gap-3">
              <Button disabled={!connected || candidateKeyRef.current!==draftKey || captureState!=='idle'}
                onClick={() => {
                  if (!connected || candidateKeyRef.current!==draftKey) return;
                  const value=intakeSuggestion;
                  clearSequence();setIntakeSuggestion(null);setCandidates([]);setLivePrediction(null);
                  onApplyIntakeSuggestion?.(value);
                }}>Dùng thông tin này</Button>
              <Button variant="secondary" onClick={handleSwitchToTouch}>Sửa bằng Chạm</Button>
              <Button variant="secondary" onClick={() => {
                clearSequence();setIntakeSuggestion(null);setCandidates([]);setLivePrediction(null);
                setCaptureMessage(vi.camera.ready);
              }}>Bỏ gợi ý / Ký lại</Button>
            </div>
          </> : <p>Chưa có gợi ý. Bấm Bắt đầu ký khi đã nhìn rõ thân trên và bàn tay.</p>}
        </div> : <div className="min-w-0 flex flex-col justify-between gap-3 ">
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
        </div>}
      </div>
    </div>
  );
};
