import type { Metadata } from 'next';

import { Empty, ProposalRow, ReadError } from '@/components/ui';
import { listProposals, readError } from '@/lib/read';
import type { Row } from '@/lib/types';

export const metadata: Metadata = { title: 'Proposals' };
export const revalidate = 20;

export default async function ProposalsPage() {
  let items: Row[] = [];
  let error = '';
  try {
    items = (await listProposals(0, 0, 40)).items;
  } catch (e) {
    error = readError(e);
  }
  return (
    <div className="c-wrap py-12">
      <p className="c-eyebrow">Proposals</p>
      <h1 className="c-h2 mt-2">Every proposal, with the word that decides what happens next</h1>
      <p className="c-muted mt-2 max-w-[40em] text-[15px]">SKIMMABLE opens for voting. REWRITE names how many questions are missing. SHELVED waits seven days. WAIVED was waved through by the card&apos;s owner.</p>
      <div className="mt-8 flex flex-col gap-3">
        {error ? <ReadError message={error} /> : items.length === 0 ? <Empty>No proposal has been submitted yet.</Empty> : items.map((r) => <ProposalRow key={r.id} r={r} />)}
      </div>
    </div>
  );
}
