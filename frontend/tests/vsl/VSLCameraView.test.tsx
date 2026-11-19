import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VSLCameraView } from '../../src/features/patient/components/VSLCameraView';
import { SessionProvider } from '../../src/state/SessionContext';
import { restApi } from '../../src/services/api/rest';
import type { HolisticObservation } from '../../src/services/vsl/HolisticDetector';

const detector = vi.hoisted(() => ({
  initialize: vi.fn().mockResolvedValue(undefined), start: vi.fn(), close: vi.fn(),
  callback: null as ((observation: HolisticObservation) => void) | null,
}));
vi.mock('../../src/services/vsl/HolisticDetector', () => ({
  HolisticDetector: class {
    initialize = detector.initialize;
    start = detector.start;
    close = detector.close;
    onResults(callback: typeof detector.callback) {
      detector.callback = callback;
      return () => { detector.callback = null; };
    }
  },
}));
vi.mock('../../src/services/api/rest', () => ({restApi: {predictVSLSequence: vi.fn()}}));

const prediction = {success:true, gloss:'ĐAU', label_vi:'Đau / Nhức', confidence:.95,
  hand_count:2, total_fingers:0, is_transitioning:false, motion_type:'steady', top_k:[],
  latency_ms:25, model_source:'vsl_v2_learned_translation'};
let clock = 10000;
async function emit(from: number, to: number) {
  for (let i = from; i <= to; i++) {
    await act(async () => {
      clock = 10000 + i * 40;
      const landmarks=Array(411).fill(.5);landmarks[27]=.4;landmarks[30]=.6;
      detector.callback?.({frame:{timestamp_ms:clock, landmarks},
        hands:[Array.from({length:21}, () => ({x:.5,y:.5,z:0}))]});
    });
  }
}
const view = (apply = vi.fn(), contextStep: 'symptom' | 'location' = 'symptom') =>
  <SessionProvider><VSLCameraView onApplyGlosses={apply} contextStep={contextStep}
    onSwitchToTouchMode={apply} /></SessionProvider>;

describe('V2 camera lifecycle and confirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clock=10000;
    vi.spyOn(performance,"now").mockImplementation(() => clock);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(Date, 'now').mockImplementation(() => clock);
    vi.mocked(restApi.predictVSLSequence).mockResolvedValue(prediction);
    Object.defineProperty(navigator, 'mediaDevices', {configurable:true,
      value:{getUserMedia:vi.fn().mockResolvedValue({getTracks:() => [{stop:vi.fn()}]})}});
  });
  it('initializes the local holistic detector and switches to touch', async () => {
    const apply = vi.fn();
    render(view(apply));
    await act(async () => {});
    expect(detector.initialize).toHaveBeenCalled();
    expect(screen.getByText('Gợi ý cử chỉ qua camera')).toBeVisible();
    fireEvent.click(screen.getByText('Chuyển sang Chạm'));
    expect(detector.close).toHaveBeenCalled();
    expect(apply).toHaveBeenCalled();
  });
  it('sends only numeric sequences and requires Nhận then Apply', async () => {
    const apply = vi.fn();
    render(view(apply));
    await emit(0,0);
    fireEvent.click(screen.getByRole('button',{name:'Bắt đầu ký'}));
    await emit(1,30);
    expect(restApi.predictVSLSequence).not.toHaveBeenCalled();
    await act(async () => {fireEvent.click(screen.getByRole('button',{name:'Xong câu'}));});
    expect(restApi.predictVSLSequence).toHaveBeenCalled();
    const [frames, context] = vi.mocked(restApi.predictVSLSequence).mock.calls[0];
    expect(frames[0].landmarks).toHaveLength(411);
    expect(context).toBe('symptom');
    expect(apply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', {name:'Nhận'}));
    expect(apply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('btn-apply-vsl-glosses'));
    expect(apply).toHaveBeenCalledWith([expect.objectContaining({gloss:'ĐAU'})]);
  });
  it('aborts a pending request and ignores its reply after context changes', async () => {
    let resolve!: (value: typeof prediction) => void;
    vi.mocked(restApi.predictVSLSequence).mockReturnValue(new Promise(r => {resolve = r;}));
    const rendered = render(view());
    await emit(0,0);
    fireEvent.click(screen.getByRole('button',{name:'Bắt đầu ký'}));
    await emit(1,30);
    fireEvent.click(screen.getByRole('button',{name:'Xong câu'}));
    expect(restApi.predictVSLSequence).toHaveBeenCalledTimes(1);
    const signal = vi.mocked(restApi.predictVSLSequence).mock.calls[0][2]!;
    rendered.rerender(view(vi.fn(),'location'));
    expect(signal.aborted).toBe(true);
    await act(async () => {resolve(prediction);});
    expect(screen.queryByRole('button', {name:'Nhận'})).not.toBeInTheDocument();
    rendered.unmount();
    expect(detector.close).toHaveBeenCalled();
  });
});
