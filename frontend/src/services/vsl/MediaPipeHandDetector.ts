import { FilesetResolver, HandLandmarker, HandLandmarkerResult } from '@mediapipe/tasks-vision';

export interface HandLandmarkerCallback {
  onResults: (result: HandLandmarkerResult) => void;
}

export class MediaPipeHandDetector {
  private handLandmarker: HandLandmarker | null = null;
  private isInitializing = false;
  private isRunning = false;
  private animFrameId: number | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private lastVideoTime = -1;
  private callbacks: Set<(result: HandLandmarkerResult) => void> = new Set();

  async initialize(): Promise<void> {
    if (this.handLandmarker || this.isInitializing) return;

    this.isInitializing = true;
    try {
      // Ưu tiên nạp wasm và model cục bộ từ thư mục public/ (chạy 100% offline không cần internet)
      const vision = await FilesetResolver.forVisionTasks('/wasm');
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/models/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      console.log('[MediaPipe] HandLandmarker initialized successfully with local model!');
    } catch (err) {
      console.warn('[MediaPipe] Local model failed, falling back to CDN:', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
        });
      } catch (fallbackErr) {
        console.error('[MediaPipe] Critical: Failed to initialize HandLandmarker:', fallbackErr);
        throw fallbackErr;
      }
    } finally {
      this.isInitializing = false;
    }
  }

  start(videoElement: HTMLVideoElement): void {
    this.videoEl = videoElement;
    this.isRunning = true;
    this.loop();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.videoEl = null;
  }

  onResults(callback: (result: HandLandmarkerResult) => void): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  private loop = (): void => {
    if (!this.isRunning || !this.videoEl) return;

    const video = this.videoEl;
    if (
      video.readyState >= 2 &&
      !video.paused &&
      video.currentTime !== this.lastVideoTime &&
      this.handLandmarker
    ) {
      this.lastVideoTime = video.currentTime;
      try {
        const result = this.handLandmarker.detectForVideo(video, performance.now());
        this.callbacks.forEach((fn) => fn(result));
      } catch (err) {
        console.error('[MediaPipe] Error detecting hands:', err);
      }
    }

    this.animFrameId = requestAnimationFrame(this.loop);
  };
}

export const mediaPipeDetector = new MediaPipeHandDetector();
