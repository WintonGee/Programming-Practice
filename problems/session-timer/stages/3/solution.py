import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Protocol


class Clock(Protocol):
    def now(self) -> int: ...


class SystemClock:
    def now(self) -> int:
        return int(time.time())


class State(Enum):
    RUNNING = "running"
    PAUSED = "paused"
    CLOSED = "closed"


@dataclass
class Session:
    running_since: int | None
    contributor: str | None = None
    accumulated: int = 0
    state: State = State.RUNNING
    tasks: set[str] = field(default_factory=set)


class SessionTimer:
    def __init__(self, clock: Clock) -> None:
        self.clock = clock
        self.sessions: dict[str, Session] = {}
        self.by_contributor: dict[str, list[str]] = {}

    def _get(self, session_id: str) -> Session:
        if session_id not in self.sessions:
            raise KeyError(session_id)
        return self.sessions[session_id]

    def _require(self, session_id: str, *allowed: State) -> Session:
        session = self._get(session_id)
        if session.state not in allowed:
            raise ValueError(f"session {session_id} is {session.state.value}")
        return session

    def _stop_running(self, session: Session, at: int) -> None:
        if session.running_since is not None:
            session.accumulated += at - session.running_since
            session.running_since = None

    def open_session(self, session_id: str, at: int, contributor: str | None = None) -> None:
        if session_id in self.sessions:
            raise ValueError(f"session {session_id} already exists")
        self.sessions[session_id] = Session(running_since=at, contributor=contributor)
        if contributor is not None:
            self.by_contributor.setdefault(contributor, []).append(session_id)

    def close_session(self, session_id: str, at: int) -> None:
        session = self._require(session_id, State.RUNNING, State.PAUSED)
        self._stop_running(session, at)
        session.state = State.CLOSED

    def pause_session(self, session_id: str, at: int) -> None:
        session = self._require(session_id, State.RUNNING)
        self._stop_running(session, at)
        session.state = State.PAUSED

    def resume_session(self, session_id: str, at: int) -> None:
        session = self._require(session_id, State.PAUSED)
        session.running_since = at
        session.state = State.RUNNING

    def complete_task(self, session_id: str, task_id: str, at: int) -> None:
        self._require(session_id, State.RUNNING).tasks.add(task_id)

    def get_session_elapsed(self, session_id: str) -> int:
        session = self._get(session_id)
        if session.running_since is None:
            return session.accumulated
        return session.accumulated + self.clock.now() - session.running_since

    def get_tasks_completed(self, session_id: str) -> int:
        return len(self._get(session_id).tasks)

    def get_contributor_elapsed(self, contributor: str) -> int:
        return sum(self.get_session_elapsed(sid) for sid in self.by_contributor.get(contributor, []))

    def get_contributor_tasks(self, contributor: str) -> int:
        sessions = (self.sessions[sid] for sid in self.by_contributor.get(contributor, []))
        return len(set().union(*(s.tasks for s in sessions)))

    def top_contributors(self, n: int) -> list[str]:
        totals = {who: self.get_contributor_elapsed(who) for who in self.by_contributor}
        ranked = sorted(totals.items(), key=lambda kv: (-kv[1], kv[0]))
        return [f"{who}({seconds})" for who, seconds in ranked[:n]]
