import Link from 'next/link';

import { WalletButton } from './Wallet';

/** The site's mark, the same drawing as app/icon.svg: lines of a page, the skim line across them. */
export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden style={{ flexShrink: 0 }}>
      <rect width="512" height="512" rx="72" fill="#fb7185" />
      <rect x="112" y="120" width="288" height="34" rx="8" fill="#2a0610" />
      <rect x="112" y="186" width="224" height="34" rx="8" fill="#2a0610" />
      <rect x="92" y="262" width="328" height="10" rx="5" fill="#fff1f2" />
      <rect x="112" y="306" width="260" height="34" rx="8" fill="#2a0610" opacity="0.35" />
      <rect x="112" y="372" width="180" height="34" rx="8" fill="#2a0610" opacity="0.35" />
    </svg>
  );
}

export function Nav() {
  return (
    <header className="c-nav">
      <div className="c-wrap c-nav-row">
        <Link href="/" className="c-brand" aria-label="Skim home">
          <Mark />
          skim
        </Link>
        <nav className="c-links" aria-label="Main">
          <Link href="/proposals">Proposals</Link>
          <Link href="/cards">Cards</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <div className="c-nav-right">
          <span className="c-pill hidden sm:inline-flex" title="GenLayer Studio Next, chain 61997">
            <span className="dot" />
            Studio Next
          </span>
          <WalletButton />
          <Link href="/cards" className="c-btn small solid hidden sm:inline-flex">
            Submit a proposal
          </Link>
        </div>
      </div>
      <nav className="c-links-mobile c-wrap" aria-label="Main, small screens">
        <Link href="/proposals">Proposals</Link>
        <Link href="/cards">Cards</Link>
        <Link href="/me">My proposals</Link>
        <Link href="/new">Open a card</Link>
        <Link href="/docs">Docs</Link>
      </nav>
    </header>
  );
}
