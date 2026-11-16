# Skim

**If they only read the top, would they know the ask?**

Skim is a skim test for proposals on [GenLayer](https://www.genlayer.com). A DAO writes the questions every proposal must answer in its opening. The contract cuts each proposal to its first 120 words in code, GenLayer validators read only that window and say for each question whether a skimming reader would find a specific answer, and a proposal opens for voting only when the top of the page answers all of them.

One contract (`contracts/skim.py`, ten methods), a Next.js site with a `/docs` section, deployed on **GenLayer Studio Next** (chain 61997) on the **GenVM v0.4** runtime. The build spec is the source of truth; where this build departs from it, [Honest departures](#honest-departures) says so.

| | |
|---|---|
| Network | GenLayer Studio Next, chain 61997 |
| Contract | [`0x9F09310beD488465b5cE7De55778E081beab9f27`](https://explorer-studio-dev.genlayer.com/address/0x9F09310beD488465b5cE7De55778E081beab9f27) |
| Site | https://skim-genlayer.vercel.app |
| Live reviewer path | [`docs/reviewer-path.studio-next.json`](docs/reviewer-path.studio-next.json): fresh accounts through the live site, REWRITE then SKIMMABLE, withdraw checked after finality |
| Deploy transaction | [`0xa5f2700b…`](https://explorer-studio-dev.genlayer.com/tx/0xa5f2700bac7f4a811daae9c2608d571e6c87ab676ded4a2dfbf62701a8293ff3) |
| Source sha256 | `3f9bf132f70d77977d277458c4b143e7103f530622c25b33f050a823177c5443` (held to the deployed bytes by `scripts/verify.py`) |
| Golden proposals through real consensus | **9 of 10**, the miss published, nothing tuned ([`eval/results.md`](eval/results.md)) |
| Held-out proposals | H1, H2 and H3 all `FOUND FOUND FOUND FOUND`, as they came out |
| Tests | 112 passing, offline |
| Mutations | 86 defences broken one at a time, 86 caught ([`docs/MUTATIONS.md`](docs/MUTATIONS.md)) |

## How it works

1. **Ask.** The DAO opens a card: 3 to 5 questions of at most 120 characters, a skim window of 80 to 200 words, a fee of 0 to 10 GEN.
2. **Submit.** An author submits a title (at most 100 characters) and a text (at most 6,000) and pays the fee.
3. **Cut.** The contract keeps the first N whitespace separated words of the title followed by the text. The rest is never given to the judge. The writing box on the site cuts the same text the same way and draws the skim line live.
4. **Read.** Validators label each question `FOUND` or `MISSING` and agree only when every label is the same.
5. **Open.** The verdict is computed in code from the labels and the attempt count:

| Verdict | When | Money |
|---|---|---|
| SKIMMABLE | every question FOUND | all fees held for the proposal go back to its author; it opens for voting |
| REWRITE · N | N questions MISSING, attempts left | the fee stays held; the missing questions are named |
| SHELVED | the third attempt still has MISSING | the fees go to the card's owner; the author waits 7 days on that card |
| WAIVED | the card's owner waives the rule | the fees go back to the author; marked on the page |

Each attempt costs the fee. Money moves only in `withdraw()`, a top-level transfer to the caller. `judge` and `waive` only move balances. A test asserts after nearly every step that `received == fees_held + owed + paid`.

## The ten methods

`open_card`, `update_card`, `submit` (payable), `revise` (payable), `judge`, `waive`, `withdraw`, `get_card`, `get_proposal`, `list_proposals`. The reference in the docs is generated from the source.

## Results, as they came out

The ten golden proposals went through the deployed contract: one Grants card with four questions and a 120 word window, each proposal submitted from its own account with the 2 GEN fee and read by the real judge. The prompt is the spec's, word for word, and the set was hashed and timestamped before the first run.

- **9 of 10 matched.** The miss is published, not tuned away: case 8 (long background first, the ask after word 120) was expected `FOUND MISSING MISSING MISSING` and the validators agreed on `MISSING` for all four, so the title "Rewrite the developer docs" did not count as naming the ask.
- **Held out, run once, never used to tune:** H1 "30 to 50k USDC", H2 "within two weeks of passing" and H3 "otherwise nothing changes" all came back with every question FOUND, so all three are SKIMMABLE.
- **Seed on chain** ([`docs/seed.studio-next.json`](docs/seed.studio-next.json)): a proposal the card's owner waived (WAIVED), one that failed three attempts (SHELVED), the 6 GEN of shelved fees withdrawn by the card's owner and the 2 GEN of the waived proposal withdrawn by its author, both checked against the wallets after finality.

## Honest departures

- **The runtime.** The spec names the GenVM v0.3 runner `py-genlayer:5jycge4q…`. Studio Next removed v0.3 and requires v0.4, so the contract starts from `# v0.4.0` and `py-genlayer:kzybg95x…`, checked with the network's own `gen_getContractSchemaForCode`. The installed `genvm-lint` does not know that runner, so `scripts/deploy.py` and `scripts/verify.py` lint the same bytes with the first two header lines swapped, and the live runtime's verdict is the authority.
- **`get_card` takes a string,** because the spec fixes ten methods: a card id, an account address (its balance and proposals) or an empty string (the totals).
- **No per-question reason.** The prompt returns labels only, as the spec fixes it, so the page shows each label and the cut window but not "where the answer was found".
- **Fees are paid per attempt**, so SKIMMABLE returns all of them and SHELVED sends all of them to the card. A shelved proposal cannot be waived: its fees have gone to the owner.
- **No bound on reading.** An attempt waits for `judge`, which anyone can call, and the owner can waive it. Stretch goals are not built.

## Layout

```
contracts/skim.py      one contract, the judge prompt pinned inside
contracts/FROZEN.json  address, deploy tx and sha256 of the exact bytes deployed
tests/                 direct tests (every method, money invariant under random play) and static tests over the source
tests/vectors.json     window cutting vectors shared with the site
eval/                  golden proposals, held-out proposals, results with transaction hashes
scripts/               chain, deploy, verify, mutate, seed, gen_docs, gen_vectors
web/                   Next.js site and /docs (Fumadocs), genlayer-js 2.0.0-rc.1
submission/            portal text, X post, silent demo script, 512 px logo
```

## Run it

```bash
python -m venv .venv && .venv/Scripts/python -m pip install -r requirements.txt
.venv/Scripts/python -m pytest tests -q          # offline
.venv/Scripts/python scripts/verify.py           # deployed bytes against this repository
.venv/Scripts/python scripts/mutate.py           # break every defence once; refuses to pass if anything escapes
cd web && npm ci && npm run build && npm start   # the site, reading the live contract
node web/scripts/hash-parity.mjs                 # the browser cut against the contract's
```

Keys never live in this repository. Test accounts are kept in `~/.skim/accounts.json`, and the scripts print only addresses. The site holds no key; writes are signed in the visitor's wallet. The only server secret is an optional model key for the card form's preview.

## Honest limits

Skim checks that the top of a proposal answers the questions the DAO set. It does not check that the answers are true, that the plan is good, or that the rest of the text agrees with the opening. A skimmable proposal is a clear one, not a good one.
