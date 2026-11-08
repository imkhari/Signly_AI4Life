import { GlossRecognizer, RecognizedGloss } from './types';

export const ONTOLOGY_GLOSSES: RecognizedGloss[] = [
  // 1. Nhóm Triệu chứng (Symptom) -> maps_to chief_complaint
  {
    gloss: 'ĐAU',
    label_vi: 'Đau',
    category: 'symptom',
    confidence: 0.95,
    maps_to: { field: 'chief_complaint', code: 'PAIN' },
  },
  {
    gloss: 'SỐT',
    label_vi: 'Sốt',
    category: 'symptom',
    confidence: 0.92,
    maps_to: { field: 'chief_complaint', code: 'FEVER' },
  },
  {
    gloss: 'HO',
    label_vi: 'Ho',
    category: 'symptom',
    confidence: 0.9,
    maps_to: { field: 'chief_complaint', code: 'COUGH' },
  },
  {
    gloss: 'KHÓ-THỞ',
    label_vi: 'Khó thở',
    category: 'symptom',
    confidence: 0.96,
    maps_to: { field: 'chief_complaint', code: 'BREATH_DIFFICULTY' },
  },
  {
    gloss: 'BUỒN-NÔN',
    label_vi: 'Buồn nôn',
    category: 'symptom',
    confidence: 0.91,
    maps_to: { field: 'chief_complaint', code: 'NAUSEA_VOMIT' },
  },
  {
    gloss: 'CHÓNG-MẶT',
    label_vi: 'Chóng mặt',
    category: 'symptom',
    confidence: 0.89,
    maps_to: { field: 'chief_complaint', code: 'DIZZY' },
  },
  {
    gloss: 'MỆT-MỎI',
    label_vi: 'Mệt mỏi',
    category: 'symptom',
    confidence: 0.88,
    maps_to: { field: 'chief_complaint', code: 'OTHER' },
  },
  {
    gloss: 'TIM-ĐẬP-NHANH',
    label_vi: 'Tim đập nhanh',
    category: 'symptom',
    confidence: 0.94,
    maps_to: { field: 'chief_complaint', code: 'BREATH_DIFFICULTY' },
  },
  {
    gloss: 'NGỨA',
    label_vi: 'Ngứa',
    category: 'symptom',
    confidence: 0.91,
    maps_to: { field: 'chief_complaint', code: 'RASH' },
  },
  {
    gloss: 'LẠNH',
    label_vi: 'Lạnh run',
    category: 'symptom',
    confidence: 0.92,
    maps_to: { field: 'chief_complaint', code: 'FEVER' },
  },
  {
    gloss: 'CHẢY-MÁU',
    label_vi: 'Chảy máu',
    category: 'symptom',
    confidence: 0.92,
    maps_to: { field: 'chief_complaint', code: 'BLEED' },
  },
  {
    gloss: 'CHẤN-THƯƠNG',
    label_vi: 'Chấn thương',
    category: 'symptom',
    confidence: 0.91,
    maps_to: { field: 'chief_complaint', code: 'INJURY' },
  },
  {
    gloss: 'BỎNG',
    label_vi: 'Bỏng',
    category: 'symptom',
    confidence: 0.9,
    maps_to: { field: 'chief_complaint', code: 'INJURY' },
  },
  {
    gloss: 'TIÊU-CHẢY',
    label_vi: 'Tiêu chảy',
    category: 'symptom',
    confidence: 0.89,
    maps_to: { field: 'chief_complaint', code: 'OTHER' },
  },
  {
    gloss: 'HO-RA-MÁU',
    label_vi: 'Ho ra máu',
    category: 'symptom',
    confidence: 0.93,
    maps_to: { field: 'chief_complaint', code: 'BLEED' },
  },

  // 2. Nhóm Vị trí cơ thể (Body Region) -> maps_to pain.body_regions
  {
    gloss: 'ĐẦU',
    label_vi: 'Đầu',
    category: 'region',
    confidence: 0.91,
    maps_to: { field: 'pain.body_regions', code: 'HEAD' },
  },
  {
    gloss: 'NGỰC',
    label_vi: 'Ngực',
    category: 'region',
    confidence: 0.94,
    maps_to: { field: 'pain.body_regions', code: 'CHEST' },
  },
  {
    gloss: 'BỤNG',
    label_vi: 'Bụng',
    category: 'region',
    confidence: 0.88,
    maps_to: { field: 'pain.body_regions', code: 'ABDOMEN_UPPER' },
  },
  {
    gloss: 'BỤNG-DƯỚI',
    label_vi: 'Bụng dưới',
    category: 'region',
    confidence: 0.87,
    maps_to: { field: 'pain.body_regions', code: 'ABDOMEN_LOWER' },
  },
  {
    gloss: 'LƯNG',
    label_vi: 'Lưng',
    category: 'region',
    confidence: 0.89,
    maps_to: { field: 'pain.body_regions', code: 'LOWER_BACK' },
  },
  {
    gloss: 'HỌNG',
    label_vi: 'Họng',
    category: 'region',
    confidence: 0.93,
    maps_to: { field: 'pain.body_regions', code: 'NECK' },
  },
  {
    gloss: 'TAY',
    label_vi: 'Tay',
    category: 'region',
    confidence: 0.92,
    maps_to: { field: 'pain.body_regions', code: 'ARM_R' },
  },
  {
    gloss: 'CHÂN',
    label_vi: 'Chân',
    category: 'region',
    confidence: 0.9,
    maps_to: { field: 'pain.body_regions', code: 'LEG_L' },
  },
  {
    gloss: 'VAI',
    label_vi: 'Vai',
    category: 'region',
    confidence: 0.92,
    maps_to: { field: 'pain.body_regions', code: 'UPPER_BACK' },
  },
  {
    gloss: 'RĂNG',
    label_vi: 'Răng',
    category: 'region',
    confidence: 0.93,
    maps_to: { field: 'pain.body_regions', code: 'HEAD' },
  },
  {
    gloss: 'MẮT',
    label_vi: 'Mắt',
    category: 'region',
    confidence: 0.94,
    maps_to: { field: 'pain.body_regions', code: 'HEAD' },
  },
  {
    gloss: 'TAI',
    label_vi: 'Tai',
    category: 'region',
    confidence: 0.93,
    maps_to: { field: 'pain.body_regions', code: 'HEAD' },
  },
  {
    gloss: 'GÁY',
    label_vi: 'Gáy',
    category: 'region',
    confidence: 0.92,
    maps_to: { field: 'pain.body_regions', code: 'NECK' },
  },
  {
    gloss: 'ĐẦU-GỐI',
    label_vi: 'Đầu gối',
    category: 'region',
    confidence: 0.9,
    maps_to: { field: 'pain.body_regions', code: 'LEG_L' },
  },
  {
    gloss: 'CỔ-TAY',
    label_vi: 'Cổ tay',
    category: 'region',
    confidence: 0.91,
    maps_to: { field: 'pain.body_regions', code: 'HAND_R' },
  },
  {
    gloss: 'HÔNG',
    label_vi: 'Hông',
    category: 'region',
    confidence: 0.89,
    maps_to: { field: 'pain.body_regions', code: 'LOWER_BACK' },
  },
  {
    gloss: 'MÔNG',
    label_vi: 'Mông',
    category: 'region',
    confidence: 0.88,
    maps_to: { field: 'pain.body_regions', code: 'ABDOMEN_LOWER' },
  },

  // 3. Nhóm Thời gian (Time & Time Unit) -> maps_to pain.onset & time_unit
  {
    gloss: 'HÔM-NAY',
    label_vi: 'Hôm nay',
    category: 'time',
    confidence: 0.87,
    maps_to: { field: 'pain.onset', value: 0, unit: 'day' },
  },
  {
    gloss: 'HÔM-QUA',
    label_vi: 'Hôm qua',
    category: 'time',
    confidence: 0.86,
    maps_to: { field: 'pain.onset', value: 1, unit: 'day' },
  },
  {
    gloss: 'SÁNG',
    label_vi: 'Sáng',
    category: 'time',
    confidence: 0.85,
    maps_to: { field: 'pain.onset', value: 0, unit: 'day' },
  },
  {
    gloss: 'TỐI',
    label_vi: 'Tối',
    category: 'time',
    confidence: 0.85,
    maps_to: { field: 'pain.onset', value: 0, unit: 'day' },
  },
  {
    gloss: 'TUẦN-TRƯỚC',
    label_vi: 'Tuần trước',
    category: 'time',
    confidence: 0.84,
    maps_to: { field: 'pain.onset', value: 7, unit: 'day' },
  },
  {
    gloss: 'GIỜ',
    label_vi: 'Giờ',
    category: 'time_unit',
    confidence: 0.92,
    maps_to: { field: 'time_unit', unit: 'hour' },
  },
  {
    gloss: 'NGÀY',
    label_vi: 'Ngày',
    category: 'time_unit',
    confidence: 0.88,
    maps_to: { field: 'time_unit', unit: 'day' },
  },
  {
    gloss: 'LIÊN-TỤC',
    label_vi: 'Đau liên tục',
    category: 'time',
    confidence: 0.88,
    maps_to: { field: 'pain.onset', value: 0, unit: 'day' },
  },
  {
    gloss: 'TỪNG-CƠN',
    label_vi: 'Đau từng cơn',
    category: 'time',
    confidence: 0.87,
    maps_to: { field: 'pain.onset', value: 0, unit: 'day' },
  },
  {
    gloss: 'VỪA-MỚI',
    label_vi: 'Vừa mới bị',
    category: 'time',
    confidence: 0.89,
    maps_to: { field: 'pain.onset', value: 1, unit: 'hour' },
  },

  // 4. Nhóm Mức độ & Số đếm (Severity & Numbers) -> maps_to pain.severity & number
  {
    gloss: '1',
    label_vi: 'Mức 1',
    category: 'severity',
    confidence: 0.95,
    maps_to: { field: 'pain.severity', value: 1 },
  },
  {
    gloss: '2',
    label_vi: 'Mức 2',
    category: 'severity',
    confidence: 0.94,
    maps_to: { field: 'pain.severity', value: 2 },
  },
  {
    gloss: '3',
    label_vi: 'Mức 3',
    category: 'severity',
    confidence: 0.93,
    maps_to: { field: 'pain.severity', value: 3 },
  },
  {
    gloss: '4',
    label_vi: 'Mức 4',
    category: 'severity',
    confidence: 0.92,
    maps_to: { field: 'pain.severity', value: 4 },
  },
  {
    gloss: '5',
    label_vi: 'Mức 5',
    category: 'severity',
    confidence: 0.91,
    maps_to: { field: 'pain.severity', value: 5 },
  },
  {
    gloss: '6',
    label_vi: 'Mức 6',
    category: 'severity',
    confidence: 0.9,
    maps_to: { field: 'pain.severity', value: 6 },
  },
  {
    gloss: '7',
    label_vi: 'Mức 7',
    category: 'severity',
    confidence: 0.89,
    maps_to: { field: 'pain.severity', value: 7 },
  },
  {
    gloss: '8',
    label_vi: 'Mức 8',
    category: 'severity',
    confidence: 0.88,
    maps_to: { field: 'pain.severity', value: 8 },
  },
  {
    gloss: '9',
    label_vi: 'Mức 9',
    category: 'severity',
    confidence: 0.87,
    maps_to: { field: 'pain.severity', value: 9 },
  },
  {
    gloss: '10',
    label_vi: 'Mức 10',
    category: 'severity',
    confidence: 0.86,
    maps_to: { field: 'pain.severity', value: 10 },
  },
  {
    gloss: 'HAI',
    label_vi: 'Hai (2)',
    category: 'number',
    confidence: 0.89,
    maps_to: { field: 'number', value: 2 },
  },
  {
    gloss: 'NẶNG',
    label_vi: 'Nặng / Nhiều',
    category: 'severity',
    confidence: 0.9,
    maps_to: { field: 'pain.severity', value: 8 },
  },
  {
    gloss: 'NHẸ',
    label_vi: 'Ít / Nhẹ',
    category: 'severity',
    confidence: 0.88,
    maps_to: { field: 'pain.severity', value: 2 },
  },

  // 5. Nhóm Định từ & Dị ứng (Modifier & Allergy)
  {
    gloss: 'CÓ',
    label_vi: 'Có',
    category: 'modifier',
    confidence: 0.95,
    maps_to: { field: 'modifier', value: true },
  },
  {
    gloss: 'KHÔNG',
    label_vi: 'Không',
    category: 'modifier',
    confidence: 0.93,
    maps_to: { field: 'modifier', value: false },
  },
  {
    gloss: 'DỊ-ỨNG',
    label_vi: 'Dị ứng',
    category: 'allergy',
    confidence: 0.89,
    maps_to: { field: 'allergy.has_allergy', value: true },
  },
  {
    gloss: 'THUỐC',
    label_vi: 'Thuốc',
    category: 'allergy',
    confidence: 0.91,
    maps_to: { field: 'allergy.category', value: 'drug' },
  },
  {
    gloss: 'KHÁM',
    label_vi: 'Khám bệnh',
    category: 'modifier',
    confidence: 0.94,
    maps_to: { field: 'chief_complaint', code: 'CHECKUP' },
  },
];

export class MockRecognizer implements GlossRecognizer {
  private active = false;
  private listeners: Set<(gloss: RecognizedGloss) => void> = new Set();
  private scenarioTimer: number | null = null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async start(_videoElement?: HTMLVideoElement | null): Promise<void> {
    this.active = true;
  }

  stop(): void {
    this.active = false;
    if (this.scenarioTimer !== null) {
      window.clearTimeout(this.scenarioTimer);
      this.scenarioTimer = null;
    }
  }

  onGloss(callback: (gloss: RecognizedGloss) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  isRecognizing(): boolean {
    return this.active;
  }

  simulateGloss(glossCode: string, confidence = 0.9): void {
    if (!this.active) return;
    const base = ONTOLOGY_GLOSSES.find((g) => g.gloss === glossCode);
    const item: RecognizedGloss = base
      ? { ...base, confidence, timestamp: Date.now() }
      : {
          gloss: glossCode,
          label_vi: glossCode,
          category: 'symptom',
          confidence,
          timestamp: Date.now(),
        };

    this.listeners.forEach((fn) => fn(item));
  }

  runScenario(scenarioName: 'chest_pain_2h' | 'emergency_shortness_breath' | 'low_confidence_demo'): void {
    if (!this.active) return;

    if (scenarioName === 'chest_pain_2h') {
      const sequence = ['ĐAU', 'NGỰC', 'HAI', 'GIỜ', 'NẶNG'];
      sequence.forEach((gloss, idx) => {
        window.setTimeout(() => {
          if (this.active) {
            this.simulateGloss(gloss, 0.92 - idx * 0.02);
          }
        }, idx * 600);
      });
    } else if (scenarioName === 'emergency_shortness_breath') {
      const sequence = ['KHÓ-THỞ', 'NGỰC', 'ĐAU'];
      sequence.forEach((gloss, idx) => {
        window.setTimeout(() => {
          if (this.active) {
            this.simulateGloss(gloss, 0.95);
          }
        }, idx * 700);
      });
    } else if (scenarioName === 'low_confidence_demo') {
      // Simulates an ambiguous gesture with confidence < 0.6
      window.setTimeout(() => {
        if (this.active) {
          this.simulateGloss('BỤNG', 0.45);
        }
      }, 300);
    }
  }
}

export const mockRecognizer = new MockRecognizer();
