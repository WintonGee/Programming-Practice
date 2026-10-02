from solution import BankingSystem

DAY = 86_400_000


def _pair():
    bank = BankingSystem()
    bank.create_account(1, "a")
    bank.create_account(2, "b")
    bank.deposit(3, "a", 1_000)
    bank.deposit(4, "b", 500)
    return bank


def test_merge_combines_balances():
    """The merged account's balance moves into the surviving account."""
    bank = _pair()
    assert bank.merge_accounts(5, "a", "b") is True
    assert bank.deposit(6, "a", 1) == 1_501


def test_merge_invalid_requests():
    """Merging an account with itself or with a missing account returns False."""
    bank = _pair()
    assert bank.merge_accounts(5, "a", "a") is False
    assert bank.merge_accounts(6, "a", "ghost") is False
    assert bank.merge_accounts(7, "ghost", "b") is False
    assert bank.deposit(8, "a", 1) == 1_001
    assert bank.deposit(9, "b", 1) == 501


def test_merged_account_is_gone():
    """After a merge the old id is unknown, and can be created again from scratch."""
    bank = _pair()
    bank.merge_accounts(5, "a", "b")
    assert bank.deposit(6, "b", 1) is None
    assert bank.transfer(7, "b", "a", 1) is None
    assert bank.top_spenders(8, 5) == ["a(0)"]
    assert bank.create_account(9, "b") is True
    assert bank.deposit(10, "b", 1) == 1


def test_merge_combines_outgoing():
    """Outgoing totals are added together for top_spenders."""
    bank = _pair()
    bank.create_account(5, "c")
    bank.transfer(6, "a", "c", 100)
    bank.transfer(7, "b", "c", 300)
    bank.pay(8, "c", 350)
    bank.merge_accounts(9, "a", "b")
    assert bank.top_spenders(10, 5) == ["a(400)", "c(350)"]


def test_pending_cashback_redirected():
    """Cashback still pending on the merged account is credited to the survivor."""
    bank = _pair()
    bank.pay(5, "b", 200)
    bank.merge_accounts(6, "a", "b")
    assert bank.deposit(5 + DAY, "a", 1) == 1_000 + 300 + 4 + 1


def test_payments_follow_merge():
    """The merged account's payments are queryable under the survivor only."""
    bank = _pair()
    bank.pay(5, "a", 100)
    bank.pay(6, "b", 100)
    bank.merge_accounts(7, "a", "b")
    assert bank.get_payment_status(8, "a", "payment1") == "IN_PROGRESS"
    assert bank.get_payment_status(9, "a", "payment2") == "IN_PROGRESS"
    assert bank.get_payment_status(10, "b", "payment2") is None
    assert bank.get_payment_status(6 + DAY, "a", "payment2") == "CASHBACK_RECEIVED"


def test_merge_chain_redirects_cashback():
    """Payments follow an account through repeated merges."""
    bank = _pair()
    bank.create_account(5, "c")
    bank.pay(6, "b", 500)
    bank.merge_accounts(7, "a", "b")
    bank.merge_accounts(8, "c", "a")
    assert bank.get_payment_status(9, "c", "payment1") == "IN_PROGRESS"
    assert bank.deposit(6 + DAY, "c", 1) == 1_000 + 0 + 10 + 1


def test_balance_history():
    """get_balance reports the balance after all operations at or before time_at."""
    bank = BankingSystem()
    bank.create_account(10, "a")
    bank.create_account(11, "b")
    bank.deposit(20, "a", 1_000)
    bank.transfer(30, "a", "b", 400)
    assert bank.get_balance(40, "a", 5) is None
    assert bank.get_balance(41, "a", 10) == 0
    assert bank.get_balance(42, "a", 19) == 0
    assert bank.get_balance(43, "a", 20) == 1_000
    assert bank.get_balance(44, "a", 29) == 1_000
    assert bank.get_balance(45, "a", 30) == 600
    assert bank.get_balance(46, "b", 30) == 400
    assert bank.get_balance(47, "a", 47) == 600


def test_balance_history_unknown_account():
    """An id that never existed has no balance at any time."""
    bank = _pair()
    assert bank.get_balance(5, "ghost", 4) is None


def test_balance_history_includes_cashback_at_due_time():
    """Cashback appears in history at its due time, even if processed later."""
    bank = _pair()
    bank.pay(5, "a", 500)
    bank.deposit(5 + DAY + 100, "b", 1)
    assert bank.get_balance(5 + DAY + 101, "a", 5 + DAY - 1) == 500
    assert bank.get_balance(5 + DAY + 102, "a", 5 + DAY) == 510


def test_balance_history_around_merge():
    """The merged id exists until the merge; the survivor gains the balance at the merge."""
    bank = _pair()
    bank.merge_accounts(10, "a", "b")
    assert bank.get_balance(11, "b", 9) == 500
    assert bank.get_balance(12, "b", 10) is None
    assert bank.get_balance(13, "a", 9) == 1_000
    assert bank.get_balance(14, "a", 10) == 1_500


def test_balance_history_recreated_id():
    """A recreated id has history for both lifetimes, with a gap between them."""
    bank = _pair()
    bank.merge_accounts(10, "a", "b")
    bank.create_account(20, "b")
    bank.deposit(30, "b", 7)
    assert bank.get_balance(31, "b", 4) == 500
    assert bank.get_balance(32, "b", 15) is None
    assert bank.get_balance(33, "b", 20) == 0
    assert bank.get_balance(34, "b", 30) == 7
