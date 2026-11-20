import type { HolisticFrame } from '../api/rest';

export const SENTENCE_LIMITS = { maxMs:6000, maxFrames:180, minFrames:24, minSpanMs:800, maxGapMs:500 };
export type CaptureReason = 'accepted' | 'unknown' | 'missing_shoulders' | 'tracking_gap' |
  'sequence_limit' | 'insufficient_frames' | 'invalid_landmarks' | 'network_error' | 'worker_unavailable' | 'inference_timeout' | 'cancelled';
export interface CaptureSummary { frame_count:number; capture_duration_ms:number }
export type TrackingIssue = 'hands_missing' | 'frames_delayed' | 'timestamps_invalid';
export interface CaptureFailure extends CaptureSummary { reason:CaptureReason; trackingIssue?:TrackingIssue }
export interface CameraTrialResult extends CaptureSummary {
  gloss:string; reason:CaptureReason; candidate_latency_ms:number|null; response_latency_ms:number|null;
  model_source:string;
}

// Offsets in the pinned pose25/face70/left21/right21 layout, before preview mirroring.
export function observedGroups(frame: HolisticFrame): string[] {
  const groups: [string, number, number][] = [
    ['Mặt', 75, 285], ['Vai trái', 27, 30], ['Vai phải', 30, 33],
    ['Tay trái', 285, 348], ['Tay phải', 348, 411],
  ];
  const visible: string[] = [];
  for (const [label, start, end] of groups) {
    for (let i = start; i < end; i += 3) {
      const [x, y] = [frame.landmarks[i], frame.landmarks[i + 1]];
      if (Number.isFinite(x) && Number.isFinite(y) && (x !== 0 || y !== 0)) {
        visible.push(label);
        break;
      }
    }
  }
  return visible;
}

export function hasValidShoulders(frame: HolisticFrame): boolean {
  const p = frame.landmarks;
  return p.length === 411 && [p[27],p[28],p[30],p[31]].every(Number.isFinite) &&
    (p[27]!==0 || p[28]!==0) && (p[30]!==0 || p[31]!==0) &&
    Math.hypot(p[27]-p[30],p[28]-p[31]) > 1e-5;
}

// Owns a single utterance only; it never sees references, labels or participant codes.
export class SentenceCapture {
  private frames:HolisticFrame[] = [];
  private started:number|null = null;
  get recording():boolean { return this.started !== null; }
  begin(now:number):void { this.cancel(); this.started=now; }
  summary(now:number):CaptureSummary {
    return {frame_count:this.frames.length,capture_duration_ms:this.started===null ? 0 : Math.max(0,now-this.started)};
  }
  cancel():void { this.frames=[]; this.started=null; }
  fail(reason:CaptureReason,now:number,trackingIssue?:TrackingIssue):CaptureFailure {
    const result={...this.summary(now),reason,...(trackingIssue ? {trackingIssue} : {})}; this.cancel(); return result;
  }
  push(frame:HolisticFrame):CaptureFailure|null {
    if (this.started===null || frame.timestamp_ms<this.started) return null;
    const now=frame.timestamp_ms, previous=this.frames[this.frames.length-1];
    if (!Number.isFinite(now) || frame.landmarks.length!==411 ||
      frame.landmarks.some(v => !Number.isFinite(v) || Math.abs(v)>10)) return this.fail('invalid_landmarks',now);
    if (now-this.started>SENTENCE_LIMITS.maxMs || this.frames.length>=SENTENCE_LIMITS.maxFrames)
      return this.fail('sequence_limit',now);
    if (previous && now<=previous.timestamp_ms)
      return this.fail('tracking_gap',now,'timestamps_invalid');
    if (now-(previous?.timestamp_ms ?? this.started)>SENTENCE_LIMITS.maxGapMs)
      return this.fail('tracking_gap',now,'frames_delayed');
    if (!hasValidShoulders(frame)) return this.fail('missing_shoulders',now);
    if (!frame.landmarks.slice(285).some(v => v!==0)) return this.fail('tracking_gap',now,'hands_missing');
    this.frames.push(frame);
    return null;
  }
  finish(now:number):{frames:HolisticFrame[]; summary:CaptureSummary}|CaptureFailure {
    const first=this.frames[0], last=this.frames[this.frames.length-1];
    if (this.started===null || !last || this.frames.length<SENTENCE_LIMITS.minFrames ||
      last.timestamp_ms-first.timestamp_ms<SENTENCE_LIMITS.minSpanMs) return this.fail('insufficient_frames',now);
    if (now-this.started>SENTENCE_LIMITS.maxMs) return this.fail('sequence_limit',now);
    if (now-last.timestamp_ms>SENTENCE_LIMITS.maxGapMs) return this.fail('tracking_gap',now,'frames_delayed');
    const result={frames:this.frames,summary:this.summary(now)};
    this.cancel(); return result;
  }
}
