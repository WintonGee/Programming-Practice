from harness import raises
from solution import TextEditor


def _editor(text):
    editor = TextEditor()
    editor.append(text)
    return editor


def test_select_sets_range_and_cursor():
    """select stores [start, end) and moves the cursor to end."""
    editor = _editor("Hello world")
    editor.select(6, 11)
    assert editor.get_selection() == (6, 11)
    assert editor.get_cursor() == 11
    assert editor.get_text() == "Hello world"


def test_select_clamps_and_swaps():
    """Out-of-range positions are clamped; a reversed range is swapped."""
    editor = _editor("abcdef")
    editor.select(-3, 2)
    assert editor.get_selection() == (0, 2)
    editor.select(99, 4)
    assert editor.get_selection() == (4, 6)
    assert editor.get_cursor() == 6


def test_empty_select_means_no_selection():
    """Selecting an empty range leaves no selection but still moves the cursor."""
    editor = _editor("abcdef")
    editor.select(1, 4)
    editor.select(3, 3)
    assert editor.get_selection() is None
    assert editor.get_cursor() == 3
    editor.insert("X")
    assert editor.get_text() == "abcXdef"


def test_insert_replaces_selection():
    """Typing over a selection replaces it; the cursor ends after the new text."""
    editor = _editor("Hello world")
    editor.select(6, 11)
    editor.insert("there")
    assert editor.get_text() == "Hello there"
    assert editor.get_cursor() == 11
    assert editor.get_selection() is None
    editor.select(0, 5)
    editor.insert("")
    assert editor.get_text() == " there"
    assert editor.get_cursor() == 0


def test_backspace_deletes_selection():
    """backspace with a selection deletes exactly the selection, ignoring n."""
    editor = _editor("abcdefgh")
    editor.select(2, 5)
    assert editor.backspace(1) == 3
    assert editor.get_text() == "abfgh"
    assert editor.get_cursor() == 2
    assert editor.get_selection() is None
    editor.select(0, 2)
    assert editor.backspace(0) == 2
    assert editor.get_text() == "fgh"


def test_backspace_negative_keeps_selection():
    """A negative backspace raises and leaves text and selection intact."""
    editor = _editor("abcdef")
    editor.select(1, 3)
    with raises(ValueError):
        editor.backspace(-1)
    assert editor.get_text() == "abcdef"
    assert editor.get_selection() == (1, 3)


def test_copy_returns_text_and_keeps_state():
    """copy returns the selected text without changing text, cursor, or selection."""
    editor = _editor("Hello world")
    editor.select(0, 5)
    assert editor.copy() == "Hello"
    assert editor.get_text() == "Hello world"
    assert editor.get_cursor() == 5
    assert editor.get_selection() == (0, 5)


def test_copy_without_selection_keeps_clipboard():
    """copy with no selection returns "" and the old clipboard survives."""
    editor = _editor("abc")
    editor.select(0, 1)
    editor.copy()
    editor.move_cursor(3)
    assert editor.copy() == ""
    assert editor.paste() is True
    assert editor.get_text() == "abca"


def test_paste_at_cursor_repeatedly():
    """paste inserts the clipboard at the cursor and can be repeated."""
    editor = _editor("ab")
    editor.select(0, 2)
    editor.copy()
    editor.move_cursor(1)
    assert editor.paste() is True
    assert editor.get_text() == "aabb"
    assert editor.get_cursor() == 3
    assert editor.paste() is True
    assert editor.get_text() == "aababb"
    assert editor.get_cursor() == 5


def test_paste_replaces_selection():
    """paste over a selection replaces it."""
    editor = _editor("one two")
    editor.select(0, 3)
    editor.copy()
    editor.select(4, 7)
    assert editor.paste() is True
    assert editor.get_text() == "one one"
    assert editor.get_cursor() == 7


def test_paste_with_empty_clipboard():
    """paste before anything is copied returns False and changes nothing."""
    editor = _editor("abc")
    editor.select(0, 2)
    assert editor.paste() is False
    assert editor.get_text() == "abc"
    assert editor.get_selection() == (0, 2)


def test_append_and_move_clear_selection():
    """append adds at the end without replacing the selection, and clears it; so does move_cursor."""
    editor = _editor("abc")
    editor.select(0, 2)
    editor.append("!")
    assert editor.get_text() == "abc!"
    assert editor.get_selection() is None
    assert editor.get_cursor() == 4
    editor.select(1, 3)
    assert editor.move_cursor(2) == 2
    assert editor.get_selection() is None
