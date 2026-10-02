from solution import InMemoryDB


def test_backup_counts_live_records():
    """backup returns how many records have at least one live field."""
    db = InMemoryDB()
    db.set_at("a", "x", "1", 1)
    db.set_at("a", "y", "2", 1)
    db.set_at("b", "x", "3", 1)
    assert db.backup(2) == 2


def test_backup_empty_database():
    """Backing up an empty database returns 0."""
    db = InMemoryDB()
    assert db.backup(5) == 0


def test_backup_skips_fully_expired_records():
    """A record whose fields have all expired is not counted."""
    db = InMemoryDB()
    db.set_at_with_ttl("a", "x", "1", 0, 5)
    db.set_at("b", "x", "2", 0)
    db.set_at_with_ttl("c", "x", "3", 0, 5)
    db.set_at("c", "y", "4", 0)
    assert db.backup(5) == 2


def test_restore_replaces_everything():
    """Restore drops later writes and brings back later deletes."""
    db = InMemoryDB()
    db.set_at("a", "x", "1", 1)
    db.set_at("a", "y", "2", 1)
    db.backup(2)
    db.delete_at("a", "y", 3)
    db.set_at("a", "x", "changed", 4)
    db.set_at("b", "new", "9", 5)
    assert db.restore(6, 2) is True
    assert db.scan_at("a", 6) == ["x(1)", "y(2)"]
    assert db.scan_at("b", 6) == []


def test_restore_recalculates_ttl():
    """Remaining TTL is measured from the restore timestamp."""
    db = InMemoryDB()
    db.set_at_with_ttl("a", "x", "1", 10, 20)
    db.backup(18)
    assert db.restore(100, 18) is True
    assert db.get_at("a", "x", 111) == "1"
    assert db.get_at("a", "x", 112) is None


def test_restore_keeps_permanent_fields_permanent():
    """A field without TTL is restored without TTL."""
    db = InMemoryDB()
    db.set_at("a", "x", "1", 0)
    db.backup(1)
    db.restore(50, 1)
    assert db.get_at("a", "x", 1_000_000) == "1"


def test_expired_fields_are_not_restored():
    """Fields already expired at backup time are not in the snapshot."""
    db = InMemoryDB()
    db.set_at_with_ttl("a", "x", "1", 0, 3)
    db.set_at("a", "y", "2", 0)
    db.backup(3)
    db.restore(4, 3)
    assert db.scan_at("a", 4) == ["y(2)"]


def test_restore_picks_latest_at_or_before():
    """The newest backup at or before timestamp_to_restore is used; the bound is inclusive."""
    db = InMemoryDB()
    db.set_at("k", "f", "v1", 1)
    db.backup(2)
    db.set_at("k", "f", "v2", 3)
    db.backup(4)
    db.set_at("k", "f", "v3", 5)
    db.backup(6)
    db.restore(10, 5)
    assert db.get_at("k", "f", 10) == "v2"
    db.restore(11, 4)
    assert db.get_at("k", "f", 11) == "v2"
    db.restore(12, 3)
    assert db.get_at("k", "f", 12) == "v1"


def test_same_timestamp_backups_use_last():
    """When backups share a timestamp, the one taken last wins."""
    db = InMemoryDB()
    db.set_at("k", "f", "first", 5)
    db.backup(5)
    db.set_at("k", "f", "second", 5)
    db.backup(5)
    db.set_at("k", "f", "third", 6)
    db.restore(7, 5)
    assert db.get_at("k", "f", 7) == "second"


def test_restore_without_backup():
    """With no backup at or before the target, restore returns False and changes nothing."""
    db = InMemoryDB()
    db.set_at("k", "f", "v", 1)
    assert db.restore(2, 1) is False
    db.backup(3)
    db.set_at("k", "f", "w", 4)
    assert db.restore(5, 2) is False
    assert db.get_at("k", "f", 5) == "w"


def test_backup_is_not_modified_by_later_writes():
    """Restoring the same backup twice gives the same contents."""
    db = InMemoryDB()
    db.set_at("k", "f", "v", 1)
    db.backup(2)
    db.restore(3, 2)
    db.set_at("k", "f", "dirty", 4)
    db.set_at("k", "g", "extra", 4)
    db.restore(5, 2)
    assert db.scan_at("k", 5) == ["f(v)"]
