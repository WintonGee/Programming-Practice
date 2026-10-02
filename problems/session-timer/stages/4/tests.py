from harness import FakeClock, raises
from solution import SessionTimer


def _paused_session():
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 100, "alice")
    timer.pause_session("s1", 130)
    timer.resume_session("s1", 200)
    timer.close_session("s1", 220)
    return timer


def test_elapsed_at_before_open():
    """Before the session opened, nothing was tracked."""
    timer = _paused_session()
    assert timer.get_session_elapsed_at("s1", 50) == 0
    assert timer.get_session_elapsed_at("s1", 100) == 0


def test_elapsed_at_mid_stretch():
    """Partway through an active stretch counts only up to `at`."""
    timer = _paused_session()
    assert timer.get_session_elapsed_at("s1", 115) == 15
    assert timer.get_session_elapsed_at("s1", 210) == 40


def test_elapsed_at_during_pause():
    """During a pause the historical value is frozen."""
    timer = _paused_session()
    assert timer.get_session_elapsed_at("s1", 130) == 30
    assert timer.get_session_elapsed_at("s1", 160) == 30
    assert timer.get_session_elapsed_at("s1", 200) == 30


def test_elapsed_at_after_close():
    """After closing, the historical value equals the final total."""
    timer = _paused_session()
    assert timer.get_session_elapsed_at("s1", 220) == 50
    assert timer.get_session_elapsed_at("s1", 10_000) == 50
    assert timer.get_session_elapsed("s1") == 50


def test_elapsed_at_running_session():
    """A still-running stretch is measured up to `at`, even past now."""
    clock = FakeClock(0)
    timer = SessionTimer(clock)
    timer.open_session("s1", 0)
    clock.set(10)
    assert timer.get_session_elapsed_at("s1", 5) == 5
    assert timer.get_session_elapsed_at("s1", 25) == 25
    assert timer.get_session_elapsed("s1") == 10


def test_elapsed_at_unknown_raises():
    """Unknown sessions raise KeyError."""
    timer = SessionTimer(FakeClock(0))
    with raises(KeyError):
        timer.get_session_elapsed_at("ghost", 5)
    with raises(KeyError):
        timer.get_tasks_completed_between("ghost", 0, 5)


def test_contributor_elapsed_at():
    """Contributor history sums each session's history."""
    timer = _paused_session()
    timer.open_session("s2", 150, "alice")
    timer.close_session("s2", 170)
    timer.open_session("s3", 0, "bob")
    timer.close_session("s3", 300)
    assert timer.get_contributor_elapsed_at("alice", 160) == 40
    assert timer.get_contributor_elapsed_at("alice", 1000) == 70
    assert timer.get_contributor_elapsed_at("bob", 160) == 160
    assert timer.get_contributor_elapsed_at("nobody", 160) == 0


def test_tasks_between_half_open():
    """The window includes `start` and excludes `end`."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 0)
    timer.complete_task("s1", "a", 10)
    timer.complete_task("s1", "b", 20)
    timer.complete_task("s1", "c", 30)
    assert timer.get_tasks_completed_between("s1", 10, 30) == 2
    assert timer.get_tasks_completed_between("s1", 0, 100) == 3
    assert timer.get_tasks_completed_between("s1", 11, 20) == 0
    assert timer.get_tasks_completed_between("s1", 30, 31) == 1


def test_tasks_between_uses_first_completion():
    """A repeated task is placed at the time it was first completed."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 0)
    timer.complete_task("s1", "a", 5)
    timer.complete_task("s1", "a", 50)
    assert timer.get_tasks_completed_between("s1", 40, 60) == 0
    assert timer.get_tasks_completed_between("s1", 0, 10) == 1
    assert timer.get_tasks_completed("s1") == 1


def test_history_does_not_change_live_values():
    """Historical queries are read-only."""
    clock = FakeClock(0)
    timer = SessionTimer(clock)
    timer.open_session("s1", 0, "amy")
    timer.pause_session("s1", 10)
    timer.resume_session("s1", 20)
    clock.set(50)
    timer.get_session_elapsed_at("s1", 15)
    timer.get_contributor_elapsed_at("amy", 5)
    assert timer.get_session_elapsed("s1") == 40
    assert timer.top_contributors(1) == ["amy(40)"]
