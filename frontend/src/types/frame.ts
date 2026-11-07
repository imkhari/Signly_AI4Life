export type ModalityType = 'touch' | 'text' | 'vsl_gloss' | 'voice';
export type OnsetUnit = 'minute' | 'hour' | 'day' | 'week' | 'month';
export type CourseType = 'sudden' | 'gradual' | 'constant' | 'comes_and_goes';
export type AllergyCategory = 'drug' | 'food' | 'other';
export type AlertLevel = 'info' | 'warning' | 'critical';
export type SessionStatus =
  | 'created'
  | 'paired'
  | 'collecting'
  | 'summary_ready'
  | 'patient_confirmed'
  | 'nurse_verified'
  | 'exported'
  | 'reset';

export interface ChiefComplaint {
  code?: string | null;
  label_vi?: string | null;
  free_text?: string | null;
}

export interface Onset {
  value?: number | null;
  unit?: OnsetUnit | null;
}

export interface Pain {
  present?: boolean | null;
  severity?: number | null; // 0..10
  body_regions: string[];
  onset?: Onset | null;
  course?: CourseType | null;
}

export interface AllergyItem {
  category: AllergyCategory;
  name: string;
}

export interface Allergy {
  has_allergy?: boolean | 'unsure' | null;
  items: AllergyItem[];
}

export interface Alert {
  code: string;
  level: AlertLevel;
  field?: string | null;
  message_vi: string;
  needs_nurse_ack: boolean;
}

export interface SemanticFrame {
  schema_version: string;
  session_id: string;
  modality: string[];
  chief_complaint: ChiefComplaint;
  pain: Pain;
  allergy: Allergy;
  extra_symptoms: string[];
  uncertain_fields: string[];
  field_confidence: Record<string, number>;
  conflicts: Alert[];
  missing_fields: string[];
}

