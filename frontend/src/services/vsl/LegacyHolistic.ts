import type {Holistic} from '@mediapipe/holistic';

type LegacyConstructor = new (config:{locateFile:(file:string)=>string}) => Holistic;
declare global { interface Window { Holistic?:LegacyConstructor } }
let scriptLoading:Promise<void>|null=null;
let initialization:Promise<void>=Promise.resolve();

async function loadScript():Promise<void> {
  if (window.Holistic) return;
  if (!scriptLoading) {
    scriptLoading=new Promise<void>((resolve,reject)=>{
      const script=document.createElement('script');
      const fail=()=>{
        clearTimeout(timer);script.remove();scriptLoading=null;
        reject(new Error('Local Holistic assets unavailable'));
      };
      const timer=setTimeout(fail,45000);
      script.src='/models/holistic-legacy/holistic.js';script.async=true;
      script.onerror=fail;
      script.onload=()=>{
        if (!window.Holistic) {fail();return;}
        clearTimeout(timer);resolve();
      };
      document.head.appendChild(script);
    });
  }
  await scriptLoading;
}

// Emscripten initialization touches shared globals; serialize attempts, including cleanup.
export function createLegacyHolistic(signal?:AbortSignal):Promise<Holistic> {
  const pending=initialization.then(async ()=>{
    if (signal?.aborted) throw new DOMException('Cancelled','AbortError');
    await loadScript();
    if (signal?.aborted) throw new DOMException('Cancelled','AbortError');
    const task=new window.Holistic!({locateFile:file=>'/models/holistic-legacy/'+file});
    task.setOptions({selfieMode:false,modelComplexity:1,smoothLandmarks:true,
      minDetectionConfidence:.5,minTrackingConfidence:.5});
    try {
      await task.initialize();
      if (signal?.aborted) throw new DOMException('Cancelled','AbortError');
      return task;
    } catch(error) {
      await task.close().catch(()=>{});
      throw error;
    }
  });
  initialization=pending.then(()=>{},()=>{});
  return pending;
}
