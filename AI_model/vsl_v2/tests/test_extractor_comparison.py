import unittest

import numpy as np

from AI_model.vsl_v2.compare_extractors import differences
from AI_model.vsl_v2.legacy_extract import selected_indices


class ExtractorComparisonTests(unittest.TestCase):
    def test_missing_groups_are_reported_without_comparing_zeros_to_observed_points(self):
        legacy = np.full((8, 411), 0.5)
        browser = legacy.copy()
        browser[:, 348:] = 0
        groups = differences(legacy, browser)
        self.assertEqual(groups["right_hand"]["legacy_present_frames"], 8)
        self.assertEqual(groups["right_hand"]["browser_present_frames"], 0)
        self.assertIsNone(groups["right_hand"]["mean_abs_xyz_difference"])
        self.assertEqual(groups["pose"]["mean_abs_xyz_difference"], 0)

    def test_misaligned_frames_and_non_finite_data_fail(self):
        with self.assertRaises(ValueError):
            differences(np.zeros((8, 411)), np.zeros((9, 411)))
        invalid = np.zeros((8, 411))
        invalid[0, 0] = float("nan")
        with self.assertRaises(ValueError):
            differences(invalid, invalid)

    def test_legacy_selection_is_read_from_pinned_source_without_executing_it(self):
        indices = selected_indices()
        self.assertEqual(len(indices["POSE_LANDMARKS"]), 25)
        self.assertEqual(indices["POSE_LANDMARKS"][9:11], [11, 12])
        self.assertEqual(len(indices["FACE_LANDMARKS"]), 70)
