from solution import BankingSystem


def _example():
    bank = BankingSystem()
    bank.create_account(1, "alice")
    bank.create_account(2, "bob")
    bank.create_account(3, "carol")
    bank.deposit(4, "alice", 5_000)
    bank.deposit(5, "bob", 5_000)
    bank.transfer(6, "alice", "bob", 1_500)
    bank.transfer(7, "bob", "carol", 400)
    bank.transfer(8, "alice", "carol", 500)
    return bank


def test_ranked_by_outgoing():
    """Accounts are ranked by total outgoing, highest first."""
    bank = _example()
    assert bank.top_spenders(9, 3) == ["alice(2000)", "bob(400)", "carol(0)"]


def test_truncates_to_n():
    """Only the first n accounts are returned."""
    bank = _example()
    assert bank.top_spenders(9, 2) == ["alice(2000)", "bob(400)"]
    assert bank.top_spenders(10, 1) == ["alice(2000)"]


def test_n_larger_than_accounts():
    """Asking for more accounts than exist returns them all."""
    bank = _example()
    assert bank.top_spenders(9, 10) == ["alice(2000)", "bob(400)", "carol(0)"]


def test_no_accounts():
    """With no accounts the ranking is empty."""
    bank = BankingSystem()
    assert bank.top_spenders(1, 3) == []


def test_ties_broken_by_id():
    """Equal totals are ordered by account id ascending."""
    bank = BankingSystem()
    for t, name in enumerate(["dan", "amy", "cat", "bea"], start=1):
        bank.create_account(t, name)
    bank.deposit(10, "dan", 1_000)
    bank.deposit(11, "cat", 1_000)
    bank.transfer(12, "dan", "amy", 300)
    bank.transfer(13, "cat", "bea", 300)
    assert bank.top_spenders(14, 4) == ["cat(300)", "dan(300)", "amy(0)", "bea(0)"]


def test_zero_spenders_sorted_by_id():
    """Accounts that never sent money still appear, ordered by id."""
    bank = BankingSystem()
    bank.create_account(1, "zed")
    bank.create_account(2, "abe")
    assert bank.top_spenders(3, 5) == ["abe(0)", "zed(0)"]


def test_deposits_and_incoming_do_not_count():
    """Only money sent out counts toward the total."""
    bank = BankingSystem()
    bank.create_account(1, "alice")
    bank.create_account(2, "bob")
    bank.deposit(3, "alice", 1_000)
    bank.deposit(4, "bob", 9_000)
    bank.transfer(5, "alice", "bob", 100)
    assert bank.top_spenders(6, 2) == ["alice(100)", "bob(0)"]


def test_failed_transfers_do_not_count():
    """Rejected transfers add nothing to outgoing totals."""
    bank = BankingSystem()
    bank.create_account(1, "alice")
    bank.create_account(2, "bob")
    bank.deposit(3, "alice", 100)
    bank.transfer(4, "alice", "bob", 500)
    bank.transfer(5, "alice", "alice", 50)
    bank.transfer(6, "alice", "ghost", 50)
    assert bank.top_spenders(7, 2) == ["alice(0)", "bob(0)"]


def test_outgoing_accumulates():
    """Several transfers from one account add up."""
    bank = BankingSystem()
    bank.create_account(1, "alice")
    bank.create_account(2, "bob")
    bank.deposit(3, "alice", 1_000)
    bank.transfer(4, "alice", "bob", 100)
    bank.transfer(5, "alice", "bob", 200)
    bank.transfer(6, "bob", "alice", 300)
    bank.transfer(7, "alice", "bob", 400)
    assert bank.top_spenders(8, 2) == ["alice(700)", "bob(300)"]
