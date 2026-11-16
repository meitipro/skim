import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SkimBox } from '@/components/SkimBox';
import { Addr, Empty, Money, NotFoundCard, ProposalRow, QuestionRow, ReadError, Tx } from '@/components/ui';
import { txIndex } from '@/lib/explorer';
import { dayTime, plural } from '@/lib/format';
import { getCard, listProposals, readError } from '@/lib/read';
import type { Card, Row } from '@/lib/types';

export const revalidate = 20;

export async function generateMetadata(props: PageProps<'/c/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  try {
    const c = await getCard(Number(id));
    return { title: c.found ? c.name : `Card ${id}` };
  } catch {
    return { title: `Card ${id}` };
  }
}

export default async function CardPage(props: PageProps<'/c/[id]'>) {
  const { id: raw } = await props.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  let card: Card | null = null;
  let items: Row[] = [];
  let error = '';
  try {
    const found = await getCard(id);
    if (!found.found) return <NotFoundCard what="card with this number" back="/cards" backLabel="All cards" />;
    card = found;
    items = (await listProposals(id, 0, 30)).items;
  } catch (e) {
    error = readError(e);
  }
  if (!card) return <div className="c-wrap py-12"><ReadError message={error} /></div>;
  const txs = await txIndex();
  const opened = txs.card[String(id)];
  return (
    <div className="c-wrap py-10">
      <p className="c-eyebrow">Card {card.id}</p>
      <h1 className="c-h2 mt-2">{card.name}</h1>
      <p className="c-muted mt-2 text-[14px]">
        opened {dayTime(card.created_at)} by <Addr address={card.owner} />
        {opened && <> · <Tx hash={opened.hash} /></>}
      </p>
      <dl className="c-kv mt-6">
        <div><dd>{card.window_words} words</dd><dt>Skim window</dt></div>
        <div><dd><Money wei={card.fee} /></dd><dt>Fee per attempt</dt></div>
        <div><dd>{plural(card.proposals, 'proposal')}</dd><dt>On this card</dt></div>
        <div><dd>{card.skimmable} skimmable · {card.shelved} shelved · {card.waived} waived</dd><dt>Record</dt></div>
      </dl>

      <div className="c-grid-2 mt-8">
        <section aria-labelledby="q-h">
          <h2 id="q-h" className="c-eyebrow mb-3">The questions every proposal must answer</h2>
          <div className="c-card overflow-hidden">
            {card.questions.map((q, i) => <QuestionRow key={i} n={i + 1} text={q} />)}
          </div>
          <p className="c-faint mt-3 text-[12.5px]">Only the first {card.window_words} words of a proposal, title included, are read. Fees held by shelved proposals so far: <Money wei={card.pool} />.</p>
        </section>
        <section aria-labelledby="p-h">
          <h2 id="p-h" className="c-eyebrow mb-3">Proposals on this card</h2>
          {items.length === 0 ? <Empty>No proposal yet. Be the first below.</Empty> : <div className="flex flex-col gap-3">{items.map((r) => <ProposalRow key={r.id} r={r} />)}</div>}
        </section>
      </div>

      <section id="submit" className="mt-12" aria-labelledby="s-h">
        <h2 id="s-h" className="c-h2">Submit a proposal on this card</h2>
        <p className="c-muted mb-6 mt-2 max-w-[42em] text-[15px]">Write, and watch the skim line: everything below it is dimmed, because nobody reads it. <Link href="/docs/write-a-skimmable-proposal" className="c-link">How to write one</Link>.</p>
        <SkimBox mode="submit" cardId={card.id} questions={card.questions} windowWords={card.window_words} fee={card.fee} />
      </section>
    </div>
  );
}
