#!/usr/bin/env python3
"""
Run the golden proposals through the deployed Skim contract on Studio Next,
through real consensus, and publish what came out.

    python eval/run_golden.py --lock       # hash and timestamp eval/golden.json, once, before the first run
    python eval/run_golden.py              # the ten golden cases
    python eval/run_golden.py H1 H2 H3     # the held-out cases, once
    python eval/run_golden.py --report     # rewrite results.md from results.json

eval/golden.json was written, hashed and timestamped before the first run, and
this script refuses to run if it has changed since. One account, golden_owner,
opens the Grants card. Each case is one proposal submitted from one of three
author accounts with the 2 GEN fee, and a judge account calls judge. The labels
are read back from the contract with get_proposal. Every step is saved before
anything is printed, so a run can stop at any point and resume without sending
anything twice. H1 to H3 are held out: run once, reported as they came out.
Cases are scored on the labels, the only thing validators compare.
"""

from __future__ import annotations

import ast
import datetime
import hashlib
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "scripts"))

import chain as C  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = pathlib.Path(__file__).resolve().parent
GOLDEN, LOCK, RESULTS, REPORT = HERE / "golden.json", HERE / "golden.lock.json", HERE / "results.json", HERE / "results.md"
OWNER, JUDGE = "golden_owner", "golden_judge"
AUTHORS = ["golden_author_1", "golden_author_2", "golden_author_3"]


def judge_sha() -> str:
    tree = ast.parse(C.CONTRACT_FILE.read_text(encoding="utf-8"))
    for node in tree.body:
        if isinstance(node, ast.Assign) and ast.unparse(node.targets[0]) == "JUDGE":
            return hashlib.sha256(ast.literal_eval(node.value).encode("utf-8")).hexdigest()
    raise SystemExit("no JUDGE constant")


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_results() -> dict:
    return json.loads(RESULTS.read_text(encoding="utf-8")) if RESULTS.exists() else {"card": {}, "cases": {}, "attempts": []}


def save(results: dict) -> None:
    RESULTS.write_text(json.dumps(results, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")


def finished(results: dict, case_id: str) -> bool:
    return any(a["case"] == case_id and a.get("labels") for a in results["attempts"])


def must(outcome: dict, what: str) -> dict:
    if not outcome["ok"]:
        raise SystemExit(f"{what} failed: {outcome['detail']}  {C.EXPLORER}/tx/{outcome['hash']}")
    return outcome


def matches(a: dict) -> bool:
    return bool(a.get("labels")) if a["expected"] == "EITHER" else a.get("labels") == a["expected"]


def lock() -> None:
    if LOCK.exists():
        raise SystemExit("eval/golden.lock.json already exists; the golden set is locked once")
    LOCK.write_text(json.dumps({"file": "eval/golden.json", "sha256": C.sha256_file(GOLDEN), "locked_at": now_iso()}, indent=2) + "\n", encoding="utf-8", newline="\n")
    print(f"locked eval/golden.json  sha256 {C.sha256_file(GOLDEN)}")


def run_case(case: dict, index: int, results: dict, address: str, golden: dict, judge: C.Chain, authors: dict, reader: C.Chain) -> None:
    cid = case["id"]
    who = authors[AUTHORS[index % len(AUTHORS)]]
    row = results["cases"].setdefault(cid, {"author": who.account.address})
    card_id = results["card"]["id"]
    if "proposal_id" not in row:
        outcome = must(who.send(address, "submit", [card_id, case["proposal_title"], case["text"]], value=golden["card"]["fee_gen"] * C.GEN), f"submit for case {cid}")
        row.update({"submit_tx": outcome["hash"], "proposal_id": int(outcome["result"])})
        save(results)
        print(f"  submitted as proposal {row['proposal_id']}  {C.EXPLORER}/tx/{outcome['hash']}")
    attempt = {"case": cid, "attempt": sum(1 for a in results["attempts"] if a["case"] == cid) + 1, "held_out": bool(case.get("held_out")), "expected": case["expected"], "expected_verdict": case.get("expected_verdict", ""), "proposal_id": row["proposal_id"]}
    outcome = judge.send(address, "judge", [row["proposal_id"]])
    attempt.update({"tx": outcome["hash"], "sent_at": now_iso(), "consensus": "decided" if outcome["ok"] else outcome["detail"]})
    read = reader.read_json(address, "get_proposal", [row["proposal_id"]])
    first = read["attempt_rows"][0]
    if first["labels"]:
        attempt.update({"labels": ",".join(first["labels"]), "verdict": first["verdict"], "missing": first["missing"], "words_total": first["words_total"], "window_words": first["window_words"], "state": read["state"]})
    results["attempts"].append(attempt)
    save(results)
    print(f"  {'MATCH' if matches(attempt) else 'MISS '} {attempt.get('labels') or 'no labels: ' + attempt['consensus']} -> {attempt.get('verdict', '')}")
    print(f"  {C.EXPLORER}/tx/{attempt['tx']}")


def run(ids: list[str]) -> None:
    lock_data = json.loads(LOCK.read_text(encoding="utf-8"))
    if C.sha256_file(GOLDEN) != lock_data["sha256"]:
        raise SystemExit("eval/golden.json changed after it was locked; the golden set is not edited after the first run")
    golden = json.loads(GOLDEN.read_text(encoding="utf-8"))
    address = C.address()
    people = C.accounts(OWNER, JUDGE, *AUTHORS)
    owner, judge, reader = C.Chain(people[OWNER]), C.Chain(people[JUDGE]), C.Chain()
    authors = {n: C.Chain(people[n]) for n in AUTHORS}
    results = load_results()
    results.update({"contract": address, "contract_sha256": C.deployment().get("skim_sha256"), "golden_sha256": lock_data["sha256"], "golden_locked_at": lock_data["locked_at"], "judge_sha256": judge_sha(), "network": C.NETWORK, "explorer": C.EXPLORER, "owner": people[OWNER].address})
    save(results)
    wanted = ids or [c["id"] for c in golden["cases"] if not c.get("held_out")]
    todo = [(i, c) for i, c in enumerate(golden["cases"]) if c["id"] in wanted and not finished(results, c["id"])]
    if todo:
        owner.ensure(people[OWNER].address, minimum_gen=20)
        judge.ensure(people[JUDGE].address, minimum_gen=20)
        for n in AUTHORS:
            authors[n].ensure(people[n].address, minimum_gen=60)
        if "id" not in results["card"]:
            spec = golden["card"]
            outcome = must(owner.send(address, "open_card", [spec["name"], spec["questions"], spec["window_words"], spec["fee_gen"] * C.GEN]), "open_card")
            results["card"] = {"id": int(outcome["result"]), "tx": outcome["hash"]}
            save(results)
            print(f"opened card {results['card']['id']}  {C.EXPLORER}/tx/{outcome['hash']}")
    for index, case in todo:
        print(f"\n{case['id']} {case['title']} (expected {case['expected']})")
        run_case(case, index, results, address, golden, judge, authors, reader)
    report()


def report() -> None:
    results = load_results()
    golden = json.loads(GOLDEN.read_text(encoding="utf-8"))
    final = {a["case"]: a for a in results["attempts"] if a.get("labels")}
    scored = [a for a in final.values() if not a["held_out"]]
    hit = sum(1 for a in scored if matches(a))
    explorer = results.get("explorer", C.EXPLORER)
    contract = results.get("contract", "")
    qs = golden["card"]["questions"]
    lines = [
        "# Golden proposals, through real consensus", "",
        f"Contract [`{contract}`]({explorer}/address/{contract}) on Studio Next (chain 61997). One Grants card with four questions and a 120 word window; every case is one proposal submitted from its own account with the 2 GEN fee, and one `judge` transaction asked the validators. The labels are read back from the contract with `get_proposal`. Cases are scored on the four labels, the only thing validators compare; the verdict is what the contract derives from them.", "",
        f"- Golden set: **{hit} of {len(scored)}** matched.",
        f"- Held-out cases: **{sum(1 for a in final.values() if a['held_out'])} run**, labels exactly as they came out (no expected answer, so none is scored).",
        f"- `eval/golden.json` sha256 `{results.get('golden_sha256', '')}`, locked at {results.get('golden_locked_at', '')}, before the first run.",
        f"- Judge prompt sha256 `{results.get('judge_sha256', '')}`.", "",
        "Nothing here was tuned. The prompt is the spec's, word for word, and no case was edited after the lock.", "",
        "Questions: " + " · ".join(f"Q{i + 1} {q}" for i, q in enumerate(qs)), "",
        "| Case | What it tests | Expected | Got | Verdict | Transaction |", "|---|---|---|---|---|---|",
    ]
    for case in golden["cases"]:
        a = final.get(case["id"])
        tag = case["id"] + (" (held out)" if case.get("held_out") else "")
        short = lambda s: s.replace("FOUND", "F").replace("MISSING", "M").replace(",", " ")  # noqa: E731
        if not a:
            lines.append(f"| {tag} | {case['title']} | {short(case['expected'])} | not run yet | | |")
            continue
        mark = "" if case["expected"] == "EITHER" else (" ✓" if matches(a) else " ✗ miss")
        verdict = a["verdict"] + (f" · {a['missing']}" if a["verdict"] == "REWRITE" else "")
        lines.append(f"| {tag} | {case['title']} | {short(case['expected'])} | {short(a['labels'])}{mark} | {verdict} | [{a['tx'][:10]}…]({explorer}/tx/{a['tx']}) |")
    lines += ["", "F is FOUND and M is MISSING, one per question in order.", "", "## Every attempt", ""]
    others = [a for a in results["attempts"] if not a.get("labels")]
    lines += [f"- case {a['case']} attempt {a['attempt']}: {a['consensus'][:200]} ([tx]({explorer}/tx/{a['tx']}))" for a in others] or ["Every judge produced labels on its first attempt; nothing was sent twice."]
    card = results.get("card", {})
    if card.get("tx"):
        lines += ["", "## The card and the proposals", "", f"- card {card['id']} opened in [{card['tx'][:10]}…]({explorer}/tx/{card['tx']})"]
    for case in golden["cases"]:
        row = results.get("cases", {}).get(case["id"])
        if row and "submit_tx" in row:
            lines.append(f"- case {case['id']}: proposal {row['proposal_id']} submitted in [{row['submit_tx'][:10]}…]({explorer}/tx/{row['submit_tx']})")
    lines.append("")
    REPORT.write_text("\n".join(lines), encoding="utf-8", newline="\n")
    print(f"\nwrote eval/results.md: golden {hit}/{len(scored)}")


if __name__ == "__main__":
    if "--lock" in sys.argv:
        lock()
    elif "--report" in sys.argv:
        report()
    else:
        run([a for a in sys.argv[1:] if not a.startswith("--")])
