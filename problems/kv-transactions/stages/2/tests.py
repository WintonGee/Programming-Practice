from solution import KVStore


def test_reads_see_uncommitted_writes():
    """Inside a transaction, reads see the transaction's own writes."""
    store = KVStore()
    store.begin()
    store.set("a", "1")
    assert store.get("a") == "1"
    assert store.count("1") == 1


def test_rollback_undoes_overwrite():
    """Rollback restores a key's value from before begin."""
    store = KVStore()
    store.set("a", "10")
    store.begin()
    store.set("a", "20")
    assert store.rollback() is True
    assert store.get("a") == "10"


def test_rollback_removes_created_keys():
    """Keys created inside a rolled-back transaction no longer exist."""
    store = KVStore()
    store.begin()
    store.set("b", "1")
    store.rollback()
    assert store.get("b") is None
    assert store.delete("b") is False


def test_rollback_restores_deleted_keys():
    """Keys deleted inside a rolled-back transaction reappear."""
    store = KVStore()
    store.set("a", "10")
    store.begin()
    assert store.delete("a") is True
    assert store.get("a") is None
    store.rollback()
    assert store.get("a") == "10"


def test_rollback_after_many_writes_to_one_key():
    """Several writes to one key all roll back to the value from before begin."""
    store = KVStore()
    store.set("a", "original")
    store.begin()
    store.set("a", "x")
    store.set("a", "y")
    store.delete("a")
    store.set("a", "z")
    store.rollback()
    assert store.get("a") == "original"


def test_rollback_restores_counts():
    """count reflects restored values after rollback."""
    store = KVStore()
    store.set("a", "10")
    store.set("b", "10")
    store.begin()
    store.set("a", "20")
    store.delete("b")
    store.set("c", "20")
    assert store.count("10") == 0
    assert store.count("20") == 2
    store.rollback()
    assert store.count("10") == 2
    assert store.count("20") == 0


def test_commit_keeps_changes():
    """Committed changes stay after the transaction closes."""
    store = KVStore()
    store.set("a", "10")
    store.begin()
    store.set("a", "20")
    store.set("b", "30")
    store.delete("a")
    assert store.commit() is True
    assert store.get("a") is None
    assert store.get("b") == "30"
    assert store.count("30") == 1


def test_commit_and_rollback_without_transaction():
    """commit and rollback return False when no transaction is open."""
    store = KVStore()
    store.set("a", "1")
    assert store.commit() is False
    assert store.rollback() is False
    assert store.get("a") == "1"


def test_transaction_closes_after_commit():
    """After commit, a rollback has nothing to undo."""
    store = KVStore()
    store.begin()
    store.set("a", "1")
    store.commit()
    assert store.rollback() is False
    assert store.get("a") == "1"


def test_writes_after_rollback_are_permanent():
    """Writes outside any transaction cannot be rolled back."""
    store = KVStore()
    store.begin()
    store.set("a", "1")
    store.rollback()
    store.set("a", "2")
    assert store.rollback() is False
    assert store.get("a") == "2"


def test_sequential_transactions_are_independent():
    """A second transaction only undoes its own changes."""
    store = KVStore()
    store.begin()
    store.set("a", "1")
    store.commit()
    store.begin()
    store.set("a", "2")
    store.set("b", "2")
    store.rollback()
    assert store.get("a") == "1"
    assert store.get("b") is None
