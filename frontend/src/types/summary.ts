import { Alert, AlertLevel, SemanticFrame, SessionStatus } from './frame';

export interface NurseConfirmedItem {
  label_vi: string;
  detail: string;
}

export interface NurseAttentionItem {
  level: AlertLevel;
  message_vi: string;
}

export interface NurseView {
  confirmed: NurseConfirmedItem[];
  needs_attention: NurseAttentionItem[];
}

export interface Flags {
  interpreter_requested: boolean;
  emergency_flag: boolean;
}

export interface Timestamps {
  created: string;
  patient_confirmed?: string | null;
  nurse_verified?: string | null;
}

export interface ValidatorResult {
  passed: boolean;
  violations: string[];
}

export interface TriageSummary {
  session_id: string;
  intake_code: string;
  queue_number?: number | null;
  status: SessionStatus;
  frame: SemanticFrame;
  nl_text_vi: string;
  nl_source: 'llm' | 'fallback_template';
  fallback_reason?: 'timeout' | 'llm_error' | 'validator_blocked' | null;
  validator: ValidatorResult;
  alerts: Alert[];
  nurse_view: NurseView;
  flags: Flags;
  timestamps: Timestamps;
}

