'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { gen } from '@/lib/format';
import { length, splitAtLine } from '@/lib/cut.mjs';

import { TxProgress, useWrite } from './Actions';
import { WalletGate } from './Wallet';

/**
 * A writing box with a live skim line. The line is the same cut the contract
 * makes (lib/cut.mjs, held to tests/vectors.json): the first N whitespace
 * separated words of the title and then the text. Above it is lit, because a
 * skimming reader and the validators see it. Below it is dimmed, because
 * nobody does.
 */
export function SkimBox({
  mode,
  cardId,
  proposalId,
  questions,
  windowWords,
  fee,
  fixedTitle,
  initialText = '',
  openQuestions,
}: {
  mode: 'submit' | 'revise';
  cardId: number;
  proposalId?: number;
  questions: string[];
  windowWords: number;
  fee: string;
  fixedTitle?: string;
  initialText?: string;
  /** For a rewrite: the questions that were MISSING last time, highlighted. */
  openQuestions?: number[];
}) {
  const router = useRouter();
  const { state, busy, run } = useWrite(['chain', `card:${cardId}`, ...(proposalId ? [`proposal:${proposalId}`] : [])]);
  const [title, setTitle] = useState(fixedTitle ?? '');
  const [text, setText] = useState(initialText);
  const t = fixedTitle ?? title;
  const split = splitAtLine(t, text, windowWords);
  const inWindow = split.total <= windowWords;
  const problems: string[] = [];
  if (!t.trim()) problems.push('A title.');
  else if (length(t.trim()) > 100) problems.push('A title of at most 100 characters.');
  if (!text.trim()) problems.push('A text.');
  else if (length(text.trim()) > 6000) problems.push('A text of at most 6,000 characters.');
  if (mode === 'revise' && text.trim() === initialText.trim()) problems.push('A new text: an attempt is not the last one again.');

  async function go() {
    const done = mode === 'submit' ? await run('submit', [cardId, t.trim(), text.trim()], BigInt(fee)) : await run('revise', [proposalId, text.trim()], BigInt(fee));
    if (done.phase === 'done') {
      const id = mode === 'submit' ? Number(done.returned) : proposalId;
      router.push(`/p/${id}`);
    }
  }

  const titleWords = splitAtLine(t, '', windowWords).total;
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <div className="flex flex-col gap-4">
        {!fixedTitle && (
          <div>
            <label className="c-label" htmlFor="title">Title ({length(t.trim())}/100): it counts toward the window</label>
            <input id="title" className="c-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Rewrite the developer docs for 40,000 USDC" />
          </div>
        )}
        {fixedTitle && <p className="c-muted text-[14px]">The title stays the same across attempts: <b>{fixedTitle}</b></p>}
        <div>
          <label className="c-label" htmlFor="text">Text ({length(text.trim())}/6,000)</label>
          <textarea id="text" className="c-textarea" style={{ minHeight: 220 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Put the ask, the amount, the date and what happens if it fails at the top." />
        </div>
        <div className="c-page" aria-label="Skim preview">
          <p className="c-eyebrow mb-2">What a skimming reader sees</p>
          {t.trim() || text.trim() ? (
            <>
              <p className="lit">{split.lit}</p>
              {inWindow ? (
                <p className="c-faint mt-2 text-[12.5px]">The whole proposal fits in the window ({split.total} of {windowWords} words).</p>
              ) : (
                <>
                  <div className="c-line"><span>word {windowWords} · nothing below is read</span></div>
                  <p className="dim">{split.dim.trim()}</p>
                </>
              )}
            </>
          ) : (
            <p className="c-faint text-[13.5px]">Start typing: the line appears at word {windowWords}.</p>
          )}
        </div>
        <div className="c-card pad flex flex-col gap-3">
          {problems.length > 0 && <p className="c-faint text-[13px]">Still needed: {problems.join(' ')}</p>}
          <WalletGate action={mode === 'submit' ? 'submit this proposal' : 'submit this attempt'}>
            <button className="c-btn solid wide" disabled={busy || problems.length > 0} onClick={go}>
              {mode === 'submit' ? 'Submit' : 'Submit the new attempt'} with a {gen(fee)} fee
            </button>
          </WalletGate>
          <p className="c-faint text-[12.5px]">Network fee estimated by your wallet. Each attempt holds the fee; it comes back when the proposal is skimmable.</p>
          <TxProgress state={state} waiting="Recording your attempt" />
        </div>
      </div>
      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <div className="c-card pad">
          <p className="c-eyebrow">{mode === 'revise' ? 'The questions still open' : 'Every proposal must answer'}</p>
          <div className="mt-2 -mx-5">
            {questions.map((q, i) => {
              const open = !openQuestions || openQuestions.includes(i);
              return (
                <div key={i} className={`c-q ${open ? 'open' : 'found'}`}>
                  <span className="mono c-q-no">Q{i + 1}</span>
                  <span className="c-q-text">{q}</span>
                  <span className="c-label-pill">{open ? 'answer it' : 'found'}</span>
                </div>
              );
            })}
          </div>
          <p className="c-faint mt-3 text-[12.5px]">A specific answer is a number, a date or a named action. &ldquo;A modest budget&rdquo; and &ldquo;soon&rdquo; are MISSING.</p>
        </div>
        <div className="c-card pad">
          <p className="c-eyebrow">The window</p>
          <div className="c-field-row"><span className="c-muted">Words read</span><b className="mono">{windowWords}</b></div>
          <div className="c-field-row"><span className="c-muted">Your title uses</span><b className="mono">{titleWords}</b></div>
          <div className="c-field-row"><span className="c-muted">Your proposal has</span><b className="mono">{split.total} words</b></div>
        </div>
      </aside>
    </div>
  );
}
