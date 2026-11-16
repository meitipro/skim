import type { Metadata } from 'next';
import Link from 'next/link';

import { Empty, ReadError } from '@/components/ui';
import { gen, plural } from '@/lib/format';
import { allCards, readError } from '@/lib/read';
import type { Card } from '@/lib/types';

export const metadata: Metadata = { title: 'Cards' };
export const revalidate = 20;

export default async function CardsPage() {
  let cards: Card[] = [];
  let error = '';
  try {
    cards = await allCards(40);
  } catch (e) {
    error = readError(e);
  }
  return (
    <div className="c-wrap py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="c-eyebrow">Cards</p>
          <h1 className="c-h2 mt-2">Pick a card, then write for its questions</h1>
        </div>
        <Link href="/new" className="c-btn solid">Open a card</Link>
      </div>
      <p className="c-muted mt-2 max-w-[40em] text-[15px]">A card is a set of questions and a window. A proposal on it opens for voting only when the top of the page answers every question.</p>
      <div className="mt-8 flex flex-col gap-3">
        {error ? <ReadError message={error} /> : cards.length === 0 ? <Empty>No card has been opened yet.</Empty> : cards.map((c) => (
          <Link key={c.id} href={`/c/${c.id}`} className="c-card c-row-link pad flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="c-h3">{c.name}</p>
              <p className="c-faint mt-1 text-[12.5px]">{plural(c.questions.length, 'question')} · window {c.window_words} words · fee {gen(c.fee)}</p>
            </div>
            <p className="c-muted text-[14px]">{plural(c.proposals, 'proposal')} · {c.skimmable} skimmable</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
