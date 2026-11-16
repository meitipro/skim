/**
 * The reviewer's path, run from FRESH accounts through the site's own code.
 *
 *   node scripts/reviewer-path.mjs [site url]
 *
 * Two accounts are made for this run only, each funded by the site's own faucet
 * route (POST /api/faucet), then every write goes through lib/genlayer-core.mjs
 * with a stand-in EIP-1193 wallet, the same code the browser runs:
 *
 *   dao:     faucet, open a card (four questions, a window, a fee)
 *   author:  faucet, submit a proposal whose window is all background (a wrong fee is refused),
 *            ask the validators, then rewrite with the ask on top (the same text is refused), ask again
 *   author:  the wrong account cannot waive; the books add up
 *   author:  withdraw the fees, compared with the wallet after finality
 *
 * It also checks that the site's cut (lib/cut.mjs) is the window the contract stored, and
 * fetches every page of the site. Writes docs/reviewer-path.studio-next.json. Exits 1 on the first step that fails.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseEther } from 'viem';

import { CONTRACT, outcomeOf, readClient, retried, submit, waitDecided, waitFinal, walletClient } from '../lib/genlayer-core.mjs';
import { cutWindow } from '../lib/cut.mjs';
import { balanceOf, ensureAccount, standinWallet } from './standin-wallet.mjs';

const SITE = (process.argv[2] ?? 'http://localhost:3211').replace(/\/$/, '');
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', '..', 'docs', 'reviewer-path.studio-next.json');
const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
const DAO = `reviewer_dao_${stamp}`;
const AUTHOR = `reviewer_author_${stamp}`;

const record = { site: SITE, contract: CONTRACT, started: new Date().toISOString(), steps: [] };
const reader = readClient();
const sent = {};

function say(step, detail = {}) {
  record.steps.push({ step, ...detail });
  console.error(`  ${step}`, JSON.stringify(detail, (k, v) => (typeof v === 'bigint' ? v.toString() : v)).slice(0, 230));
}

function fail(step, why) {
  record.failed = { step, why };
  fs.writeFileSync(OUT, JSON.stringify(record, null, 2));
  console.error(`FAILED at ${step}: ${why}`);
  process.exit(1);
}

/** One write through the site's code. With `expectRefusal` the contract must refuse, and the site's success test must say so. */
async function write(name, method, args, value = 0n, expectRefusal = false) {
  const { address, provider } = standinWallet(name);
  const client = walletClient(address, provider);
  const hash = await submit(client, { method, args, value, sender: address });
  (sent[name] ??= []).push({ hash, client });
  const outcome = outcomeOf(await waitDecided(client, hash, method));
  if (expectRefusal) {
    if (outcome.ok) fail(method, 'expected a refusal, the write succeeded');
    return { hash, outcome, client };
  }
  if (!outcome.ok) fail(method, outcome.refusal || `${outcome.status} ${outcome.execution}`);
  return { hash, outcome, client };
}

async function finalize(client, hash) {
  for (let i = 0; ; i++) {
    try {
      return await waitFinal(client, hash);
    } catch (error) {
      if (i >= 25) throw error;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

const view = async (method, args) => JSON.parse(await retried(() => reader.readContract({ address: CONTRACT, functionName: method, args }), 4));

// -- accounts and the site's faucet ------------------------------------------------------
const daoAddr = ensureAccount(DAO);
const authorAddr = ensureAccount(AUTHOR);
for (const [name, address] of [[DAO, daoAddr], [AUTHOR, authorAddr]]) {
  const before = await balanceOf(address);
  const response = await fetch(`${SITE}/api/faucet`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address: address.toLowerCase() }) });
  const body = await response.json();
  if (!response.ok) fail('faucet', `${name}: ${body.error}`);
  const after = await balanceOf(address);
  if (after <= before) fail('faucet', `${name}: the balance did not move`);
  say('faucet', { account: name, address, from: before.toString(), to: after.toString(), note: 'a lowercase address, checksummed by the route' });
}

// -- the DAO opens a card ---------------------------------------------------------------------
const questions = ['What is being asked of the DAO', 'How much it costs', 'The date a decision is needed', 'What happens if it does not pass'];
const opened = await write(DAO, 'open_card', [`Reviewer path ${stamp}`, questions, 80, parseEther('2')]);
const cardId = Number(opened.outcome.returned);
const card = await view('get_card', [String(cardId)]);
if (card.window_words !== 80 || card.fee !== parseEther('2').toString() || card.questions.length !== 4) fail('open_card', 'the stored card is not what was sent');
say('open_card', { cardId, hash: opened.hash, window_words: card.window_words, fee: card.fee });

// -- the author submits: a wrong fee is refused, the right one works -------------------------------------
const title = `Rewrite the developer docs ${stamp}`;
const background = 'Over the past year, contributors have raised the state of the docs in calls, forums and threads. '.repeat(7);
const first = background + 'We ask for 40,000 USDC, and we need a decision by December 5.';
const wrongFee = await write(AUTHOR, 'submit', [cardId, title, first], parseEther('1'), true);
say('submit_wrong_fee', { hash: wrongFee.hash, refusal: wrongFee.outcome.refusal, note: "refused with the contract's own sentence: accepted, but not a success" });
const submitted = await write(AUTHOR, 'submit', [cardId, title, first], parseEther('2'));
const pid = Number(submitted.outcome.returned);
const p0 = await view('get_proposal', [pid]);
const siteCut = cutWindow(title, first, 80);
if (p0.attempt_rows[0].window !== siteCut) fail('submit', 'the window the contract cut is not the window the site code cuts');
if (p0.held !== parseEther('2').toString()) fail('submit', 'the fee is not held');
say('submit', { proposalId: pid, hash: submitted.hash, words_total: p0.attempt_rows[0].words_total, note: 'the window cut by the contract is the window cut by the site code, word for word' });

// -- the first read, the rewrite, the second read -----------------------------------------------------------
const judged = await write(AUTHOR, 'judge', [pid]);
const p1 = await view('get_proposal', [pid]);
const a1 = p1.attempt_rows[0];
if (!a1.verdict) fail('judge', 'no verdict was stored');
say('judge', { proposalId: pid, hash: judged.hash, labels: a1.labels, verdict: a1.verdict, missing: a1.missing });
if (p1.state !== 'REWRITE') fail('judge', `expected the background-first proposal to be sent back, got ${p1.state}`);

const second = 'We ask for 40,000 USDC to rewrite the docs in Q1, paid in two halves. We need a decision by December 5. If the proposal does not pass, the docs stay as they are.';
const sameText = await write(AUTHOR, 'revise', [pid, first], parseEther('2'), true);
say('revise_same_text', { hash: sameText.hash, refusal: sameText.outcome.refusal });
const revised = await write(AUTHOR, 'revise', [pid, second], parseEther('2'));
const reread = await write(AUTHOR, 'judge', [pid]);
const p2 = await view('get_proposal', [pid]);
const a2 = p2.attempt_rows[1];
if (!a2?.verdict) fail('judge', 'the second attempt was not read');
say('rewrite', { proposalId: pid, revise: revised.hash, judge: reread.hash, labels: a2.labels, verdict: a2.verdict, state: p2.state, held: p2.held });

// -- the wrong account cannot waive; the books -------------------------------------------------------------------
const stranger = await write(AUTHOR, 'waive', [pid], 0n, true);
say('waive_by_the_wrong_account', { hash: stranger.hash, refusal: stranger.outcome.refusal });
const totals = (await view('get_card', [''])).totals;
const sum = BigInt(totals.fees_held) + BigInt(totals.owed) + BigInt(totals.paid);
if (BigInt(totals.received) !== sum) fail('books', `received ${totals.received} is not ${sum}`);
say('books', { ...totals, note: 'received = fees_held + owed + paid' });

// -- the fees back, after finality -----------------------------------------------------------------------------------
const account = await view('get_card', [authorAddr.toLowerCase()]);
const owed = BigInt(account.balance);
if (p2.state === 'SKIMMABLE' && owed !== BigInt(parseEther('4'))) fail('balance', `the contract owes ${owed}, both fees are ${parseEther('4')}`);
if (owed > 0n) {
  for (const { hash, client } of sent[AUTHOR]) await finalize(client, hash);
  const walletBefore = await balanceOf(authorAddr);
  const withdrawn = await write(AUTHOR, 'withdraw', []);
  const final = await finalize(withdrawn.client, withdrawn.hash);
  const walletAfter = await balanceOf(authorAddr);
  const gained = walletAfter - walletBefore;
  say('withdraw', { hash: withdrawn.hash, owed: owed.toString(), wallet_before: walletBefore.toString(), wallet_after_finality: walletAfter.toString(), gained: gained.toString(), fee_difference: (owed - gained).toString(), final_status: outcomeOf(final).status, note: 'the wallet gains what was owed, less the fee of the withdraw transaction' });
  if (gained <= 0n || gained > owed) fail('withdraw', `the wallet moved by ${gained}, which is not within what was owed (${owed})`);
  if ((await view('get_card', [authorAddr.toLowerCase()])).balance !== '0') fail('withdraw', 'the balance was not cleared');
} else {
  say('withdraw', { skipped: `the second attempt came back ${p2.state}, so nothing is owed yet` });
}

// -- the pages --------------------------------------------------------------------------------------------------------
const pages = ['/', '/proposals', '/cards', '/new', '/me', `/c/${cardId}`, `/p/${pid}`, ...(p2.state === 'REWRITE' ? [`/p/${pid}/revise`] : []), '/docs', '/docs/quickstart', '/docs/reference/contract', '/docs/more/evaluation', '/llms.txt'];
for (const page of pages) {
  const response = await fetch(SITE + page, { redirect: 'follow' });
  if (response.status !== 200) fail('pages', `${page} answered ${response.status}`);
}
const text = await (await fetch(`${SITE}/p/${pid}`)).text();
if (!text.includes(p2.state)) fail('pages', `/p/${pid} does not show ${p2.state}`);
say('pages', { checked: pages.length, all: 200, proposal_page_shows: p2.state });

record.finished = new Date().toISOString();
fs.writeFileSync(OUT, JSON.stringify(record, null, 2));
console.log(JSON.stringify({ ok: true, cardId, proposalId: pid, first: a1.verdict, second: a2.verdict, state: p2.state, steps: record.steps.length }));
