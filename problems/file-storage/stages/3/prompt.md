The drive becomes multi-user. Every file now has an **owner**, and each user has a storage **capacity** in bytes.

### New operations

| Method | Behavior |
|---|---|
| `add_user(user_id, capacity)` | Create a user with `capacity` bytes and no files. Return `True`, or `False` if the user already exists. |
| `add_file_by(user_id, name, size)` | Add a file owned by `user_id`. Return the user's **remaining capacity** after adding it. Return `None` and change nothing if the user doesn't exist, a file with that name already exists (whoever owns it), or the file would push the user's total over capacity. Filling capacity exactly is allowed. |
| `merge_user(user_id_1, user_id_2)` | Fold user 2 into user 1: user 1's capacity grows by user 2's capacity, and all of user 2's files become owned by user 1. User 2 is then removed. Return user 1's remaining capacity. Return `None` and change nothing if the ids are equal or either user doesn't exist. |

### Rules

- A user's **remaining capacity** is their capacity minus the total size of the files they currently own.
- `add_file` from Stage 1 still works: those files belong to a built-in user `"admin"` with **unlimited** capacity.
- `"admin"` is reserved. `add_user("admin", …)` returns `False`, and `add_file_by` and `merge_user` treat `"admin"` as an unknown user (return `None`).
- `delete_file` works on any file regardless of owner, and frees the owner's capacity.
- A removed user's id can be added again with `add_user`; it starts fresh.

All Stage 1–2 behavior still applies; `get_file_size` and `get_n_largest` see every user's files.

### Example

```python
storage = CloudStorage()
storage.add_user("alice", 1_000)                     # True
storage.add_user("alice", 50)                        # False
storage.add_file_by("alice", "alice/a.txt", 400)     # 600
storage.add_file_by("alice", "alice/b.txt", 700)     # None  (would exceed capacity)
storage.add_file("shared.txt", 10_000_000)           # True  (admin: unlimited)
storage.add_file_by("alice", "shared.txt", 1)        # None  (name taken)
storage.add_user("bob", 500)                         # True
storage.add_file_by("bob", "bob/c.txt", 200)         # 300
storage.merge_user("alice", "bob")                   # 900   (1500 capacity - 600 used)
storage.get_file_size("bob/c.txt")                   # 200   (now owned by alice)
storage.add_file_by("bob", "bob/d.txt", 1)           # None  (bob no longer exists)
```
