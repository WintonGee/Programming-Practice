The store now needs **time-to-live (TTL)**: fields that disappear on their own. Every new operation takes an integer `timestamp` saying when it happens.

### New operations

| Method | Behavior |
|---|---|
| `set_at(key, field, value, timestamp)` | Like `set`, at `timestamp`. The field never expires. |
| `set_at_with_ttl(key, field, value, timestamp, ttl)` | Like `set`, but the field is alive only during `[timestamp, timestamp + ttl)` — start inclusive, end **exclusive**. `ttl` is a positive integer. |
| `get_at(key, field, timestamp)` | Like `get`, but returns `None` if the field has expired by `timestamp`. |
| `delete_at(key, field, timestamp)` | Like `delete`, but returns `False` if the field has expired by `timestamp` (an expired field counts as missing). |
| `scan_at(key, timestamp)` | Like `scan`, listing only fields alive at `timestamp`. |
| `scan_by_prefix_at(key, prefix, timestamp)` | Like `scan_by_prefix`, listing only fields alive at `timestamp`. |

### Rules

- A field with TTL is alive at `timestamp` exactly when `set_timestamp <= timestamp < set_timestamp + ttl`.
- Writing a field that already exists (alive or expired) replaces both its value **and** its expiry. `set_at` on a field that had a TTL makes it permanent; `set_at_with_ttl` on a permanent field gives it a TTL.
- Across all `_at` calls, timestamps never decrease.
- The Stage 1–2 methods keep working exactly as before. A single database is driven either by the untimed methods or by the `_at` methods, never a mix of both, so you don't need to define how they interact.

### Example

```python
db = InMemoryDB()
db.set_at("user1", "name", "Ada", 1)
db.set_at_with_ttl("user1", "token", "abc", 2, 10)   # alive for 2..11
db.scan_at("user1", 5)               # ["name(Ada)", "token(abc)"]
db.get_at("user1", "token", 11)      # "abc"
db.get_at("user1", "token", 12)      # None  (2 + 10 = 12 is excluded)
db.scan_at("user1", 12)              # ["name(Ada)"]
db.delete_at("user1", "token", 13)   # False (already expired)
```
