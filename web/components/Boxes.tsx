'use client';

import { useEffect, useState } from 'react';

import { until } from '@/lib/claims';
import { gen } from '@/lib/format';

import { TxProgress, useWrite } from './Actions';
import { WalletGate, useWallet } from './Wallet';

/** Anyone asks the validators to read the window of the current attempt. */
export function JudgeBox({ proposalId, cardId, author }: { proposalId: number; cardId: number; author: string }) {
  const { state, busy, run } = useWrite([`proposal:${proposalId}`, `card:${cardId}`, `account:${author.toLowerCase()}`]);
  return (
    <div className="c-card pad flex flex-col gap-3">
      <p className="c-eyebrow">Waiting to be read</p>
      <p className="c-muted text-[14px]">
        Anyone can ask the validators to read this attempt. They see only the questions and the window the contract cut, never what comes after. Several answer one label per question, and the labels stand only when they agree. It takes about a minute.
      </p>
      <WalletGate action="ask the validators">
        <button className="c-btn solid wide" disabled={busy} onClick={() => run('judge', [proposalId])}>
          Ask the validators to read it
        </button>
      </WalletGate>
      <TxProgress state={state} waiting="Validators are reading" />
    </div>
  );
}

/** The card's owner waives the rule for one proposal that has not opened or been shelved. */
export function WaiveBox({ proposalId, cardId, owner, author, held }: { proposalId: number; cardId: number; owner: string; author: string; held: string }) {
  const w = useWallet();
  const { state, busy, run } = useWrite([`proposal:${proposalId}`, `card:${cardId}`, `account:${author.toLowerCase()}`]);
  if (!w.account || w.account.toLowerCase() !== owner.toLowerCase()) return null;
  return (
    <div className="c-card pad flex flex-col gap-3">
      <p className="c-eyebrow">You own this card</p>
      <p className="c-muted text-[14px]">
        You may waive the rule for this proposal, for any reason. It opens for voting, the page says it was waived and by whom, and its {gen(held)} in fees goes back to its author.
      </p>
      <button className="c-btn wide" disabled={busy} onClick={() => run('waive', [proposalId])}>
        Waive the rule
      </button>
      <TxProgress state={state} waiting="Recording the waiver" />
    </div>
  );
}

/** Time left on a cooldown, ticking. */
export function Cooldown({ until: end }: { until: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  if (end * 1000 <= now) return <span className="mono">over</span>;
  return <span className="mono">{until(end, now)}</span>;
}

export function useBalance(address: string): { owed: bigint | null; reload: () => void } {
  const [owed, setOwed] = useState<bigint | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!address) return;
    let live = true;
    fetch(`/api/account?address=${address}&brief=1`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((b) => live && setOwed(BigInt(b?.account?.balance ?? '0')))
      .catch(() => live && setOwed(null));
    return () => {
      live = false;
    };
  }, [address, n]);
  return { owed, reload: () => setN((v) => v + 1) };
}

/** Withdraw whatever the contract owes the connected account: the only call that pays. */
export function WithdrawBox({ title = 'Your balance' }: { title?: string }) {
  const w = useWallet();
  const { owed, reload } = useBalance(w.account);
  const { state, busy, run } = useWrite(w.account ? [`account:${w.account.toLowerCase()}`] : []);
  if (!w.account || !w.chainOk) return null;
  return (
    <div className="c-card pad flex flex-col gap-3">
      <p className="c-eyebrow">{title}</p>
      <p className="c-stat mono">{owed === null ? '…' : gen(owed)}</p>
      <p className="c-faint text-[13px]">Verdicts only move balances inside the contract. Withdraw is the one call that pays, to you, in its own transaction.</p>
      <button
        className="c-btn solid wide"
        disabled={busy || !owed || owed <= 0n}
        onClick={async () => {
          const done = await run('withdraw', []);
          if (done.phase === 'done') reload();
        }}
      >
        {owed && owed > 0n ? `Withdraw ${gen(owed)}` : 'Nothing to withdraw'}
      </button>
      <TxProgress state={state} waiting="Recording the withdrawal" />
    </div>
  );
}
