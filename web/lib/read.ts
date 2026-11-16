import { unstable_cache } from 'next/cache';

import { CONTRACT, readClient, retried } from './genlayer-core.mjs';
import type { Account, Card, Listing, NotFound, Proposal, Row, Totals } from './types';

/**
 * Reads happen on the server, cached for 20 seconds under tags: Studio Next
 * rate-limits each IP at about thirty requests a minute. After a decided write
 * the page POSTs /api/refresh, which expires the tags it touched.
 */

const client = readClient();
const REVALIDATE = 20;

async function view<T>(method: string, args: (number | string)[]): Promise<T> {
  const raw = await retried(() => client.readContract({ address: CONTRACT, functionName: method, args }), 3);
  return JSON.parse(String(raw)) as T;
}

export const tags = {
  all: 'chain',
  card: (id: number) => `card:${id}`,
  proposal: (id: number) => `proposal:${id}`,
  account: (address: string) => `account:${address.toLowerCase()}`,
};

export function getTotals(): Promise<Totals> {
  return unstable_cache(async () => (await view<NotFound>('get_card', [''])).totals, ['totals'], { revalidate: REVALIDATE, tags: [tags.all] })();
}

export function getCard(id: number): Promise<Card | NotFound> {
  return unstable_cache(() => view<Card | NotFound>('get_card', [String(id)]), ['get_card', String(id)], { revalidate: REVALIDATE, tags: [tags.all, tags.card(id)] })();
}

export function getProposal(id: number): Promise<Proposal | NotFound> {
  return unstable_cache(() => view<Proposal | NotFound>('get_proposal', [id]), ['get_proposal', String(id)], { revalidate: REVALIDATE, tags: [tags.all, tags.proposal(id)] })();
}

export function getAccount(address: string): Promise<Account | NotFound> {
  return unstable_cache(() => view<Account | NotFound>('get_card', [address.toLowerCase()]), ['get_account', address.toLowerCase()], { revalidate: REVALIDATE, tags: [tags.all, tags.account(address)] })();
}

export function listProposals(cardId = 0, offset = 0, limit = 20): Promise<Listing> {
  return unstable_cache(() => view<Listing>('list_proposals', [cardId, offset, limit]), ['list_proposals', String(cardId), String(offset), String(limit)], {
    revalidate: REVALIDATE,
    tags: [tags.all, ...(cardId ? [tags.card(cardId)] : [])],
  })();
}

/** Every card, newest first. */
export async function allCards(limit = 24): Promise<Card[]> {
  const totals = await getTotals();
  const out: Card[] = [];
  for (let id = totals.cards; id >= 1 && out.length < limit; id--) {
    const c = await getCard(id);
    if (c.found) out.push(c);
  }
  return out;
}

/** The proposal shown on the front page: the newest one that was sent back (it shows the line best), else the newest. */
export async function featuredProposal(): Promise<Proposal | null> {
  const page = await listProposals(0, 0, 12);
  const pick = page.items.find((r: Row) => r.state === 'REWRITE' || r.state === 'SHELVED') ?? page.items[0];
  if (!pick) return null;
  const full = await getProposal(pick.id);
  return full.found ? full : null;
}

export function readError(error: unknown): string {
  const text = String((error as Error)?.message ?? error);
  if (/-32029|rate limit/i.test(text)) return 'Studio Next is rate limiting reads right now. Wait a minute and reload.';
  return 'Studio Next did not answer this read. Reload in a moment.';
}
