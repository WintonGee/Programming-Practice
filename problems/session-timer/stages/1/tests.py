from harness import FakeClock, raises
from solution import SessionTimer


def test_closed_session_elapsed():
    """A closed session reports close minus open."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 10)
    timer.close_session("s1", 70)
    assert timer.get_session_elapsed("s1") == 60


def test_open_session_counts_to_now():
    """An open session is measured up to clock.now()."""
    clock = FakeClock(100)
    timer = SessionTimer(clock)
    timer.open_session("s1", 100)
    assert timer.get_session_elapsed("s1") == 0
    clock.set(145)
    assert timer.get_session_elapsed("s1") == 45
    clock.advance(15)
    assert timer.get_session_elapsed("s1") == 60


def test_closed_session_ignores_clock():
    """Once closed, elapsed time stops changing."""
    clock = FakeClock(0)
    timer = SessionTimer(clock)
    timer.open_session("s1", 0)
    timer.close_session("s1", 30)
    clock.set(10_000)
    assert timer.get_session_elapsed("s1") == 30


def test_count_tasks():
    """Distinct tasks are counted per session."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 0)
    timer.complete_task("s1", "t1", 5)
    timer.complete_task("s1", "t2", 6)
    timer.complete_task("s1", "t3", 7)
    assert timer.get_tasks_completed("s1") == 3


def test_duplicate_task_counts_once():
    """Completing the same task twice in one session counts once."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 0)
    timer.complete_task("s1", "t1", 5)
    timer.complete_task("s1", "t1", 9)
    assert timer.get_tasks_completed("s1") == 1


def test_sessions_are_independent():
    """Tasks and time are tracked separately for each session."""
    clock = FakeClock(0)
    timer = SessionTimer(clock)
    timer.open_session("a", 0)
    timer.open_session("b", 20)
    timer.complete_task("a", "t1", 25)
    timer.complete_task("b", "t1", 25)
    timer.complete_task("b", "t2", 26)
    timer.close_session("a", 50)
    clock.set(80)
    assert timer.get_session_elapsed("a") == 50
    assert timer.get_session_elapsed("b") == 60
    assert timer.get_tasks_completed("a") == 1
    assert timer.get_tasks_completed("b") == 2


def test_new_session_has_no_tasks():
    """A brand-new session has completed zero tasks."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 0)
    assert timer.get_tasks_completed("s1") == 0


def test_zero_timestamps():
    """Timestamp 0 is a real time, not 'missing'."""
    clock = FakeClock(0)
    timer = SessionTimer(clock)
    timer.open_session("s1", 0)
    timer.close_session("s1", 0)
    clock.set(99)
    assert timer.get_session_elapsed("s1") == 0


def test_reopen_existing_id_raises():
    """Session ids can never be reused, even after closing."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 0)
    with raises(ValueError):
        timer.open_session("s1", 1)
    timer.close_session("s1", 2)
    with raises(ValueError):
        timer.open_session("s1", 3)


def test_unknown_session_raises_key_error():
    """Every operation on an unknown session raises KeyError."""
    timer = SessionTimer(FakeClock(0))
    with raises(KeyError):
        timer.close_session("nope", 1)
    with raises(KeyError):
        timer.complete_task("nope", "t1", 1)
    with raises(KeyError):
        timer.get_session_elapsed("nope")
    with raises(KeyError):
        timer.get_tasks_completed("nope")


def test_closed_session_rejects_changes():
    """A closed session cannot be closed again or receive tasks."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 0)
    timer.close_session("s1", 10)
    with raises(ValueError):
        timer.close_session("s1", 11)
    with raises(ValueError):
        timer.complete_task("s1", "t1", 12)
    assert timer.get_tasks_completed("s1") == 0
