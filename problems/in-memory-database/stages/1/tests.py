from solution import InMemoryDB


def test_set_then_get():
    """A stored field can be read back."""
    db = InMemoryDB()
    db.set("user1", "name", "Ada")
    assert db.get("user1", "name") == "Ada"


def test_get_unknown_record():
    """Reading from a record that doesn't exist returns None."""
    db = InMemoryDB()
    assert db.get("ghost", "name") is None


def test_get_unknown_field():
    """Reading a missing field of an existing record returns None."""
    db = InMemoryDB()
    db.set("user1", "name", "Ada")
    assert db.get("user1", "email") is None


def test_set_overwrites():
    """Setting an existing field replaces its value."""
    db = InMemoryDB()
    db.set("user1", "name", "Ada")
    db.set("user1", "name", "Grace")
    assert db.get("user1", "name") == "Grace"


def test_records_are_independent():
    """The same field name in two records holds two separate values."""
    db = InMemoryDB()
    db.set("a", "x", "1")
    db.set("b", "x", "2")
    assert db.get("a", "x") == "1"
    assert db.get("b", "x") == "2"


def test_delete_existing_field():
    """Deleting a field returns True and removes it."""
    db = InMemoryDB()
    db.set("user1", "name", "Ada")
    db.set("user1", "lang", "Python")
    assert db.delete("user1", "lang") is True
    assert db.get("user1", "lang") is None
    assert db.get("user1", "name") == "Ada"


def test_delete_missing_returns_false():
    """Deleting an unknown record or unknown field returns False."""
    db = InMemoryDB()
    db.set("user1", "name", "Ada")
    assert db.delete("ghost", "name") is False
    assert db.delete("user1", "email") is False
    assert db.get("user1", "name") == "Ada"


def test_delete_twice():
    """A second delete of the same field returns False."""
    db = InMemoryDB()
    db.set("k", "f", "v")
    assert db.delete("k", "f") is True
    assert db.delete("k", "f") is False


def test_empty_string_is_a_value():
    """An empty-string value is stored and returned, not treated as missing."""
    db = InMemoryDB()
    db.set("k", "f", "")
    assert db.get("k", "f") == ""
    assert db.delete("k", "f") is True


def test_set_after_deleting_last_field():
    """A record emptied by delete can be written again."""
    db = InMemoryDB()
    db.set("k", "f", "old")
    db.delete("k", "f")
    assert db.get("k", "f") is None
    db.set("k", "f", "new")
    assert db.get("k", "f") == "new"
