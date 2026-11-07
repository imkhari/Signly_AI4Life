import { VSLPredictionResponse } from '../api/rest';

export interface StableCandidate {
  gloss: string;
  label_vi: string;
  confidence: number;
  durationMs: number;
  stableFrames: number;
}

export interface StabilizationResult {
  isStable: boolean;
  status: 'idle' | 'holding' | 'stable' | 'uncertain';
  statusMessage: string;
  candidate: StableCandidate | null;
  currentGloss: string | null;
  progressPercent: number; // 0 đến 100%
}

export class GestureStabilizer {
  private activeGloss: string | null = null;
  private firstSeenTime: number = 0;
  private consecutiveCount: number = 0;
  private confidenceAccumulator: number = 0;
  private minStabilityDurationMs: number;
  private minConfidence: number;
  private minStableFrames: number;
  private lastEmittedGloss: string | null = null;
  private lastEmittedTime: number = 0;
  private cooldownMs: number;

  constructor(options?: {
    minStabilityDurationMs?: number;
    minConfidence?: number;
    minStableFrames?: number;
    cooldownMs?: number;
  }) {
    this.minStabilityDurationMs = options?.minStabilityDurationMs ?? 800; // 800ms
    this.minConfidence = options?.minConfidence ?? 0.70;
    this.minStableFrames = options?.minStableFrames ?? 3;
    this.cooldownMs = options?.cooldownMs ?? 2500;
  }

  public process(
    prediction: VSLPredictionResponse | null,
    now: number = Date.now()
  ): StabilizationResult {
    // 1. Nếu không có dữ liệu hoặc không nhận diện được
    if (
      !prediction ||
      !prediction.success ||
      !prediction.gloss ||
      prediction.gloss === 'UNKNOWN'
    ) {
      this.resetTracking();
      return {
        isStable: false,
        status: 'idle',
        statusMessage: 'Đang chờ cử chỉ...',
        candidate: null,
        currentGloss: null,
        progressPercent: 0,
      };
    }

    const { gloss, confidence, is_transitioning, motion_type } = prediction;

    // 2. Kiểm tra trạng thái chuyển tiếp hoặc vẫy tay rác
    if (is_transitioning || motion_type === 'transitioning' || motion_type === 'waving') {
      this.resetTracking();
      return {
        isStable: false,
        status: 'uncertain',
        statusMessage: 'Chưa chắc chắn (đang di chuyển tay)',
        candidate: null,
        currentGloss: gloss,
        progressPercent: 0,
      };
    }

    // 3. Kiểm tra độ tin cậy tối thiểu
    if (confidence < this.minConfidence) {
      this.resetTracking();
      return {
        isStable: false,
        status: 'uncertain',
        statusMessage: `Chưa chắc chắn (độ tin cậy ${Math.round(confidence * 100)}% < ${Math.round(this.minConfidence * 100)}%)`,
        candidate: null,
        currentGloss: gloss,
        progressPercent: 0,
      };
    }

    // 4. Nếu đổi sang một từ khác
    if (this.activeGloss !== gloss) {
      this.activeGloss = gloss;
      this.firstSeenTime = now;
      this.consecutiveCount = 1;
      this.confidenceAccumulator = confidence;

      return {
        isStable: false,
        status: 'holding',
        statusMessage: `Đang giữ cử chỉ: ${prediction.label_vi || gloss}`,
        candidate: null,
        currentGloss: gloss,
        progressPercent: Math.min(99, Math.round((1 / this.minStableFrames) * 30)),
      };
    }

    // 5. Cùng một từ xuất hiện tiếp tục
    this.consecutiveCount += 1;
    this.confidenceAccumulator += confidence;

    const duration = now - this.firstSeenTime;
    const avgConfidence = this.confidenceAccumulator / this.consecutiveCount;
    const progressPercent = Math.min(100, Math.round((duration / this.minStabilityDurationMs) * 100));

    // Kiểm tra đã đủ thời gian và số frame ổn định chưa
    if (
      duration >= this.minStabilityDurationMs &&
      this.consecutiveCount >= this.minStableFrames
    ) {
      // Kiểm tra cooldown để không bắn trùng cùng một từ liên tục
      if (this.lastEmittedGloss === gloss && now - this.lastEmittedTime < this.cooldownMs) {
        return {
          isStable: true,
          status: 'stable',
          statusMessage: `Đã nhận diện: ${prediction.label_vi || gloss}`,
          candidate: null, // Đang trong cooldown, không tạo candidate trùng
          currentGloss: gloss,
          progressPercent: 100,
        };
      }

      this.lastEmittedGloss = gloss;
      this.lastEmittedTime = now;

      const candidate: StableCandidate = {
        gloss,
        label_vi: prediction.label_vi || gloss,
        confidence: Math.round(avgConfidence * 100) / 100,
        durationMs: duration,
        stableFrames: this.consecutiveCount,
      };

      return {
        isStable: true,
        status: 'stable',
        statusMessage: `Cử chỉ ổn định: ${candidate.label_vi}`,
        candidate,
        currentGloss: gloss,
        progressPercent: 100,
      };
    }

    return {
      isStable: false,
      status: 'holding',
      statusMessage: `Giữ yên (${progressPercent}%)...`,
      candidate: null,
      currentGloss: gloss,
      progressPercent,
    };
  }

  public reset(): void {
    this.resetTracking();
    this.lastEmittedGloss = null;
    this.lastEmittedTime = 0;
  }

  private resetTracking(): void {
    this.activeGloss = null;
    this.firstSeenTime = 0;
    this.consecutiveCount = 0;
    this.confidenceAccumulator = 0;
  }
}
