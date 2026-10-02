from solution import CloudStorage


def test_add_and_get_size():
    """An added file reports its size."""
    storage = CloudStorage()
    assert storage.add_file("docs/report.pdf", 2_048) is True
    assert storage.get_file_size("docs/report.pdf") == 2_048


def test_add_duplicate_name():
    """Adding an existing name returns False and keeps the original size."""
    storage = CloudStorage()
    storage.add_file("a.txt", 100)
    assert storage.add_file("a.txt", 999) is False
    assert storage.get_file_size("a.txt") == 100


def test_get_missing_file():
    """Asking for an unknown file returns None."""
    storage = CloudStorage()
    assert storage.get_file_size("nope.txt") is None


def test_delete_returns_size():
    """Deleting a file returns its size and removes it."""
    storage = CloudStorage()
    storage.add_file("a.txt", 100)
    assert storage.delete_file("a.txt") == 100
    assert storage.get_file_size("a.txt") is None


def test_delete_missing_file():
    """Deleting an unknown file returns None."""
    storage = CloudStorage()
    assert storage.delete_file("nope.txt") is None


def test_delete_twice():
    """The second delete of the same file returns None."""
    storage = CloudStorage()
    storage.add_file("a.txt", 100)
    storage.delete_file("a.txt")
    assert storage.delete_file("a.txt") is None


def test_readd_after_delete():
    """A deleted name can be added again with a new size."""
    storage = CloudStorage()
    storage.add_file("a.txt", 100)
    storage.delete_file("a.txt")
    assert storage.add_file("a.txt", 7) is True
    assert storage.get_file_size("a.txt") == 7


def test_zero_size_file():
    """A zero-byte file exists; its size is 0, not None."""
    storage = CloudStorage()
    assert storage.add_file("empty.txt", 0) is True
    assert storage.get_file_size("empty.txt") == 0
    assert storage.delete_file("empty.txt") == 0
    assert storage.get_file_size("empty.txt") is None


def test_names_are_case_sensitive():
    """Names differing only in case are different files."""
    storage = CloudStorage()
    storage.add_file("a.txt", 1)
    assert storage.add_file("A.txt", 2) is True
    assert storage.get_file_size("a.txt") == 1
    assert storage.get_file_size("A.txt") == 2


def test_files_are_independent():
    """Deleting one file leaves the others untouched."""
    storage = CloudStorage()
    storage.add_file("dir/a.txt", 10)
    storage.add_file("dir/b.txt", 20)
    storage.delete_file("dir/a.txt")
    assert storage.get_file_size("dir/b.txt") == 20
