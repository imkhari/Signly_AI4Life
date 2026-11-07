import { OntologyResponse } from '../../types';

const API_BASE = '/api';

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
}

export const restApi = new RestApiClient();

