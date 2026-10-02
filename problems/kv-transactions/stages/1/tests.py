from solution import KVStore


def test_set_and_get():
    """A stored value can be read back."""
    store = KVStore()
    store.set("a", "1")
    assert store.get("a") == "1"


def test_get_missing_is_none():
    """Reading a key that was never set returns None."""
    store = KVStore()
    assert store.get("nope") is None


def test_set_returns_none():
    """set returns None."""
    store = KVStore()
    assert store.set("a", "1") is None


def test_overwrite():
    """Setting an existing key replaces its value."""
    store = KVStore()
    store.set("a", "1")
    store.set("a", "2")
    assert store.get("a") == "2"


def test_delete_existing_and_missing():
    """delete reports whether the key existed, and the key is gone afterwards."""
    store = KVStore()
    store.set("a", "1")
    assert store.delete("a") is True
    assert store.get("a") is None
    assert store.delete("a") is False
    assert store.delete("never") is False


def test_count_values():
    """count reports how many keys hold exactly that value."""
    store = KVStore()
    store.set("a", "10")
    store.set("b", "10")
    store.set("c", "20")
    assert store.count("10") == 2
    assert store.count("20") == 1
    assert store.count("30") == 0


def test_count_follows_overwrite():
    """Overwriting moves a key from its old value's count to the new one."""
    store = KVStore()
    store.set("a", "10")
    store.set("b", "10")
    store.set("b", "20")
    assert store.count("10") == 1
    assert store.count("20") == 1


def test_count_after_same_value_overwrite():
    """Re-setting a key to the value it already holds does not change counts."""
    store = KVStore()
    store.set("a", "10")
    store.set("a", "10")
    assert store.count("10") == 1


def test_count_after_delete():
    """Deleted keys no longer count toward their value."""
    store = KVStore()
    store.set("a", "10")
    store.set("b", "10")
    store.delete("a")
    assert store.count("10") == 1
    store.delete("b")
    assert store.count("10") == 0


def test_empty_string_is_a_value():
    """The empty string is a real value, distinct from missing."""
    store = KVStore()
    store.set("a", "")
    assert store.get("a") == ""
    assert store.count("") == 1
    assert store.delete("a") is True
    assert store.count("") == 0


def test_set_after_delete():
    """A deleted key can be set again."""
    store = KVStore()
    store.set("a", "1")
    store.delete("a")
    store.set("a", "2")
    assert store.get("a") == "2"
    assert store.count("1") == 0
    assert store.count("2") == 1
