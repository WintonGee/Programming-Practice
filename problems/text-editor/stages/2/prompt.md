Users want to select text and move it around. A **selection** is a half-open range `[start, end)` of positions with `start < end` — it covers the characters `text[start:end]`. At any moment there is either one active selection or none. The editor also has a single **clipboard**, empty until the first successful `copy`.

### New operations

| Method | Behavior |
|---|---|
| `select(start, end)` | Clamp both positions to `[0, len(text)]`. If `start > end` after clamping, swap them. If they are then equal there is no selection; otherwise the selection becomes `[start, end)`. Either way the cursor moves to `end` (the larger position). Replaces any previous selection. |
| `get_selection()` | The active selection as a tuple `(start, end)`, or `None` if there isn't one. |
| `copy()` | Put the selected text on the clipboard and return it. The document, cursor, and selection are unchanged. With no selection, return `""` and leave the clipboard as it was. |
| `paste()` | Behaves exactly like `insert(clipboard)` and returns `True`. If nothing has ever been copied, return `False` and change nothing. Pasting does not empty the clipboard. |

### Changed behavior while a selection is active

- `insert(text)` **replaces** the selected text with `text`; the cursor ends at `start + len(text)`. So `insert("")` deletes the selection.
- `backspace(n)` deletes exactly the selected text, ignoring `n`, and returns the number of characters deleted; the cursor ends at `start`. A negative `n` still raises `ValueError` (and changes nothing).
- `append(text)` still adds to the end of the document and does not touch the selected text.

After `insert`, `paste`, `backspace`, `append`, or `move_cursor` there is **no** selection. `copy`, `get_text`, `get_cursor`, and `get_selection` leave it in place. All Stage 1 behavior still applies when no selection is active.

### Example

```python
editor = TextEditor()
editor.append("Hello world")
editor.select(6, 11)       # selects "world", cursor 11
editor.copy()              # "world"
editor.insert("there")     # "Hello there", cursor 11, no selection
editor.move_cursor(0)
editor.paste()             # True -> "worldHello there", cursor 5
editor.select(99, 10)      # clamped to (16, 10), swapped: (10, 16) = " there"
editor.backspace(1)        # 6 -> "worldHello", cursor 10
```
