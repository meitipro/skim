import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Cooldown, JudgeBox, WaiveBox, WithdrawBox } from '@/components/Boxes';
import { Addr, Money, NotFoundCard, QuestionRow, ReadError, StateBadge, Tx } from '@/components/ui';
import { STATE_HELP } from '@/lib/claims';
import { txIndex } from '@/lib/explorer';
import { dayTime } from '@/lib/format';
import { getProposal, readError } from '@/lib/read';
import type { AttemptRow, Proposal } from '@/lib/types';

export const revalidate = 20;

export async function generateMetadata(props: PageProps<'/p/[id]'>): Promise<Metadata> {
  const { id } = await props.params;
  try {
    const p = await getProposal(Number(id));
    return { title: p.found ? `Proposal ${p.id}: ${p.title}` : `Proposal ${id}` };
  } catch {
    return { title: `Proposal ${id}` };
  }
}

/** The text of one attempt with the skim line across it: the window lit, the rest dimmed. */
function Page({ title, a }: { title: string; a: AttemptRow }) {
  const titleWords = title.split(/\s+/).filter(Boolean).length;
  const textWords = a.text.split(/\s+/).filter(Boolean);
  const rest = textWords.slice(Math.max(0, a.window_words - titleWords)).join(' ');
  const cut = a.words_total > a.window_words;
  const lit = a.window.split(/\s+/).slice(titleWords).join(' ');
  return (
    <div className="c-page">
      <p className="title">{title}</p>
      <p className="lit">{lit}</p>
      {cut && (
        <>
          <div className="c-line"><span>word {a.window_words} · the window ends here</span></div>
          <p className="dim">{rest}</p>
        </>
      )}
      {!cut && <p className="c-faint mt-3 text-[12.5px]">The whole proposal fits in the window ({a.words_total} of {a.window_words} words).</p>}
    </div>
  );
}

export default async function ProposalPage(props: PageProps<'/p/[id]'>) {
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
  const txs = await txIndex();
  const submitted = txs.submit[String(id)];
  const reads = txs.judge[String(id)] ?? [];
  const current = p.attempt_rows[p.attempt_rows.length - 1];
  const shown = current.verdict ? current : p.attempt_rows[p.attempt_rows.length - 2] ?? current;
  const open = p.state === 'SUBMITTED';

  return (
    <div className="c-wrap py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="c-eyebrow">Proposal {p.id} · attempt {p.attempts} of 3 · <Link href={`/c/${p.card_id}`} className="hover:underline">{p.card_name}</Link> card {open ? 'waiting to be read' : 'read'}</p>
          <h1 className="c-h2 mt-2">{p.title}</h1>
          <p className="c-muted mt-2 text-[14px]">
            by <Addr address={p.author} /> · submitted {dayTime(p.created_at)}
            {submitted && <> · <Tx hash={submitted.hash} /></>}
          </p>
        </div>
        <StateBadge state={p.state} missing={shown.missing} />
      </div>
      <p className="c-faint mt-3 text-[13.5px]">{STATE_HELP[p.state]}{p.state === 'WAIVED' && p.waived_by ? <> Waived by <Addr address={p.waived_by} />.</> : null}</p>

      <div className="c-grid-2 mt-8">
        <section aria-labelledby="page-h">
          <h2 id="page-h" className="c-eyebrow mb-3">The page, as a reader sees it{p.attempts > 1 ? ` · attempt ${current.n}` : ''}</h2>
          <Page title={p.title} a={current} />
        </section>
        <section className="flex flex-col gap-4" aria-labelledby="res-h">
          <h2 id="res-h" className="c-eyebrow">Skim result</h2>
          <div className="c-card pad">
            <p className="c-stat">{shown.verdict ? `${shown.questions.length - shown.missing} / ${shown.questions.length}` : 'Not read'}</p>
            <p className="c-faint mt-1 text-[13px]">{shown.verdict ? 'questions answered in the window' : 'The validators have not read this attempt yet.'}</p>
          </div>
          <div className="c-card overflow-hidden">
            {shown.questions.map((q, i) => <QuestionRow key={i} n={i + 1} text={q} label={shown.labels[i]} />)}
          </div>
          {shown.verdict && reads.length > 0 && (
            <p className="c-faint text-[12.5px]">
              {(() => {
                const read = reads[shown.n - 1] ?? reads[reads.length - 1];
                return read?.votes ? <>The labels were agreed by {read.votes.agreed} of {read.votes.voted} validators who voted{read.votes.seconds ? `, in ${read.votes.seconds} seconds` : ''}. </> : null;
              })()}
              <Tx hash={(reads[shown.n - 1] ?? reads[reads.length - 1]).hash} label="read in" />
            </p>
          )}
          {p.state === 'REWRITE' && (
            <div className="c-card pad flex flex-col gap-3">
              <p className="c-eyebrow">Rewrite, {p.attempts_left} {p.attempts_left === 1 ? 'try' : 'tries'} left</p>
              <p className="c-muted text-[14px]">Move the missing answers into the first {current.window_words} words. Each new attempt holds the fee again.</p>
              <Link href={`/p/${p.id}/revise`} className="c-btn solid wide">Rewrite it</Link>
            </div>
          )}
          {p.state === 'SHELVED' && (
            <div className="c-note">The third attempt still had missing questions. <Addr address={p.author} /> can submit again on this card in <Cooldown until={p.cooldown_until} />.</div>
          )}
          {open && <JudgeBox proposalId={p.id} cardId={p.card_id} author={p.author} />}
          {(p.state === 'SUBMITTED' || p.state === 'REWRITE') && <WaiveBox proposalId={p.id} cardId={p.card_id} owner={p.card_owner} author={p.author} held={p.held} />}
          {(p.state === 'SKIMMABLE' || p.state === 'WAIVED') && <WithdrawBox title="Withdraw what you are owed" />}
        </section>
      </div>

      {p.attempt_rows.length > 1 && (
        <section className="mt-10" aria-labelledby="hist-h">
          <h2 id="hist-h" className="c-eyebrow mb-3">Attempt history</h2>
          <div className="flex flex-col gap-3">
            {p.attempt_rows.map((a) => (
              <div key={a.n} className="c-card pad flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[14.5px] font-medium">Attempt {a.n} · {a.words_total} words · window {a.window_words}</p>
                  <p className="c-faint mt-1 line-clamp-1 text-[13px]">{a.text}</p>
                </div>
                <span className={`c-state-pill ${(a.verdict || 'SUBMITTED').toLowerCase()}`}>{a.verdict ? (a.verdict === 'REWRITE' ? `REWRITE · ${a.missing}` : a.verdict) : 'not read'}</span>
              </div>
            ))}
          </div>
          <p className="c-faint mt-3 text-[12.5px]">Fees held for this proposal: <Money wei={p.held} />.</p>
        </section>
      )}
    </div>
  );
}
