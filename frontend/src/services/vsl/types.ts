export interface RecognizedGloss {
  gloss: string;
  label_vi: string;
  category: 'symptom' | 'region' | 'allergy' | 'modifier' | 'time' | 'number' | 'time_unit' | 'severity';
  confidence: number; // 0.0 to 1.0
  timestamp?: number;
  maps_to?: {
    field: string;
    code?: string;
    value?: unknown;
    unit?: string;
  };
}

export interface GlossRecognizer {
  start(videoElement?: HTMLVideoElement | null): Promise<void>;
  stop(): void;
  onGloss(callback: (gloss: RecognizedGloss) => void): () => void;
  isRecognizing(): boolean;
}
