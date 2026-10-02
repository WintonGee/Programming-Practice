from solution import BankingSystem

DAY = 86_400_000


def _funded(*names, amount=100_000):
    bank = BankingSystem()
    for t, name in enumerate(names, start=1):
        bank.create_account(2 * t, name)
        bank.deposit(2 * t + 1, name, amount)
    return bank


def test_pay_withdraws_and_returns_id():
    """A payment withdraws the amount and returns payment1."""
    bank = _funded("alice")
    assert bank.pay(1_000, "alice", 25_000) == "payment1"
    assert bank.deposit(1_001, "alice", 1) == 75_001


def test_payment_ids_are_global():
    """Payment numbers are shared across all accounts."""
    bank = _funded("alice", "bob")
    assert bank.pay(1_000, "alice", 10) == "payment1"
    assert bank.pay(1_001, "bob", 10) == "payment2"
    assert bank.pay(1_002, "alice", 10) == "payment3"


def test_failed_pay_returns_none():
    """A payment from a missing account or without funds returns None and uses no id."""
    bank = _funded("alice", amount=500)
    assert bank.pay(1_000, "ghost", 10) is None
    assert bank.pay(1_001, "alice", 501) is None
    assert bank.pay(1_002, "alice", 500) == "payment1"
    assert bank.deposit(1_003, "alice", 1) == 1


def test_cashback_credited_exactly_one_day_later():
    """2% cashback arrives at payment time + 86_400_000, not a millisecond earlier."""
    bank = _funded("alice")
    bank.pay(1_000, "alice", 25_000)
    assert bank.deposit(1_000 + DAY - 1, "alice", 1) == 75_001
    assert bank.deposit(1_000 + DAY, "alice", 1) == 75_502


def test_cashback_rounds_down():
    """Cashback is 2% of the amount, rounded down to whole cents."""
    bank = _funded("alice", amount=1_000)
    bank.pay(1_000, "alice", 149)
    bank.pay(1_001, "alice", 49)
    assert bank.deposit(1_001 + DAY, "alice", 1) == 1_000 - 149 - 49 + 2 + 0 + 1


def test_payment_status_lifecycle():
    """Status is IN_PROGRESS until the due time, then CASHBACK_RECEIVED."""
    bank = _funded("alice")
    bank.pay(1_000, "alice", 49)
    assert bank.get_payment_status(1_001, "alice", "payment1") == "IN_PROGRESS"
    assert bank.get_payment_status(1_000 + DAY - 1, "alice", "payment1") == "IN_PROGRESS"
    assert bank.get_payment_status(1_000 + DAY, "alice", "payment1") == "CASHBACK_RECEIVED"


def test_payment_status_invalid_lookups():
    """Status is None for a missing account, missing payment, or another account's payment."""
    bank = _funded("alice", "bob")
    bank.pay(1_000, "alice", 100)
    assert bank.get_payment_status(1_001, "ghost", "payment1") is None
    assert bank.get_payment_status(1_002, "alice", "payment9") is None
    assert bank.get_payment_status(1_003, "bob", "payment1") is None


def test_cashback_processed_before_same_timestamp_operation():
    """An operation at the exact due time can spend the cashback."""
    bank = _funded("alice", "bob", amount=10_000)
    bank.pay(1_000, "alice", 10_000)
    assert bank.transfer(1_000 + DAY, "alice", "bob", 200) == 0


def test_multiple_cashbacks_in_order():
    """Several pending cashbacks are each credited at their own due time."""
    bank = _funded("alice", "bob")
    bank.pay(1_000, "alice", 1_000)
    bank.pay(2_000, "bob", 5_000)
    bank.pay(3_000, "alice", 2_000)
    assert bank.deposit(2_500 + DAY, "alice", 1) == 100_000 - 3_000 + 20 + 1
    assert bank.deposit(2_501 + DAY, "bob", 1) == 100_000 - 5_000 + 100 + 1
    assert bank.deposit(3_000 + DAY, "alice", 1) == 100_000 - 3_000 + 20 + 1 + 40 + 1


def test_payments_count_as_outgoing():
    """Payments add to top_spenders totals; cashback does not reduce them."""
    bank = _funded("alice", "bob")
    bank.pay(1_000, "alice", 1_000)
    bank.transfer(1_001, "bob", "alice", 600)
    assert bank.top_spenders(1_002, 2) == ["alice(1000)", "bob(600)"]
    assert bank.top_spenders(1_000 + DAY, 2) == ["alice(1000)", "bob(600)"]
