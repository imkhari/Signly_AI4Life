import { Alert, ModalityType, SemanticFrame } from './frame';
import { TriageSummary, ValidatorResult } from './summary';

export type EventType =
  | 'SESSION_JOINED'
  | 'INPUT_UPDATED'
  | 'SUMMARY_REQUESTED'
  | 'SUMMARY_READY'
  | 'PATIENT_CONFIRMED'
  | 'NURSE_QUESTION'
  | 'NURSE_VERIFIED'
  | 'RECORD_EXPORTED'
  | 'REQUEST_INTERPRETER'
  | 'INTERPRETER_STATUS'
  | 'SESSION_RESET'
  | 'PING'
  | 'PONG'
  | 'ERROR';

export type EventSource = 'patient' | 'nurse' | 'doctor' | 'server';

export interface EventEnvelope<T = unknown> {
  event: EventType;
  session_id: string;
  seq: number;
  ts: string;
  source: EventSource;
  payload: T;
}

export interface SessionJoinedPayload {
  role: 'patient' | 'nurse' | 'doctor';
  pairing_code?: string | null;
}

export interface InputUpdatedClientPayload {
  step: string;
  modality?: ModalityType;
  patch: Record<string, unknown>;
  raw_input?: Record<string, unknown> | null;
  reply_to?: string | null;
}

export interface InputUpdatedServerPayload {
  frame: SemanticFrame;
  alerts: Alert[];
  completeness: number;
  step: string;
}

export interface SummaryRequestedPayload {
  language: string;
  reading_level: string;
}

export interface SummaryReadyPayload {
  summary: TriageSummary;
  nl_text_vi: string;
  nl_source: 'llm' | 'fallback_template';
  fallback_reason?: 'timeout' | 'llm_error' | 'validator_blocked' | null;
  validator: ValidatorResult;
  tts_text: string;
}

export interface PatientConfirmedPayload {
  decision: 'confirmed' | 'needs_edit' | 'unsure';
  corrections: string[];
  confirmed_fields: string[];
}

export interface NurseQuestionPayload {
  question_id: string;
  template_code: string;
  text_vi: string;
  answer_type: 'yes_no_unsure' | 'single_choice' | 'free_text';
  icon?: string | null;
}

export interface NurseVerifiedPayload {
  intake_code: string;
  queue_number: number;
  verified_by: string;
  notes?: string | null;
  acknowledged_alerts: string[];
}

export interface RecordExportedPayload {
  format: 'pdf' | 'print' | 'json';
  include: string[];
  target: 'doctor';
}

export interface RequestInterpreterPayload {
  reason:
    | 'low_confidence'
    | 'patient_unsure'
    | 'nurse_request'
    | 'conflict_unresolved'
    | 'emergency_flag';
  requested_by: 'patient' | 'nurse';
  urgency: 'normal' | 'urgent';
  language: 'VSL';
}

export interface InterpreterStatusPayload {
  status: 'requested' | 'connecting' | 'connected' | 'ended';
  estimated_wait_seconds?: number | null;
}

export interface SessionResetPayload {
  reason: 'completed' | 'timeout' | 'manual' | 'error';
  wipe: boolean;
}

export interface ErrorPayload {
  code:
    | 'VALIDATION_ERROR'
    | 'SESSION_NOT_FOUND'
    | 'FORBIDDEN_ROLE'
    | 'LLM_FALLBACK_USED'
    | 'RATE_LIMITED';
  message_vi: string;
  detail?: Record<string, unknown>;
}

