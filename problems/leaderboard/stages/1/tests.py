from solution import Leaderboard


def test_add_returns_running_total():
    """add_score returns the player's new total each time."""
    board = Leaderboard()
    assert board.add_score("ann", 10) == 10
    assert board.add_score("ann", 5) == 15
    assert board.add_score("ann", 1) == 16


def test_get_score_after_adds():
    """get_score reports the accumulated total."""
    board = Leaderboard()
    board.add_score("ann", 7)
    board.add_score("ann", 8)
    assert board.get_score("ann") == 15


def test_unknown_player_is_zero():
    """A player who never scored reads as 0."""
    board = Leaderboard()
    assert board.get_score("ghost") == 0
    board.add_score("ann", 3)
    assert board.get_score("ghost") == 0


def test_players_are_independent():
    """Each player has a separate total."""
    board = Leaderboard()
    board.add_score("ann", 10)
    board.add_score("bob", 4)
    board.add_score("ann", 1)
    assert board.get_score("ann") == 11
    assert board.get_score("bob") == 4


def test_negative_points_subtract():
    """Negative points lower the total, even below zero."""
    board = Leaderboard()
    board.add_score("ann", 5)
    assert board.add_score("ann", -8) == -3
    assert board.get_score("ann") == -3


def test_zero_points():
    """Adding 0 points returns the unchanged total."""
    board = Leaderboard()
    assert board.add_score("ann", 0) == 0
    board.add_score("ann", 4)
    assert board.add_score("ann", 0) == 4


def test_reset_clears_score():
    """After reset the player reads as 0."""
    board = Leaderboard()
    board.add_score("ann", 12)
    board.reset("ann")
    assert board.get_score("ann") == 0


def test_score_after_reset_starts_over():
    """The first add after a reset starts from 0."""
    board = Leaderboard()
    board.add_score("ann", 12)
    board.reset("ann")
    assert board.add_score("ann", 3) == 3


def test_reset_only_affects_that_player():
    """Resetting one player leaves the others alone."""
    board = Leaderboard()
    board.add_score("ann", 12)
    board.add_score("bob", 9)
    board.reset("ann")
    assert board.get_score("bob") == 9


def test_reset_unknown_player_is_noop():
    """Resetting a player who isn't on the board does nothing and doesn't raise."""
    board = Leaderboard()
    board.reset("ghost")
    board.add_score("ann", 1)
    board.reset("ann")
    board.reset("ann")
    assert board.get_score("ann") == 0
    assert board.get_score("ghost") == 0


def test_names_are_case_sensitive():
    """'Ann' and 'ann' are different players."""
    board = Leaderboard()
    board.add_score("Ann", 5)
    board.add_score("ann", 2)
    assert board.get_score("Ann") == 5
    assert board.get_score("ann") == 2
