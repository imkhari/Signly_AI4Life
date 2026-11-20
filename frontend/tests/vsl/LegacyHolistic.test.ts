import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {createLegacyHolistic} from '../../src/services/vsl/LegacyHolistic';
const initialize=vi.fn(),close=vi.fn(),setOptions=vi.fn();
let locate:(file:string)=>string;
beforeEach(()=>{
  vi.clearAllMocks();initialize.mockResolvedValue(undefined);close.mockResolvedValue(undefined);
  window.Holistic=class {
    initialize=initialize;close=close;setOptions=setOptions;
    constructor(options:{locateFile:(file:string)=>string}){locate=options.locateFile;}
  } as unknown as NonNullable<typeof window.Holistic>;
});
afterEach(()=>{delete window.Holistic;});
it('uses local assets and the verified legacy recipe',async ()=>{
  await createLegacyHolistic();
  expect(locate('pose_landmark_full.tflite')).toBe('/models/holistic-legacy/pose_landmark_full.tflite');
  expect(setOptions).toHaveBeenCalledWith({selfieMode:false,modelComplexity:1,smoothLandmarks:true,
    minDetectionConfidence:.5,minTrackingConfidence:.5});
});
it('releases resources when local initialization fails',async ()=>{
  initialize.mockRejectedValue(new Error('missing local asset'));
  await expect(createLegacyHolistic()).rejects.toThrow('missing local asset');
  expect(close).toHaveBeenCalledOnce();
});
