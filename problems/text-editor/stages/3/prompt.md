Everyone makes mistakes. Add **undo** and **redo**.

### Edits

An **edit** is a call to `append`, `insert`, `backspace`, or `paste` that **changes the text**. A call that leaves the text exactly as it was — `backspace` at position `0`, `backspace(0)` with no selection, `insert("")` with no selection, `paste` with an empty clipboard — is not an edit: it is not recorded and does not affect undo/redo history. `move_cursor`, `select`, `copy`, and the getters are never edits.

### New operations

| Method | Behavior |
|---|---|
| `undo()` | Revert the most recent edit that hasn't been undone. The text, cursor, **and selection** go back to exactly what they were just before that edit. Returns `True`, or `False` (changing nothing) if there is nothing to undo. |
| `redo()` | Re-apply the most recently undone edit. The text, cursor, and selection go back to exactly what they were just before the matching `undo()` call. Returns `True`, or `False` (changing nothing) if there is nothing to redo. |

### Rules

- Undo history is unlimited. Several `undo()` calls in a row walk back through edits newest-first; several `redo()` calls re-apply them oldest-first.
- A `redo()` puts that edit back on the undo history, so a following `undo()` reverts it again (back to the state just before the `redo()`).
- Any new **edit** clears the redo history. Non-edits (`move_cursor`, `select`, `copy`, no-op calls) do not.
- The clipboard is not part of the history: `undo` and `redo` never change it.

All Stage 1 and 2 behavior still applies.

### Example

```python
editor = TextEditor()
editor.append("Hello world")
editor.select(6, 11)
editor.insert("there")     # "Hello there", cursor 11, no selection
editor.undo()              # True -> "Hello world", cursor 11, selection (6, 11)
editor.undo()              # True -> "", cursor 0
editor.undo()              # False
editor.redo()              # True -> "Hello world", cursor 11, selection (6, 11)
editor.backspace()         # deletes "world" (new edit: redo history cleared)
editor.redo()              # False
```
