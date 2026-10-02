from harness import FakeClock, raises
from solution import SessionTimer


def test_paused_time_not_counted():
    """Time spent paused is excluded from elapsed."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 0)
    timer.pause_session("s1", 30)
    timer.resume_session("s1", 100)
    timer.close_session("s1", 130)
    assert timer.get_session_elapsed("s1") == 60


def test_elapsed_frozen_while_paused():
    """A paused session does not grow as the clock advances."""
    clock = FakeClock(0)
    timer = SessionTimer(clock)
    timer.open_session("s1", 0)
    timer.pause_session("s1", 40)
    clock.set(500)
    assert timer.get_session_elapsed("s1") == 40


def test_resumed_session_counts_to_now():
    """After resuming, elapsed grows with the clock again."""
    clock = FakeClock(0)
    timer = SessionTimer(clock)
    timer.open_session("s1", 0)
    timer.pause_session("s1", 10)
    timer.resume_session("s1", 50)
    clock.set(75)
    assert timer.get_session_elapsed("s1") == 35


def test_many_pauses():
    """Multiple pause/resume cycles accumulate correctly."""
    clock = FakeClock(0)
    timer = SessionTimer(clock)
    timer.open_session("s1", 0)
    for start in range(0, 100, 20):
        # active 10s, paused 10s, repeated
        timer.pause_session("s1", start + 10)
        timer.resume_session("s1", start + 20)
    timer.close_session("s1", 105)
    assert timer.get_session_elapsed("s1") == 55


def test_close_while_paused():
    """Closing a paused session ends it at the pause; the break never counts."""
    clock = FakeClock(0)
    timer = SessionTimer(clock)
    timer.open_session("s1", 0)
    timer.pause_session("s1", 25)
    timer.close_session("s1", 90)
    clock.set(1000)
    assert timer.get_session_elapsed("s1") == 25


def test_pause_twice_raises():
    """A session that is already paused cannot be paused again."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 0)
    timer.pause_session("s1", 5)
    with raises(ValueError):
        timer.pause_session("s1", 6)


def test_resume_running_raises():
    """Only a paused session can be resumed."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 0)
    with raises(ValueError):
        timer.resume_session("s1", 5)


def test_pause_resume_closed_raises():
    """Closed sessions cannot be paused or resumed."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 0)
    timer.close_session("s1", 10)
    with raises(ValueError):
        timer.pause_session("s1", 11)
    with raises(ValueError):
        timer.resume_session("s1", 12)


def test_pause_resume_unknown_raises():
    """Unknown sessions raise KeyError."""
    timer = SessionTimer(FakeClock(0))
    with raises(KeyError):
        timer.pause_session("ghost", 1)
    with raises(KeyError):
        timer.resume_session("ghost", 1)


def test_no_tasks_while_paused():
    """complete_task on a paused session raises and is not recorded."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 0)
    timer.complete_task("s1", "t1", 1)
    timer.pause_session("s1", 2)
    with raises(ValueError):
        timer.complete_task("s1", "t2", 3)
    timer.resume_session("s1", 4)
    timer.complete_task("s1", "t3", 5)
    assert timer.get_tasks_completed("s1") == 2


def test_pause_at_open_time():
    """Pausing at the same instant as opening tracks zero seconds."""
    clock = FakeClock(0)
    timer = SessionTimer(clock)
    timer.open_session("s1", 0)
    timer.pause_session("s1", 0)
    clock.set(50)
    assert timer.get_session_elapsed("s1") == 0
