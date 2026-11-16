import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { SkimBox } from '@/components/SkimBox';
import { Empty, NotFoundCard, ReadError } from '@/components/ui';
import { getProposal, readError } from '@/lib/read';
import type { Proposal } from '@/lib/types';

export const revalidate = 20;
export const metadata: Metadata = { title: 'Rewrite a proposal' };

export default async function RevisePage(props: PageProps<'/p/[id]/revise'>) {
  const { id: raw } = await props.params;
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) notFound();
  let p: Proposal | null = null;
  let error = '';
  try {
    const found = await getProposal(id);
    if (!found.found) return <NotFoundCard what="proposal with this number" back="/proposals" backLabel="All proposals" />;
    p = found;
  } catch (e) {
    error = readError(e);
  }
  if (!p) return <div className="c-wrap py-12"><ReadError message={error} /></div>;
  const last = p.attempt_rows[p.attempt_rows.length - 1];
  const missing = last.labels.map((l, i) => (l === 'MISSING' ? i : -1)).filter((i) => i >= 0);
  return (
    <div className="c-wrap py-10">
      <p className="c-eyebrow"><Link href={`/p/${p.id}`} className="hover:underline">Proposal {p.id}</Link> · rewrite</p>
      <h1 className="c-h2 mt-2">Move the missing answers to the top</h1>
      {p.state !== 'REWRITE' ? (
        <div className="mt-6"><Empty>Only a proposal sent back for a rewrite can be revised. This one is {p.state}.</Empty></div>
      ) : (
        <>
          <p className="c-muted mb-6 mt-2 max-w-[44em] text-[15px]">{missing.length} {missing.length === 1 ? 'question is' : 'questions are'} still missing from the first {last.window_words} words. {p.attempts_left} {p.attempts_left === 1 ? 'try' : 'tries'} left. The new text is cut under the card&apos;s rules as they are now.</p>
          <SkimBox mode="revise" cardId={p.card_id} proposalId={p.id} questions={last.questions} windowWords={last.window_words} fee={p.card_fee} fixedTitle={p.title} initialText={last.text} openQuestions={missing} />
        </>
      )}
    </div>
  );
}
