import { describe, it, expect, beforeEach } from 'vitest';
import { GestureStabilizer } from '../../src/services/vsl/GestureStabilizer';
import { VSLPredictionResponse } from '../../src/services/api/rest';

describe('GestureStabilizer', () => {
  let stabilizer: GestureStabilizer;

  const mockPrediction = (overrides?: Partial<VSLPredictionResponse>): VSLPredictionResponse => ({
    success: true,
    gloss: 'NGỰC',
    label_vi: 'Vùng Ngực',
    confidence: 0.94,
    hand_count: 1,
    total_fingers: 0,
    is_transitioning: false,
    motion_type: 'steady',
    latency_ms: 0.05,
    model_source: 'AI_model',
    top_k: [],
    ...overrides,
  });

  beforeEach(() => {
    stabilizer = new GestureStabilizer({
      minStabilityDurationMs: 800,
      minConfidence: 0.70,
      minStableFrames: 3,
      cooldownMs: 2500,
    });
  });

  it('does not create candidate on short flickers (< 800ms)', () => {
    const t0 = 1000;
    // Frame 1
    const res1 = stabilizer.process(mockPrediction(), t0);
    expect(res1.isStable).toBe(false);
    expect(res1.status).toBe('holding');
    expect(res1.candidate).toBeNull();

    // Frame 2 at 400ms (still < 800ms)
    const res2 = stabilizer.process(mockPrediction(), t0 + 400);
    expect(res2.isStable).toBe(false);
    expect(res2.candidate).toBeNull();
  });

  it('creates candidate when same gloss is held stably for >= 800ms and >= 3 frames', () => {
    const t0 = 1000;
    stabilizer.process(mockPrediction(), t0);
    stabilizer.process(mockPrediction(), t0 + 300);
    stabilizer.process(mockPrediction(), t0 + 600);
    const resFinal = stabilizer.process(mockPrediction(), t0 + 850);

    expect(resFinal.isStable).toBe(true);
    expect(resFinal.status).toBe('stable');
    expect(resFinal.candidate).not.toBeNull();
    expect(resFinal.candidate?.gloss).toBe('NGỰC');
    expect(resFinal.candidate?.label_vi).toBe('Vùng Ngực');
    expect(resFinal.candidate?.stableFrames).toBe(4);
    expect(resFinal.candidate?.durationMs).toBe(850);
  });

  it('rejects predictions with confidence < 0.70 as uncertain', () => {
    const t0 = 1000;
    const res = stabilizer.process(mockPrediction({ confidence: 0.55 }), t0);
    expect(res.isStable).toBe(false);
    expect(res.status).toBe('uncertain');
    expect(res.candidate).toBeNull();
    expect(res.statusMessage).toContain('Chưa chắc chắn');
  });

  it('rejects transitioning or waving gestures as uncertain', () => {
    const t0 = 1000;
    const resTransition = stabilizer.process(
      mockPrediction({ is_transitioning: true, motion_type: 'transitioning' }),
      t0
    );
    expect(resTransition.isStable).toBe(false);
    expect(resTransition.status).toBe('uncertain');
    expect(resTransition.candidate).toBeNull();

    const resWaving = stabilizer.process(
      mockPrediction({ is_transitioning: false, motion_type: 'waving' }),
      t0 + 200
    );
    expect(resWaving.isStable).toBe(false);
    expect(resWaving.status).toBe('uncertain');
    expect(resWaving.candidate).toBeNull();
  });

  it('resets buffer when gloss changes rapidly', () => {
    const t0 = 1000;
    stabilizer.process(mockPrediction({ gloss: 'NGỰC' }), t0);
    stabilizer.process(mockPrediction({ gloss: 'NGỰC' }), t0 + 400);

    // Suddenly changes to 'SỐT'
    const resSwitched = stabilizer.process(mockPrediction({ gloss: 'SỐT', label_vi: 'Sốt nóng' }), t0 + 600);
    expect(resSwitched.candidate).toBeNull();
    expect(resSwitched.currentGloss).toBe('SỐT');
    expect(resSwitched.progressPercent).toBeLessThan(50);
  });

  it('cleans up buffer on reset()', () => {
    const t0 = 1000;
    stabilizer.process(mockPrediction(), t0);
    stabilizer.reset();

    const res = stabilizer.process(mockPrediction(), t0 + 100);
    expect(res.progressPercent).toBeLessThan(50);
    expect(res.candidate).toBeNull();
  });
});
