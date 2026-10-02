from solution import CloudStorage


def _user_with_files():
    storage = CloudStorage()
    storage.add_user("u1", 1_000)
    storage.add_file_by("u1", "a.txt", 100)
    storage.add_file_by("u1", "b.txt", 200)
    return storage


def test_backup_counts_files():
    """backup_user returns how many files were saved."""
    storage = _user_with_files()
    assert storage.backup_user("u1") == 2


def test_backup_unknown_user():
    """Backing up or restoring an unknown user or admin returns None."""
    storage = _user_with_files()
    assert storage.backup_user("ghost") is None
    assert storage.backup_user("admin") is None
    assert storage.restore_user("ghost") is None
    assert storage.restore_user("admin") is None


def test_restore_replaces_files():
    """Restore brings back deleted files and removes files added since the backup."""
    storage = _user_with_files()
    storage.backup_user("u1")
    storage.delete_file("a.txt")
    storage.add_file_by("u1", "c.txt", 50)
    assert storage.restore_user("u1") == 2
    assert storage.get_file_size("a.txt") == 100
    assert storage.get_file_size("c.txt") is None
    assert storage.get_n_largest("", 5) == ["b.txt(200)", "a.txt(100)"]


def test_restore_uses_backed_up_size():
    """A file re-added with a different size is restored to its backed-up size."""
    storage = _user_with_files()
    storage.backup_user("u1")
    storage.delete_file("a.txt")
    storage.add_file_by("u1", "a.txt", 7)
    storage.restore_user("u1")
    assert storage.get_file_size("a.txt") == 100


def test_restore_skips_names_owned_by_others():
    """Backed-up names now used by another owner are skipped and not counted."""
    storage = _user_with_files()
    storage.add_user("u2", 1_000)
    storage.backup_user("u1")
    storage.delete_file("a.txt")
    storage.delete_file("b.txt")
    storage.add_file("a.txt", 5)
    storage.add_file_by("u2", "b.txt", 9)
    assert storage.restore_user("u1") == 0
    assert storage.get_file_size("a.txt") == 5
    assert storage.get_file_size("b.txt") == 9


def test_restore_without_backup_deletes_everything():
    """Restoring a user who was never backed up removes all their files."""
    storage = _user_with_files()
    storage.add_file("admin.txt", 1)
    assert storage.restore_user("u1") == 0
    assert storage.get_n_largest("", 5) == ["admin.txt(1)"]


def test_empty_backup_is_a_backup():
    """Backing up a user with no files saves 0 files; restoring it empties the user."""
    storage = CloudStorage()
    storage.add_user("u1", 100)
    assert storage.backup_user("u1") == 0
    storage.add_file_by("u1", "a.txt", 10)
    assert storage.restore_user("u1") == 0
    assert storage.get_file_size("a.txt") is None


def test_backup_overwrites_previous():
    """Only the most recent backup is restored."""
    storage = _user_with_files()
    storage.backup_user("u1")
    storage.delete_file("a.txt")
    assert storage.backup_user("u1") == 1
    assert storage.restore_user("u1") == 1
    assert storage.get_file_size("a.txt") is None


def test_restore_twice():
    """A backup is not consumed by restoring it."""
    storage = _user_with_files()
    storage.backup_user("u1")
    assert storage.restore_user("u1") == 2
    storage.delete_file("b.txt")
    assert storage.restore_user("u1") == 2
    assert storage.get_file_size("b.txt") == 200


def test_restore_updates_used_capacity():
    """After a restore, remaining capacity reflects exactly the restored files."""
    storage = _user_with_files()
    storage.backup_user("u1")
    storage.delete_file("b.txt")
    storage.add_file_by("u1", "c.txt", 600)
    storage.restore_user("u1")
    assert storage.add_file_by("u1", "d.txt", 0) == 700


def test_merge_and_backups():
    """Merged-in files are dropped by user 1's restore; user 2's backup is discarded."""
    storage = _user_with_files()
    storage.add_user("u2", 500)
    storage.add_file_by("u2", "m.txt", 40)
    storage.backup_user("u1")
    storage.backup_user("u2")
    storage.merge_user("u1", "u2")
    assert storage.restore_user("u1") == 2
    assert storage.get_file_size("m.txt") is None
    storage.add_user("u2", 500)
    storage.add_file_by("u2", "n.txt", 1)
    assert storage.restore_user("u2") == 0
    assert storage.get_file_size("n.txt") is None
