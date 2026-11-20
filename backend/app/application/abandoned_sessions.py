"""Bound abandoned RAM sessions without treating heartbeats as patient activity."""

import asyncio
import time
from collections.abc import Callable
from typing import Protocol

from app.infrastructure.session_store_memory import InMemorySessionStore


class ConnectionPresence(Protocol):
    def has_connections(self, session_id: str) -> bool: ...
    def disconnected_since(self, session_id: str) -> float | None: ...
    def prune_disconnected(self, live_ids: set[str]) -> None: ...


class AbandonedSessions:
    def __init__(
        self, store: InMemorySessionStore, connections: ConnectionPresence,
        timeout_seconds: float = 600, clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self.store = store
        self.connections = connections
        self.timeout_seconds = timeout_seconds
        self.clock = clock
        self.absent_since: dict[str, float] = {}

    async def sweep(self) -> list[str]:
        live_ids = self.store.session_ids()
        self.connections.prune_disconnected(live_ids)
        for session_id in set(self.absent_since) - live_ids:
            del self.absent_since[session_id]
        now = self.clock()
        removed = []
        for session_id in live_ids:
            if self.connections.has_connections(session_id):
                self.absent_since.pop(session_id, None)
                continue
            disconnected = self.connections.disconnected_since(session_id)
            if disconnected is not None:
                self.absent_since[session_id] = disconnected
            since = self.absent_since.setdefault(session_id, now)
            if now - since >= self.timeout_seconds:
                await self.store.remove_session(session_id)
                self.absent_since.pop(session_id, None)
                removed.append(session_id)
        self.connections.prune_disconnected(self.store.session_ids())
        return removed


async def run_abandoned_cleanup(cleaner: AbandonedSessions) -> None:
    while True:
        await cleaner.sweep()
        await asyncio.sleep(30)
