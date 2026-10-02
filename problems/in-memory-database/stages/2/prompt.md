Clients want to read a whole record at once. Add two scan operations.

### New operations

| Method | Behavior |
|---|---|
| `scan(key)` | All fields of record `key` as a list of strings formatted `"<field>(<value>)"`, sorted by field name **ascending**. Returns `[]` if the record doesn't exist. |
| `scan_by_prefix(key, prefix)` | Same as `scan`, but only fields whose name **starts with** `prefix`. Returns `[]` if the record doesn't exist or nothing matches. An empty prefix matches every field. |

Sorting is plain string order (so `"f10"` comes before `"f2"`), and prefix matching is case-sensitive. All Stage 1 behavior still applies.

### Example

```python
db = InMemoryDB()
db.set("user1", "name", "Ada")
db.set("user1", "lang", "Python")
db.set("user1", "lang_version", "3.11")
db.scan("user1")                      # ["lang(Python)", "lang_version(3.11)", "name(Ada)"]
db.scan_by_prefix("user1", "lang")    # ["lang(Python)", "lang_version(3.11)"]
db.scan_by_prefix("user1", "zip")     # []
db.scan("user2")                      # []
```
