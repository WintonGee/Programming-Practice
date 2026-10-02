from harness import raises
from solution import TextEditor


def _editor(text, cursor):
    editor = TextEditor()
    editor.append(text)
    editor.move_cursor(cursor)
    return editor


def test_new_editor_is_empty():
    """A new editor has no text and the cursor at 0."""
    editor = TextEditor()
    assert editor.get_text() == ""
    assert editor.get_cursor() == 0


def test_append_moves_cursor_to_end():
    """append adds to the end and leaves the cursor after it."""
    editor = TextEditor()
    editor.append("abc")
    assert editor.get_text() == "abc"
    assert editor.get_cursor() == 3
    editor.append("de")
    assert editor.get_text() == "abcde"
    assert editor.get_cursor() == 5


def test_append_ignores_cursor_position():
    """append always adds at the end, even when the cursor is in the middle."""
    editor = _editor("hello", 2)
    editor.append("!")
    assert editor.get_text() == "hello!"
    assert editor.get_cursor() == 6


def test_insert_in_middle():
    """insert types at the cursor; the cursor ends just after the new text."""
    editor = _editor("Hello world", 5)
    editor.insert(",")
    assert editor.get_text() == "Hello, world"
    assert editor.get_cursor() == 6
    editor.insert(" there")
    assert editor.get_text() == "Hello, there world"
    assert editor.get_cursor() == 12


def test_insert_at_start():
    """Inserting at position 0 prepends."""
    editor = _editor("world", 0)
    editor.insert("hi ")
    assert editor.get_text() == "hi world"
    assert editor.get_cursor() == 3


def test_insert_empty_changes_nothing():
    """Inserting the empty string leaves text and cursor alone."""
    editor = _editor("abc", 1)
    editor.insert("")
    assert editor.get_text() == "abc"
    assert editor.get_cursor() == 1


def test_move_cursor_clamps():
    """move_cursor clamps to [0, len(text)] and returns the new position."""
    editor = _editor("abcd", 0)
    assert editor.move_cursor(2) == 2
    assert editor.move_cursor(-5) == 0
    assert editor.move_cursor(100) == 4
    assert editor.get_cursor() == 4
    assert editor.move_cursor(4) == 4
    assert TextEditor().move_cursor(3) == 0


def test_backspace_deletes_before_cursor():
    """backspace removes characters to the left and moves the cursor left."""
    editor = _editor("Hello, world", 6)
    assert editor.backspace(3) == 3
    assert editor.get_text() == "Hel world"
    assert editor.get_cursor() == 3


def test_backspace_default_is_one():
    """backspace() with no argument deletes a single character."""
    editor = _editor("abc", 3)
    assert editor.backspace() == 1
    assert editor.get_text() == "ab"
    assert editor.get_cursor() == 2


def test_backspace_stops_at_start():
    """Deleting past the start removes only what exists; at 0 nothing is removed."""
    editor = _editor("abcdef", 2)
    assert editor.backspace(10) == 2
    assert editor.get_text() == "cdef"
    assert editor.get_cursor() == 0
    assert editor.backspace() == 0
    assert editor.get_text() == "cdef"


def test_backspace_zero_and_negative():
    """backspace(0) is a no-op; a negative count raises ValueError and changes nothing."""
    editor = _editor("abc", 2)
    assert editor.backspace(0) == 0
    with raises(ValueError):
        editor.backspace(-1)
    assert editor.get_text() == "abc"
    assert editor.get_cursor() == 2
