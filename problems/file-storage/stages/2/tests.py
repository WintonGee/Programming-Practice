from solution import CloudStorage


def _example():
    storage = CloudStorage()
    storage.add_file("dir1/a.txt", 100)
    storage.add_file("dir1/b.txt", 300)
    storage.add_file("dir1/c.txt", 100)
    storage.add_file("dir2/d.txt", 500)
    return storage


def test_largest_first():
    """Matching files are listed by size, largest first."""
    storage = _example()
    assert storage.get_n_largest("dir1/", 1) == ["dir1/b.txt(300)"]


def test_ties_by_name():
    """Files of equal size are ordered by name ascending."""
    storage = _example()
    assert storage.get_n_largest("dir1/", 3) == ["dir1/b.txt(300)", "dir1/a.txt(100)", "dir1/c.txt(100)"]


def test_n_larger_than_matches():
    """Asking for more files than match returns all matches."""
    storage = _example()
    assert storage.get_n_largest("dir1/", 10) == ["dir1/b.txt(300)", "dir1/a.txt(100)", "dir1/c.txt(100)"]


def test_n_zero():
    """n of 0 returns an empty list."""
    storage = _example()
    assert storage.get_n_largest("dir1/", 0) == []


def test_no_matches():
    """A prefix that matches nothing returns an empty list."""
    storage = _example()
    assert storage.get_n_largest("dir3/", 5) == []
    assert CloudStorage().get_n_largest("", 5) == []


def test_empty_prefix_matches_all():
    """An empty prefix considers every file."""
    storage = _example()
    assert storage.get_n_largest("", 2) == ["dir2/d.txt(500)", "dir1/b.txt(300)"]


def test_prefix_is_plain_string():
    """A prefix is not a directory: dir1 also matches dir10."""
    storage = _example()
    storage.add_file("dir10/e.txt", 200)
    assert storage.get_n_largest("dir1", 2) == ["dir1/b.txt(300)", "dir10/e.txt(200)"]
    assert storage.get_n_largest("dir1/", 2) == ["dir1/b.txt(300)", "dir1/a.txt(100)"]


def test_prefix_equal_to_name():
    """A prefix equal to a full file name matches that file."""
    storage = _example()
    assert storage.get_n_largest("dir2/d.txt", 3) == ["dir2/d.txt(500)"]


def test_deleted_files_excluded():
    """Deleted files no longer appear."""
    storage = _example()
    storage.delete_file("dir1/b.txt")
    assert storage.get_n_largest("dir1/", 3) == ["dir1/a.txt(100)", "dir1/c.txt(100)"]


def test_zero_size_files_included():
    """Zero-byte files are listed after larger ones."""
    storage = CloudStorage()
    storage.add_file("x/empty", 0)
    storage.add_file("x/full", 1)
    assert storage.get_n_largest("x/", 5) == ["x/full(1)", "x/empty(0)"]
