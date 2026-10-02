from solution import TextEditor


def _state(editor):
    return (editor.get_text(), editor.get_cursor(), editor.get_selection())


def test_undo_insert_restores_text_and_cursor():
    """undo puts text and cursor back to just before the edit."""
    editor = TextEditor()
    editor.append("abcd")
    editor.move_cursor(2)
    editor.insert("XY")
    assert editor.undo() is True
    assert _state(editor) == ("abcd", 2, None)


def test_nothing_to_undo_or_redo():
    """undo and redo return False when their history is empty."""
    editor = TextEditor()
    assert editor.undo() is False
    assert editor.redo() is False
    editor.append("a")
    assert editor.redo() is False
    assert editor.undo() is True
    assert editor.undo() is False
    assert editor.get_text() == ""


def test_multiple_undo_then_redo_in_order():
    """Undo walks back newest-first; redo re-applies oldest-first."""
    editor = TextEditor()
    editor.append("a")
    editor.append("b")
    editor.append("c")
    editor.undo()
    editor.undo()
    assert editor.get_text() == "a"
    editor.redo()
    assert _state(editor) == ("ab", 2, None)
    editor.redo()
    assert _state(editor) == ("abc", 3, None)
    assert editor.redo() is False


def test_undo_restores_selection():
    """Undoing an edit that replaced a selection brings the selection back."""
    editor = TextEditor()
    editor.append("Hello world")
    editor.select(6, 11)
    editor.insert("there")
    editor.undo()
    assert _state(editor) == ("Hello world", 11, (6, 11))
    editor.insert("you")
    assert editor.get_text() == "Hello you"


def test_undo_backspace_restores_deleted_text():
    """Undoing a backspace puts the characters and cursor back."""
    editor = TextEditor()
    editor.append("abcdef")
    editor.move_cursor(4)
    editor.backspace(3)
    assert editor.get_text() == "aef"
    editor.undo()
    assert _state(editor) == ("abcdef", 4, None)


def test_redo_restores_post_edit_state():
    """redo returns to the state just before the undo, including the cursor."""
    editor = TextEditor()
    editor.append("hello")
    editor.move_cursor(0)
    editor.insert(">> ")
    editor.undo()
    assert editor.get_cursor() == 0
    editor.redo()
    assert _state(editor) == (">> hello", 3, None)


def test_new_edit_clears_redo():
    """Any new edit discards the redo history."""
    editor = TextEditor()
    editor.append("one")
    editor.append(" two")
    editor.undo()
    editor.append(" three")
    assert editor.redo() is False
    assert editor.get_text() == "one three"


def test_non_edits_keep_redo_history():
    """move_cursor, select, copy and no-op calls don't create history or clear redo."""
    editor = TextEditor()
    editor.append("abc")
    editor.append("def")
    editor.undo()
    editor.move_cursor(1)
    editor.select(0, 2)
    editor.copy()
    editor.move_cursor(0)
    editor.backspace(5)
    editor.insert("")
    assert editor.redo() is True
    assert editor.get_text() == "abcdef"
    assert editor.undo() is True
    assert editor.undo() is True
    assert editor.undo() is False


def test_no_op_calls_are_not_recorded():
    """Calls that leave the text unchanged can't be undone."""
    editor = TextEditor()
    editor.backspace()
    editor.insert("")
    editor.paste()
    assert editor.undo() is False
    editor.append("x")
    editor.move_cursor(0)
    editor.backspace(3)
    assert editor.undo() is True
    assert editor.get_text() == ""


def test_undo_paste_keeps_clipboard():
    """Undoing a paste removes the pasted text but the clipboard is untouched."""
    editor = TextEditor()
    editor.append("copy me")
    editor.select(0, 4)
    editor.copy()
    editor.move_cursor(7)
    editor.paste()
    assert editor.get_text() == "copy mecopy"
    editor.undo()
    assert _state(editor) == ("copy me", 7, None)
    editor.paste()
    assert editor.get_text() == "copy mecopy"


def test_undo_after_redo_reverts_again():
    """A redone edit can be undone again."""
    editor = TextEditor()
    editor.append("abc")
    editor.undo()
    editor.redo()
    assert editor.undo() is True
    assert _state(editor) == ("", 0, None)


def test_redo_restores_state_before_undo():
    """Redo returns to the state just before the matching undo, including the cursor."""
    editor = TextEditor()
    editor.append("abc")
    editor.move_cursor(1)
    assert editor.undo() == True
    assert editor.redo() == True
    assert editor.get_text() == "abc"
    assert editor.get_cursor() == 1
