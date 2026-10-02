You're building the core of a simple bank. Accounts hold money, receive deposits, and send transfers to each other. Implement `BankingSystem`.

All amounts are **integer cents** (`2_500` means $25.00) and are always positive. Every method takes a `timestamp` (integer milliseconds) as its first argument; timestamps **strictly increase** from one call to the next. You won't need them yet, but later stages will.

### Operations

| Method | Behavior |
|---|---|
| `create_account(timestamp, account_id)` | Open an account with balance `0`. Return `True`, or `False` if an account with that id already exists. |
| `deposit(timestamp, account_id, amount)` | Add `amount` to the account. Return the new balance, or `None` if the account doesn't exist. |
| `transfer(timestamp, source_account_id, target_account_id, amount)` | Move `amount` from source to target. Return the **source's** new balance. Return `None` and change nothing if either account doesn't exist, if source and target are the same account, or if the source's balance is less than `amount`. Transferring the entire balance is allowed. |

No method raises: invalid requests return `False` or `None`.

### Example

```python
bank = BankingSystem()
bank.create_account(1, "alice")            # True
bank.create_account(2, "alice")            # False (already exists)
bank.create_account(3, "bob")              # True
bank.deposit(4, "alice", 10_000)           # 10000
bank.transfer(5, "alice", "bob", 2_500)    # 7500  (alice's new balance)
bank.transfer(6, "bob", "alice", 9_999)    # None  (bob only has 2500)
bank.deposit(7, "bob", 500)                # 3000
bank.deposit(8, "carol", 100)              # None  (no such account)
```
