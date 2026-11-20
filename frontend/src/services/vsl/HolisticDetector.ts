import { FilesetResolver, HolisticLandmarker, HolisticLandmarkerResult } from '@mediapipe/tasks-vision';
import type { HolisticFrame } from '../api/rest';
import type { NormalizedLandmark } from './drawHandSkeleton';

// VSL-GH 6c351e6 layout; shoulders are subset positions 9 and 10.
export const POSE_INDICES = [0,1,2,3,4,5,6,7,8,11,12,13,14,15,16,17,18,19,20,23,24,25,26,27,28];
export const FACE_INDICES = [61,146,91,181,84,17,314,405,321,375,291,308,324,318,402,317,14,87,178,88,
  33,7,163,144,145,153,362,382,381,380,374,373,46,53,52,65,55,285,295,282,283,276,168,6,197,195,
  5,4,1,19,94,10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152];
export interface HolisticObservation { frame: HolisticFrame; hands: NormalizedLandmark[][] }

export function toObservation(result: Pick<HolisticLandmarkerResult, 'poseLandmarks' | 'faceLandmarks' |
  'leftHandLandmarks' | 'rightHandLandmarks'>, timestamp: number): HolisticObservation {
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
  private task: HolisticLandmarker | null = null;
  private closed = false;
  private raf: number | null = null;
  private video: HTMLVideoElement | null = null;
  private lastTime = -1;
  private canvas = document.createElement('canvas');
  private callbacks = new Set<(result: HolisticObservation) => void>();

  async initialize(): Promise<void> {
    this.canvas.width = this.canvas.height = 360;
    const vision = await FilesetResolver.forVisionTasks('/wasm');
    const create = (delegate: 'GPU' | 'CPU') => HolisticLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: '/models/holistic_landmarker.task', delegate },
      runningMode: 'VIDEO', outputFaceBlendshapes: false, outputPoseSegmentationMasks: false,
    });
    const task = await create('GPU').catch(() => create('CPU'));
    if (this.closed) { task.close(); return; }
    this.task = task;
    this.loop();
  }

  // Deterministic public-video audit uses the same task, resize and coordinate mapping.
  detectFrame(source: CanvasImageSource, timestamp: number): HolisticObservation {
    if (this.closed || !this.task) throw new Error('Holistic detector is not ready');
    const context=this.canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    try {
      context.drawImage(source,0,0,360,360);
      return toObservation(this.task.detectForVideo(this.canvas,timestamp),timestamp);
    } finally {
      context.clearRect(0,0,360,360);
    }
  }

  start(video: HTMLVideoElement): void {
    if (this.closed) return;
    this.video = video; this.loop();
  }
  onResults(callback: (result: HolisticObservation) => void): () => void {
    this.callbacks.add(callback); return () => { this.callbacks.delete(callback); };
  }
  stop(): void {
    this.video = null;
    if (this.raf !== null) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.lastTime = -1;
    this.canvas.getContext('2d')?.clearRect(0,0,360,360);
  }
  close(): void {
    this.closed = true; this.stop(); this.callbacks.clear(); this.task?.close(); this.task = null;
  }
  private loop = (): void => {
    if (this.closed || this.raf !== null || !this.video || !this.task) return;
    const tick = () => {
      this.raf = null;
      const video = this.video;
      if (this.closed || !video || !this.task) return;
      if (video.readyState >= 2 && !video.paused && video.currentTime !== this.lastTime) {
        this.lastTime = video.currentTime;
        const context = this.canvas.getContext('2d');
        const side = Math.min(video.videoWidth, video.videoHeight);
        if (context && side > 0) {
          // Pinned extractor resizes the full frame; do not center-crop or mirror input.
          try {
            const observation = this.detectFrame(video,performance.now());
            this.callbacks.forEach(callback => callback(observation));
          } catch { /* Missing observations never become a label. */ }

        }
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  };
}
