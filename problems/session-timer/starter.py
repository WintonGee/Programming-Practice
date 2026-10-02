import time
from typing import Protocol


class Clock(Protocol):
    def now(self) -> int: ...


class SystemClock:
    def now(self) -> int:
        return int(time.time())


class SessionTimer:
    def __init__(self, clock: Clock) -> None:
        raise NotImplementedError

    def open_session(self, session_id: str, at: int) -> None:
        # Contributor begins a work session, as of timestamp `at`
        raise NotImplementedError

    def close_session(self, session_id: str, at: int) -> None:
        # Session ends, as of timestamp `at`
        raise NotImplementedError

    def complete_task(self, session_id: str, task_id: str, at: int) -> None:
        # A task was finished inside this session, at timestamp `at`
        raise NotImplementedError

    def get_session_elapsed(self, session_id: str) -> int:
        # Total tracked seconds. If the session is open, counts up to clock.now()
        raise NotImplementedError

    def get_tasks_completed(self, session_id: str) -> int:
        # How many tasks were completed in a given session
        raise NotImplementedError


def main() -> None:
    timer = SessionTimer(SystemClock())
    print("Hello, SessionTimer!", timer)


if __name__ == "__main__":
    main()
