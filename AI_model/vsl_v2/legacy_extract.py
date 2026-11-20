"""Extract a local public reference video with the pinned legacy Holistic recipe."""

import argparse
import ast
import base64
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def selected_indices() -> dict[str, list[int]]:
    source = ROOT / "AI_model/vsl_v2/vendor/extract_keypoints.source.txt"
    tree = ast.parse(source.read_text())
    return {
        node.targets[0].id: ast.literal_eval(node.value)
        for node in tree.body
        if isinstance(node, ast.Assign)
        and isinstance(node.targets[0], ast.Name)
        and node.targets[0].id in ("POSE_LANDMARKS", "FACE_LANDMARKS")
    }


def main() -> None:
    import cv2
    import mediapipe as mp
    import numpy as np

    parser = argparse.ArgumentParser(
        description="Public reference videos only; no patient recordings"
    )
    parser.add_argument("--video", type=Path, required=True)
    args = parser.parse_args()
    indices = selected_indices()
    cap = cv2.VideoCapture(str(args.video))
    if not cap.isOpened():
        raise ValueError("Cannot open public reference video")
    fps = cap.get(cv2.CAP_PROP_FPS)
    if not np.isfinite(fps) or fps <= 0:
        raise ValueError("Invalid source FPS")
    frames = []
    source_images = []
    try:
        with mp.solutions.holistic.Holistic(
            static_image_mode=False, model_complexity=1, smooth_landmarks=True,
            min_detection_confidence=0.5, min_tracking_confidence=0.5,
        ) as task:
            while True:
                ok, image = cap.read()
                if not ok:
                    break
                if len(frames) >= 300:
                    raise ValueError("Reference clip exceeds 300-frame audit limit")
                rgb = cv2.cvtColor(cv2.resize(image, (360, 360)), cv2.COLOR_BGR2RGB)
                ok, encoded = cv2.imencode(".png", cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR))
                if not ok:
                    raise ValueError("Cannot encode reference frame")
                source_images.append(base64.b64encode(encoded).decode("ascii"))
                result = task.process(rgb)
                vector = []
                for points, selection in [
                    (result.pose_landmarks, indices["POSE_LANDMARKS"]),
                    (result.face_landmarks, indices["FACE_LANDMARKS"]),
                    (result.left_hand_landmarks, list(range(21))),
                    (result.right_hand_landmarks, list(range(21))),
                ]:
                    for i in selection:
                        point = points.landmark[i] if points else None
                        vector.extend([point.x, point.y, point.z] if point else [0, 0, 0])
                frames.append(vector)
    finally:
        cap.release()
    if not frames:
        raise ValueError("Empty reference video")
    print(json.dumps({
        "fps": fps, "frames": frames, "source_images": source_images,
        "video_sha256": hashlib.sha256(args.video.read_bytes()).hexdigest(),
    }, allow_nan=False))


if __name__ == "__main__":
    main()
