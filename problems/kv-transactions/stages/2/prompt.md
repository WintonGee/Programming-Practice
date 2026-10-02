Clients want to group writes so they either all happen or none do. Add **transactions**.

### New operations

| Method | Behavior |
|---|---|
| `begin()` | Open a transaction. Returns `None`. |
| `commit()` | Make every change since `begin()` permanent and close the transaction. Return `True`, or `False` if no transaction is open. |
| `rollback()` | Undo every change since `begin()` (sets, overwrites, and deletes) and close the transaction. Return `True`, or `False` if no transaction is open. |

### Rules

- While a transaction is open, `get`, `delete`, and `count` see its changes immediately, exactly as if they were permanent.
- After a rollback, every key holds exactly what it held before `begin()`: overwritten keys get their old value back, deleted keys reappear, and keys created inside the transaction no longer exist. `count` reflects the restored values.
- At most one transaction is open at a time in this stage: `begin()` is never called while a transaction is already open.

All Stage 1 behavior still applies.

### Example

```python
store = KVStore()
store.set("a", "10")
store.begin()
store.set("a", "20")
store.set("b", "20")
store.count("20")      # 2
store.rollback()       # True
store.get("a")         # "10"
store.get("b")         # None
store.count("20")      # 0
store.begin()
store.delete("a")      # True
store.commit()         # True
store.get("a")         # None
store.rollback()       # False (no transaction open)
```
