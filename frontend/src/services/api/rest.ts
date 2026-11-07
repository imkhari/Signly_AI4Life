import { OntologyResponse } from '../../types';

const API_BASE = (import.meta.env?.VITE_API_BASE as string) || '/api';

export interface CreateSessionResult {
  session_id: string;
  pairing_code: string;
  token_nurse: string;
}

export interface JoinSessionResult {
  session_id: string;
  token_patient: string;
}

export interface HealthResult {
  status: string;
  llm_mode: string;
}

export interface HandLandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface HandData {
  handedness: 'Right' | 'Left';
  landmarks: HandLandmarkPoint[];
}

export interface VSLTopK {
  gloss: string;
  confidence: number;
}

export interface VSLPredictionResponse {
  success: boolean;
  gloss: string;
  token?: string | null;
  secondary_token?: string | null;
  tokens?: string[];
  label_vi?: string | null;
  confidence: number;
  hand_count: number;
  total_fingers: number;
  is_transitioning: boolean;
  motion_type: string;
  suggested_next_step?: string | null;
  top_k: VSLTopK[];
  latency_ms: number;
  model_source: string;
}

export class RestApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  async createSession(): Promise<CreateSessionResult> {
    const res = await fetch(`${this.baseUrl}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Failed to create session: ${res.statusText}`);
    }
    return (await res.json()) as CreateSessionResult;
  }

  async joinSession(pairingCode: string): Promise<JoinSessionResult> {
    const res = await fetch(`${this.baseUrl}/sessions/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pairing_code: pairingCode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail?.message_vi || 'Mã ghép cặp không hợp lệ hoặc đã hết hạn');
    }
    return (await res.json()) as JoinSessionResult;
  }

  async getOntology(): Promise<OntologyResponse> {
    const res = await fetch(`${this.baseUrl}/ontology`);
    if (!res.ok) {
      throw new Error('Failed to load ontology');
    }
    return (await res.json()) as OntologyResponse;
  }

  async getHealth(): Promise<HealthResult> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) {
      throw new Error('Health check failed');
    }
    return (await res.json()) as HealthResult;
  }

  async forceFallback(
    sessionId: string,
    force: boolean = true
  ): Promise<{ session_id: string; force_fallback: boolean }> {
    const res = await fetch(`${this.baseUrl}/dev/force-fallback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, force }),
    });
    if (!res.ok) {
      throw new Error('Failed to toggle force-fallback');
    }
    return (await res.json()) as { session_id: string; force_fallback: boolean };
  }

  async predictVSL(hands: HandData[], contextStep?: string): Promise<VSLPredictionResponse> {
    const res = await fetch(`${this.baseUrl}/vsl/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hands, context_step: contextStep }),
    });
    if (!res.ok) {
      throw new Error(`VSL prediction failed: ${res.statusText}`);
    }
    return (await res.json()) as VSLPredictionResponse;
  }

  async getVSLVocab(): Promise<{ vocab: string[]; total: number }> {
    const res = await fetch(`${this.baseUrl}/vsl/vocab`);
    if (!res.ok) {
      throw new Error('Failed to load VSL vocabulary');
    }
    return (await res.json()) as { vocab: string[]; total: number };
  }
}

export const restApi = new RestApiClient();

