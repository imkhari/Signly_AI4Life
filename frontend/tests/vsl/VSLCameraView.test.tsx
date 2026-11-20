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
const sentencePrediction = {...prediction, intake_suggestion:{chief_complaint_code:'PAIN' as const,
  pain_present:true as const, body_regions:['CHEST' as const]}};
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
it('does not begin a new sentence using stale tracking readiness',async () => {
  render(view());await emit(0,0);
  clock=10600;
  fireEvent.click(screen.getByRole('button',{name:'Bắt đầu ký'}));
  expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  expect(screen.getByText(/Chờ hình theo dõi mới/)).toBeVisible();
  expect(restApi.predictVSLSequence).not.toHaveBeenCalled();
});

  it('offers the complete sentence only after finishing and writes only on explicit acceptance', async () => {
    const apply=vi.fn(), legacy=vi.fn();
    vi.mocked(restApi.predictVSLSequence).mockResolvedValue(sentencePrediction);
    render(<VSLCameraView contextStep="intake" onApplyGlosses={legacy} onApplyIntakeSuggestion={apply} draftKey="A" />, {wrapper:SessionProvider});
    await emit(0,0);fireEvent.click(screen.getByRole('button',{name:'Bắt đầu ký'}));await emit(1,30);
    await act(async () => {fireEvent.click(screen.getByRole('button',{name:'Xong câu'}));});
    expect(restApi.predictVSLSequence).toHaveBeenCalledWith(expect.any(Array),'intake',expect.any(AbortSignal));
    expect(screen.getByText('Ngực')).toBeVisible();expect(screen.getByText('Có đau')).toBeVisible();
    expect(screen.queryByText(/Triệu chứng đã chốt/)).not.toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Dùng thông tin này'}));
    expect(apply).toHaveBeenCalledOnce();expect(apply).toHaveBeenCalledWith(sentencePrediction.intake_suggestion);
    expect(legacy).not.toHaveBeenCalled();
  });

  it.each(['draft','disconnect'])('invalidates a displayed sentence on %s change', async variant => {
    const apply=vi.fn();vi.mocked(restApi.predictVSLSequence).mockResolvedValue(sentencePrediction);
    const props={contextStep:'intake' as const,onApplyGlosses:vi.fn(),onApplyIntakeSuggestion:apply};
    const rendered=render(<VSLCameraView {...props} draftKey="A" connected />, {wrapper:SessionProvider});
    await emit(0,0);fireEvent.click(screen.getByRole('button',{name:'Bắt đầu ký'}));await emit(1,30);
    await act(async () => {fireEvent.click(screen.getByRole('button',{name:'Xong câu'}));});
    expect(screen.getByRole('button',{name:'Dùng thông tin này'})).toBeEnabled();
    rendered.rerender(<VSLCameraView {...props} draftKey={variant==='draft' ? 'B' : 'A'} connected={variant!=='disconnect'} />);
    expect(screen.queryByRole('button',{name:'Dùng thông tin này'})).not.toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();
  });

  it('does not fall back to a single gloss when an intake bundle is absent', async () => {
    const apply=vi.fn();render(<VSLCameraView contextStep="intake" onApplyGlosses={apply} onApplyIntakeSuggestion={apply} />, {wrapper:SessionProvider});
    await emit(0,0);fireEvent.click(screen.getByRole('button',{name:'Bắt đầu ký'}));await emit(1,30);
    await act(async () => {fireEvent.click(screen.getByRole('button',{name:'Xong câu'}));});
    expect(screen.queryByRole('button',{name:'Dùng thông tin này'})).not.toBeInTheDocument();
    expect(screen.getByText(/Chưa nhận rõ/)).toBeVisible();expect(apply).not.toHaveBeenCalled();
  });

  it('records a worker failure as unmeasurable with response time only', async () => {
    const record=vi.fn();
    vi.mocked(restApi.predictVSLSequence).mockResolvedValue({...prediction,success:false,
      gloss:'UNKNOWN',suggested_next_step:'worker_unavailable'});
    render(<VSLCameraView contextStep="intake" onApplyGlosses={vi.fn()} onTrialResult={record}
      onSwitchToTouchMode={vi.fn()} />, {wrapper:SessionProvider});
    await emit(0,0);fireEvent.click(screen.getByRole('button',{name:'Bắt đầu ký'}));await emit(1,30);
    await act(async () => {fireEvent.click(screen.getByRole('button',{name:'Xong câu'}));});
    expect(record).toHaveBeenCalledWith(expect.objectContaining({gloss:'UNKNOWN',reason:'worker_unavailable',
      candidate_latency_ms:null,response_latency_ms:expect.any(Number)}));
    expect(screen.getByText(/Bộ nhận diện chưa xử lý/)).toBeVisible();
    expect(screen.getByRole('button',{name:'Chuyển sang Chạm'})).toBeEnabled();
  });

  it('clears the display and ends a capture if observations stop arriving', async () => {
    render(view());await emit(0,0);
    expect(screen.getByTestId('vsl-tracking')).toHaveTextContent('Mặt · Vai trái · Vai phải · Tay trái · Tay phải');
    fireEvent.click(screen.getByRole('button',{name:'Bắt đầu ký'}));await emit(1,1);
    clock+=700;
    await screen.findByTestId('vsl-capture-stopped');
    expect(screen.getByTestId('vsl-tracking')).toHaveTextContent('Đang tìm');
    expect(screen.getByRole('button',{name:'Bắt đầu ký'})).toBeDisabled();
    expect(restApi.predictVSLSequence).not.toHaveBeenCalled();
  });

  it('finishes once with Space while recording and ignores text inputs', async () => {
    const record=vi.fn();
    render(<VSLCameraView contextStep="intake" onApplyGlosses={vi.fn()} onTrialResult={record} />,
      {wrapper:SessionProvider});
    await emit(0,0);fireEvent.click(screen.getByRole('button',{name:'Bắt đầu ký'}));await emit(1,30);
    const input=document.createElement('input');document.body.appendChild(input);
    fireEvent.keyDown(input,{code:'Space'});
    expect(restApi.predictVSLSequence).not.toHaveBeenCalled();
    input.remove();
    await act(async () => {fireEvent.keyDown(document.body,{code:'Space'});});
    expect(restApi.predictVSLSequence).toHaveBeenCalledOnce();
    fireEvent.keyDown(document.body,{code:'Space'});
    expect(restApi.predictVSLSequence).toHaveBeenCalledOnce();
    expect(record).toHaveBeenCalledOnce();
  });

  it.each([
    ['hand_motion_unclear','Chuyển động tay chưa đủ rõ'],
    ['model_score_low','Điểm nhận diện chưa đạt ngưỡng'],
    ['phrase_not_supported','Đầu ra nhận diện chưa khớp câu được hỗ trợ'],
    ['arbitrary decoder text','Chưa nhận rõ'],
  ])('shows only controlled rejection guidance for %s',async (hint,text) => {
    vi.mocked(restApi.predictVSLSequence).mockResolvedValue({...prediction,success:false,
      gloss:'UNKNOWN',suggested_next_step:hint});
    const apply=vi.fn(), record=vi.fn();
    render(<VSLCameraView contextStep="intake" onApplyGlosses={apply}
      onApplyIntakeSuggestion={apply} onTrialResult={record} />, {wrapper:SessionProvider});
    await emit(0,0);fireEvent.click(screen.getByRole('button',{name:'Bắt đầu ký'}));await emit(1,30);
    await act(async () => {fireEvent.click(screen.getByRole('button',{name:'Xong câu'}));});
    expect(screen.getByRole('status')).toHaveTextContent(text);
    expect(screen.queryByRole('button',{name:'Dùng thông tin này'})).not.toBeInTheDocument();
    expect(apply).not.toHaveBeenCalled();
    expect(record).toHaveBeenCalledWith(expect.objectContaining({gloss:'UNKNOWN',
      reason:'unknown',candidate_latency_ms:null}));
  });

});
