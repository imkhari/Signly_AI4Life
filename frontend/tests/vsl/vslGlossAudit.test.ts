import { describe, it, expect } from 'vitest';
import { ONTOLOGY_GLOSSES } from '../../src/services/vsl/MockRecognizer';
import { GLOSS_METADATA } from '../../src/services/vsl/LiveApiRecognizer';
import vslGlossJson from '../../../backend/app/domain/ontology/vsl_gloss.json';

// Định nghĩa tập hợp mã hợp lệ theo ontology AI4Care
const VALID_CHIEF_COMPLAINT_CODES = new Set([
  'PAIN',
  'FEVER',
  'COUGH',
  'BREATH_DIFFICULTY',
  'DIZZY',
  'NAUSEA_VOMIT',
  'INJURY',
  'BLEED',
  'RASH',
  'CHECKUP',
  'OTHER',
]);

const VALID_BODY_REGION_CODES = new Set([
  'HEAD',
  'NECK',
  'CHEST',
  'UPPER_BACK',
  'ABDOMEN_UPPER',
  'ABDOMEN_LOWER',
  'LOWER_BACK',
  'ARM_L',
  'ARM_R',
  'HAND_L',
  'HAND_R',
  'LEG_L',
  'LEG_R',
  'FOOT_L',
  'FOOT_R',
]);

describe('VSL Gloss Audit and Cross-File Alignment', () => {
  it('ensures no duplicate glosses exist in ONTOLOGY_GLOSSES', () => {
    const glosses = ONTOLOGY_GLOSSES.map((g) => g.gloss);
    const unique = new Set(glosses);
    expect(glosses.length).toBe(unique.size);
  });

  it('validates every ontology gloss has legitimate maps_to conforming to domain schema', () => {
    for (const item of ONTOLOGY_GLOSSES) {
      expect(item.gloss).toBeDefined();
      expect(item.label_vi).toBeDefined();
      expect(item.category).toBeDefined();

      if (item.maps_to) {
        const { field, code, value, unit } = item.maps_to;

        if (field === 'chief_complaint') {
          expect(VALID_CHIEF_COMPLAINT_CODES.has(code!)).toBe(true);
        } else if (field === 'pain.body_regions') {
          expect(VALID_BODY_REGION_CODES.has(code!)).toBe(true);
        } else if (field === 'pain.severity') {
          expect(typeof value).toBe('number');
          expect((value as number) >= 0 && (value as number) <= 10).toBe(true);
        } else if (field === 'pain.onset') {
          expect(['minute', 'hour', 'day', 'week', 'month']).toContain(unit);
        } else if (field === 'allergy.has_allergy' || field === 'modifier') {
          expect(typeof value).toBe('boolean');
        }
      }
    }
  });

  it('verifies HO is strictly mapped to COUGH and not corrupted', () => {
    const ho = ONTOLOGY_GLOSSES.find((g) => g.gloss === 'HO');
    expect(ho).toBeDefined();
    expect(ho?.category).toBe('symptom');
    expect(ho?.maps_to?.code).toBe('COUGH');
  });

  it('verifies severity numbers are bounded between 0 and 10', () => {
    const severities = ONTOLOGY_GLOSSES.filter((g) => g.category === 'severity');
    for (const s of severities) {
      if (s.maps_to?.field === 'pain.severity') {
        const val = s.maps_to.value as number;
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(10);
      }
    }
  });

  it('cross-checks 60 glosses consistency across vsl_gloss.json, MockRecognizer, and LiveApiRecognizer', () => {
    const ontologyGlosses = new Set(vslGlossJson.map((item) => item.gloss));
    const mockGlosses = new Set(ONTOLOGY_GLOSSES.map((item) => item.gloss));
    const liveApiGlosses = new Set(Object.keys(GLOSS_METADATA));

    // Cả 3 nguồn đều phải có chính xác 60 gloss
    expect(ontologyGlosses.size).toBe(60);
    expect(mockGlosses.size).toBe(60);
    expect(liveApiGlosses.size).toBe(60);

    // Không có gloss nào thiếu hoặc thừa giữa MockRecognizer và Ontology
    const missingInMock = [...ontologyGlosses].filter((g) => !mockGlosses.has(g));
    const extraInMock = [...mockGlosses].filter((g) => !ontologyGlosses.has(g));
    expect(missingInMock).toEqual([]);
    expect(extraInMock).toEqual([]);

    // Không có gloss nào thiếu hoặc thừa giữa LiveApiRecognizer và Ontology
    const missingInLiveApi = [...ontologyGlosses].filter((g) => !liveApiGlosses.has(g));
    const extraInLiveApi = [...liveApiGlosses].filter((g) => !ontologyGlosses.has(g));
    expect(missingInLiveApi).toEqual([]);
    expect(extraInLiveApi).toEqual([]);

    // Kiểm tra category và maps_to đồng bộ 100% giữa LiveApiRecognizer và Ontology
    const ontologyMap = new Map(vslGlossJson.map((item) => [item.gloss, item]));
    for (const [gloss, meta] of Object.entries(GLOSS_METADATA)) {
      const ont = ontologyMap.get(gloss);
      expect(ont).toBeDefined();
      expect(meta.category).toBe(ont?.category);
      expect(meta.maps_to).toEqual(ont?.maps_to);
    }
  });
});
