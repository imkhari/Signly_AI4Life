export interface IntakeSuggestion {
  chief_complaint_code: 'PAIN' | 'COUGH' | 'FEVER' | 'BREATH_DIFFICULTY';
  pain_present: true | null;
  body_regions: ('HEAD' | 'CHEST' | 'ABDOMEN_UPPER' | 'ABDOMEN_LOWER' | 'NECK' | 'LOWER_BACK')[];
}
