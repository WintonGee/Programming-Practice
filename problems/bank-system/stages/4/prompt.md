Customers with two accounts want to consolidate them, and support needs to answer "what was my balance last Tuesday?". Add account **merging** and **historical balance** queries.

### New operations

| Method | Behavior |
|---|---|
| `merge_accounts(timestamp, account_id_1, account_id_2)` | Fold `account_id_2` into `account_id_1` and delete `account_id_2`. Return `True`, or `False` and change nothing if the ids are equal or either account doesn't exist. |
| `get_balance(timestamp, account_id, time_at)` | The balance `account_id` had at time `time_at`, or `None` if no account with that id existed at `time_at`. `time_at` is always `<= timestamp`. |

### Merge rules

- `account_id_1`'s balance increases by `account_id_2`'s balance, and its outgoing total (for `top_spenders`) increases by `account_id_2`'s outgoing total.
- Every payment made by `account_id_2` now belongs to `account_id_1`: its status is queryable as `get_payment_status(t, account_id_1, payment)`, and any cashback still pending is credited to `account_id_1` when due.
- After the merge, `account_id_2` doesn't exist: every operation treats it as unknown, and it no longer appears in `top_spenders`. Its id may be used again by `create_account`, which creates a brand-new account (balance `0`, outgoing `0`, no payments).

### History rules

- The balance "at `time_at`" reflects every operation with timestamp `<= time_at`, including any cashback due at or before `time_at`, and a merge at exactly `time_at`.
- An account exists from its `create_account` timestamp (inclusive) until the timestamp it is merged away (exclusive). Outside those times `get_balance` returns `None`, unless the id was created again, in which case the new account exists from its own creation time. Balances from the earlier lifetime stay queryable for the times it existed — keep history per account id, not per account object.

All Stage 1–3 behavior still applies.

### Example

```python
DAY = 86_400_000
bank = BankingSystem()
bank.create_account(1, "a")
bank.create_account(2, "b")
bank.deposit(3, "a", 1_000)
bank.deposit(4, "b", 500)
bank.pay(5, "b", 200)                           # "payment1"  (b = 300, cashback 4 due at 5 + DAY)
bank.merge_accounts(6, "a", "b")                # True  (a = 1300)
bank.get_balance(7, "b", 5)                     # 300
bank.get_balance(8, "b", 6)                     # None  (merged away at 6)
bank.get_balance(9, "a", 5)                     # 1000
bank.get_balance(10, "a", 6)                    # 1300
bank.get_payment_status(11, "a", "payment1")    # "IN_PROGRESS"
bank.get_payment_status(12, "b", "payment1")    # None
bank.deposit(5 + DAY, "a", 1)                   # 1305  (1300 + 4 cashback + 1)
bank.get_balance(6 + DAY, "a", 4 + DAY)         # 1300
```
