import { GlossRecognizer, RecognizedGloss } from './types';

export const ONTOLOGY_GLOSSES: RecognizedGloss[] = [
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
    gloss: 'ĐẦU',
    label_vi: 'Đầu',
    category: 'region',
    confidence: 0.91,
    maps_to: { field: 'pain.body_regions', code: 'HEAD' },
  },
  {
    gloss: 'KHÓ-THỞ',
    label_vi: 'Khó thở',
    category: 'symptom',
    confidence: 0.96,
    maps_to: { field: 'chief_complaint', code: 'BREATH_DIFFICULTY' },
  },
  {
    gloss: 'DỊ-ỨNG',
    label_vi: 'Dị ứng',
    category: 'allergy',
    confidence: 0.89,
    maps_to: { field: 'allergy.has_allergy', value: true },
  },
  {
    gloss: 'KHÔNG',
    label_vi: 'Không',
    category: 'modifier',
    confidence: 0.93,
    maps_to: { field: 'modifier', value: false },
  },
  {
    gloss: 'CÓ',
    label_vi: 'Có',
    category: 'modifier',
    confidence: 0.95,
    maps_to: { field: 'modifier', value: true },
  },
  {
    gloss: 'HÔM-NAY',
    label_vi: 'Hôm nay',
    category: 'time',
    confidence: 0.87,
    maps_to: { field: 'pain.onset', value: 0, unit: 'day' },
  },
  {
    gloss: 'HAI',
    label_vi: 'Hai (2)',
    category: 'number',
    confidence: 0.89,
    maps_to: { field: 'number', value: 2 },
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
    gloss: 'NẶNG',
    label_vi: 'Nặng / Nhiều',
    category: 'severity',
    confidence: 0.9,
    maps_to: { field: 'pain.severity', value: 8 },
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
