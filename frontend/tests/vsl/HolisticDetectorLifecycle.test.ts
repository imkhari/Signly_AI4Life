import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(() => ({create:vi.fn(),resolve:vi.fn(),task:{close:vi.fn(),detectForVideo:vi.fn()}}));
vi.mock('@mediapipe/tasks-vision',() => ({
  FilesetResolver:{forVisionTasks:vi.fn().mockResolvedValue({})},
  HolisticLandmarker:{createFromOptions:mocks.create},
}));
import {HolisticDetector} from '../../src/services/vsl/HolisticDetector';

describe('holistic input and lifecycle',() => {
  afterEach(() => vi.unstubAllGlobals());
  beforeEach(() => {vi.clearAllMocks();mocks.create.mockResolvedValue(mocks.task);});
  it('resizes the full rectangular frame to source dimensions without cropping',async () => {
    const context={drawImage:vi.fn(),clearRect:vi.fn()};
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    const queue:FrameRequestCallback[]=[];
    vi.stubGlobal('requestAnimationFrame',vi.fn((callback:FrameRequestCallback) => {queue.push(callback);return queue.length;}));
    vi.stubGlobal('cancelAnimationFrame',vi.fn());
    mocks.task.detectForVideo.mockReturnValue({poseLandmarks:[],faceLandmarks:[],leftHandLandmarks:[],rightHandLandmarks:[]});
    const detector=new HolisticDetector();await detector.initialize();
    const listener=vi.fn();detector.onResults(listener);
    const video={readyState:2,paused:false,currentTime:1,videoWidth:640,videoHeight:480} as HTMLVideoElement;
    detector.start(video);queue.shift()!(0);
    expect(context.drawImage).toHaveBeenCalledWith(video,0,0,360,360);
    expect(listener.mock.calls[0][0].frame.landmarks).toHaveLength(411);
    detector.close();expect(mocks.task.close).toHaveBeenCalledOnce();
    const calls=vi.mocked(requestAnimationFrame).mock.calls.length;
    detector.start(video);expect(requestAnimationFrame).toHaveBeenCalledTimes(calls);
    vi.unstubAllGlobals();
  });
  it('closes a task whose initialization completes after unmount',async () => {
    let resolve!: (task:typeof mocks.task) => void;
    mocks.create.mockReturnValue(new Promise(r => {resolve=r;}));
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(null);
    const detector=new HolisticDetector(), pending=detector.initialize();
    await Promise.resolve();detector.close();resolve(mocks.task);await pending;
    expect(mocks.task.close).toHaveBeenCalledOnce();
  });
});
