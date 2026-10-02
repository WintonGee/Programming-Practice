Users keep deleting things by accident. Add per-user **backup** and **restore**.

### New operations

| Method | Behavior |
|---|---|
| `backup_user(user_id)` | Save the names and sizes of every file `user_id` currently owns, **replacing** any earlier backup of that user. Return the number of files saved (`0` is fine: an empty backup is still a backup). Return `None` if the user doesn't exist. |
| `restore_user(user_id)` | Delete every file `user_id` currently owns, then re-create the files from the user's latest backup, owned by `user_id`. Return the number of files re-created. Return `None` if the user doesn't exist. |

### Rules

- "Currently owns" includes files gained through `merge_user`. Restoring removes them if they weren't in the backup.
- If a backed-up file's name is now used by a file of **another** user (or admin), that file is skipped and not counted; the other user's file is untouched.
- If the user has never been backed up, restore still deletes all of their files and returns `0`.
- Restore does not check or change the user's capacity. Restored files count toward `used` like any other.
- Backups are never consumed: restoring twice from the same backup gives the same result.
- `merge_user` discards user 2's backup; user 1's backup is unchanged. A user id added again after being merged away starts with no backup.
- As in Stage 3, `"admin"` is treated as an unknown user (return `None`).

All Stage 1–3 behavior still applies.

### Example

```python
storage = CloudStorage()
storage.add_user("u1", 1_000)
storage.add_file_by("u1", "a.txt", 100)     # 900
storage.add_file_by("u1", "b.txt", 200)     # 700
storage.backup_user("u1")                   # 2
storage.delete_file("a.txt")                # 100
storage.add_file_by("u1", "c.txt", 50)      # 750
storage.add_file("a.txt", 5)                # True  (admin takes the name)
storage.restore_user("u1")                  # 1     (b.txt back; a.txt skipped; c.txt removed)
storage.get_file_size("a.txt")              # 5     (still admin's)
storage.get_file_size("c.txt")              # None
storage.add_file_by("u1", "d.txt", 0)       # 800
```
