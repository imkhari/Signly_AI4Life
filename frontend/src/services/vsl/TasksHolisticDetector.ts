import { FilesetResolver, HolisticLandmarker } from '@mediapipe/tasks-vision';
import {toObservation, type HolisticObservation} from './HolisticDetector';
export class TasksHolisticDetector {
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
