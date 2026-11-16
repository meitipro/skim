#!/usr/bin/env python3
"""
Seed the deployed contract beyond the golden run.

    python scripts/seed.py

The golden run (eval/run_golden.py) already put a Grants card and ten proposals
on chain: skimmable ones and ones sent back. This script adds what that run
leaves out, from real transactions, saved to docs/seed.studio-next.json before
anything is printed:

  - a second card, "Fee changes", with a proposal the owner waives (WAIVED)
  - a proposal that fails three attempts and is SHELVED, with its cooldown
  - the withdrawals those outcomes owe, checked against the wallets after finality

The labels and verdicts are whatever the validators answered; this script never
chooses them. A step already recorded is never sent twice.
"""

from __future__ import annotations

import datetime
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

import chain as C  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
RECORD = C.ROOT / "docs" / "seed.studio-next.json"
VAGUE = [
    "As discussed in the forum, same as before.",
    "As discussed in the forum, same as before. Please see the thread.",
    "As discussed in the forum, same as before. More detail will follow soon.",
]
QUESTIONS = ["What is being changed", "By how much", "The date it takes effect", "What happens if it does not pass"]


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def step(record: dict, key: str, chain: C.Chain, address: str, method: str, args: list, value: int = 0) -> dict:
    if key in record["steps"]:
        return record["steps"][key]
    out = chain.send(address, method, args, value=value)
    row = {"method": method, "tx": out["hash"], "ok": out["ok"], "returned": out["result"], "refusal": out["refusal"], "at": now_iso()}
    record["steps"][key] = row
    RECORD.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    print(f"  {key}: {'ok' if out['ok'] else 'FAILED ' + (out['refusal'] or out['detail'])}  {C.EXPLORER}/tx/{out['hash']}")
    if not out["ok"]:
        raise SystemExit(f"{key} did not succeed; nothing already recorded is sent twice.")
    return row


def main() -> int:
    address = C.address()
    people = C.accounts("seed_dao", "seed_author_1", "seed_author_2", "seed_judge")
    dao, a1, a2, judge, reader = (C.Chain(people[n]) for n in ("seed_dao", "seed_author_1", "seed_author_2", "seed_judge")), None, None, None, C.Chain()
    dao, a1, a2, judge = dao
    record = json.loads(RECORD.read_text(encoding="utf-8")) if RECORD.exists() else {"steps": {}}
    record.update({"contract": address})
    for name, chain in (("seed_dao", dao), ("seed_author_1", a1), ("seed_author_2", a2), ("seed_judge", judge)):
        chain.ensure(people[name].address, minimum_gen=30)

    card = step(record, "open_card", dao, address, "open_card", ["Fee changes", QUESTIONS, 100, 2 * C.GEN])
    cid = int(card["returned"])
    p1 = step(record, "submit_waived", a1, address, "submit", [cid, "Change the fee", VAGUE[0]], 2 * C.GEN)
    step(record, "judge_waived", judge, address, "judge", [p1["returned"]])
    step(record, "waive", dao, address, "waive", [p1["returned"]])

    p2 = step(record, "submit_shelved", a2, address, "submit", [cid, "Another fee change", VAGUE[0]], 2 * C.GEN)
    step(record, "judge_shelved_1", judge, address, "judge", [p2["returned"]])
    for n in (1, 2):
        step(record, f"revise_shelved_{n}", a2, address, "revise", [p2["returned"], VAGUE[n]], 2 * C.GEN)
        step(record, f"judge_shelved_{n + 1}", judge, address, "judge", [p2["returned"]])

    for name, chain in (("seed_dao", dao), ("seed_author_1", a1)):
        owed = int(reader.read_json(address, "get_card", [people[name].address.lower()])["balance"])
        if owed > 0 and f"withdraw_{name}" not in record["steps"]:
            before = chain.balance(people[name].address)
            row = step(record, f"withdraw_{name}", chain, address, "withdraw", [])
            chain.wait(row["tx"], "finalized")
            after = C.retry("balance", chain.balance, people[name].address)
            row.update({"owed": str(owed), "balance_before": str(before), "balance_after_finality": str(after)})
            RECORD.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
            print(f"  {name}: owed {owed / C.GEN} GEN, wallet {before / C.GEN:.4f} -> {after / C.GEN:.4f} after finality")
    record["finished_at"] = now_iso()
    RECORD.write_text(json.dumps(record, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    for pid in (p1["returned"], p2["returned"]):
        view = reader.read_json(address, "get_proposal", [pid])
        print(f"  proposal {pid}: {view['state']}, attempts {[a['labels'] for a in view['attempt_rows']]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
