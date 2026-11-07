import {
  EventEnvelope,
  EventType,
  InputUpdatedClientPayload,
  InputUpdatedServerPayload,
  SemanticFrame,
  SummaryReadyPayload,
  TriageSummary,
} from '../types';

export class FakeWebSocketServer {
  private listeners: Set<(event: EventEnvelope) => void> = new Set();
  private seq = 0;
  private currentFrame: SemanticFrame;

  constructor() {
    this.currentFrame = this.createEmptyFrame('fake-session-001');
  }

  private createEmptyFrame(sessionId: string): SemanticFrame {
    return {
      schema_version: '1.0',
      session_id: sessionId,
      modality: ['touch'],
      chief_complaint: { code: null, label_vi: null, free_text: null },
      pain: { present: null, severity: null, body_regions: [] },
      allergy: { has_allergy: null, items: [] },
      extra_symptoms: [],
      uncertain_fields: [],
      field_confidence: {},
      conflicts: [],
      missing_fields: ['chief_complaint.code', 'pain.present', 'allergy.has_allergy'],
    };
  }

  onMessage(callback: (event: EventEnvelope) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit(event: EventType, source: 'server' | 'patient' | 'nurse', payload: unknown): void {
    this.seq++;
    const envelope: EventEnvelope = {
      event,
      session_id: this.currentFrame.session_id,
      seq: this.seq,
      ts: new Date().toISOString(),
      source,
      payload,
    };
    this.listeners.forEach((fn) => fn(envelope));
  }

  handleClientMessage(event: EventType, payload: unknown): void {
    if (event === 'PING') {
      this.emit('PONG', 'server', {});
      return;
    }

    if (event === 'INPUT_UPDATED') {
      const p = payload as InputUpdatedClientPayload;
      // Merge patch
      if (p.patch.chief_complaint) {
        this.currentFrame.chief_complaint = {
          ...this.currentFrame.chief_complaint,
          ...(p.patch.chief_complaint as Record<string, unknown>),
        };
      }
      if (p.patch.pain) {
        this.currentFrame.pain = {
          ...this.currentFrame.pain,
          ...(p.patch.pain as Record<string, unknown>),
        };
      }
      if (p.patch.allergy) {
        this.currentFrame.allergy = {
          ...this.currentFrame.allergy,
          ...(p.patch.allergy as Record<string, unknown>),
        };
      }

      const serverPayload: InputUpdatedServerPayload = {
        frame: this.currentFrame,
        alerts: [],
        completeness: 0.75,
        step: p.step,
      };
      this.emit('INPUT_UPDATED', 'server', serverPayload);
      return;
    }

    if (event === 'SUMMARY_REQUESTED') {
      setTimeout(() => {
        const mockSummary: TriageSummary = {
          session_id: this.currentFrame.session_id,
          intake_code: 'AC-0042',
          queue_number: null,
          status: 'summary_ready',
          frame: this.currentFrame,
          nl_text_vi: 'Bạn bị đau ở ngực, mức 7/10. Bạn không có dị ứng.',
          nl_source: 'llm',
          fallback_reason: null,
          validator: { passed: true, violations: [] },
          alerts: [],
          nurse_view: {
            confirmed: [
              { label_vi: 'Lý do khám', detail: 'Đau ngực' },
              { label_vi: 'Mức đau', detail: '7/10' },
            ],
            needs_attention: [],
          },
          flags: { interpreter_requested: false, emergency_flag: false },
          timestamps: { created: new Date().toISOString() },
        };

        const readyPayload: SummaryReadyPayload = {
          summary: mockSummary,
          nl_text_vi: mockSummary.nl_text_vi,
          nl_source: 'llm',
          fallback_reason: null,
          validator: mockSummary.validator,
          tts_text: mockSummary.nl_text_vi,
        };
        this.emit('SUMMARY_READY', 'server', readyPayload);
      }, 300);
      return;
    }

    if (event === 'PATIENT_CONFIRMED') {
      this.emit('PATIENT_CONFIRMED', 'patient', payload);
      return;
    }

    if (event === 'NURSE_VERIFIED') {
      this.emit('NURSE_VERIFIED', 'nurse', payload);
      return;
    }

    if (event === 'REQUEST_INTERPRETER') {
      this.emit('REQUEST_INTERPRETER', 'patient', payload);
      setTimeout(() => {
        this.emit('INTERPRETER_STATUS', 'server', {
          status: 'connecting',
          estimated_wait_seconds: 30,
        });
      }, 500);
      return;
    }

    if (event === 'SESSION_RESET') {
      this.currentFrame = this.createEmptyFrame('fake-session-002');
      this.emit('SESSION_RESET', 'server', { reason: 'completed', wipe: true });
      return;
    }
  }
}

export const fakeServer = new FakeWebSocketServer();

