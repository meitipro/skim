"""
Read a proposal's attempts, labels and verdict from Python, with genlayer-py 0.19.0rc2.

    python web/examples/read_proposal.py <proposal id>

genlayer-py reads through an account even for views, so a throwaway one is
made here; it is never funded and never signs. This file is the Python sample
on the docs page "Write a skimmable proposal", copied in by scripts/gen_docs.py.
"""

import json
import sys

from genlayer_py import create_account, create_client
from genlayer_py.chains import studio_devnet

SKIM = "0x9F09310beD488465b5cE7De55778E081beab9f27"
studio_devnet.rpc_urls = {"default": {"http": ["https://studio-next.genlayer.com/api"]}}

reader = create_account()
client = create_client(chain=studio_devnet, account=reader)
proposal_id = int(sys.argv[1] if len(sys.argv) > 1 else 1)
p = json.loads(client.read_contract(address=SKIM, function_name="get_proposal", args=[proposal_id], account=reader))

if not p["found"]:
    raise SystemExit("no such proposal")
print(json.dumps({
    "title": p["title"],
    "state": p["state"],
    "attempts": [{"n": a["n"], "labels": a["labels"], "verdict": a["verdict"]} for a in p["attempt_rows"]],
}, ensure_ascii=False))
