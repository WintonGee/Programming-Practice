Operators want to roll the database back after bad writes. Add point-in-time **backup** and **restore**. Both are timed operations: their timestamps follow the same never-decreasing rule as the other `_at` calls.

### New operations

| Method | Behavior |
|---|---|
| `backup(timestamp)` | Save a snapshot of every field alive at `timestamp`. For a field with a TTL, the snapshot stores its **remaining** TTL, `expires_at - timestamp`; permanent fields stay permanent. Returns the number of records that have at least one field alive at `timestamp`. |
| `restore(timestamp, timestamp_to_restore)` | Find the most recent backup whose timestamp is **at or before** `timestamp_to_restore` (if several backups share that timestamp, use the one taken last). Replace the **entire** database with that snapshot and return `True`. If no backup qualifies, return `False` and change nothing. |

### Rules

- On restore, a field saved with remaining TTL `r` is alive again during `[timestamp, timestamp + r)`, measured from the **restore** `timestamp`, not the original write.
- Restoring discards everything written since the backup and brings back fields deleted since then.
- Backups are never consumed or modified. Restoring the same backup twice yields the same contents both times, even if you wrote to the database in between.
- `timestamp_to_restore` is always `<= timestamp`.

Everything from Stages 1–3 still applies.

### Example

```python
db = InMemoryDB()
db.set_at_with_ttl("a", "x", "1", 10, 20)   # alive for 10..29
db.set_at("a", "y", "2", 12)
db.set_at_with_ttl("b", "z", "3", 15, 5)    # alive for 15..19
db.backup(18)                    # 2  (x has 12 left, z has 2 left)
db.backup(25)                    # 1  (b's only field has expired)
db.delete_at("a", "y", 26)       # True
db.restore(40, 20)               # True  (uses the backup from 18)
db.scan_at("a", 41)              # ["x(1)", "y(2)"]
db.get_at("b", "z", 42)          # None  (40 + 2 = 42 is excluded)
db.get_at("a", "x", 51)          # "1"   (40 + 12 = 52)
```
