import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({
  create:vi.fn(),task:{close:vi.fn(),send:vi.fn(),onResults:vi.fn()},
}));
vi.mock('../../src/services/vsl/LegacyHolistic',()=>({createLegacyHolistic:mocks.create}));
import {HolisticDetector} from '../../src/services/vsl/HolisticDetector';

const empty={poseLandmarks:[],faceLandmarks:[],leftHandLandmarks:[],rightHandLandmarks:[]};
describe('legacy holistic input and lifecycle',()=>{
  afterEach(()=>vi.unstubAllGlobals());
  beforeEach(()=>{
    vi.clearAllMocks();
    mocks.task.close.mockResolvedValue(undefined);
    mocks.create.mockResolvedValue(mocks.task);
    mocks.task.send.mockImplementation(async ()=>{
      mocks.task.onResults.mock.calls.at(-1)![0](empty);
    });
    vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue({
      drawImage:vi.fn(),clearRect:vi.fn(),
    } as unknown as CanvasRenderingContext2D);
  });

  it('resizes a full rectangular frame and maps all 411 coordinates',async ()=>{
    const detector=new HolisticDetector();
    await expect(detector.detectFrame(document.createElement('canvas'),0)).rejects.toThrow('not ready');
    await detector.initialize();
    const image=document.createElement('canvas');image.width=640;image.height=480;
    const result=await detector.detectFrame(image,100);
    expect(result.frame.landmarks).toHaveLength(411);
    expect(result.frame.timestamp_ms).toBe(100);
    const context=vi.mocked(HTMLCanvasElement.prototype.getContext).mock.results[0].value;
    expect(context.drawImage).toHaveBeenCalledWith(image,0,0,360,360);
    detector.close();detector.close();
    expect(mocks.task.close).toHaveBeenCalledOnce();
    await expect(detector.detectFrame(image,120)).rejects.toThrow('not ready');
  });

  it('closes a task initialized after unmount',async ()=>{
    let resolve!:(value:typeof mocks.task)=>void;
    mocks.create.mockReturnValue(new Promise(r=>{resolve=r;}));
    const detector=new HolisticDetector(),pending=detector.initialize();
    detector.close();resolve(mocks.task);await pending;
    expect(mocks.task.close).toHaveBeenCalledOnce();
    expect(mocks.task.onResults).not.toHaveBeenCalled();
  });

  it('serializes sends and waits to dispose an in-flight task',async ()=>{
    let complete!:()=>void;
    mocks.task.send.mockImplementation(()=>new Promise<void>(resolve=>{complete=resolve;}));
    const detector=new HolisticDetector();await detector.initialize();
    const image=document.createElement('canvas');
    const pending=detector.detectFrame(image,100);
    await expect(detector.detectFrame(image,110)).rejects.toThrow('pending');
    detector.close();expect(mocks.task.close).not.toHaveBeenCalled();
    mocks.task.onResults.mock.calls[0][0](empty);complete();
    await expect(pending).rejects.toThrow('unavailable');
    expect(mocks.task.close).toHaveBeenCalledOnce();
  });

  it('discards a result arriving after stop',async ()=>{
    let complete!:()=>void;
    mocks.task.send.mockImplementation(()=>new Promise<void>(resolve=>{complete=resolve;}));
    const queue:FrameRequestCallback[]=[];
    vi.stubGlobal('requestAnimationFrame',vi.fn(fn=>{queue.push(fn);return queue.length;}));
    vi.stubGlobal('cancelAnimationFrame',vi.fn());
    const detector=new HolisticDetector();await detector.initialize();
    const listener=vi.fn();detector.onResults(listener);
    detector.start({readyState:2,paused:false,currentTime:1,videoWidth:640,videoHeight:480} as HTMLVideoElement);
    const tick=queue.shift()!;
    const pending=tick(0);
    detector.stop();
    mocks.task.onResults.mock.calls[0][0](empty);complete();
    await pending;
    expect(listener).not.toHaveBeenCalled();
    detector.close();
  });
});
