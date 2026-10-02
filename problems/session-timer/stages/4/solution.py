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
    contributor: str | None
    # Active stretches as [start, end]; end is None while the stretch is running.
    intervals: list[list[int | None]] = field(default_factory=list)
    state: State = State.RUNNING
    # task_id -> timestamp of its first completion
    tasks: dict[str, int] = field(default_factory=dict)

    def elapsed_at(self, at: int) -> int:
        """Historical: every stretch is clipped to `at`."""
        total = 0
        for start, end in self.intervals:
            stop = at if end is None else min(end, at)
            total += max(0, stop - start)
        return total

    def elapsed_live(self, now: int) -> int:
        """Live: finished stretches count in full; only a running one is measured to now."""
        return sum((now if end is None else end) - start for start, end in self.intervals)


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
        if session.state is State.RUNNING:
            session.intervals[-1][1] = at

    def open_session(self, session_id: str, at: int, contributor: str | None = None) -> None:
        if session_id in self.sessions:
            raise ValueError(f"session {session_id} already exists")
        self.sessions[session_id] = Session(contributor=contributor, intervals=[[at, None]])
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
        session.intervals.append([at, None])
        session.state = State.RUNNING

    def complete_task(self, session_id: str, task_id: str, at: int) -> None:
        self._require(session_id, State.RUNNING).tasks.setdefault(task_id, at)

    def get_session_elapsed(self, session_id: str) -> int:
        return self._get(session_id).elapsed_live(self.clock.now())

    def get_session_elapsed_at(self, session_id: str, at: int) -> int:
        return self._get(session_id).elapsed_at(at)

    def get_tasks_completed(self, session_id: str) -> int:
        return len(self._get(session_id).tasks)

    def get_tasks_completed_between(self, session_id: str, start: int, end: int) -> int:
        return sum(1 for t in self._get(session_id).tasks.values() if start <= t < end)

    def _contributor_sessions(self, contributor: str) -> list[Session]:
        return [self.sessions[sid] for sid in self.by_contributor.get(contributor, [])]

    def get_contributor_elapsed(self, contributor: str) -> int:
        now = self.clock.now()
        return sum(s.elapsed_live(now) for s in self._contributor_sessions(contributor))

    def get_contributor_elapsed_at(self, contributor: str, at: int) -> int:
        return sum(s.elapsed_at(at) for s in self._contributor_sessions(contributor))

    def get_contributor_tasks(self, contributor: str) -> int:
        return len(set().union(*(s.tasks for s in self._contributor_sessions(contributor))))

    def top_contributors(self, n: int) -> list[str]:
        totals = {who: self.get_contributor_elapsed(who) for who in self.by_contributor}
        ranked = sorted(totals.items(), key=lambda kv: (-kv[1], kv[0]))
        return [f"{who}({seconds})" for who, seconds in ranked[:n]]
