from harness import FakeClock
from solution import SessionTimer


def _example():
    clock = FakeClock(0)
    timer = SessionTimer(clock)
    timer.open_session("s1", 0, "alice")
    timer.open_session("s2", 0, "bob")
    timer.open_session("s3", 10, "alice")
    timer.open_session("s4", 0)
    timer.close_session("s1", 30)
    timer.close_session("s2", 50)
    clock.set(40)
    return clock, timer


def test_two_argument_open_still_works():
    """Sessions opened without a contributor behave exactly as before."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 0)
    timer.close_session("s1", 12)
    assert timer.get_session_elapsed("s1") == 12


def test_contributor_elapsed_sums_sessions():
    """Contributor time sums all of their sessions, open ones measured to now."""
    _, timer = _example()
    assert timer.get_contributor_elapsed("alice") == 60
    assert timer.get_contributor_elapsed("bob") == 50


def test_contributor_elapsed_tracks_clock():
    """Open sessions keep growing a contributor's total."""
    clock, timer = _example()
    clock.set(100)
    assert timer.get_contributor_elapsed("alice") == 120


def test_contributor_elapsed_respects_pauses():
    """Paused time is excluded from contributor totals too."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 0, "carol")
    timer.pause_session("s1", 10)
    timer.resume_session("s1", 90)
    timer.close_session("s1", 100)
    assert timer.get_contributor_elapsed("carol") == 20


def test_unknown_contributor_is_zero():
    """A contributor with no sessions reports zero time and tasks."""
    _, timer = _example()
    assert timer.get_contributor_elapsed("zed") == 0
    assert timer.get_contributor_tasks("zed") == 0


def test_contributor_tasks_distinct_across_sessions():
    """The same task id in two sessions of one contributor counts once."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 0, "alice")
    timer.open_session("s2", 0, "alice")
    timer.open_session("s3", 0, "bob")
    timer.complete_task("s1", "t1", 1)
    timer.complete_task("s1", "t2", 2)
    timer.complete_task("s2", "t2", 3)
    timer.complete_task("s2", "t3", 4)
    timer.complete_task("s3", "t1", 5)
    assert timer.get_contributor_tasks("alice") == 3
    assert timer.get_contributor_tasks("bob") == 1
    assert timer.get_tasks_completed("s2") == 2


def test_top_contributors_format_and_order():
    """Top contributors are formatted name(seconds), highest first."""
    _, timer = _example()
    assert timer.top_contributors(5) == ["alice(60)", "bob(50)"]


def test_top_contributors_truncates():
    """Only the first n contributors are returned."""
    _, timer = _example()
    assert timer.top_contributors(1) == ["alice(60)"]


def test_top_contributors_ties_by_name():
    """Equal totals are ordered by contributor id ascending."""
    timer = SessionTimer(FakeClock(0))
    for sid, who in [("s1", "dan"), ("s2", "amy"), ("s3", "cat"), ("s4", "bea")]:
        timer.open_session(sid, 0, who)
        timer.close_session(sid, 10 if who != "bea" else 99)
    assert timer.top_contributors(4) == ["bea(99)", "amy(10)", "cat(10)", "dan(10)"]


def test_top_contributors_includes_zero_totals():
    """A contributor whose sessions tracked 0 seconds still appears."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("s1", 5, "zero")
    timer.close_session("s1", 5)
    timer.open_session("s2", 0, "busy")
    timer.close_session("s2", 7)
    assert timer.top_contributors(10) == ["busy(7)", "zero(0)"]


def test_top_contributors_ignores_anonymous():
    """Anonymous sessions never appear in contributor rankings."""
    timer = SessionTimer(FakeClock(0))
    timer.open_session("anon", 0)
    timer.close_session("anon", 1000)
    assert timer.top_contributors(3) == []
