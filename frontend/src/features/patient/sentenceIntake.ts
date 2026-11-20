import type { IntakeSuggestion } from '../../types/vsl';
import type { SymptomsData } from './components/SymptomsStep';
import type { VSLPredictionResponse } from '../../services/api/rest';

export const SENTENCE_COMPLAINTS = {
  PAIN: { gloss: 'ĐAU', label: 'Đau / Nhức' },
  COUGH: { gloss: 'HO', label: 'Ho' },
  FEVER: { gloss: 'SỐT', label: 'Sốt' },
  BREATH_DIFFICULTY: { gloss: 'KHÓ-THỞ', label: 'Khó thở' },
};
export const SENTENCE_REGIONS: Record<IntakeSuggestion['body_regions'][number], string> = {
  HEAD: 'Đầu', CHEST: 'Ngực', ABDOMEN_UPPER: 'Bụng trên',
  ABDOMEN_LOWER: 'Bụng dưới', NECK: 'Cổ / Họng', LOWER_BACK: 'Lưng dưới',
};

// Fail closed even if a malformed response reaches the browser.
export function readIntakeSuggestion(response: VSLPredictionResponse): IntakeSuggestion | null {
  const value = response.intake_suggestion;
  if (!response.success || response.model_source !== 'vsl_v2_learned_translation' ||
    !Number.isFinite(response.confidence) || response.confidence < .7 || response.confidence > 1 ||
    !value || typeof value !== 'object' || Object.keys(value).sort().join(',') !==
      'body_regions,chief_complaint_code,pain_present' ||
    !Object.prototype.hasOwnProperty.call(SENTENCE_COMPLAINTS, value.chief_complaint_code) ||
    SENTENCE_COMPLAINTS[value.chief_complaint_code].gloss !== response.gloss ||
    !Array.isArray(value.body_regions) || value.body_regions.length > 1 ||
    value.body_regions.some(code => !Object.prototype.hasOwnProperty.call(SENTENCE_REGIONS, code))) return null;
  if (value.chief_complaint_code === 'PAIN' ? value.pain_present !== true :
    value.pain_present !== null || value.body_regions.length !== 0) return null;
  return { ...value, body_regions: [...value.body_regions] };
}

export function sentencePatch(data: SymptomsData, value: IntakeSuggestion): Partial<SymptomsData> {
  const changed = data.chiefComplaintCode !== value.chief_complaint_code ||
    data.hasPain !== value.pain_present ||
    [...data.bodyRegions].sort().join(',') !== [...value.body_regions].sort().join(',');
  return {
    chiefComplaintCode: value.chief_complaint_code,
    chiefComplaintLabel: SENTENCE_COMPLAINTS[value.chief_complaint_code].label,
    hasPain: value.pain_present,
    bodyRegions: [...value.body_regions],
    extraSymptoms: (data.extraSymptoms || []).filter(code => code !== value.chief_complaint_code),
    ...(changed ? { severity: null, onsetValue: null, onsetUnit: null } : {}),
  };
}
