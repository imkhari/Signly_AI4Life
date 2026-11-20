import type {Holistic} from '@mediapipe/holistic';
import {createLegacyHolistic} from './LegacyHolistic';
import type { HolisticFrame } from '../api/rest';
import type { NormalizedLandmark } from './drawHandSkeleton';

// VSL-GH 6c351e6 layout; shoulders are subset positions 9 and 10.
export const POSE_INDICES = [0,1,2,3,4,5,6,7,8,11,12,13,14,15,16,17,18,19,20,23,24,25,26,27,28];
export const FACE_INDICES = [61,146,91,181,84,17,314,405,321,375,291,308,324,318,402,317,14,87,178,88,
  33,7,163,144,145,153,362,382,381,380,374,373,46,53,52,65,55,285,295,282,283,276,168,6,197,195,
  5,4,1,19,94,10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152];
export interface HolisticObservation { frame: HolisticFrame; hands: NormalizedLandmark[][] }

export function toObservation(result: Record<
  'poseLandmarks'|'faceLandmarks'|'leftHandLandmarks'|'rightHandLandmarks',
  NormalizedLandmark[][]>, timestamp: number): HolisticObservation {
  const flatten = (points: NormalizedLandmark[] | undefined, indices: number[]) =>
    indices.flatMap(i => { const p = points?.[i]; return p ? [p.x,p.y,p.z ?? 0] : [0,0,0]; });
  const left = result.leftHandLandmarks[0];
  const right = result.rightHandLandmarks[0];
  return {
    frame: { timestamp_ms: timestamp, landmarks: [
      ...flatten(result.poseLandmarks[0], POSE_INDICES), ...flatten(result.faceLandmarks[0], FACE_INDICES),
      ...flatten(left, Array.from({length:21}, (_,i) => i)),
      ...flatten(right, Array.from({length:21}, (_,i) => i)),
    ] },
    hands: [left, right].filter((h): h is NonNullable<typeof h> => !!h)
      .map(h => h.map(p => ({x:p.x, y:p.y, z:p.z}))),
  };
}

export class HolisticDetector {
  private task:Holistic|null=null;
  private initializationController=new AbortController();
  private closed=false;
  private busy=false;
  private generation=0;
  private raf:number|null=null;
  private video:HTMLVideoElement|null=null;
  private lastTime=-1;
  private canvas=document.createElement('canvas');
  private observation:HolisticObservation|null=null;
  private timestamp=0;
  private callbacks=new Set<(result:HolisticObservation)=>void>();

  async initialize():Promise<void> {
    this.canvas.width=this.canvas.height=360;
    const task=await createLegacyHolistic(this.initializationController.signal);
    if (this.closed) {await task.close();return;}
    this.task=task;
    task.onResults(result=>{
      if (this.closed) return;
      this.observation=toObservation({
        poseLandmarks:result.poseLandmarks?.length ? [result.poseLandmarks] : [],
        faceLandmarks:result.faceLandmarks?.length ? [result.faceLandmarks] : [],
        leftHandLandmarks:result.leftHandLandmarks?.length ? [result.leftHandLandmarks] : [],
        rightHandLandmarks:result.rightHandLandmarks?.length ? [result.rightHandLandmarks] : [],
      },this.timestamp);
    });
    this.loop();
  }

  async detectFrame(source:CanvasImageSource,timestamp:number):Promise<HolisticObservation> {
    if (this.closed || !this.task) throw new Error('Holistic detector is not ready');
    if (this.busy) throw new Error('Holistic inference already pending');
    const context=this.canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    this.busy=true;this.observation=null;this.timestamp=timestamp;
    const task=this.task;
    try {
      context.drawImage(source,0,0,360,360);
      await task.send({image:this.canvas});
      if (this.closed || !this.observation) throw new Error('Observation unavailable');
      return this.observation;
    } finally {
      this.busy=false;this.observation=null;
      context.clearRect(0,0,360,360);
      if (this.closed) this.releaseTask();
    }
  }

  start(video:HTMLVideoElement):void {
    if (this.closed) return;
    this.video=video;this.loop();
  }
  onResults(callback:(result:HolisticObservation)=>void):()=>void {
    this.callbacks.add(callback);return ()=>{this.callbacks.delete(callback);};
  }
  stop():void {
    this.generation++;this.video=null;
    if (this.raf!==null) cancelAnimationFrame(this.raf);
    this.raf=null;this.lastTime=-1;
    if (!this.busy) this.canvas.getContext('2d')?.clearRect(0,0,360,360);
  }
  close():void {
    this.closed=true;this.initializationController.abort();this.stop();this.callbacks.clear();
    if (!this.busy) this.releaseTask();
  }
  private releaseTask():void {
    const task=this.task;this.task=null;
    void task?.close().catch(()=>{});
  }
  private loop=():void=>{
    if (this.closed || this.raf!==null || !this.video || !this.task || this.busy) return;
    const tick=async ()=>{
      this.raf=null;
      const video=this.video,generation=this.generation;
      if (this.closed || !video || !this.task) return;
      if (video.readyState>=2 && !video.paused && video.currentTime!==this.lastTime &&
        video.videoWidth>0 && video.videoHeight>0) {
        this.lastTime=video.currentTime;
        try {
          const result=await this.detectFrame(video,performance.now());
          if (!this.closed && generation===this.generation) {
            this.callbacks.forEach(callback=>callback(result));
          }
        } catch { /* Missing observations are handled by the existing capture gap guard. */ }
      }
      this.loop();
    };
    this.raf=requestAnimationFrame(tick);
  };
}
