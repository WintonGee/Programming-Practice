from harness import raises
from solution import Leaderboard


def _example():
    board = Leaderboard()
    board.add_score_at("ann", 10, 5)
    board.add_score_at("bob", 7, 8)
    board.add_score_at("ann", -4, 12)
    return board


def test_add_score_at_returns_current_total():
    """add_score_at returns the new running total, like add_score."""
    board = Leaderboard()
    assert board.add_score_at("ann", 10, 5) == 10
    assert board.add_score_at("ann", -4, 12) == 6
    assert board.get_score("ann") == 6


def test_score_at_is_inclusive():
    """A change made exactly at `at` is counted."""
    board = _example()
    assert board.score_at("ann", 5) == 10
    assert board.score_at("ann", 12) == 6


def test_score_at_between_changes():
    """Between changes, the earlier total holds."""
    board = _example()
    assert board.score_at("ann", 11) == 10
    assert board.score_at("ann", 1_000) == 6


def test_score_at_before_first_change_is_zero():
    """Before a player's first change their historical score is 0."""
    board = _example()
    assert board.score_at("ann", 4) == 0
    assert board.score_at("bob", 7) == 0


def test_score_at_unknown_player_is_zero():
    """A player with no history reads as 0 at any time."""
    board = _example()
    assert board.score_at("ghost", 100) == 0


def test_same_timestamp_changes_all_count():
    """Several changes at one timestamp are all visible at that timestamp."""
    board = Leaderboard()
    board.add_score_at("ann", 3, 10)
    board.add_score_at("ann", 4, 10)
    board.add_score_at("bob", 1, 10)
    assert board.score_at("ann", 9) == 0
    assert board.score_at("ann", 10) == 7


def test_top_at_only_players_with_history():
    """top_at ranks historical totals and skips players who hadn't scored yet."""
    board = _example()
    assert board.top_at(5, 4) == []
    assert board.top_at(5, 6) == ["ann(10)"]
    assert board.top_at(5, 12) == ["bob(7)", "ann(6)"]
    assert board.top_at(1, 8) == ["ann(10)"]


def test_top_at_ties_and_zero_totals():
    """top_at breaks ties by name and keeps players whose total was 0."""
    board = Leaderboard()
    board.add_score_at("cat", 5, 1)
    board.add_score_at("amy", 5, 2)
    board.add_score_at("bob", 0, 3)
    assert board.top_at(3, 3) == ["amy(5)", "cat(5)", "bob(0)"]


def test_untimed_add_uses_latest_timestamp():
    """add_score records at the latest timestamp seen, or 0 before any."""
    board = Leaderboard()
    board.add_score("zed", 2)
    assert board.score_at("zed", 0) == 2
    board.add_score_at("ann", 10, 5)
    board.add_score_at("bob", 7, 12)
    assert board.add_score("ann", 1) == 11
    assert board.score_at("ann", 11) == 10
    assert board.score_at("ann", 12) == 11
    board.add_score_at("ann", 1, 12)
    assert board.get_score("ann") == 12


def test_backwards_timestamp_raises():
    """A timestamp earlier than the latest raises ValueError and changes nothing."""
    board = _example()
    with raises(ValueError):
        board.add_score_at("cat", 3, 9)
    assert board.get_score("cat") == 0
    assert board.top(5) == ["bob(7)", "ann(6)"]
    assert board.add_score_at("cat", 3, 12) == 3


def test_reset_erases_history():
    """After reset, every historical query sees the player as absent."""
    board = _example()
    board.reset("ann")
    assert board.score_at("ann", 5) == 0
    assert board.top_at(5, 100) == ["bob(7)"]
    board.add_score_at("ann", 1, 20)
    assert board.score_at("ann", 12) == 0
    assert board.score_at("ann", 20) == 1


def test_live_queries_still_work():
    """top, rank and get_score reflect the latest totals."""
    board = _example()
    board.add_score_at("cat", 6, 15)
    assert board.top(3) == ["bob(7)", "ann(6)", "cat(6)"]
    assert board.rank("cat") == 2
    assert board.get_score("ann") == 6
