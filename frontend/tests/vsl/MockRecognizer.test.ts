import { describe, it, expect, vi } from 'vitest';
import { MockRecognizer, ONTOLOGY_GLOSSES } from '../../src/services/vsl/MockRecognizer';
import { RecognizedGloss } from '../../src/services/vsl/types';

describe('MockRecognizer', () => {
  it('contains the 15 seed ontology glosses', () => {
    expect(ONTOLOGY_GLOSSES.length).toBe(15);
    const codes = ONTOLOGY_GLOSSES.map((g) => g.gloss);
    expect(codes).toContain('ĐAU');
    expect(codes).toContain('NGỰC');
    expect(codes).toContain('BỤNG');
    expect(codes).toContain('ĐẦU');
    expect(codes).toContain('KHÓ-THỞ');
    expect(codes).toContain('SỐT');
    expect(codes).toContain('HAI');
    expect(codes).toContain('GIỜ');
  });

  it('emits glosses when active and calls listeners', async () => {
    const recognizer = new MockRecognizer();
    await recognizer.start();
    expect(recognizer.isRecognizing()).toBe(true);

    const emitted: RecognizedGloss[] = [];
    const unsub = recognizer.onGloss((g) => emitted.push(g));

    recognizer.simulateGloss('ĐAU', 0.95);
    expect(emitted.length).toBe(1);
    expect(emitted[0].gloss).toBe('ĐAU');
    expect(emitted[0].confidence).toBe(0.95);
    expect(emitted[0].label_vi).toBe('Đau');

    unsub();
    recognizer.simulateGloss('NGỰC', 0.9);
    expect(emitted.length).toBe(1); // Unsubscribed

    recognizer.stop();
    expect(recognizer.isRecognizing()).toBe(false);
  });

  it('runs low confidence scenario and emits gloss with confidence < 0.6', async () => {
    vi.useFakeTimers();
    const recognizer = new MockRecognizer();
    await recognizer.start();

    const emitted: RecognizedGloss[] = [];
    recognizer.onGloss((g) => emitted.push(g));

    recognizer.runScenario('low_confidence_demo');
    vi.advanceTimersByTime(500);

    expect(emitted.length).toBe(1);
    expect(emitted[0].gloss).toBe('BỤNG');
    expect(emitted[0].confidence).toBeLessThan(0.6);

    recognizer.stop();
    vi.useRealTimers();
  });
});
