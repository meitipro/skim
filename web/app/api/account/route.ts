import { NextResponse } from 'next/server';
import { isAddress } from 'viem';

import { getAccount, getProposal, readError } from '@/lib/read';
import type { Proposal } from '@/lib/types';

/**
 * One account's balance and proposals, read through the site so the browser
 * spends no RPC budget of its own and the answer is cached with the rest.
 * `brief=1` is the account alone.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const address = String(url.searchParams.get('address') ?? '');
  if (!isAddress(address, { strict: false })) return NextResponse.json({ error: 'Send a wallet address.' }, { status: 400 });
  try {
    const account = await getAccount(address);
    if (!account.found) return NextResponse.json({ account: { balance: '0', earned: '0', withdrawn: '0', proposals: [] }, proposals: [] });
    if (url.searchParams.get('brief')) return NextResponse.json({ account });
    const proposals: Proposal[] = [];
    for (const id of account.proposals.slice(0, 12)) {
      const p = await getProposal(id);
      if (p.found) proposals.push(p);
    }
    return NextResponse.json({ account, proposals });
  } catch (error) {
    return NextResponse.json({ error: readError(error) }, { status: 502 });
  }
}
