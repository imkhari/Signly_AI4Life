export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
}

const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  // Index
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  // Middle
  [9, 10],
  [10, 11],
  [11, 12],
  // Ring
  [13, 14],
  [14, 15],
  [15, 16],
  // Pinky
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  // Palm Base
  [5, 9],
  [9, 13],
  [13, 17],
];

export function drawHandLandmarks(
  ctx: CanvasRenderingContext2D,
  landmarksList: NormalizedLandmark[][],
  width: number,
  height: number
): void {
  ctx.clearRect(0, 0, width, height);

  for (const landmarks of landmarksList) {
    if (!landmarks || landmarks.length < 21) continue;

    // 1. Draw connections
    ctx.strokeStyle = '#10B981'; // Emerald 500
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];
      if (p1 && p2) {
        ctx.beginPath();
        ctx.moveTo(p1.x * width, p1.y * height);
        ctx.lineTo(p2.x * width, p2.y * height);
        ctx.stroke();
      }
    }

    // 2. Draw landmark joints
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      if (!p) continue;

      const px = p.x * width;
      const py = p.y * height;

      ctx.beginPath();
      const isTip = [4, 8, 12, 16, 20].includes(i);
      ctx.arc(px, py, isTip ? 6 : 4, 0, 2 * Math.PI);

      if (isTip) {
        ctx.fillStyle = '#F59E0B'; // Amber for tips
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 8;
      } else if (i === 0) {
        ctx.fillStyle = '#3B82F6'; // Blue for wrist
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#10B981';
      }

      ctx.fill();
      ctx.strokeStyle = '#065F46';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset
    }
  }
}

