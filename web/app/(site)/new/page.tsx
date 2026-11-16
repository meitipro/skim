import type { Metadata } from 'next';

import { CardForm } from '@/components/CardForm';

export const metadata: Metadata = { title: 'Open a card' };

export default function NewPage() {
  return (
    <div className="c-wrap py-12">
      <p className="c-eyebrow">Open a card</p>
      <h1 className="c-h2 mt-2">The questions every proposal must answer</h1>
      <p className="c-muted mt-2 max-w-[42em] text-[15px]">Write 3 to 5 plain questions, pick how many words of a proposal are read, and set a fee. Drag the ruler to see how much of a page that is.</p>
      <div className="mt-8"><CardForm /></div>
    </div>
  );
}
