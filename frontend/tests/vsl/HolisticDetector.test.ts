import { expect, it } from 'vitest';
import { toObservation } from '../../src/services/vsl/HolisticDetector';

it('preserves the 411-coordinate source layout, anatomical hands and missing zeros', () => {
  const points = (n: number) => Array.from({length:n}, (_,i) => ({x:i/500,y:i/1000,z:-i/2000,visibility:1}));
  const pose = points(33), face = points(478), left = points(21);
  const result = toObservation({poseLandmarks:[pose], faceLandmarks:[face],
    leftHandLandmarks:[left],rightHandLandmarks:[]}, 123);
  expect(result.frame.landmarks).toHaveLength(411);
  expect(result.frame.landmarks.slice(27,30)).toEqual([pose[11].x,pose[11].y,pose[11].z]);
  expect(result.frame.landmarks.slice(75,78)).toEqual([face[61].x,face[61].y,face[61].z]);
  expect(result.frame.landmarks.slice(285,348)).toEqual(left.flatMap(p => [p.x,p.y,p.z]));
  expect(result.frame.landmarks.slice(348)).toEqual(Array(63).fill(0));
  expect(result.frame.timestamp_ms).toBe(123);
  expect(result.hands).toHaveLength(1);
});
