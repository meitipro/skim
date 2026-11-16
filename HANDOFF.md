# Handoff

Only the user can do these:

- Send the portal entry (`submission/portal.md`, counted with `python submission/count.py`). Choose the two focus tags in the portal's list for the Governance tag.
- Send the X post (`submission/x-post.md`).
- Record the silent demo from `submission/demo-script.md`.
- Optional: set `OPENROUTER_API_KEY` on the Vercel project to switch on the card form's "Preview with one model". It is untested here because no key was available, and it never reaches the chain.

Worth knowing:

- The runtime differs from the spec's because Studio Next removed GenVM v0.3. See the README, "Honest departures".
- The golden miss (case 8) is published as it came out and was not tuned.
- Test keys live in `~/.skim/accounts.json`, outside the repository. Nothing prints a key.
- One mutant of the first list was dropped because its check is redundant in the deployed contract: `revise` refuses a fourth attempt twice, once by the state (REWRITE only exists below three attempts) and once by an explicit count. Neither is a gap; the contract was not changed.
