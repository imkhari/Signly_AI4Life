import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

import numpy as np
import torch

from AI_model.vsl_v2.engine import V2Engine, preprocess
from AI_model.vsl_v2.evaluate import evaluate
from AI_model.vsl_v2.worker import predict_request, prepare_sequence, respond

FIXTURES = Path(__file__).with_name("fixtures")


class V2Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        torch.set_num_threads(4)
        cls.engine = V2Engine()

    def test_real_public_landmarks_reproduce_good_and_known_wrong_prediction(self):
        for row, filename in zip(
            json.loads((FIXTURES / "source.json").read_text()), ("SENT101.npz", "SENT105.npz")
        ):
            raw = np.load(FIXTURES / filename, allow_pickle=False)["frames"]
            result = self.engine.decode_frames(raw)
            self.assertEqual(result["translation"], row["translation"])
            self.assertIsNone(result["ctc_glosses"])
            self.assertEqual(result["input_source"], "observed_landmarks")
        self.assertNotEqual(row["reference"], result["translation"])

    def test_evaluation_counts_invalid_pose_rejection_and_does_not_hide_missing_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            raw = np.load(FIXTURES / "SENT101.npz", allow_pickle=False)["frames"]
            np.save(root / "valid.npy", raw)
            bad = raw.copy()
            bad[2, :75] = 0
            np.save(root / "invalid.npy", bad)
            supplied = root / "provided.json"
            supplied.write_text(
                json.dumps(
                    {
                        "predictions": [
                            {
                                "video_id": name,
                                "reference": "tôi bị đau đầu .",
                                "hypothesis": "tôi bị đau đầu .",
                            }
                            for name in ("valid", "invalid")
                        ]
                    }
                )
            )
            report = evaluate(root, supplied)
            self.assertEqual(report["metrics"]["clips"], 2)
            self.assertEqual(report["metrics"]["exact_matches"], 1)
            self.assertEqual(report["rejected_clips"], 1)
            (root / "invalid.npy").unlink()
            with self.assertRaises(FileNotFoundError):
                evaluate(root, supplied)

    def test_tampered_checkpoint_is_rejected_before_loading(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "fake.pt"
            path.write_bytes(b"wrong checkpoint")
            with self.assertRaisesRegex(ValueError, "checksum"):
                V2Engine(path)

    def test_shoulders_and_velocity_follow_verified_norm2(self):
        raw = np.load(FIXTURES / "SENT101.npz", allow_pickle=False)["frames"]
        processed = preprocess(raw).numpy()
        self.assertEqual(processed.shape, (len(raw), 822))
        np.testing.assert_allclose(processed[:, 27] + processed[:, 30], 0, atol=1e-5)
        np.testing.assert_allclose(processed[1:, 411:], np.diff(processed[:, :411], axis=0))
        np.testing.assert_array_equal(processed[0, 411:], 0)
        for bad in (np.zeros((8, 411)), np.zeros((7, 411)), np.full((8, 411), np.nan)):
            with self.assertRaises(ValueError):
                preprocess(bad)

    def test_partial_pose_loss_is_rejected_instead_of_extreme_normalized_features(self):
        raw = np.load(FIXTURES / "SENT101.npz", allow_pickle=False)["frames"].copy()
        raw[1:10, :75] = 0
        with self.assertRaisesRegex(ValueError, "shoulders"):
            preprocess(raw)
        raw = np.load(FIXTURES / "SENT101.npz", allow_pickle=False)["frames"].copy()
        raw[5, 30:32] = 0
        with self.assertRaisesRegex(ValueError, "shoulders"):
            preprocess(raw)

    def test_resampling_preserves_missing_groups_and_bounds(self):
        raw = np.zeros((30, 411))
        raw[:, :75] = 0.5
        result = prepare_sequence({"frames": raw.tolist(), "timestamps_ms": np.arange(30) * 40})
        self.assertEqual(result.shape, (35, 411))
        np.testing.assert_array_equal(result[:, 75:], 0)
        with self.assertRaises(ValueError):
            prepare_sequence({"frames": raw.tolist(), "timestamps_ms": [0] * 30})

    def test_exact_30fps_timestamps_do_not_drop_a_frame_due_to_roundoff(self):
        for count in (8, 24, 69, 70, 180, 300):
            frames = np.zeros((count, 411))
            result = prepare_sequence(
                {"frames": frames, "timestamps_ms": np.arange(count) * 1000 / 30}
            )
            self.assertEqual(len(result), count)

    def test_rest_and_static_input_do_not_call_the_decoder(self):
        engine = Mock()
        for raw in (np.zeros((30, 411)), np.full((30, 411), 0.5)):
            result = predict_request(
                engine, {"frames": raw.tolist(), "timestamps_ms": np.arange(30) * 40}
            )
            self.assertEqual(result["mean_token_probability"], 0)
        engine.decode_frames.assert_not_called()
        self.assertNotIn("frames", json.loads(respond(engine, '{"name":"not numeric frames"}')))


if __name__ == "__main__":
    unittest.main()
