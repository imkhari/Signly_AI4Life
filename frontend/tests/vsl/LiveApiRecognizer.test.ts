import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LiveApiRecognizer } from '../../src/services/vsl/LiveApiRecognizer';
import { restApi } from '../../src/services/api/rest';

// Mock restApi
vi.mock('../../src/services/api/rest', () => ({
  restApi: {
    predictVSL: vi.fn(),
    getVSLVocab: vi.fn(),
  },
}));

describe('LiveApiRecognizer', () => {
  let recognizer: LiveApiRecognizer;

  beforeEach(() => {
    vi.clearAllMocks();
    recognizer = new LiveApiRecognizer();
  });

  it('starts and stops recognizing', async () => {
    expect(recognizer.isRecognizing()).toBe(false);
    await recognizer.start();
    expect(recognizer.isRecognizing()).toBe(true);
    recognizer.stop();
    expect(recognizer.isRecognizing()).toBe(false);
  });

  it('calls predictVSL API and emits recognized gloss', async () => {
    (restApi.predictVSL as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      gloss: 'NGỰC',
      label_vi: 'Vùng Ngực',
      confidence: 0.95,
      tokens: ['NGỰC'],
      latency_ms: 0.05,
      model_source: 'best_checkpoints.pth',
    });

    await recognizer.start();

    const received: string[] = [];
    recognizer.onGloss((g) => {
      received.push(g.gloss);
    });

    const mockHands = [{ handedness: 'Right' as const, landmarks: [{ x: 0.5, y: 0.65 }] }];
    const res = await recognizer.predictHands(mockHands, 'location');

    expect(restApi.predictVSL).toHaveBeenCalledWith(mockHands, 'location');
    expect(res).not.toBeNull();
    expect(res?.gloss).toBe('NGỰC');
    expect(res?.category).toBe('region');
    expect(received).toEqual(['NGỰC']);
  });

  it('handles triggerDemoGesture with chest pain gesture', async () => {
    (restApi.predictVSL as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: true,
      gloss: 'NGỰC',
      label_vi: 'Vùng Ngực (Tim / Phổi)',
      confidence: 0.94,
      tokens: ['NGỰC'],
      latency_ms: 0.04,
      model_source: 'AI_model',
    });

    await recognizer.start();
    const res = await recognizer.triggerDemoGesture('chest');

    expect(restApi.predictVSL).toHaveBeenCalled();
    expect(res?.gloss).toBe('NGỰC');
    expect(res?.label_vi).toBe('Vùng Ngực (Tim / Phổi)');
  });
});

