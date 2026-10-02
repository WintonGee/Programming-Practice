from solution import InMemoryDB


def test_set_at_never_expires():
    """A field written with set_at is readable at any later time."""
    db = InMemoryDB()
    db.set_at("k", "f", "v", 1)
    assert db.get_at("k", "f", 1) == "v"
    assert db.get_at("k", "f", 1_000_000) == "v"


def test_ttl_window_is_half_open():
    """A TTL field is alive from its set time up to, but not including, set time + ttl."""
    db = InMemoryDB()
    db.set_at_with_ttl("k", "f", "v", 10, 5)
    assert db.get_at("k", "f", 10) == "v"
    assert db.get_at("k", "f", 14) == "v"
    assert db.get_at("k", "f", 15) is None


def test_get_at_missing():
    """get_at returns None for an unknown record or field."""
    db = InMemoryDB()
    db.set_at("k", "f", "v", 1)
    assert db.get_at("ghost", "f", 2) is None
    assert db.get_at("k", "other", 2) is None


def test_overwrite_extends_ttl():
    """Rewriting a TTL field replaces its expiry with the new one."""
    db = InMemoryDB()
    db.set_at_with_ttl("k", "f", "v1", 0, 10)
    db.set_at_with_ttl("k", "f", "v2", 8, 10)
    assert db.get_at("k", "f", 12) == "v2"
    assert db.get_at("k", "f", 18) is None


def test_overwrite_can_shorten_ttl():
    """A shorter TTL on rewrite wins over the earlier, longer one."""
    db = InMemoryDB()
    db.set_at_with_ttl("k", "f", "v1", 0, 100)
    db.set_at_with_ttl("k", "f", "v2", 5, 3)
    assert db.get_at("k", "f", 8) is None


def test_set_at_clears_ttl():
    """set_at on a TTL field makes it permanent; a TTL write on a permanent field adds expiry."""
    db = InMemoryDB()
    db.set_at_with_ttl("k", "a", "1", 0, 5)
    db.set_at("k", "a", "2", 3)
    db.set_at("k", "b", "3", 3)
    db.set_at_with_ttl("k", "b", "4", 4, 2)
    assert db.get_at("k", "a", 50) == "2"
    assert db.get_at("k", "b", 50) is None


def test_rewrite_after_expiry():
    """An expired field can be written again and is alive under its new TTL."""
    db = InMemoryDB()
    db.set_at_with_ttl("k", "f", "old", 0, 5)
    db.set_at_with_ttl("k", "f", "new", 7, 5)
    assert db.get_at("k", "f", 11) == "new"


def test_delete_at_live_field():
    """delete_at removes a live field and returns True."""
    db = InMemoryDB()
    db.set_at_with_ttl("k", "f", "v", 0, 10)
    assert db.delete_at("k", "f", 9) is True
    assert db.get_at("k", "f", 9) is None
    assert db.delete_at("k", "f", 9) is False


def test_delete_at_expired_field():
    """delete_at on an expired or unknown field returns False."""
    db = InMemoryDB()
    db.set_at_with_ttl("k", "f", "v", 0, 10)
    assert db.delete_at("k", "f", 10) is False
    assert db.delete_at("ghost", "f", 11) is False


def test_scan_at_skips_expired():
    """scan_at lists only fields alive at that time, still sorted by field."""
    db = InMemoryDB()
    db.set_at("user1", "name", "Ada", 1)
    db.set_at_with_ttl("user1", "token", "abc", 2, 10)
    db.set_at_with_ttl("user1", "code", "42", 3, 2)
    assert db.scan_at("user1", 4) == ["code(42)", "name(Ada)", "token(abc)"]
    assert db.scan_at("user1", 5) == ["name(Ada)", "token(abc)"]
    assert db.scan_at("user1", 12) == ["name(Ada)"]
    assert db.scan_at("ghost", 12) == []


def test_scan_by_prefix_at():
    """scan_by_prefix_at applies both the prefix and the expiry filter."""
    db = InMemoryDB()
    db.set_at("k", "lang", "Python", 0)
    db.set_at_with_ttl("k", "lang_tmp", "Rust", 0, 5)
    db.set_at("k", "name", "Ada", 0)
    assert db.scan_by_prefix_at("k", "lang", 4) == ["lang(Python)", "lang_tmp(Rust)"]
    assert db.scan_by_prefix_at("k", "lang", 5) == ["lang(Python)"]
    assert db.scan_by_prefix_at("k", "zzz", 5) == []
