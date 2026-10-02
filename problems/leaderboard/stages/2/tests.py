from solution import Leaderboard


def _example():
    board = Leaderboard()
    board.add_score("dan", 50)
    board.add_score("bob", 40)
    board.add_score("amy", 40)
    board.add_score("cat", 10)
    return board


def test_top_orders_by_score():
    """Higher scores come first, formatted player(score)."""
    board = Leaderboard()
    board.add_score("low", 1)
    board.add_score("high", 30)
    board.add_score("mid", 20)
    assert board.top(3) == ["high(30)", "mid(20)", "low(1)"]


def test_top_ties_by_name():
    """Equal scores are ordered by player name ascending."""
    board = _example()
    assert board.top(4) == ["dan(50)", "amy(40)", "bob(40)", "cat(10)"]


def test_top_truncates_to_k():
    """Only the first k players are returned."""
    board = _example()
    assert board.top(2) == ["dan(50)", "amy(40)"]


def test_top_k_larger_than_board():
    """Asking for more players than exist returns everyone."""
    board = _example()
    assert board.top(100) == ["dan(50)", "amy(40)", "bob(40)", "cat(10)"]


def test_top_zero_and_empty():
    """top(0) and top on an empty board both return []."""
    assert Leaderboard().top(3) == []
    assert _example().top(0) == []


def test_top_includes_zero_and_negative_totals():
    """Players with 0 or negative totals are still on the board."""
    board = Leaderboard()
    board.add_score("neg", -5)
    board.add_score("zero", 0)
    board.add_score("pos", 2)
    assert board.top(5) == ["pos(2)", "zero(0)", "neg(-5)"]


def test_top_excludes_reset_players():
    """A reset player leaves the rankings until they score again."""
    board = _example()
    board.reset("dan")
    assert board.top(10) == ["amy(40)", "bob(40)", "cat(10)"]
    board.add_score("dan", 0)
    assert board.top(10) == ["amy(40)", "bob(40)", "cat(10)", "dan(0)"]


def test_rank_competition_style():
    """Tied players share the better rank and the next rank is skipped."""
    board = _example()
    assert board.rank("dan") == 1
    assert board.rank("amy") == 2
    assert board.rank("bob") == 2
    assert board.rank("cat") == 4


def test_rank_missing_player_is_none():
    """Players who were never added or were reset have no rank."""
    board = _example()
    assert board.rank("eve") is None
    board.reset("cat")
    assert board.rank("cat") is None


def test_rank_follows_score_changes():
    """Rank is computed from the current scores."""
    board = _example()
    board.add_score("cat", 45)
    assert board.rank("cat") == 1
    assert board.rank("dan") == 2
    assert board.rank("amy") == 3
    board.reset("dan")
    assert board.rank("cat") == 1
    assert board.rank("amy") == 2


def test_single_player_ranks_first():
    """A lone player, even with a negative score, is rank 1."""
    board = Leaderboard()
    board.add_score("solo", -2)
    assert board.rank("solo") == 1
    assert board.top(1) == ["solo(-2)"]
