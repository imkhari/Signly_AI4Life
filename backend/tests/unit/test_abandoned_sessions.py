import asyncio
from unittest.mock import AsyncMock

import pytest

from app.api.ws.hub import ConnectionManager
from app.application.abandoned_sessions import AbandonedSessions
from app.infrastructure.session_store_memory import InMemorySessionStore


class Connections:
    def __init__(self) -> None:
        self.active: set[str] = set()
        self.disconnected: dict[str, float] = {}

    def has_connections(self, session_id: str) -> bool:
        return session_id in self.active

    def disconnected_since(self, session_id: str) -> float | None:
        return self.disconnected.get(session_id)

    def prune_disconnected(self, live_ids: set[str]) -> None:
        self.disconnected = {key: value for key, value in self.disconnected.items()
                             if key in live_ids}


@pytest.mark.asyncio
async def test_orphan_cleanup_waits_full_deadline_and_revokes_pairing_code() -> None:
    store, connections = InMemorySessionStore(), Connections()
    session = await store.create_session('synthetic')
    code = session.pairing_code
    now = [0.0]
    cleaner = AbandonedSessions(store, connections, clock=lambda: now[0])
    assert await cleaner.sweep() == []
    now[0] = 599
    assert await cleaner.sweep() == []
    now[0] = 600
    assert await cleaner.sweep() == ['synthetic']
    assert await store.get_session('synthetic') is None
    assert await store.get_session_by_pairing_code(code) is None
    assert cleaner.absent_since == {}


@pytest.mark.asyncio
async def test_active_session_is_never_deleted_and_reconnect_restarts_the_deadline() -> None:
    store, connections = InMemorySessionStore(), Connections()
    await store.create_session('synthetic')
    now = [0.0]
    cleaner = AbandonedSessions(store, connections, clock=lambda: now[0])
    await cleaner.sweep()
    connections.active.add('synthetic')
    now[0] = 5000
    assert await cleaner.sweep() == []
    assert await store.get_session('synthetic') is not None
    connections.active.clear()
    connections.disconnected['synthetic'] = 5000
    now[0] = 5599
    assert await cleaner.sweep() == []
    now[0] = 5600
    assert await cleaner.sweep() == ['synthetic']


@pytest.mark.asyncio
async def test_brief_reconnect_between_sweeps_also_restarts_deadline() -> None:
    store, connections = InMemorySessionStore(), Connections()
    await store.create_session('synthetic')
    now = [0.0]
    cleaner = AbandonedSessions(store, connections, clock=lambda: now[0])
    await cleaner.sweep()
    connections.disconnected['synthetic'] = 590
    now[0] = 600
    assert await cleaner.sweep() == []
    now[0] = 1190
    assert await cleaner.sweep() == ['synthetic']


@pytest.mark.asyncio
async def test_manager_tracks_final_disconnect_and_clears_it_on_reconnect() -> None:
    manager = ConnectionManager()
    nurse, patient = AsyncMock(), AsyncMock()
    await manager.connect('synthetic', 'nurse', nurse)
    await manager.connect('synthetic', 'patient', patient)
    manager.disconnect('synthetic', 'patient', patient)
    assert manager.has_connections('synthetic')
    assert manager.disconnected_since('synthetic') is None
    manager.disconnect('synthetic', 'nurse', nurse)
    assert not manager.has_connections('synthetic')
    assert manager.disconnected_since('synthetic') is not None
    await manager.connect('synthetic', 'patient', patient)
    assert manager.disconnected_since('synthetic') is None


@pytest.mark.asyncio
async def test_lifespan_cancels_cleanup_worker_on_shutdown(monkeypatch) -> None:
    import app.main as main

    started, stopped = asyncio.Event(), asyncio.Event()

    async def observe(cleaner: AbandonedSessions) -> None:
        started.set()
        try:
            await asyncio.Event().wait()
        finally:
            stopped.set()

    monkeypatch.setattr(main, 'run_abandoned_cleanup', observe)
    async with main.lifespan(main.app):
        await started.wait()
        assert not stopped.is_set()
    assert stopped.is_set()
