from typing import Any

import pytest

from app.api.ws.handlers import handle_ws_message
from app.infrastructure.session_store_memory import SessionData


class RecordingHub:
    def __init__(self) -> None:
        self.events: list[dict[str, Any]] = []

    async def broadcast(self, session_id: str, message: dict[str, Any]) -> None:
        self.events.append(message)

    async def send_to_role(self, session_id: str, role: str, message: dict[str, Any]) -> None:
        self.events.append(message)


def session() -> SessionData:
    result = SessionData('synthetic', 'TESTAA', 'synthetic-token')
    result.state_machine.on_patient_joined()
    return result


async def send(s: SessionData, hub: RecordingHub, role: str, event: str,
               payload: dict[str, Any]) -> None:
    await handle_ws_message(s, role, {'event': event, 'payload': payload}, hub)


async def summary(s: SessionData, hub: RecordingHub, severity: int = 3) -> None:
    await send(s, hub, 'patient', 'INPUT_UPDATED', {'patch': {
        'chief_complaint': {'code': 'PAIN', 'label_vi': 'Đau'},
        'pain': {'present': True, 'severity': severity, 'body_regions': ['CHEST']},
        'allergy': {'has_allergy': False}, 'extra_symptoms': ['COUGH'],
    }})
    await send(s, hub, 'patient', 'SUMMARY_REQUESTED', {})


@pytest.mark.asyncio
async def test_critical_ack_is_required_by_backend_and_verified_frame_is_immutable() -> None:
    s, hub = session(), RecordingHub()
    await summary(s, hub, 8)
    await send(s, hub, 'patient', 'PATIENT_CONFIRMED', {'decision': 'confirmed'})
    await send(s, hub, 'nurse', 'NURSE_VERIFIED', {'acknowledged_alerts': []})
    assert hub.events[-1]['event'] == 'ERROR'
    assert s.status == 'patient_confirmed'
    await send(s, hub, 'nurse', 'NURSE_VERIFIED', {
        'acknowledged_alerts': ['EMERGENCY_RED_FLAG'], 'queue_number': 1,
    })
    assert s.status == 'nurse_verified'
    snapshot = s.frame.model_dump()
    await send(s, hub, 'patient', 'INPUT_UPDATED', {'patch': {'pain': {'severity': 2}}})
    assert hub.events[-1]['event'] == 'ERROR'
    assert s.frame.model_dump() == snapshot
    assert s.summary is not None and s.summary.frame.pain.severity == 8


@pytest.mark.asyncio
async def test_false_pain_and_positive_severity_cannot_be_confirmed() -> None:
    s, hub = session(), RecordingHub()
    await send(s, hub, 'patient', 'INPUT_UPDATED', {
        'patch': {'pain': {'present': False, 'severity': 3}},
    })
    await send(s, hub, 'patient', 'SUMMARY_REQUESTED', {})
    await send(s, hub, 'patient', 'PATIENT_CONFIRMED', {'decision': 'confirmed'})
    assert hub.events[-1]['event'] == 'ERROR'
    assert s.status == 'summary_ready'


@pytest.mark.asyncio
async def test_question_reply_is_correlated_and_requires_fresh_confirmation() -> None:
    s, hub = session(), RecordingHub()
    await summary(s, hub)
    await send(s, hub, 'patient', 'PATIENT_CONFIRMED', {'decision': 'confirmed'})
    question = {'question_id': 'q-1', 'template_code': 'ASK_DRUG_ALLERGY'}
    await send(s, hub, 'nurse', 'NURSE_QUESTION', question)
    assert s.status == 'collecting'
    assert s.summary is None
    await send(s, hub, 'nurse', 'NURSE_QUESTION', question)
    assert hub.events[-1]['event'] == 'ERROR'
    await send(s, hub, 'patient', 'INPUT_UPDATED', {
        'reply_to': 'old-q', 'patch': {'allergy': {'has_allergy': True}},
    })
    assert hub.events[-1]['event'] == 'ERROR'
    assert s.frame.allergy.has_allergy is False
    reply = {'reply_to': 'q-1', 'patch': {'allergy': {'has_allergy': 'unsure'}}}
    await send(s, hub, 'patient', 'INPUT_UPDATED', reply)
    assert hub.events[-1]['payload']['step'] == 'nurse_reply'
    assert s.frame.allergy.has_allergy == 'unsure'
    assert s.pending_question is None
    await send(s, hub, 'patient', 'INPUT_UPDATED', reply)
    assert hub.events[-1]['event'] == 'ERROR'


@pytest.mark.asyncio
async def test_extra_symptom_survives_summary_and_nurse_handoff() -> None:
    s, hub = session(), RecordingHub()
    await summary(s, hub)
    assert s.summary is not None
    assert 'Ho' in s.summary.nl_text_vi
    assert any('Ho' in item.detail for item in s.summary.nurse_view.confirmed)
