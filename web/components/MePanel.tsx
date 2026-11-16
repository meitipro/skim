'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { gen, short } from '@/lib/format';
import type { Proposal } from '@/lib/types';

import { Cooldown, WithdrawBox } from './Boxes';
import { Empty, ProposalRow } from './ui';
import { WalletGate, useWallet } from './Wallet';

type Data = { account: { balance: string; earned: string; withdrawn: string; proposal_count?: number }; proposals: Proposal[] };

/** Attempts by state, cooldowns, balance and withdraw, for the connected wallet or for ?address=0x… */
export function MePanel({ address }: { address: string }) {
  const w = useWallet();
  const who = address || w.account;
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!who) return;
    let live = true;
    setError('');
    fetch(`/api/account?address=${who}`, { cache: 'no-store' })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body?.error ?? 'The chain did not answer.');
        if (live) setData(body);
      })
      .catch((e) => live && setError(String(e?.message ?? e)));
    return () => {
      live = false;
    };
  }, [who, w.balance]);

  if (!who) {
    return (
      <WalletGate action="see your proposals">
        <Empty>Connect a wallet to see your proposals, cooldowns and balance, or open this page with ?address=0x…</Empty>
      </WalletGate>
    );
  }
  if (error) return <div className="c-note" style={{ color: 'var(--danger)' }}>{error}</div>;
  if (!data) return <div className="c-note flex items-center gap-2"><span className="c-spin" /> Reading the chain…</div>;
  const mine = !address || address.toLowerCase() === w.account.toLowerCase();
  const order = ['SUBMITTED', 'REWRITE', 'SHELVED', 'SKIMMABLE', 'WAIVED'];
  const sorted = [...data.proposals].sort((a, b) => order.indexOf(a.state) - order.indexOf(b.state));
  const cooling = data.proposals.filter((p) => p.state === 'SHELVED' && p.cooldown_until * 1000 > Date.now());
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
      <div className="flex flex-col gap-6">
        <section>
          <h2 className="c-eyebrow mb-3">Proposals by {short(who)} · {data.account.proposal_count ?? data.proposals.length}</h2>
          {sorted.length === 0 ? (
            <Empty>No proposal yet. <Link href="/cards" className="c-link">Pick a card and submit one.</Link></Empty>
          ) : (
            <div className="flex flex-col gap-3">
              {sorted.map((p) => (
                <div key={p.id} className="flex flex-col gap-1">
                  <ProposalRow r={p} />
                  {p.state === 'REWRITE' && mine && <Link href={`/p/${p.id}/revise`} className="c-link px-1 text-[13px]">Rewrite it, {p.attempts_left} {p.attempts_left === 1 ? 'try' : 'tries'} left →</Link>}
                </div>
              ))}
            </div>
          )}
        </section>
        {cooling.length > 0 && (
          <section>
            <h2 className="c-eyebrow mb-3">Cooldowns</h2>
            {cooling.map((p) => (
              <div key={p.id} className="c-field-row"><span className="c-muted">{p.card_name}: a new proposal in</span><Cooldown until={p.cooldown_until} /></div>
            ))}
          </section>
        )}
      </div>
      <div className="flex flex-col gap-4">
        {mine ? (
          <WithdrawBox />
        ) : (
          <div className="c-card pad">
            <p className="c-eyebrow">Owed to {short(who)}</p>
            <p className="c-stat mono mt-2">{gen(data.account.balance)}</p>
          </div>
        )}
        <div className="c-card pad">
          <p className="c-eyebrow">Credited and withdrawn</p>
          <div className="c-field-row"><span className="c-muted">Credited so far</span><span className="mono">{gen(data.account.earned)}</span></div>
          <div className="c-field-row"><span className="c-muted">Withdrawn</span><span className="mono">{gen(data.account.withdrawn)}</span></div>
        </div>
      </div>
    </div>
  );
}
