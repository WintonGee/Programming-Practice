Analysts want to run long reports without seeing half-finished work or being disturbed by later writes. Add **snapshots**: frozen, read-only views of the store's **committed** data.

A value is **committed** once it is written outside any transaction, or once the outermost transaction that wrote it commits. Changes made inside a transaction that is still open, including changes folded in from committed inner transactions, are **not** committed yet.

### New operations

| Method | Behavior |
|---|---|
| `snapshot()` | Capture the committed data as it is right now and return a snapshot id. Ids are integers starting at `1` and increasing by one per call; an id is never reused. May be called while transactions are open. |
| `get_at_snapshot(snapshot_id, key)` | The value `key` held in that snapshot, or `None` if the key didn't exist then. |
| `count_at_snapshot(snapshot_id, value)` | The number of keys holding exactly `value` in that snapshot. |
| `release_snapshot(snapshot_id)` | Discard the snapshot. Return `True`, or `False` if the id is unknown or already released. |

### Rules

- A snapshot never changes: later writes, commits, and rollbacks don't affect it.
- Taking or reading a snapshot never changes the live store or any open transaction.
- For an unknown or released snapshot id, `get_at_snapshot` returns `None` and `count_at_snapshot` returns `0`.

All Stage 1–3 behavior still applies.

### Example

```python
store = KVStore()
store.set("a", "1")
store.begin()
store.set("a", "2")
store.set("b", "2")
s1 = store.snapshot()             # 1
store.get_at_snapshot(s1, "a")    # "1"  (the "2" is not committed)
store.get_at_snapshot(s1, "b")    # None
store.commit()
s2 = store.snapshot()             # 2
store.count_at_snapshot(s2, "2")  # 2
store.set("a", "3")
store.get_at_snapshot(s2, "a")    # "2"  (snapshots never change)
store.release_snapshot(s1)        # True
store.get_at_snapshot(s1, "a")    # None (released)
```
