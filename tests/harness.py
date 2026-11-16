"""
Loads the REAL contract file against the doubles in genvm_double.py.

Nothing is copied or re-implemented here, so a change to contracts/skim.py is
a change to what these tests exercise.
"""

from __future__ import annotations

import datetime
import importlib.util
import json
import os
import pathlib
import sys
import types

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
#: SKIM_CONTRACT points the suite at a mutant; scripts/mutate.py sets it.
CONTRACT = pathlib.Path(os.environ.get("SKIM_CONTRACT") or ROOT / "contracts" / "skim.py")

sys.path.insert(0, str(HERE))

import genvm_double as D  # noqa: E402

GEN = 10**18
HOUR = 3600
DAY = 86400
FEE = 2 * GEN
#: 2026-11-01T00:00:00Z. Every world starts here.
T0 = 1793491200


def _install(gl: D.GL) -> None:
    storage = types.ModuleType("genlayer.storage")
    storage.TreeMap = D.TreeMap
    storage.DynArray = D.DynArray
    storage.allow = D.allow_storage
    module = types.ModuleType("genlayer")
    module.Address = D.Address
    for name in ("u8", "u16", "u32", "u64", "u256"):
        setattr(module, name, getattr(D, name))
    for name in ("contract", "vm", "message", "public", "nondet", "evm"):
        setattr(module, name, getattr(gl, name))
    module.storage = storage
    module.__all__ = ["Address", "u8", "u16", "u32", "u64", "u256"]
    sys.modules["genlayer"] = module
    sys.modules["genlayer.storage"] = storage


def load(gl: D.GL, path: pathlib.Path | None = None, name: str = "skim_contract") -> types.ModuleType:
    _install(gl)
    spec = importlib.util.spec_from_file_location(name, path or CONTRACT)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def answer(labels) -> str:
    """A model answer, as the model would type it. `labels` is a string like 'FMFF' or a list."""
    if isinstance(labels, str):
        labels = [{"F": "FOUND", "M": "MISSING"}[c] for c in labels]
    return json.dumps({"labels": list(labels)})


QUESTIONS = [
    "What is being asked of the DAO",
    "How much it costs",
    "The date a decision is needed",
    "What happens if it does not pass",
]
TITLE = "Rewrite the developer docs"
GOOD = "We ask for 40,000 USDC to rewrite the docs in Q1, paid in two halves. We need a decision by December 5. If the proposal does not pass, the docs stay as they are."


class World:
    """One Skim contract and the accounts around it. Time is explicit: `at(seconds)` sets the transaction datetime."""

    OWNER = "0x" + "3e" * 20
    ANA = "0x" + "41" * 20
    BEN = "0x" + "a2" * 20
    STRANGER = "0x" + "d4" * 20

    def __init__(self) -> None:
        self.gl = D.GL()
        self.mod = load(self.gl)
        self.at(T0)
        self.sender(self.OWNER)
        self.c = self.mod.Skim()

    def at(self, seconds: int) -> "World":
        self.t = int(seconds)
        stamp = datetime.datetime.fromtimestamp(self.t, datetime.timezone.utc)
        self.gl.message.raw["datetime"] = stamp.strftime("%Y-%m-%dT%H:%M:%SZ")
        return self

    def advance(self, seconds: int) -> "World":
        return self.at(self.t + seconds)

    def sender(self, address: str, value: int = 0) -> "World":
        self.gl.message.sender_address = D.Address(address)
        self.gl.message.origin_address = D.Address(address)
        self.gl.message.value = int(value)
        return self

    @property
    def leader(self) -> D.NodeWorld:
        return self.gl.nondet.leader

    @property
    def validators(self) -> list[D.NodeWorld]:
        return self.gl.nondet.validators

    # -- shorthands --------------------------------------------------------

    def card(self, name="Grants", questions=None, words: int = 120, fee: int = FEE, who=None) -> int:
        self.sender(who or self.OWNER)
        return int(self.c.open_card(name, list(questions if questions is not None else QUESTIONS), words, fee))

    def update(self, cid: int = 1, questions=None, words: int = 120, who=None) -> int:
        self.sender(who or self.OWNER)
        return int(self.c.update_card(cid, list(questions if questions is not None else QUESTIONS), words))

    def submit(self, cid: int = 1, title: str = TITLE, text: str = GOOD, who=None, value=None) -> int:
        fee = int(json.loads(self.c.get_card(str(cid))).get("fee", 0)) if value is None else int(value)
        self.sender(who or self.ANA, fee)
        try:
            return int(self.c.submit(cid, title, text))
        finally:
            self.sender(who or self.ANA)

    def revise(self, pid: int, text: str, who=None, value=None) -> int:
        fee = int(json.loads(self.c.get_proposal(pid)).get("card_fee", 0)) if value is None else int(value)
        self.sender(who or self.ANA, fee)
        try:
            return int(self.c.revise(pid, text))
        finally:
            self.sender(who or self.ANA)

    def queue(self, labels, validator_labels=None) -> None:
        self.leader.answers.append(answer(labels))
        for world in self.validators:
            world.answers.append(answer(validator_labels or labels))

    def judge(self, pid: int, labels: str | None = "FFFF", who=None, validator_labels=None) -> str:
        if labels is not None:
            self.queue(labels, validator_labels)
        self.sender(who or self.STRANGER)
        return str(self.c.judge(pid))

    def waive(self, pid: int, who=None) -> int:
        self.sender(who or self.OWNER)
        return int(self.c.waive(pid))

    def withdraw(self, who: str) -> int:
        self.sender(who)
        return int(self.c.withdraw())

    def get_card(self, cid=1) -> dict:
        return json.loads(self.c.get_card(str(cid)))

    def prop(self, pid: int = 1) -> dict:
        return json.loads(self.c.get_proposal(pid))

    def listing(self, cid: int = 0, offset: int = 0, limit: int = 50) -> dict:
        return json.loads(self.c.list_proposals(cid, offset, limit))

    def account(self, address: str) -> dict:
        return json.loads(self.c.get_card(address))

    def totals(self) -> dict:
        return json.loads(self.c.get_card(""))["totals"]

    def balance_of(self, address: str) -> int:
        return int(self.account(address)["balance"])

    def paid_to(self, address: str) -> int:
        return sum(t.value for t in self.gl.bus.transfers if t.to.lower() == address.lower())

    def paid_out(self) -> int:
        return sum(t.value for t in self.gl.bus.transfers)


def refused(prefix: str, fn, *args, **kwargs) -> str:
    try:
        fn(*args, **kwargs)
    except D.UserError as error:
        message = str(error)
        assert message.startswith("[EXPECTED] "), f"unprefixed refusal: {message}"
        assert prefix in message, f"expected {prefix!r}, got {message!r}"
        return message
    raise AssertionError(f"expected a refusal containing {prefix!r}, nothing was raised")
