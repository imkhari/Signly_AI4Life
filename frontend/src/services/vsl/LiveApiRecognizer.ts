import { GlossRecognizer, RecognizedGloss } from './types';
import { restApi, HandData, VSLPredictionResponse } from '../api/rest';

// Mapping gloss name to semantic ontology category and frame mapping
export const GLOSS_METADATA: Record<
  string,
  {
    category: RecognizedGloss['category'];
    maps_to?: RecognizedGloss['maps_to'];
  }
> = {
  // 1. Nhóm Triệu chứng (Symptom) -> maps_to chief_complaint
  ĐAU: { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'PAIN' } },
  SỐT: { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'FEVER' } },
  HO: { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'COUGH' } },
  'KHÓ-THỞ': { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'BREATH_DIFFICULTY' } },
  'BUỒN-NÔN': { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'NAUSEA_VOMIT' } },
  'CHÓNG-MẶT': { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'DIZZY' } },
  'MỆT-MỎI': { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'OTHER' } },
  'TIM-ĐẬP-NHANH': { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'BREATH_DIFFICULTY' } },
  NGỨA: { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'RASH' } },
  LẠNH: { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'FEVER' } },
  'CHẢY-MÁU': { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'BLEED' } },
  'CHẤN-THƯƠNG': { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'INJURY' } },
  BỎNG: { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'INJURY' } },
  'TIÊU-CHẢY': { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'OTHER' } },
  'HO-RA-MÁU': { category: 'symptom', maps_to: { field: 'chief_complaint', code: 'BLEED' } },

  // 2. Nhóm Vị trí cơ thể (Body Region) -> maps_to pain.body_regions
  ĐẦU: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'HEAD' } },
  NGỰC: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'CHEST' } },
  BỤNG: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'ABDOMEN_UPPER' } },
  'BỤNG-DƯỚI': { category: 'region', maps_to: { field: 'pain.body_regions', code: 'ABDOMEN_LOWER' } },
  LƯNG: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'LOWER_BACK' } },
  HỌNG: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'NECK' } },
  TAY: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'ARM_R' } },
  CHÂN: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'LEG_L' } },
  VAI: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'UPPER_BACK' } },
  RĂNG: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'HEAD' } },
  MẮT: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'HEAD' } },
  TAI: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'HEAD' } },
  GÁY: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'NECK' } },
  'ĐẦU-GỐI': { category: 'region', maps_to: { field: 'pain.body_regions', code: 'LEG_L' } },
  'CỔ-TAY': { category: 'region', maps_to: { field: 'pain.body_regions', code: 'HAND_R' } },
  HÔNG: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'LOWER_BACK' } },
  MÔNG: { category: 'region', maps_to: { field: 'pain.body_regions', code: 'ABDOMEN_LOWER' } },

  // 3. Nhóm Thời gian (Time & Time Unit) -> maps_to pain.onset & time_unit
  'HÔM-NAY': { category: 'time', maps_to: { field: 'pain.onset', value: 0, unit: 'day' } },
  'HÔM-QUA': { category: 'time', maps_to: { field: 'pain.onset', value: 1, unit: 'day' } },
  SÁNG: { category: 'time', maps_to: { field: 'pain.onset', value: 0, unit: 'day' } },
  TỐI: { category: 'time', maps_to: { field: 'pain.onset', value: 0, unit: 'day' } },
  'TUẦN-TRƯỚC': { category: 'time', maps_to: { field: 'pain.onset', value: 7, unit: 'day' } },
  GIỜ: { category: 'time_unit', maps_to: { field: 'time_unit', unit: 'hour' } },
  NGÀY: { category: 'time_unit', maps_to: { field: 'time_unit', unit: 'day' } },
  'LIÊN-TỤC': { category: 'time', maps_to: { field: 'pain.onset', value: 0, unit: 'day' } },
  'TỪNG-CƠN': { category: 'time', maps_to: { field: 'pain.onset', value: 0, unit: 'day' } },
  'VỪA-MỚI': { category: 'time', maps_to: { field: 'pain.onset', value: 1, unit: 'hour' } },

  // 4. Nhóm Mức độ & Số đếm (Severity & Numbers) -> maps_to pain.severity & number
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
  HAI: { category: 'number', maps_to: { field: 'number', value: 2 } },
  NẶNG: { category: 'severity', maps_to: { field: 'pain.severity', value: 8 } },
  NHẸ: { category: 'severity', maps_to: { field: 'pain.severity', value: 2 } },

  // 5. Nhóm Định từ & Dị ứng (Modifier & Allergy)
  CÓ: { category: 'modifier', maps_to: { field: 'modifier', value: true } },
  KHÔNG: { category: 'modifier', maps_to: { field: 'modifier', value: false } },
  'DỊ-ỨNG': { category: 'allergy', maps_to: { field: 'allergy.has_allergy', value: true } },
  THUỐC: { category: 'allergy', maps_to: { field: 'allergy.category', value: 'drug' } },
  KHÁM: { category: 'modifier', maps_to: { field: 'chief_complaint', code: 'CHECKUP' } },
};

export class LiveApiRecognizer implements GlossRecognizer {
  private listeners: Set<(gloss: RecognizedGloss) => void> = new Set();
  private recognizing = false;
  private videoEl: HTMLVideoElement | null = null;
  private lastPrediction: VSLPredictionResponse | null = null;

  async start(videoElement?: HTMLVideoElement | null): Promise<void> {
    this.videoEl = videoElement || null;
    this.recognizing = true;
  }

  stop(): void {
    this.recognizing = false;
    this.videoEl = null;
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoEl;
  }

  isRecognizing(): boolean {
    return this.recognizing;
  }

  onGloss(callback: (gloss: RecognizedGloss) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  getLastPrediction(): VSLPredictionResponse | null {
    return this.lastPrediction;
  }

  /**
   * Gửi dữ liệu bàn tay 3D landmarks sang Backend AI_model inference engine
   */
  async predictHands(hands: HandData[], contextStep?: string): Promise<RecognizedGloss | null> {
    if (!this.recognizing && this.listeners.size === 0) return null;

    try {
      const res = await restApi.predictVSL(hands, contextStep);
      this.lastPrediction = res;

      if (!res.success || !res.gloss || res.gloss === 'UNKNOWN') {
        return null;
      }

      const meta = GLOSS_METADATA[res.gloss] || {
        category: res.gloss.startsWith('MỨC-') ? 'severity' : 'symptom',
        maps_to: res.gloss.startsWith('MỨC-')
          ? {
              field: 'pain.severity',
              value: parseInt(res.gloss.replace('MỨC-', '')) || 5,
            }
          : undefined,
      };

      const recognized: RecognizedGloss = {
        gloss: res.gloss,
        label_vi: res.label_vi || res.gloss,
        category: meta.category,
        confidence: res.confidence,
        timestamp: Date.now(),
        maps_to: meta.maps_to,
      };

      this.listeners.forEach((fn) => fn(recognized));
      return recognized;
    } catch (err) {
      console.error('Failed to run VSL prediction via backend API:', err);
      return null;
    }
  }

  /**
   * Kích hoạt một cử chỉ mẫu để gọi AI_model thật sự trên backend
   */
  async triggerDemoGesture(
    gesture: 'chest' | 'fever' | 'belly' | 'cough' | 'pain_5' | 'throat'
  ): Promise<RecognizedGloss | null> {
    let mockLandmarks: Array<{ x: number; y: number; z?: number }> = [];
    let contextStep: string | undefined = undefined;

    switch (gesture) {
      case 'chest':
        // Nắm đấm trước ngực (y = 0.65)
        mockLandmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.65, z: 0.0 }));
        contextStep = 'location';
        break;
      case 'fever':
        // Áp tay lên trán (y = 0.25)
        mockLandmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.25, z: 0.0 }));
        for (const i of [8, 12, 16, 20]) {
          mockLandmarks[i] = { x: 0.5, y: 0.15, z: 0.0 };
        }
        contextStep = 'symptom';
        break;
      case 'belly':
        // Xoa bụng (y = 0.80)
        mockLandmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.8, z: 0.0 }));
        contextStep = 'location';
        break;
      case 'cough':
        // Nắm tay trước miệng (y = 0.45)
        mockLandmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.45, z: 0.0 }));
        contextStep = 'symptom';
        break;
      case 'throat':
        // Chỉ tay vào cổ (y = 0.45)
        mockLandmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.45, z: 0.0 }));
        mockLandmarks[8] = { x: 0.5, y: 0.42, z: 0.0 };
        contextStep = 'location';
        break;
      case 'pain_5':
        // Giơ 5 ngón tay
        mockLandmarks = Array.from({ length: 21 }, () => ({ x: 0.82, y: 0.6, z: 0.0 }));
        mockLandmarks[0] = { x: 0.85, y: 0.82, z: 0.0 };
        for (const [t, d, p, m] of [
          [8, 7, 6, 5],
          [12, 11, 10, 9],
          [16, 15, 14, 13],
          [20, 18, 18, 17],
        ]) {
          mockLandmarks[m] = { x: 0.82, y: 0.62, z: 0.0 };
          mockLandmarks[p] = { x: 0.82, y: 0.5, z: 0.0 };
          mockLandmarks[d] = { x: 0.82, y: 0.42, z: 0.0 };
          mockLandmarks[t] = { x: 0.82, y: 0.34, z: 0.0 };
        }
        mockLandmarks[2] = { x: 0.76, y: 0.65, z: 0.0 };
        mockLandmarks[3] = { x: 0.72, y: 0.58, z: 0.0 };
        mockLandmarks[4] = { x: 0.67, y: 0.5, z: 0.0 };
        contextStep = 'general';
        break;
    }

    const hands: HandData[] = [{ handedness: 'Right', landmarks: mockLandmarks }];
    return this.predictHands(hands, contextStep);
  }
}
