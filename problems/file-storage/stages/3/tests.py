from solution import CloudStorage


def test_add_user():
    """Users are created once; duplicates and the reserved admin id are rejected."""
    storage = CloudStorage()
    assert storage.add_user("alice", 1_000) is True
    assert storage.add_user("alice", 50) is False
    assert storage.add_user("admin", 50) is False


def test_add_file_by_returns_remaining():
    """Each added file reduces the owner's remaining capacity."""
    storage = CloudStorage()
    storage.add_user("alice", 1_000)
    assert storage.add_file_by("alice", "a.txt", 400) == 600
    assert storage.add_file_by("alice", "b.txt", 150) == 450
    assert storage.get_file_size("a.txt") == 400


def test_capacity_limit_is_inclusive():
    """A file may fill capacity exactly, but not exceed it."""
    storage = CloudStorage()
    storage.add_user("alice", 100)
    assert storage.add_file_by("alice", "big.txt", 101) is None
    assert storage.get_file_size("big.txt") is None
    assert storage.add_file_by("alice", "fit.txt", 100) == 0
    assert storage.add_file_by("alice", "one.txt", 1) is None
    assert storage.add_file_by("alice", "zero.txt", 0) == 0


def test_add_file_by_unknown_user():
    """Unknown users and the admin id cannot use add_file_by."""
    storage = CloudStorage()
    assert storage.add_file_by("ghost", "a.txt", 1) is None
    assert storage.add_file_by("admin", "a.txt", 1) is None
    assert storage.get_file_size("a.txt") is None


def test_add_file_by_name_taken():
    """A name owned by anyone, including admin, cannot be reused."""
    storage = CloudStorage()
    storage.add_user("alice", 1_000)
    storage.add_user("bob", 1_000)
    storage.add_file("shared.txt", 5)
    storage.add_file_by("bob", "bob.txt", 5)
    assert storage.add_file_by("alice", "shared.txt", 1) is None
    assert storage.add_file_by("alice", "bob.txt", 1) is None
    assert storage.add_file("bob.txt", 1) is False
    assert storage.add_file_by("alice", "mine.txt", 1) == 999


def test_admin_is_unlimited():
    """Files added with add_file never hit a capacity limit."""
    storage = CloudStorage()
    assert storage.add_file("huge1.bin", 10**12) is True
    assert storage.add_file("huge2.bin", 10**12) is True
    assert storage.get_n_largest("huge", 5) == ["huge1.bin(1000000000000)", "huge2.bin(1000000000000)"]


def test_delete_frees_capacity():
    """Deleting a user's file gives the space back to its owner."""
    storage = CloudStorage()
    storage.add_user("alice", 100)
    storage.add_file_by("alice", "a.txt", 80)
    assert storage.delete_file("a.txt") == 80
    assert storage.add_file_by("alice", "b.txt", 90) == 10


def test_merge_combines_capacity_and_files():
    """Merging adds capacities, moves files, and returns user 1's remaining capacity."""
    storage = CloudStorage()
    storage.add_user("alice", 1_000)
    storage.add_user("bob", 500)
    storage.add_file_by("alice", "a.txt", 400)
    storage.add_file_by("bob", "c.txt", 200)
    assert storage.merge_user("alice", "bob") == 900
    assert storage.get_file_size("c.txt") == 200
    assert storage.add_file_by("alice", "d.txt", 900) == 0


def test_merged_files_count_against_new_owner():
    """After a merge, deleting a moved file frees space for user 1."""
    storage = CloudStorage()
    storage.add_user("alice", 100)
    storage.add_user("bob", 100)
    storage.add_file_by("bob", "b.txt", 100)
    storage.merge_user("alice", "bob")
    storage.delete_file("b.txt")
    assert storage.add_file_by("alice", "a.txt", 200) == 0


def test_merge_invalid():
    """Merging with itself, an unknown user, or admin returns None and changes nothing."""
    storage = CloudStorage()
    storage.add_user("alice", 100)
    storage.add_file_by("alice", "a.txt", 10)
    assert storage.merge_user("alice", "alice") is None
    assert storage.merge_user("alice", "ghost") is None
    assert storage.merge_user("ghost", "alice") is None
    assert storage.merge_user("alice", "admin") is None
    assert storage.merge_user("admin", "alice") is None
    assert storage.add_file_by("alice", "b.txt", 0) == 90


def test_merged_user_is_removed():
    """User 2 no longer exists after a merge, and its id can be added again fresh."""
    storage = CloudStorage()
    storage.add_user("alice", 100)
    storage.add_user("bob", 100)
    storage.add_file_by("bob", "b.txt", 30)
    storage.merge_user("alice", "bob")
    assert storage.add_file_by("bob", "x.txt", 1) is None
    assert storage.add_user("bob", 10) is True
    assert storage.add_file_by("bob", "x.txt", 1) == 9
