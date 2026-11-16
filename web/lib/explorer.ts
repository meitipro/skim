import { abi } from 'genlayer-js';
import { unstable_cache } from 'next/cache';

import { CONTRACT, EXPLORER } from './genlayer-core.mjs';

/**
 * The transactions behind cards and proposals, read from the Studio Next
 * explorer's API: the open_card whose returned id is the card, the submit whose
 * returned id is the proposal, the revise and judge whose argument is the
 * proposal, in order. Only decided, successful transactions count. Links are a
 * convenience, never a dependency.
 */

export type Votes = { agreed: number; voted: number; seconds: number };
export type ContractTx = { method: string; hash: string; from: string; created: string; args: string[]; returned?: string; votes?: Votes };
export type TxIndex = {
  card: Record<string, ContractTx>;
  submit: Record<string, ContractTx>;
  /** proposal id -> its revise transactions, oldest first */
  revise: Record<string, ContractTx[]>;
  /** proposal id -> its judge transactions that decided an attempt, oldest first */
  judge: Record<string, ContractTx[]>;
  waive: Record<string, ContractTx>;
  withdraw: Record<string, ContractTx[]>;
};

/* eslint-disable @typescript-eslint/no-explicit-any */

function decode(b64: string): { method: string; args: unknown[] } | null {
  try {
    const out = abi.calldata.decode(Uint8Array.from(Buffer.from(b64, 'base64'))) as any;
    if (!(out instanceof Map)) return null;
    return { method: String(out.get('') ?? ''), args: (out.get('args') as unknown[]) ?? [] };
  } catch {
    return null;
  }
}

function leaderOf(tx: any): any {
  const rounds = tx?.consensus_data?.leader_receipt;
  if (Array.isArray(rounds)) return rounds.find((r: any) => String(r?.mode ?? '').toLowerCase() === 'leader') ?? rounds[0];
  return rounds;
}

/** One status byte (0 means returned) and then the returned value, calldata-encoded, as the explorer stores it. */
function succeeded(tx: any): { ok: boolean; returned?: string } {
  const status = String(tx?.status ?? '').toUpperCase();
  if (status !== 'ACCEPTED' && status !== 'FINALIZED') return { ok: false };
  const leader = leaderOf(tx);
  if (String(leader?.execution_result ?? '').toUpperCase() !== 'SUCCESS') return { ok: false };
  const result = leader?.result;
  if (typeof result === 'string') {
    try {
      const bytes = Uint8Array.from(Buffer.from(result, 'base64'));
      if (bytes[0] !== 0) return { ok: false };
      const value = abi.calldata.decode(bytes.subarray(1)) as unknown;
      return { ok: true, returned: typeof value === 'bigint' || typeof value === 'number' || typeof value === 'string' ? String(value) : undefined };
    } catch {
      return { ok: false };
    }
  }
  const readable = result?.payload?.readable ?? result?.payload;
  return { ok: String(result?.status ?? '').toLowerCase() === 'return', returned: typeof readable === 'string' ? readable.replace(/^"|"$/g, '') : undefined };
}

/** Votes cast and agreed, and how long the round took, from the explorer's own record. "idle" was not in that committee. */
function votesOf(tx: any): Votes | undefined {
  const votes = tx?.consensus_data?.votes;
  if (!votes || typeof votes !== 'object') return undefined;
  const cast = Object.values(votes).map((v) => String(v).toLowerCase()).filter((v) => v !== 'idle' && v !== '');
  if (cast.length === 0) return undefined;
  const started = Date.parse(String(tx?.created_at ?? '')) / 1000;
  const ended = Number(tx?.last_vote_timestamp ?? 0);
  return { agreed: cast.filter((v) => v === 'agree').length, voted: cast.length, seconds: Number.isFinite(started) && ended > started ? Math.round(ended - started) : 0 };
}

const EMPTY: TxIndex = { card: {}, submit: {}, revise: {}, judge: {}, waive: {}, withdraw: {} };

async function scan(): Promise<TxIndex> {
  const index: TxIndex = { card: {}, submit: {}, revise: {}, judge: {}, waive: {}, withdraw: {} };
  const rows: ContractTx[] = [];
  for (let page = 1; page <= 40; page++) {
    const response = await fetch(`${EXPLORER}/api/transactions?address=${CONTRACT}&limit=100&page=${page}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`explorer answered ${response.status}`);
    const body = await response.json();
    for (const tx of body.transactions ?? []) {
      const call = tx?.data?.calldata ? decode(tx.data.calldata) : null;
      if (!call) continue;
      const done = succeeded(tx);
      if (!done.ok) continue;
      rows.push({
        method: call.method,
        hash: tx.hash,
        from: String(tx.from_address ?? ''),
        created: String(tx.created_at ?? ''),
        args: call.args.map((a) => (typeof a === 'bigint' || typeof a === 'number' || typeof a === 'string' ? String(a) : '')),
        returned: done.returned,
        votes: call.method === 'judge' ? votesOf(tx) : undefined,
      });
    }
    if (page >= Number(body?.pagination?.totalPages ?? 1)) break;
  }
  rows.sort((a, b) => a.created.localeCompare(b.created));
  for (const row of rows) {
    const num = /^\d+$/.test(row.returned ?? '') ? (row.returned as string) : '';
    if (row.method === 'open_card' && num) index.card[num] ??= row;
    else if (row.method === 'submit' && num) index.submit[num] ??= row;
    else if (row.method === 'revise' && row.args[0]) (index.revise[row.args[0]] ??= []).push(row);
    else if (row.method === 'judge' && row.args[0]) (index.judge[row.args[0]] ??= []).push(row);
    else if (row.method === 'waive' && row.args[0]) index.waive[row.args[0]] ??= row;
    else if (row.method === 'withdraw') (index.withdraw[row.from.toLowerCase()] ??= []).push(row);
  }
  return index;
}

const cachedScan = unstable_cache(scan, ['explorer-scan', CONTRACT], { revalidate: 60, tags: ['txs'] });

export async function txIndex(): Promise<TxIndex> {
  try {
    return await cachedScan();
  } catch {
    return EMPTY;
  }
}
