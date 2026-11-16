import Link from 'next/link';

import { Empty, ProposalRow, QuestionRow, StateBadge } from '@/components/ui';
import { verdictWord } from '@/lib/claims';
import { plural, short } from '@/lib/format';
import { featuredProposal, getTotals, listProposals, readError } from '@/lib/read';
import type { Proposal, Row, Totals } from '@/lib/types';

export const revalidate = 20;

const FAQ = [
  ['Is it a moderator?', 'No. Nobody reads your proposal and decides. The contract cuts the opening in code, validators label each question FOUND or MISSING, and the verdict follows from the labels. Nothing about whether the proposal is good is ever judged.'],
  ['Who sets the questions?', 'The DAO, on a card: 3 to 5 plain questions and a window of 80 to 200 words. They are public, so a weak card shows.'],
  ['What if I disagree with a label?', 'The window, the questions and the prompt are all on the page, so the label can be argued with. The card owner can also waive the rule for one proposal, for any reason, and the waiver is public.'],
  ['Which network is it on?', 'GenLayer Studio Next, chain 61997. The contract address is in the footer, and every figure on this site is read from it.'],
] as const;

function Hero({ featured }: { featured: Proposal | null }) {
  const a = featured?.attempt_rows[featured.attempt_rows.length - 1];
  const questions = a?.questions ?? ['What is being asked of the DAO', 'How much it costs', 'The date a decision is needed', 'What happens if it does not pass'];
  return (
    <section className="c-wrap grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:py-20">
      <div>
        <p className="c-eyebrow">Skim tests, judged on GenLayer</p>
        <h1 className="c-h1 mt-4">
          If they only read the top, would they <em>know the ask?</em>
        </h1>
        <p className="c-lead mt-5">The DAO sets four questions. GenLayer validators read the first 120 words of your proposal and nothing else.</p>
        <div className="c-card mt-7 overflow-hidden">
          {questions.map((q, i) => (
            <QuestionRow key={i} n={i + 1} text={q} label={a && a.labels[i] ? a.labels[i] : undefined} />
          ))}
        </div>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/cards" className="c-btn solid">Submit a proposal</Link>
          <Link href="/new" className="c-btn">Open a card</Link>
        </div>
      </div>
      <div>
        {featured && a ? (
          <div className="c-page">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="c-eyebrow">Proposal {featured.id} · {featured.card_name}</p>
              <StateBadge state={featured.state} missing={a.missing} />
            </div>
            <p className="title">{featured.title}</p>
            <p className="lit">{a.window}</p>
            {a.words_total > a.window_words && (
              <>
                <div className="c-line"><span>word {a.window_words} · nothing below is read</span></div>
                <p className="dim line-clamp-4">{a.text.split(/\s+/).slice(Math.max(0, a.window_words - 1 - featured.title.split(/\s+/).length)).join(' ')}</p>
              </>
            )}
            <p className="c-faint mt-3 text-[13px]">
              {a.verdict ? `${a.questions.length - a.missing} of ${a.questions.length} questions answered in the window` : 'Waiting to be read'}
              {' · '}
              <Link href={`/p/${featured.id}`} className="c-link">Open it →</Link>
            </p>
          </div>
        ) : (
          <Empty>No proposal has been submitted yet. Open a card and submit the first one.</Empty>
        )}
      </div>
    </section>
  );
}

function Recent({ list }: { list: Row[] }) {
  return (
    <section className="c-wrap pb-14">
      <p className="c-eyebrow mb-3">Recent proposals</p>
      {list.length === 0 ? (
        <Empty>Nothing yet.</Empty>
      ) : (
        <div className="grid gap-px overflow-hidden rounded-[4px] border border-[var(--line)] bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
          {list.map((r) => (
            <Link key={r.id} href={`/p/${r.id}`} className="c-row-link bg-[var(--surface)] p-4">
              <span className={`c-state-pill ${r.state.toLowerCase()}`}>{verdictWord(r.state, r.missing)}</span>
              <p className="mt-3 line-clamp-2 text-[14.5px] font-medium">{r.title}</p>
              <p className="c-faint mt-1 text-[12.5px]">{r.card_name} · attempt {r.attempts}</p>
              <p className="c-faint mono mt-2 text-[11.5px]">proposal #{r.id} · {short(r.author)}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function How() {
  const steps = [
    ['01', 'Ask', 'The DAO writes 3 to 5 questions and picks a window of 80 to 200 words on a card.'],
    ['02', 'Submit', 'An author submits a proposal with the card\'s fee. The contract cuts it to the window, title included.'],
    ['03', 'Read', 'Validators see only that window and label each question FOUND or MISSING.'],
    ['04', 'Open', 'All FOUND opens it for voting and the fee comes back. Otherwise it goes back, up to three tries.'],
  ];
  return (
    <section id="how" className="c-section">
      <div className="c-wrap">
        <p className="c-eyebrow">How it works</p>
        <h2 className="c-h2 mt-2 max-w-[18em]">Ask, submit, read, open</h2>
        <div className="c-steps mt-8">
          {steps.map(([n, t, d]) => (
            <div key={n}>
              <p className="mono c-faint text-[12px]">{n}</p>
              <p className="c-h3 mt-3">{t}</p>
              <p className="c-muted mt-2 text-[14.5px]">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForDaos({ totals }: { totals: Totals | null }) {
  return (
    <section id="daos" className="c-section">
      <div className="c-wrap c-grid-2">
        <div>
          <p className="c-eyebrow">For DAOs</p>
          <h2 className="c-h2 mt-2">What a card sets, and what an owner may waive</h2>
          <p className="c-muted mt-4 max-w-[34em] text-[15.5px]">A card is a bar for clarity that every proposal meets, with no one deciding what a good proposal is. The owner may waive the rule for one proposal, for any reason, in an emergency, and the waiver is public on the page.</p>
        </div>
        <div className="c-card pad">
          <p className="c-eyebrow mb-1">A card sets</p>
          <div className="c-field-row"><span className="c-muted">Questions</span><b className="mono">3 to 5</b></div>
          <div className="c-field-row"><span className="c-muted">Skim window</span><b className="mono">80 to 200 words</b></div>
          <div className="c-field-row"><span className="c-muted">Fee per attempt</span><b className="mono">0 to 10 GEN</b></div>
          <div className="c-field-row"><span className="c-muted">Attempts</span><b className="mono">3, then 7 days</b></div>
          {totals && <p className="c-faint mt-3 text-[12.5px]">On the chain now: {plural(totals.cards, 'card')}, {plural(totals.proposals, 'proposal')}.</p>}
        </div>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq" className="c-section">
      <div className="c-wrap c-grid-2">
        <div>
          <p className="c-eyebrow">FAQ</p>
          <h2 className="c-h2 mt-2">Questions people ask first</h2>
          <p className="c-muted mt-4 text-[15px]">More in the <Link href="/docs/more/faq" className="c-link">docs</Link>.</p>
        </div>
        <div className="c-faq">
          {FAQ.map(([q, a]) => (
            <details key={q}><summary>{q}</summary><p>{a}</p></details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  let featured: Proposal | null = null;
  let recent: Row[] = [];
  let totals: Totals | null = null;
  try {
    totals = await getTotals();
    featured = await featuredProposal();
    recent = (await listProposals(0, 0, 4)).items;
  } catch (e) {
    void readError(e);
  }
  return (
    <>
      <Hero featured={featured} />
      <Recent list={recent} />
      <How />
      <ForDaos totals={totals} />
      <Faq />
    </>
  );
}
