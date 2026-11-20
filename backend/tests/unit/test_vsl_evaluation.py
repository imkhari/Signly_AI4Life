import copy
import io
import json
import pickle
import sys
from pathlib import Path
from typing import Any

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from AI_model.evaluation.checkpoint_audit import MetadataReader, audit_checkpoint  # noqa: E402
from AI_model.evaluation.evaluate import (  # noqa: E402
    evaluate,
    metrics,
    score_candidate,
    validate_dataset,
)
from AI_model.evaluation.synthetic_cases import dataset  # noqa: E402


def test_metrics_penalize_rejection_and_false_acceptance() -> None:
    report = metrics([
        {'expected': 'A', 'predicted': 'A'},
        {'expected': 'B', 'predicted': 'UNKNOWN'},
        {'expected': 'UNKNOWN', 'predicted': 'A'},
        {'expected': 'UNKNOWN', 'predicted': 'UNKNOWN'},
    ], ['A', 'B'])
    assert report['accuracy'] == 0.5
    assert report['coverage'] == 0.5
    assert report['false_accepts'] == 1
    assert report['false_accept_rate'] == 0.5
    assert report['macro_f1'] == pytest.approx(1 / 3)
    assert report['per_label']['B']['fn'] == 1


def test_unexpected_output_label_is_penalized_in_macro_f1() -> None:
    report = metrics([
        {'expected': 'A', 'predicted': 'A'},
        {'expected': 'UNKNOWN', 'predicted': 'OUTSIDE'},
    ], ['A'])
    assert report['macro_f1'] == 0.5
    assert report['scored_labels'] == ['A', 'OUTSIDE']


@pytest.mark.parametrize('change', ['signer', 'content', 'id', 'timestamp'])
def test_dataset_rejects_leakage_or_ambiguous_records(change: str) -> None:
    data = dataset()
    extra = copy.deepcopy(data['clips'][0])
    extra['clip_id'] = 'new-clip'
    extra['signer_id'] = 'separate-signer'
    extra['split'] = 'train'
    if change == 'signer':
        extra['signer_id'] = data['clips'][0]['signer_id']
    elif change == 'id':
        extra['clip_id'] = data['clips'][0]['clip_id']
    elif change == 'timestamp':
        data['clips'][0]['frames'][0]['timestamp_ms'] = -0.5
    data['clips'].append(extra)
    with pytest.raises(ValueError):
        validate_dataset(data)


def test_real_data_requires_declared_splits_and_permission() -> None:
    data = dataset()
    data['kind'] = 'consented_landmarks'
    with pytest.raises(ValueError, match='all split'):
        validate_dataset(data)
    data['kind'] = 'synthetic'
    data['license_or_consent'] = ''
    with pytest.raises(ValueError, match='permission'):
        validate_dataset(data)


def test_metadata_reader_rejects_unapproved_globals() -> None:
    payload = pickle.dumps(Path('/tmp/synthetic'))
    with pytest.raises(ValueError, match='Unsupported checkpoint global'):
        MetadataReader(io.BytesIO(payload)).load()
    assert audit_checkpoint(Path('/tmp/nonexistent-signly-checkpoint'))['exists'] is False


def test_synthetic_replay_reports_actual_temporal_rejection_and_errors() -> None:
    report: dict[str, Any] = evaluate(dataset())
    assert report['kind'] == 'synthetic'
    assert report['independent_signer_evaluation'] is False
    assert report['stabilizer_options']['minStabilityDurationMs'] == 500
    results = {row['clip_id']: row for row in report['clip_results']}
    assert results['synthetic-chest']['predicted'] == 'NGỰC'
    assert results['synthetic-chest']['first_candidate_delay_ms'] == 540
    assert results['synthetic-empty']['predicted'] == 'UNKNOWN'
    assert results['synthetic-collapsed']['predicted'] == 'UNKNOWN'
    assert report['stabilized_first_candidate']['false_accepts'] >= 1
    json.dumps(report, allow_nan=False)


def test_candidate_comparison_uses_manifest_truth_and_requires_complete_predictions() -> None:
    data = dataset()
    candidate: dict[str, Any] = {
        'model_name': 'test-only-perfect-predictions',
        'decision_policy': 'first_stable_candidate',
        'training_signers': [],
        'predictions': [
            {'clip_id': clip['clip_id'], 'predicted': clip['expected']}
            for clip in data['clips']
        ],
    }
    assert score_candidate(data, candidate)['metrics']['accuracy'] == 1
    candidate['predictions'].pop()
    with pytest.raises(ValueError, match='exactly once'):
        score_candidate(data, candidate)


def test_candidate_rejects_missing_training_metadata_or_heldout_signers() -> None:
    data = dataset()
    candidate: dict[str, Any] = {
        'model_name': 'test-only', 'decision_policy': 'first_stable_candidate',
    }
    with pytest.raises(ValueError, match='list of training_signers'):
        score_candidate(data, candidate)
    candidate['training_signers'] = [data['clips'][0]['signer_id']]
    with pytest.raises(ValueError, match='overlap held-out'):
        score_candidate(data, candidate)
