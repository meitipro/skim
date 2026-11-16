'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { gen, toWei } from '@/lib/format';
import { length, splitAtLine } from '@/lib/cut.mjs';

import { TxProgress, useWrite } from './Actions';
import { WalletGate } from './Wallet';

const SAMPLE_TITLE = 'Rewrite the developer docs';
const SAMPLE = 'We ask the DAO for 40,000 USDC to rewrite the developer docs in Q1. A decision is needed by December 5, and if it does not pass the docs stay as they are. ' + 'Over the past year, contributors have raised the state of the docs in calls, forums and threads. '.repeat(3);

/** Open a card: questions as plain sentences, a window with a ruler, a fee, and a non-binding try-it preview. */
export function CardForm() {
  const router = useRouter();
  const { state, busy, run } = useWrite(['chain']);
  const [name, setName] = useState('');
  const [questions, setQuestions] = useState<string[]>(['What is being asked of the DAO', 'How much it costs', 'The date a decision is needed', 'What happens if it does not pass']);
  const [words, setWords] = useState(120);
  const [feeText, setFeeText] = useState('2');
  const [sample, setSample] = useState(SAMPLE);
  const [preview, setPreview] = useState<{ labels?: string[]; message?: string } | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const fee = toWei(feeText);
  const clean = questions.map((q) => q.trim()).filter(Boolean);
  const problems: string[] = [];
  if (!name.trim()) problems.push('A name.');
  else if (length(name.trim()) > 80) problems.push('A name of at most 80 characters.');
  if (clean.length < 3 || clean.length > 5) problems.push('3 to 5 questions.');
  if (clean.some((q) => length(q) > 120)) problems.push('Questions of at most 120 characters.');
  if (fee === null || fee > 10n * 10n ** 18n) problems.push('A fee of 0 to 10 GEN.');
  const split = splitAtLine(SAMPLE_TITLE, sample, words);

  async function tryIt() {
    setPreviewing(true);
    setPreview(null);
    try {
      const response = await fetch('/api/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ questions: clean, window: split.lit, n: words }) });
      setPreview(await response.json());
    } catch {
      setPreview({ message: 'The preview did not answer.' });
    } finally {
      setPreviewing(false);
    }
  }

  async function go() {
    if (fee === null) return;
    const done = await run('open_card', [name.trim(), clean, words, fee]);
    if (done.phase === 'done' && done.returned !== undefined) router.push(`/c/${String(done.returned)}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
      <div className="flex flex-col gap-6">
        <section className="c-card pad flex flex-col gap-3" aria-labelledby="q-h">
          <h2 id="q-h" className="c-h3">1. The questions every proposal must answer</h2>
          <div>
            <label className="c-label" htmlFor="name">Card name ({length(name.trim())}/80)</label>
            <input id="name" className="c-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Grants" />
          </div>
          {questions.map((q, i) => (
            <div key={i}>
              <label className="c-label" htmlFor={`q${i}`}>Q{i + 1} ({length(q.trim())}/120)</label>
              <div className="flex gap-2">
                <input id={`q${i}`} className="c-input" value={q} onChange={(e) => setQuestions(questions.map((x, j) => (j === i ? e.target.value : x)))} />
                {questions.length > 3 && <button className="c-btn small ghost" aria-label={`Remove question ${i + 1}`} onClick={() => setQuestions(questions.filter((_, j) => j !== i))}>×</button>}
              </div>
            </div>
          ))}
          <div><button className="c-btn small" disabled={questions.length >= 5} onClick={() => setQuestions([...questions, ''])}>Add a question</button></div>
          <p className="c-faint text-[12.5px]">Plain sentences, each answerable with something specific: an amount, a date, a named action.</p>
        </section>

        <section className="c-card pad flex flex-col gap-3" aria-labelledby="w-h">
          <h2 id="w-h" className="c-h3">2. Skim window and fee</h2>
          <label className="c-label" htmlFor="words">Skim window: {words} words</label>
          <input id="words" type="range" className="c-range" min={80} max={200} step={1} value={words} onChange={(e) => setWords(Number(e.target.value))} />
          <div className="flex justify-between text-[12px] c-faint"><span>80</span><span>200</span></div>
          <div>
            <label className="c-label" htmlFor="fee">Fee per attempt, GEN (0 to 10)</label>
            <input id="fee" className="c-input mono" inputMode="decimal" value={feeText} onChange={(e) => setFeeText(e.target.value)} />
          </div>
          <div className="c-field-row"><span className="c-muted">Attempts per proposal</span><b className="mono">3</b></div>
          <div className="c-field-row"><span className="c-muted">Cooldown after the third failure</span><b className="mono">7 days</b></div>
          {problems.length > 0 && <p className="c-faint text-[13px]">Still needed: {problems.join(' ')}</p>}
          <WalletGate action="open this card">
            <button className="c-btn solid wide" disabled={busy || problems.length > 0} onClick={go}>
              Open the card
            </button>
          </WalletGate>
          <p className="c-faint text-[12.5px]">Network fee estimated by your wallet.</p>
          <TxProgress state={state} waiting="Recording your card" />
        </section>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        <div className="c-card pad flex flex-col gap-3">
          <p className="c-eyebrow">Try a proposal, before it is the rule</p>
          <textarea className="c-textarea" style={{ minHeight: 150 }} value={sample} onChange={(e) => setSample(e.target.value)} aria-label="Sample proposal text" />
          <div className="c-page">
            <p className="lit">{split.lit}</p>
            {split.total > words && (<><div className="c-line"><span>word {words}</span></div><p className="dim">{split.dim.trim()}</p></>)}
          </div>
          <button className="c-btn" disabled={previewing || clean.length < 3} onClick={tryIt}>{previewing ? 'Reading…' : 'Preview with one model'}</button>
          {preview && (
            <div className="c-note">
              {preview.labels ? (
                <p>{preview.labels.map((l, i) => `Q${i + 1} ${l}`).join(' · ')}. One model, a preview only: it is not binding and it never reaches the chain.</p>
              ) : (
                <p>{preview.message}</p>
              )}
            </div>
          )}
        </div>
        <div className="c-card pad">
          <p className="c-eyebrow">Card health</p>
          <div className="c-field-row"><span className="c-muted">Questions</span><b className="mono">{clean.length} of 5 allowed</b></div>
          <div className="c-field-row"><span className="c-muted">The window</span><b className="mono">{words} words</b></div>
          <div className="c-field-row"><span className="c-muted">A fee of</span><b className="mono">{fee === null ? '—' : gen(fee)}</b></div>
          <p className="c-faint mt-3 text-[12.5px]">Questions are public on the card, so a weak card shows.</p>
        </div>
      </aside>
    </div>
  );
}
