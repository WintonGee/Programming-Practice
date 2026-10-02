from solution import KVStore


def test_depth_counts_open_transactions():
    """depth tracks how many transactions are open."""
    store = KVStore()
    assert store.depth() == 0
    store.begin()
    store.begin()
    assert store.depth() == 2
    store.commit()
    assert store.depth() == 1
    store.rollback()
    assert store.depth() == 0


def test_inner_rollback_keeps_outer_changes():
    """Rolling back the inner transaction leaves the outer one's changes."""
    store = KVStore()
    store.begin()
    store.set("a", "outer")
    store.begin()
    store.set("a", "inner")
    store.set("b", "inner")
    assert store.rollback() is True
    assert store.get("a") == "outer"
    assert store.get("b") is None
    assert store.depth() == 1


def test_inner_rollback_then_outer_rollback():
    """A key only the inner transaction created stays gone after both roll back."""
    store = KVStore()
    store.begin()
    store.begin()
    store.set("b", "1")
    store.rollback()
    store.rollback()
    assert store.get("b") is None
    assert store.count("1") == 0


def test_outer_rollback_after_inner_commit():
    """An inner commit is undone when the outer transaction rolls back."""
    store = KVStore()
    store.set("a", "1")
    store.begin()
    store.begin()
    store.set("a", "2")
    store.set("b", "2")
    store.commit()
    assert store.get("a") == "2"
    store.rollback()
    assert store.get("a") == "1"
    assert store.get("b") is None


def test_outer_rollback_restores_value_from_before_outer():
    """When both levels changed a key, outer rollback restores the pre-outer value."""
    store = KVStore()
    store.set("a", "0")
    store.begin()
    store.set("a", "1")
    store.begin()
    store.set("a", "2")
    store.commit()
    store.rollback()
    assert store.get("a") == "0"


def test_outer_rollback_restores_key_deleted_inside():
    """A key deleted in a committed inner transaction returns on outer rollback."""
    store = KVStore()
    store.set("a", "1")
    store.begin()
    store.begin()
    store.delete("a")
    store.commit()
    assert store.get("a") is None
    store.rollback()
    assert store.get("a") == "1"


def test_commit_all_levels_is_permanent():
    """Committing every level makes the changes permanent."""
    store = KVStore()
    store.begin()
    store.set("a", "1")
    store.begin()
    store.set("b", "2")
    store.commit()
    store.commit()
    assert store.rollback() is False
    assert store.get("a") == "1"
    assert store.get("b") == "2"


def test_inner_commit_then_outer_commit_after_more_writes():
    """The outer transaction can keep writing after an inner commit."""
    store = KVStore()
    store.begin()
    store.begin()
    store.set("a", "1")
    store.commit()
    store.set("a", "2")
    store.commit()
    assert store.get("a") == "2"
    assert store.depth() == 0


def test_counts_across_nested_rollbacks():
    """count follows every nested rollback."""
    store = KVStore()
    store.set("a", "x")
    store.begin()
    store.set("b", "x")
    store.begin()
    store.set("c", "x")
    store.delete("a")
    assert store.count("x") == 2
    store.rollback()
    assert store.count("x") == 2
    store.rollback()
    assert store.count("x") == 1


def test_three_levels():
    """Each rollback peels back exactly one level."""
    store = KVStore()
    store.set("a", "0")
    for level in ["1", "2", "3"]:
        store.begin()
        store.set("a", level)
    store.rollback()
    assert store.get("a") == "2"
    store.rollback()
    assert store.get("a") == "1"
    store.rollback()
    assert store.get("a") == "0"
    assert store.rollback() is False


def test_empty_inner_transaction():
    """An inner transaction with no writes commits and rolls back cleanly."""
    store = KVStore()
    store.begin()
    store.set("a", "1")
    store.begin()
    assert store.commit() is True
    store.begin()
    assert store.rollback() is True
    assert store.get("a") == "1"
    assert store.depth() == 1
