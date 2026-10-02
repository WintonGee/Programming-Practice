from solution import KVStore


def test_snapshot_ids_are_sequential():
    """Snapshot ids start at 1, increase by one, and are never reused."""
    store = KVStore()
    assert store.snapshot() == 1
    assert store.snapshot() == 2
    store.release_snapshot(2)
    assert store.snapshot() == 3


def test_snapshot_is_frozen():
    """Later writes and deletes do not change a snapshot."""
    store = KVStore()
    store.set("a", "1")
    store.set("b", "1")
    snap = store.snapshot()
    store.set("a", "2")
    store.delete("b")
    store.set("c", "3")
    assert store.get_at_snapshot(snap, "a") == "1"
    assert store.get_at_snapshot(snap, "b") == "1"
    assert store.get_at_snapshot(snap, "c") is None
    assert store.get("a") == "2"


def test_snapshot_of_deleted_key():
    """A key deleted before the snapshot is missing from it."""
    store = KVStore()
    store.set("a", "1")
    store.delete("a")
    snap = store.snapshot()
    assert store.get_at_snapshot(snap, "a") is None


def test_snapshot_excludes_open_transaction():
    """Uncommitted sets, overwrites, and deletes are not in a snapshot."""
    store = KVStore()
    store.set("a", "1")
    store.set("b", "1")
    store.begin()
    store.set("a", "2")
    store.delete("b")
    store.set("c", "2")
    snap = store.snapshot()
    assert store.get_at_snapshot(snap, "a") == "1"
    assert store.get_at_snapshot(snap, "b") == "1"
    assert store.get_at_snapshot(snap, "c") is None


def test_snapshot_excludes_inner_commit_while_outer_open():
    """Changes folded into a still-open outer transaction are not committed."""
    store = KVStore()
    store.set("a", "0")
    store.begin()
    store.set("a", "1")
    store.begin()
    store.set("a", "2")
    store.set("b", "2")
    store.commit()
    snap = store.snapshot()
    assert store.get_at_snapshot(snap, "a") == "0"
    assert store.get_at_snapshot(snap, "b") is None


def test_snapshot_after_outer_commit():
    """Once the outermost transaction commits, a new snapshot includes its changes."""
    store = KVStore()
    store.begin()
    store.set("a", "1")
    before = store.snapshot()
    store.commit()
    after = store.snapshot()
    assert store.get_at_snapshot(before, "a") is None
    assert store.get_at_snapshot(after, "a") == "1"


def test_count_at_snapshot():
    """count_at_snapshot counts the snapshot's committed values only."""
    store = KVStore()
    store.set("a", "x")
    store.set("b", "x")
    store.begin()
    store.set("c", "x")
    store.set("a", "y")
    snap = store.snapshot()
    store.commit()
    assert store.count_at_snapshot(snap, "x") == 2
    assert store.count_at_snapshot(snap, "y") == 0
    assert store.count("x") == 2
    assert store.count("y") == 1


def test_snapshot_does_not_disturb_transaction():
    """Taking a snapshot mid-transaction leaves live reads and rollback intact."""
    store = KVStore()
    store.set("a", "1")
    store.begin()
    store.set("a", "2")
    store.begin()
    store.set("b", "3")
    store.snapshot()
    assert store.get("a") == "2"
    assert store.get("b") == "3"
    assert store.depth() == 2
    store.rollback()
    store.rollback()
    assert store.get("a") == "1"
    assert store.get("b") is None


def test_rollback_does_not_change_snapshot():
    """A snapshot taken before a transaction ignores what the transaction did."""
    store = KVStore()
    store.set("a", "1")
    snap = store.snapshot()
    store.begin()
    store.set("a", "2")
    store.commit()
    store.begin()
    store.delete("a")
    store.rollback()
    assert store.get_at_snapshot(snap, "a") == "1"
    assert store.get("a") == "2"


def test_release_snapshot():
    """Released and unknown snapshots read as empty, and release reports success."""
    store = KVStore()
    store.set("a", "1")
    snap = store.snapshot()
    assert store.release_snapshot(snap) is True
    assert store.release_snapshot(snap) is False
    assert store.release_snapshot(99) is False
    assert store.get_at_snapshot(snap, "a") is None
    assert store.count_at_snapshot(snap, "1") == 0
    assert store.get_at_snapshot(99, "a") is None
    assert store.count_at_snapshot(99, "1") == 0


def test_snapshots_are_independent():
    """Releasing one snapshot leaves the others readable."""
    store = KVStore()
    store.set("a", "1")
    first = store.snapshot()
    store.set("a", "2")
    second = store.snapshot()
    store.release_snapshot(first)
    assert store.get_at_snapshot(second, "a") == "2"
