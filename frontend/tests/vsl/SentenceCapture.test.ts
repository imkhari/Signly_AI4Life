import {describe,expect,it} from 'vitest';
import {SentenceCapture,hasValidShoulders} from '../../src/services/vsl/SentenceCapture';

const frame=(time:number) => {
  const points=Array(411).fill(.5);points[27]=.4;points[30]=.6;
  return {timestamp_ms:time,landmarks:points};
};
describe('single sentence bounds',() => {
  it('keeps no data before beginning and transfers one bounded sentence on finish',() => {
    const capture=new SentenceCapture();
    capture.push(frame(0));expect(capture.summary(0).frame_count).toBe(0);
    capture.begin(0);for(let i=0;i<30;i++) capture.push(frame(i*40));
    const result=capture.finish(1200);expect('frames' in result && result.frames.length).toBe(30);
    expect(capture.recording).toBe(false);expect(capture.summary(1200).frame_count).toBe(0);
    expect(capture.finish(1200)).toMatchObject({reason:'insufficient_frames'});
  });
  it('rejects a missing leading section instead of accepting a partial sentence',() => {
    const capture=new SentenceCapture();capture.begin(0);
    expect(capture.push(frame(800))).toMatchObject({reason:'tracking_gap'});
    expect(capture.summary(800).frame_count).toBe(0);
  });
  it('rejects a gap and releases the old utterance',() => {
    const capture=new SentenceCapture();capture.begin(0);capture.push(frame(0));
    expect(capture.push(frame(600))).toMatchObject({reason:'tracking_gap'});
    expect(capture.recording).toBe(false);expect(capture.summary(600).frame_count).toBe(0);
  });
  it('does not silently truncate a long utterance',() => {
    const capture=new SentenceCapture();capture.begin(0);
    for(let i=0;i<180;i++) expect(capture.push(frame(i*33))).toBeNull();
    expect(capture.push(frame(6000))).toMatchObject({reason:'sequence_limit'});
    expect(capture.summary(6000).frame_count).toBe(0);
  });
  it('rejects missing shoulders and non-finite coordinates',() => {
    const bad=frame(0);bad.landmarks.fill(0,27,33);
    expect(hasValidShoulders(bad)).toBe(false);
    const capture=new SentenceCapture();capture.begin(0);
    expect(capture.push(bad)).toMatchObject({reason:'missing_shoulders'});
    const nonfinite=frame(1);nonfinite.landmarks[300]=NaN;capture.begin(0);
    expect(capture.push(nonfinite)).toMatchObject({reason:'invalid_landmarks'});
  });
  it('requires a complete, recent sequence rather than padding or reusing old frames',() => {
    const capture=new SentenceCapture();capture.begin(0);capture.push(frame(0));
    expect(capture.finish(1000)).toMatchObject({reason:'insufficient_frames'});
    capture.begin(2000);for(let i=0;i<30;i++) capture.push(frame(2000+i*40));
    expect(capture.finish(4000)).toMatchObject({reason:'tracking_gap'});
  });
});
