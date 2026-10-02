The editor now holds several **documents**, like tabs. It starts with one empty document named `"main"`, which is the **active** document.

### New operations

| Method | Behavior |
|---|---|
| `create(name)` | Create a new empty document (empty text, cursor `0`, no selection, no history) and return `True`. Return `False` and change nothing if a document with that name already exists. Does **not** switch to the new document. |
| `switch(name)` | Make `name` the active document and return `True`. Return `False` and leave the active document unchanged if no such document exists. Switching to the already-active document is allowed and returns `True`. |
| `current_document()` | The name of the active document. |

### Rules

- Every Stage 1–3 operation acts on the **active** document only.
- Each document keeps its own text, cursor, selection, and undo/redo history. Switching away and back finds them exactly as they were left.
- There is **one clipboard shared** by all documents: copy in one document, paste in another.
- `undo` and `redo` only use the active document's history and never cross documents. `create` and `switch` are not edits: they are never undone and never clear any redo history.

### Example

```python
editor = TextEditor()
editor.append("Dear team,")
editor.select(0, 4)
editor.copy()               # "Dear"
editor.create("notes")      # True  (still in "main")
editor.create("main")       # False
editor.switch("notes")      # True
editor.paste()              # True -> notes: "Dear"
editor.undo()               # True -> notes: ""
editor.undo()               # False (main's history is not touched)
editor.switch("main")
editor.get_selection()      # (0, 4)  (kept while away)
editor.undo()               # True -> main: ""
```
