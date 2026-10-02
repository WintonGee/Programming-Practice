from solution import TextEditor


def test_starts_in_main():
    """A new editor has one empty active document named "main"."""
    editor = TextEditor()
    assert editor.current_document() == "main"
    assert editor.get_text() == ""


def test_create_and_duplicates():
    """create returns True for a new name and False for an existing one, including "main"."""
    editor = TextEditor()
    assert editor.create("notes") is True
    assert editor.create("notes") is False
    assert editor.create("main") is False


def test_create_does_not_switch_or_overwrite():
    """create leaves the active document alone, and a duplicate create keeps the old contents."""
    editor = TextEditor()
    editor.append("keep me")
    editor.create("notes")
    assert editor.current_document() == "main"
    editor.switch("notes")
    editor.append("draft")
    editor.create("notes")
    assert editor.get_text() == "draft"


def test_switch_unknown_document():
    """switch to a missing document returns False and keeps the active one."""
    editor = TextEditor()
    editor.append("hi")
    assert editor.switch("ghost") is False
    assert editor.current_document() == "main"
    assert editor.get_text() == "hi"
    assert editor.switch("main") is True
    assert editor.get_text() == "hi"


def test_new_document_is_empty():
    """A freshly created document has no text, cursor 0, no selection, no history."""
    editor = TextEditor()
    editor.append("main text")
    editor.create("b")
    editor.switch("b")
    assert editor.get_text() == ""
    assert editor.get_cursor() == 0
    assert editor.get_selection() is None
    assert editor.undo() is False


def test_documents_keep_text_and_cursor():
    """Each document remembers its own text and cursor across switches."""
    editor = TextEditor()
    editor.append("alpha")
    editor.move_cursor(2)
    editor.create("b")
    editor.switch("b")
    editor.append("beta")
    editor.switch("main")
    assert editor.get_text() == "alpha"
    assert editor.get_cursor() == 2
    editor.insert("-")
    editor.switch("b")
    assert editor.get_text() == "beta"
    assert editor.get_cursor() == 4


def test_selection_kept_per_document():
    """A selection survives switching away and back."""
    editor = TextEditor()
    editor.append("select me")
    editor.select(0, 6)
    editor.create("b")
    editor.switch("b")
    assert editor.get_selection() is None
    editor.switch("main")
    assert editor.get_selection() == (0, 6)
    editor.insert("pick")
    assert editor.get_text() == "pick me"


def test_clipboard_is_shared():
    """Text copied in one document can be pasted into another."""
    editor = TextEditor()
    editor.append("Dear team,")
    editor.select(0, 4)
    editor.copy()
    editor.create("notes")
    editor.switch("notes")
    assert editor.paste() is True
    assert editor.get_text() == "Dear"
    editor.switch("main")
    assert editor.get_text() == "Dear team,"


def test_undo_never_crosses_documents():
    """undo uses only the active document's history."""
    editor = TextEditor()
    editor.append("one")
    editor.create("b")
    editor.switch("b")
    assert editor.undo() is False
    editor.append("two")
    editor.switch("main")
    assert editor.undo() is True
    assert editor.get_text() == ""
    assert editor.undo() is False
    editor.switch("b")
    assert editor.get_text() == "two"


def test_redo_history_survives_switching():
    """Switching documents does not clear either document's redo history."""
    editor = TextEditor()
    editor.append("x")
    editor.undo()
    editor.create("b")
    editor.switch("b")
    editor.append("y")
    editor.switch("main")
    assert editor.redo() is True
    assert editor.get_text() == "x"
    editor.switch("b")
    assert editor.redo() is False
    assert editor.undo() is True
    assert editor.get_text() == ""
