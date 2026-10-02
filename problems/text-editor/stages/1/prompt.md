You're building the core of a plain-text editor. The document is a single string, and a **cursor** sits *between* characters: position `0` is before the first character and position `len(text)` is after the last. Implement `TextEditor`.

A new editor has an empty document with the cursor at `0`.

### Operations

| Method | Behavior |
|---|---|
| `append(text)` | Add `text` to the **end** of the document, regardless of where the cursor is. The cursor then moves to the end of the document. |
| `insert(text)` | Insert `text` at the cursor. The cursor moves to just after the inserted text, exactly as if you had typed it. |
| `move_cursor(position)` | Move the cursor to `position`, clamped to `[0, len(text)]`: negative positions go to `0`, positions past the end go to the end. Returns the new cursor position. |
| `backspace(n=1)` | Delete up to `n` characters immediately **before** the cursor; the cursor moves left by the number deleted. Returns how many characters were actually deleted — fewer than `n` if the cursor is close to the start, `0` at position `0`. `backspace(0)` does nothing. Raise `ValueError` if `n < 0`. |
| `get_text()` | The whole document. |
| `get_cursor()` | The cursor position. |

### Example

```python
editor = TextEditor()
editor.append("Hello world")   # cursor 11
editor.move_cursor(5)          # 5
editor.insert(",")             # "Hello, world", cursor 6
editor.backspace(3)            # 3 -> "Hel world", cursor 3
editor.move_cursor(-4)         # 0
editor.backspace()             # 0  (nothing before the cursor)
editor.append("!")             # "Hel world!", cursor 10
```
