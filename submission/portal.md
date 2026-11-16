# Portal entry

The fields in the order the portal shows them. `python submission/count.py` counts every limited field.

## Project name

Skim - if they only read the top, would they know the ask?

## Project tag

Governance

## Tag 1

(choose the closest focus in the portal's list for Governance)

## Tag 2

(choose the next closest focus in the portal's list for Governance)

## Icon

`submission/skim-icon-512.png` (512 × 512, the site's own mark, safe for a circular crop)

## One-liner

A skim test for proposals: the top of the page must answer the DAO's questions.

## Description

Skim is a skim test for proposals on GenLayer. A DAO writes the questions every proposal must answer, and the contract cuts each proposal to its first 120 words in code. Validators read only that window and label each question found or missing. The contract derives the verdict from those labels, so a proposal opens for voting only when its opening answers every question, with up to three rewrites, a returned fee and an owner waiver for emergencies. Only withdraw pays. It never judges whether a proposal is good. Deployed on Studio Next on the GenVM v0.4 runtime, with golden proposals run through real consensus and published as they came out: 9 of 10, the miss shown.

## Show it in action

Demo video: not recorded yet (`submission/demo-script.md` has the shot list).

## Write the exact path

### 1. Fund a wallet

Open skim-genlayer.vercel.app and select Connect wallet in the header, then Switch to Studio Next: the site adds GenLayer Studio Next (chain 61997) to the wallet. The first action panel you reach offers Get test GEN, which pays 20 test GEN from the site's faucet.

### 2. Open a card

Select Cards, then Open a card. Write your questions, drag the window ruler, set a 2 GEN fee, then select Open the card and confirm. The page of your card opens.

### 3. Submit a proposal

On the card, write a title and a text in the box under Submit a proposal on this card; a dashed skim line shows where the window ends. Select Submit with a 2 GEN fee and confirm.

### 4. Ask the validators

On the proposal page select Ask the validators to read it and confirm. The page shows Validators are reading, then each question marked FOUND or MISSING and the verdict.

### 5. Rewrite

If it came back REWRITE, select Rewrite it, move the missing answers to the top, and select Submit the new attempt with a 2 GEN fee. Ask the validators again; SKIMMABLE opens it for voting.

### 6. Withdraw

Select Withdraw and confirm. Verdicts only move balances inside the contract; withdraw is the one call that pays, and the fees come back to you.

## Prove the path works

### Expected verification outcome

The proposal page shows the skim line across the text, each question with its label and the verdict, and My proposals shows the balance. To confirm on chain, open the judge transaction: consensus_data.leader_receipt[0] has execution_result SUCCESS and result.status return; a refusal is also ACCEPTED, so status alone proves nothing. get_proposal(id) returns the window, labels and verdict. The same path ran from fresh accounts against the live site: https://github.com/meitipro/skim/blob/main/docs/reviewer-path.studio-next.json

### Contract link

https://explorer-studio-dev.genlayer.com/address/0x9F09310beD488465b5cE7De55778E081beab9f27

## Send people to it

- Website: https://skim-genlayer.vercel.app
- GitHub: https://github.com/meitipro/skim

## Steward note

Studio Next removed GenVM v0.3, so the contract starts from the v0.4 runner instead of the one in the spec. The golden set was locked before the first run and nothing was tuned: 9 of 10, with case 8 expected to have its ask in the title FOUND and labelled MISSING. A shelved proposal cannot be waived; its fees have already gone to the card.

## Evidence

- Contract: https://explorer-studio-dev.genlayer.com/address/0x9F09310beD488465b5cE7De55778E081beab9f27
- Deploy: https://explorer-studio-dev.genlayer.com/tx/0xa5f2700bac7f4a811daae9c2608d571e6c87ab676ded4a2dfbf62701a8293ff3
- Evaluation: https://github.com/meitipro/skim/blob/main/eval/results.md
- Mutations, 86 of 86: https://github.com/meitipro/skim/blob/main/docs/MUTATIONS.md
- Seed, WAIVED: https://explorer-studio-dev.genlayer.com/tx/0x035794aa54190127e562f036f649e92760ee1d21c3b40fc06d06a73ff8644e04
- Seed, SHELVED after three attempts: https://explorer-studio-dev.genlayer.com/tx/0x9c19a816bcd04a16f223c0eed953f27a853a26ff0fe78d56cdcfd6c6cd499c8f
- Reviewer path on the live site: https://github.com/meitipro/skim/blob/main/docs/reviewer-path.studio-next.json
