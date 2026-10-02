Application code calls helpers that open their own transactions, so transactions must now **nest**. `begin()` may be called while a transaction is already open; it opens a new transaction *inside* the current one.

### Changed operations

| Method | Behavior |
|---|---|
| `begin()` | Open a transaction nested inside the innermost open one (or a top-level transaction if none is open). Returns `None`. |
| `commit()` | Close the **innermost** transaction, folding its changes into its parent. If it was the outermost transaction, its changes become permanent. Return `True`, or `False` if no transaction is open. |
| `rollback()` | Undo only the changes made since the **innermost** transaction began, and close it. The parent stays open with its own changes intact. Return `True`, or `False` if no transaction is open. |

### New operation

| Method | Behavior |
|---|---|
| `depth()` | The number of currently open transactions. `0` when none is open. |

### Rules

- Committing an inner transaction does **not** make its changes permanent: if the parent later rolls back, the inner transaction's changes are undone too, and every key returns to what it held before the parent began.
- Reads (`get`, `count`, `delete`) always see the changes of every open transaction.

All Stage 1–2 behavior still applies.

### Example

```python
store = KVStore()
store.set("a", "1")
store.begin()
store.set("a", "2")
store.begin()
store.set("a", "3")
store.depth()          # 2
store.rollback()       # True: undoes the inner transaction only
store.get("a")         # "2"
store.begin()
store.set("b", "9")
store.commit()         # True: folded into the outer transaction
store.get("b")         # "9"
store.rollback()       # True: undoes the outer transaction, including "b"
store.get("a")         # "1"
store.get("b")         # None
store.depth()          # 0
```
