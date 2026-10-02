from solution import BankingSystem


def test_create_account():
    """A new account id can be created."""
    bank = BankingSystem()
    assert bank.create_account(1, "alice") is True


def test_create_duplicate_account():
    """Creating an existing account id returns False."""
    bank = BankingSystem()
    bank.create_account(1, "alice")
    assert bank.create_account(2, "alice") is False


def test_deposit_returns_balance():
    """Deposits accumulate and return the new balance."""
    bank = BankingSystem()
    bank.create_account(1, "alice")
    assert bank.deposit(2, "alice", 1_000) == 1_000
    assert bank.deposit(3, "alice", 250) == 1_250


def test_duplicate_create_keeps_balance():
    """A rejected create does not reset the existing account."""
    bank = BankingSystem()
    bank.create_account(1, "alice")
    bank.deposit(2, "alice", 700)
    bank.create_account(3, "alice")
    assert bank.deposit(4, "alice", 1) == 701


def test_deposit_unknown_account():
    """Depositing into a missing account returns None."""
    bank = BankingSystem()
    assert bank.deposit(1, "ghost", 100) is None


def test_transfer_moves_money():
    """A transfer debits the source, credits the target, and returns the source balance."""
    bank = BankingSystem()
    bank.create_account(1, "alice")
    bank.create_account(2, "bob")
    bank.deposit(3, "alice", 10_000)
    assert bank.transfer(4, "alice", "bob", 2_500) == 7_500
    assert bank.deposit(5, "bob", 1) == 2_501


def test_transfer_entire_balance():
    """Transferring exactly the whole balance leaves 0."""
    bank = BankingSystem()
    bank.create_account(1, "alice")
    bank.create_account(2, "bob")
    bank.deposit(3, "alice", 500)
    assert bank.transfer(4, "alice", "bob", 500) == 0


def test_transfer_insufficient_funds():
    """A transfer larger than the balance returns None and moves nothing."""
    bank = BankingSystem()
    bank.create_account(1, "alice")
    bank.create_account(2, "bob")
    bank.deposit(3, "alice", 500)
    assert bank.transfer(4, "alice", "bob", 501) is None
    assert bank.deposit(5, "alice", 1) == 501
    assert bank.deposit(6, "bob", 1) == 1


def test_transfer_unknown_accounts():
    """A transfer involving a missing account returns None and moves nothing."""
    bank = BankingSystem()
    bank.create_account(1, "alice")
    bank.deposit(2, "alice", 500)
    assert bank.transfer(3, "alice", "ghost", 100) is None
    assert bank.transfer(4, "ghost", "alice", 100) is None
    assert bank.deposit(5, "alice", 1) == 501


def test_transfer_to_self():
    """Transferring to the same account returns None."""
    bank = BankingSystem()
    bank.create_account(1, "alice")
    bank.deposit(2, "alice", 500)
    assert bank.transfer(3, "alice", "alice", 100) is None
    assert bank.deposit(4, "alice", 1) == 501
