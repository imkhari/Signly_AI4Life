import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import numpy as np
import torch

from AI_model.training.analysis import token_metrics
from AI_model.training.data import PREPROCESSING, audit, features
from AI_model.training.model import TinyTemporalCTC, decode
from AI_model.training.predict import predict


def skeleton(frames: int = 8) -> np.ndarray:
    points = np.zeros((frames, 137, 3), dtype=np.float32)
    points[:, 9] = (0.4, 0.5, 0.1)
    points[:, 10] = (0.6, 0.5, 0.1)
    points[:, 95] = (0.7, 0.6, 0.0)
    return points.reshape(frames, 411)


class PreprocessingTests(unittest.TestCase):
    def test_shoulders_and_missing_landmark_velocity(self) -> None:
        raw = skeleton()
        raw[3, 95 * 3 : 96 * 3] = 0
        output = features(raw).numpy()
        self.assertEqual(output.shape, (8, 822))
        self.assertAlmostEqual(float(output[0, 9 * 3]), -0.5, places=5)
        self.assertAlmostEqual(float(output[0, 10 * 3]), 0.5, places=5)
        self.assertTrue(np.all(output[:, 0:3] == 0))
        self.assertTrue(np.all(output[3:5, 411 + 95 * 3 : 411 + 96 * 3] == 0))

    def test_reject_invalid_shape_nonfinite_and_missing_shoulders(self) -> None:
        for raw in (np.zeros((5, 126)), np.zeros((5, 411)), np.full((5, 411), np.nan)):
            with self.subTest(shape=raw.shape), self.assertRaises(ValueError):
                features(raw)

    def test_downsampling_preserves_endpoints(self) -> None:
        raw = skeleton(400)
        raw[:, 285] = np.linspace(0.1, 0.8, 400)
        full = features(raw, max_frames=500)
        reduced = features(raw, max_frames=50)
        self.assertEqual(len(reduced), 50)
        torch.testing.assert_close(reduced[[0, -1], :411], full[[0, -1], :411])

    def test_audit_canonicalizes_ids_and_detects_signer_leakage(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "data/keypoints").mkdir(parents=True)
            rows = []
            for i, split in enumerate(("train", "val", "test")):
                identifier = f"SENT001_S{i + 1:02d}_R01_F" + (" " if i == 0 else "")
                raw = skeleton()
                raw[0, 300] = i + 1
                np.save(root / "data/keypoints" / f"{identifier}.npy", raw)
                rows.append({"id": identifier, "split": split, "gloss_sequence": ["A"]})
            metadata = root / "data/dataset.json"
            metadata.write_text(json.dumps(rows))
            digest = hashlib.sha256(metadata.read_bytes()).hexdigest()
            with patch("AI_model.training.data.METADATA_SHA256", digest):
                actual, report = audit(root)
            self.assertEqual(actual[0]["id"], "SENT001_S01_R01_F")
            self.assertEqual(len(report["canonicalized_ids"]), 1)
            rows[2]["gloss_sequence"] = [""]
            metadata.write_text(json.dumps(rows))
            digest = hashlib.sha256(metadata.read_bytes()).hexdigest()
            with patch("AI_model.training.data.METADATA_SHA256", digest):
                accepted, report = audit(root)
            self.assertEqual(len(accepted), 2)
            self.assertEqual(report["rejected_clips"], 1)
            self.assertEqual(report["rejected"][0]["reason"], "empty_gloss_label")
            rows[1]["id"] = "SENT002_S01_R01_F"
            metadata.write_text(json.dumps(rows))
            digest = hashlib.sha256(metadata.read_bytes()).hexdigest()
            with patch("AI_model.training.data.METADATA_SHA256", digest):
                with self.assertRaisesRegex(ValueError, "Signer leakage"):
                    audit(root)


class ModelTests(unittest.TestCase):
    def setUp(self) -> None:
        torch.manual_seed(42)
        torch.set_num_threads(1)

    def test_padding_does_not_change_valid_sequence_predictions(self) -> None:
        model = TinyTemporalCTC(3, width=32, layers=1).eval()
        short = features(skeleton(5))
        long = features(skeleton(8))
        batch = torch.nn.utils.rnn.pad_sequence([short, long], batch_first=True)
        with torch.no_grad():
            single = model(short.unsqueeze(0), torch.tensor([5]))
            together = model(batch, torch.tensor([5, 8]))
        torch.testing.assert_close(single[0], together[0, :5], atol=1e-6, rtol=1e-5)

    def test_token_alignment_counts_substitution_deletion_and_insertion(self) -> None:
        report = token_metrics(
            [
                {"expected_glosses": ["A", "B", "C"], "predicted_glosses": ["A", "X", "C", "D"]},
                {"expected_glosses": ["B"], "predicted_glosses": []},
            ]
        )
        self.assertEqual(report["per_label"]["A"]["tp"], 1)
        self.assertEqual(report["per_label"]["B"]["fn"], 2)
        self.assertEqual(report["per_label"]["D"]["fp"], 1)
        self.assertIsNone(report["per_label"]["D"]["recall"])
        self.assertEqual(report["per_label"]["X"]["precision"], 0)

    def test_ctc_decode_preserves_repeat_separated_by_blank(self) -> None:
        logits = torch.full((1, 5, 3), -9.0)
        for time, label in enumerate((1, 1, 0, 1, 2)):
            logits[0, time, label] = 0
        self.assertEqual(
            decode(logits, torch.tensor([5]), ["<blank>", "A", "B"]), [["A", "A", "B"]]
        )

    def test_prediction_depends_on_landmarks_not_sentence_filename(self) -> None:
        model = TinyTemporalCTC(3, width=32, layers=1)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            checkpoint = root / "test.pt"
            torch.save(
                {
                    "config": {
                        "architecture": "TinyTemporalCTC",
                        "preprocessing": PREPROCESSING,
                        "classes": 3,
                        "width": 32,
                        "layers": 1,
                    },
                    "tokens": ["<blank>", "A", "B"],
                    "state_dict": model.state_dict(),
                },
                checkpoint,
            )
            first, second = root / "SENT999.npy", root / "unseen.npy"
            np.save(first, skeleton())
            np.save(second, skeleton())
            a, b = predict(checkpoint, first), predict(checkpoint, second)
            self.assertEqual(a["gloss_sequence"], b["gloss_sequence"])
            self.assertEqual(a["input_source"], "observed_landmarks")
            self.assertEqual(a["engine_source"], "learned_model")
            self.assertFalse(a["clinical_or_patient_confirmation"])

    def test_finite_gradient_learning_and_checkpoint_roundtrip(self) -> None:
        model = TinyTemporalCTC(3, width=32, layers=1)
        optimizer = torch.optim.AdamW(model.parameters(), lr=0.01)
        values = features(skeleton()).unsqueeze(0)
        lengths = torch.tensor([8])
        criterion = torch.nn.CTCLoss(blank=0)
        losses = []
        for _ in range(10):
            optimizer.zero_grad()
            logits = model(values, lengths)
            loss = criterion(logits.transpose(0, 1), torch.tensor([1]), lengths, torch.tensor([1]))
            loss.backward()
            self.assertTrue(
                all(p.grad is None or torch.isfinite(p.grad).all() for p in model.parameters())
            )
            optimizer.step()
            losses.append(float(loss.detach()))
        self.assertLess(losses[-1], losses[0])
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "weights.pt"
            torch.save(model.state_dict(), path)
            restored = TinyTemporalCTC(3, width=32, layers=1)
            restored.load_state_dict(torch.load(path, weights_only=True), strict=True)
            torch.testing.assert_close(model(values, lengths), restored(values, lengths))


if __name__ == "__main__":
    unittest.main()
