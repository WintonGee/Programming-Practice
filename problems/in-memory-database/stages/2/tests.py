from solution import InMemoryDB


def _user():
    db = InMemoryDB()
    db.set("user1", "name", "Ada")
    db.set("user1", "lang", "Python")
    db.set("user1", "lang_version", "3.11")
    return db


def test_scan_sorted_by_field():
    """scan lists every field as field(value), sorted by field name."""
    db = _user()
    assert db.scan("user1") == ["lang(Python)", "lang_version(3.11)", "name(Ada)"]


def test_scan_unknown_record():
    """Scanning a record that doesn't exist returns an empty list."""
    db = _user()
    assert db.scan("user2") == []


def test_scan_reflects_updates():
    """scan shows overwritten values and omits deleted fields."""
    db = _user()
    db.set("user1", "name", "Grace")
    db.delete("user1", "lang")
    assert db.scan("user1") == ["lang_version(3.11)", "name(Grace)"]


def test_scan_uses_string_order():
    """Field names sort as strings, so f10 comes before f2."""
    db = InMemoryDB()
    db.set("k", "f2", "b")
    db.set("k", "f10", "a")
    db.set("k", "f1", "c")
    assert db.scan("k") == ["f1(c)", "f10(a)", "f2(b)"]


def test_scan_empty_value():
    """An empty-string value is rendered as field()."""
    db = InMemoryDB()
    db.set("k", "f", "")
    assert db.scan("k") == ["f()"]


def test_prefix_filters_fields():
    """scan_by_prefix keeps only fields starting with the prefix."""
    db = _user()
    assert db.scan_by_prefix("user1", "lang") == ["lang(Python)", "lang_version(3.11)"]
    assert db.scan_by_prefix("user1", "n") == ["name(Ada)"]


def test_prefix_no_match():
    """A prefix that matches nothing returns an empty list."""
    db = _user()
    assert db.scan_by_prefix("user1", "zip") == []
    assert db.scan_by_prefix("ghost", "n") == []


def test_empty_prefix_matches_all():
    """An empty prefix behaves like scan."""
    db = _user()
    assert db.scan_by_prefix("user1", "") == db.scan("user1")


def test_prefix_equal_to_field_name():
    """A prefix equal to a whole field name still matches that field."""
    db = _user()
    assert db.scan_by_prefix("user1", "lang_version") == ["lang_version(3.11)"]


def test_prefix_is_case_sensitive():
    """Prefix matching respects case."""
    db = InMemoryDB()
    db.set("k", "Alpha", "1")
    db.set("k", "alpha", "2")
    assert db.scan_by_prefix("k", "a") == ["alpha(2)"]
    assert db.scan_by_prefix("k", "A") == ["Alpha(1)"]
