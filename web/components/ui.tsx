import Link from 'next/link';

import { verdictWord } from '@/lib/claims';
import { gen, short, shortHash } from '@/lib/format';
import { DEPLOYMENT } from '@/lib/genlayer-core.mjs';
import type { Label, State } from '@/lib/types';

export const EXPLORER = DEPLOYMENT.explorer as string;
export const CONTRACT = DEPLOYMENT.skim as string;

export const txUrl = (hash: string) => `${EXPLORER}/tx/${hash}`;
export const addressUrl = (address: string) => `${EXPLORER}/address/${address}`;

export function Tx({ hash, label }: { hash?: string; label?: string }) {
  if (!hash) return null;
  return (
    <a className="c-link mono text-[12.5px]" href={txUrl(hash)} target="_blank" rel="noreferrer">
      {label ? `${label} ` : ''}
      {shortHash(hash)} ↗
    </a>
  );
}

export function Addr({ address }: { address: string }) {
  if (!address) return null;
  return (
    <a className="c-link mono text-[12.5px]" href={addressUrl(address)} target="_blank" rel="noreferrer" title={address}>
      {short(address)}
    </a>
  );
}

export function Money({ wei, strong }: { wei: string | bigint; strong?: boolean }) {
  return <span className={`mono ${strong ? 'font-semibold' : ''}`}>{gen(wei)}</span>;
}

/** Rose for skimmable, hatched for a rewrite, grey for shelved, dotted for waived. */
export function StateBadge({ state, missing = 0 }: { state: State; missing?: number }) {
  return <span className={`c-state-pill ${state.toLowerCase()}`}>{verdictWord(state, missing)}</span>;
}

export function LabelPill({ label }: { label: Label }) {
  return <span className={`c-label-pill ${label === 'FOUND' ? 'hit' : 'miss'}`}>{label}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="c-note">{children}</div>;
}

export function ReadError({ message }: { message: string }) {
  return (
    <div className="c-card pad">
      <p className="font-medium">The chain did not answer.</p>
      <p className="c-muted mt-1 text-[14px]">{message}</p>
    </div>
  );
}

export function NotFoundCard({ what, back, backLabel }: { what: string; back: string; backLabel: string }) {
  return (
    <div className="c-wrap py-20">
      <div className="c-card pad max-w-xl">
        <p className="c-eyebrow">Not found</p>
        <h1 className="c-h2 mt-2">There is no {what}.</h1>
        <p className="c-muted mt-2">It may not exist yet on Studio Next, or the number is wrong.</p>
        <Link href={back} className="c-btn mt-4">
          {backLabel}
        </Link>
      </div>
    </div>
  );
}

/** One question with its label: FOUND lit, MISSING hatched. */
export function QuestionRow({ n, text, label }: { n: number; text: string; label?: Label }) {
  return (
    <div className={`c-q ${label ? label.toLowerCase() : 'open'}`}>
      <span className="mono c-q-no">Q{n}</span>
      <span className="c-q-text">{text}</span>
      {label ? <LabelPill label={label} /> : <span className="c-label-pill">not read</span>}
    </div>
  );
}

/** A proposal as one row: title, card, attempts, state. */
export function ProposalRow({ r }: { r: { id: number; title: string; card_name: string; author: string; state: State; attempts: number; missing: number } }) {
  return (
    <Link href={`/p/${r.id}`} className="c-card c-row-link pad flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="c-h3">#{r.id} · {r.title}</p>
        <p className="c-faint mt-1 text-[12.5px]">
          {r.card_name} · <span className="mono">{short(r.author)}</span> · attempt {r.attempts} of 3
        </p>
      </div>
      <StateBadge state={r.state} missing={r.missing} />
    </Link>
  );
}
