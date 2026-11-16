/**
 * Open a card, submit a proposal, ask the validators, rewrite and read the result, with genlayer-js.
 *
 *   node examples/quickstart.mjs <account name for the DAO> <account name for the author>
 *
 * In a browser the provider is window.ethereum and the account is the one the
 * wallet connected. Here a stand-in wallet signs for a local test account, so
 * the same code runs from a terminal. This file is the sample on the docs page
 * "Quickstart", copied in by scripts/gen_docs.py.
 */
import { createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import { parseEther } from 'viem';

import { standinWallet } from '../scripts/standin-wallet.mjs';

const SKIM = '0x9F09310beD488465b5cE7De55778E081beab9f27';
const chain = { ...studioDevnet, id: 61997, rpcUrls: { default: { http: ['https://studio-next.genlayer.com/api'] } } };

const [daoName = 'docs_dao', authorName = 'docs_author'] = process.argv.slice(2);

function wallet(name) {
  const { address, provider } = standinWallet(name); // browser: window.ethereum
  return createClient({ chain, account: address, provider });
}

/** One write: a fee deposit from the SDK's estimate, then the success test. */
async function write(client, functionName, args, { value = 0n, rotations = 1 } = {}) {
  const estimate = await client.estimateTransactionFees({
    leaderTimeunitsAllocation: 600,
    validatorTimeunitsAllocation: 600,
    totalMessageFees: 0,
    rotations: [rotations],
  });
  const hash = await client.writeContract({
    address: SKIM,
    functionName,
    args,
    value,
    fees: { distribution: estimate.distribution, feeValue: estimate.feeValue },
  });
  const receipt = await client.waitForTransactionReceipt({ hash, waitUntil: 'decided', interval: 4000, retries: 120 });
  const leader = receipt.consensus_data.leader_receipt[0];
  // ACCEPTED is not success on its own: a refusal is accepted too. Check the result.
  if (leader.execution_result !== 'SUCCESS' || leader.result.status !== 'return') {
    throw new Error(`${functionName} refused: ${JSON.stringify(leader.result.payload)}`);
  }
  return { hash, returned: JSON.parse(leader.result.payload.readable) };
}

const dao = wallet(daoName);
const author = wallet(authorName);

// --- step: card
// 1. The DAO opens a card: four questions, a 120 word window, a 2 GEN fee.
const questions = ['What is being asked of the DAO', 'How much it costs', 'The date a decision is needed', 'What happens if it does not pass'];
const card = await write(dao, 'open_card', ['Quickstart grants ' + new Date().toISOString().slice(0, 16), questions, 120, parseEther('2')]);
const cardId = Number(card.returned);

// --- step: submit
// 2. An author submits a proposal whose opening is all background, paying the 2 GEN fee.
const background = 'Over the past year, contributors have raised the state of the docs in calls, forums and threads. '.repeat(8);
const title = 'Rewrite the developer docs';
const submitted = await write(author, 'submit', [cardId, title, background + 'We ask for 40,000 USDC, and need a decision by December 5.'], { value: parseEther('2') });
const proposalId = Number(submitted.returned);

// --- step: judge
// 3. Anyone asks the validators. judge may rotate to a second committee, so it allows more rotations.
const judged = await write(author, 'judge', [proposalId], { rotations: 3 });

// --- step: revise
// 4. The ask moves to the top. A new attempt holds the fee again, and is read the same way.
const second = await write(author, 'revise', [proposalId, 'We ask for 40,000 USDC to rewrite the docs in Q1, paid in two halves. We need a decision by December 5. If the proposal does not pass, the docs stay as they are.'], { value: parseEther('2') });
const reread = await write(author, 'judge', [proposalId], { rotations: 3 });

// --- step: read
// 5. Read the result back from the contract.
const view = JSON.parse(await author.readContract({ address: SKIM, functionName: 'get_proposal', args: [proposalId] }));
console.log(JSON.stringify({ cardId, proposalId, attempt: second.returned, firstRead: judged.hash, secondRead: reread.hash, state: view.state, labels: view.attempt_rows.map((a) => a.labels) }));
