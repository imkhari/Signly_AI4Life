import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

import numpy as np

from AI_model.vsl_v2.robustness import load_public, probe, variants


class RobustnessTests(unittest.TestCase):
    def setUp(self):
        self.raw = np.load(Path(__file__).with_name("fixtures") / "SENT101.npz",
                           allow_pickle=False)["frames"]

    def test_variants_preserve_input_and_sampling_timestamps(self):
        original = self.raw.copy()
        cases = {name: (frames, times) for name, frames, times in variants(self.raw)}
        self.assertEqual(len(cases), 17)
        for name, (frames, times) in cases.items():
            self.assertEqual(frames.shape, (len(times), 411), name)
            self.assertTrue((np.diff(times) > 0).all(), name)
        for fps in (15, 20, 24):
            frames, times = cases[f"sample_{fps}fps"]
            np.testing.assert_array_equal(frames[[0, -1]], original[[0, -1]])
            self.assertEqual(times[-1], (len(original) - 1) * 1000 / 30)
        np.testing.assert_array_equal(self.raw, original)
        cases["source_30fps"][0][:] = 0
        np.testing.assert_array_equal(self.raw, original)

    def test_holds_are_explicit_endpoint_repeats_and_speed_changes_only_time(self):
        cases = {name: (frames, times) for name, frames, times in variants(self.raw)}
        held, _ = cases["endpoint_holds_0.5s_each"]
        np.testing.assert_array_equal(held[15:-15], self.raw)
        np.testing.assert_array_equal(held[0], self.raw[0])
        np.testing.assert_array_equal(held[-1], self.raw[-1])
        frames, times = cases["duration_x2"]
        np.testing.assert_array_equal(frames, self.raw)
        np.testing.assert_allclose(times, cases["source_30fps"][1] * 2)

    def test_malformed_or_unknown_public_sources_cannot_enter_the_report(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with self.assertRaisesRegex(ValueError, "predefined"):
                load_public(root, "../../private")
            (root / "SENT101_S06_R01_F.npy").write_bytes(b"changed public data")
            with self.assertRaisesRegex(ValueError, "checksum"):
                load_public(root, "SENT101_S06_R01_F")

    def test_missing_hands_and_shoulders_reject_without_publishing_a_suggestion(self):
        engine = Mock()
        cases = {name: (frames, times) for name, frames, times in variants(self.raw)}
        hands, times = cases["both_hands_missing"]
        result = probe(engine, hands, times)
        self.assertEqual(result["label"], "UNKNOWN")
        self.assertEqual(result["diagnostic_code"], "hand_motion_unclear")
        engine.decode_frames.assert_not_called()
        # The real preprocessor's shoulder check is already covered in test_v2.py.
        engine.decode_frames.side_effect = ValueError("Missing shoulders")
        result = probe(engine, *cases["one_frame_missing_shoulder"])
        self.assertEqual(result["diagnostic_code"], "invalid_input")

    def test_report_label_comes_only_from_observed_inference_and_is_json_safe(self):
        engine = Mock()
        engine.decode_frames.return_value = {
            "translation": "tôi bị sốt .", "mean_token_probability": .95,
        }
        result = probe(engine, self.raw, np.arange(len(self.raw)) * 1000 / 30)
        self.assertEqual(result["label"], "FEVER")
        self.assertNotIn("translation", result)
        self.assertNotIn("frames", result)
        json.dumps(result, allow_nan=False)


if __name__ == "__main__":
    unittest.main()
