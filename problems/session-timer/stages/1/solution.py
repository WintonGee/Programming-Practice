import time
from dataclasses import dataclass, field
from typing import Protocol


class Clock(Protocol):
    def now(self) -> int: ...


class SystemClock:
    def now(self) -> int:
        return int(time.time())


@dataclass
class Session:
    opened_at: int
    closed_at: int | None = None
    tasks: set[str] = field(default_factory=set)


class SessionTimer:
    def __init__(self, clock: Clock) -> None:
        self.clock = clock
        self.sessions: dict[str, Session] = {}

    def _get(self, session_id: str) -> Session:
        if session_id not in self.sessions:
            raise KeyError(session_id)
        return self.sessions[session_id]

    def _get_open(self, session_id: str) -> Session:
        session = self._get(session_id)
        if session.closed_at is not None:
            raise ValueError(f"session {session_id} is closed")
        return session

    def open_session(self, session_id: str, at: int) -> None:
        if session_id in self.sessions:
            raise ValueError(f"session {session_id} already exists")
        self.sessions[session_id] = Session(opened_at=at)

    def close_session(self, session_id: str, at: int) -> None:
        self._get_open(session_id).closed_at = at

    def complete_task(self, session_id: str, task_id: str, at: int) -> None:
        self._get_open(session_id).tasks.add(task_id)

    def get_session_elapsed(self, session_id: str) -> int:
        session = self._get(session_id)
        end = session.closed_at if session.closed_at is not None else self.clock.now()
        return end - session.opened_at

    def get_tasks_completed(self, session_id: str) -> int:
        return len(self._get(session_id).tasks)
