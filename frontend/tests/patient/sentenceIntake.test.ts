import { expect, it } from 'vitest';
import { readIntakeSuggestion, sentencePatch } from '../../src/features/patient/sentenceIntake';
import type { SymptomsData } from '../../src/features/patient/components/SymptomsStep';
import type { VSLPredictionResponse } from '../../src/services/api/rest';
import type { IntakeSuggestion } from '../../src/types/vsl';

const suggestion: IntakeSuggestion = { chief_complaint_code: 'PAIN', pain_present: true, body_regions: ['CHEST'] };
const previous: SymptomsData = { chiefComplaintCode: 'PAIN', chiefComplaintLabel: 'Đau', hasPain: true,
  bodyRegions: ['HEAD'], severity: 8, onsetValue: 2, onsetUnit: 'day', extraSymptoms: ['COUGH'] };
const response = (value: unknown, overrides = {}) => ({ success: true, gloss: 'ĐAU', confidence: .9,
  model_source: 'vsl_v2_learned_translation', intake_suggestion: value, ...overrides }) as VSLPredictionResponse;

it('accepts a controlled sentence bundle and rejects a conflicting or expanded response', () => {
  expect(readIntakeSuggestion(response(suggestion))).toEqual(suggestion);
  for (const value of [null, {}, {...suggestion, pain_present:false}, {...suggestion, severity:8},
    {...suggestion, body_regions:['UNKNOWN']}, {...suggestion, body_regions:['HEAD','CHEST']},
    {...suggestion, chief_complaint_code:'COUGH'}, {...suggestion, chief_complaint_code:'toString'}]) {
    expect(readIntakeSuggestion(response(value))).toBeNull();
  }
  expect(readIntakeSuggestion(response(suggestion, {gloss:'HO'}))).toBeNull();
  expect(readIntakeSuggestion(response(suggestion, {confidence:.69}))).toBeNull();
});

it('replaces associated fields together, clears old detail and preserves unrelated symptoms', () => {
  expect(sentencePatch(previous, suggestion)).toEqual({chiefComplaintCode:'PAIN', chiefComplaintLabel:'Đau / Nhức',
    hasPain:true, bodyRegions:['CHEST'], severity:null, onsetValue:null, onsetUnit:null, extraSymptoms:['COUGH']});
  expect(sentencePatch({...previous, bodyRegions:['CHEST']}, suggestion)).not.toHaveProperty('severity');
});

it('does not interpret a cough statement as absence of pain or reuse an old pain location', () => {
  const patch=sentencePatch(previous, {chief_complaint_code:'COUGH', pain_present:null, body_regions:[]});
  expect(patch).toMatchObject({hasPain:null, bodyRegions:[], severity:null, onsetValue:null,
    onsetUnit:null, chiefComplaintCode:'COUGH', extraSymptoms:[]});
});
