/**
 * Read a proposal: its attempts, the window cut for each, the labels and the verdict. Reads need no wallet and no fee.
 *
 *   node examples/read-proposal.mjs <proposal id>
 *
 * This file is the sample on the docs pages "Write a skimmable proposal" and
 * "Vote page badge", copied in by scripts/gen_docs.py.
 */
import { createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';

const SKIM = '0x9F09310beD488465b5cE7De55778E081beab9f27';
const chain = { ...studioDevnet, id: 61997, rpcUrls: { default: { http: ['https://studio-next.genlayer.com/api'] } } };

const client = createClient({ chain });
const [id = '1'] = process.argv.slice(2);
const p = JSON.parse(await client.readContract({ address: SKIM, functionName: 'get_proposal', args: [Number(id)] }));

if (!p.found) throw new Error('no such proposal');
console.log(`#${p.id} ${p.title}: ${p.state}, attempt ${p.attempts} of 3`);
for (const a of p.attempt_rows) console.log(`  attempt ${a.n}: ${a.labels.join(' ') || 'not read'} -> ${a.verdict || 'waiting'}`);
