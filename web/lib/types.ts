/** What the contract's views answer. Money is a decimal string of wei; times are chain seconds. */

export type Label = 'FOUND' | 'MISSING';
export type State = 'SUBMITTED' | 'REWRITE' | 'SKIMMABLE' | 'SHELVED' | 'WAIVED';

export type Totals = { cards: number; proposals: number; received: string; fees_held: string; owed: string; paid: string };
export type NotFound = { found: false; totals: Totals };

export type Card = {
  found: true;
  id: number;
  owner: string;
  name: string;
  questions: string[];
  window_words: number;
  fee: string;
  pool: string;
  created_at: number;
  updated_at: number;
  proposals: number;
  skimmable: number;
  waived: number;
  shelved: number;
  totals: Totals;
};

export type Row = {
  id: number;
  card_id: number;
  card_name: string;
  author: string;
  title: string;
  state: State;
  attempts: number;
  attempts_left: number;
  /** -1 while the current attempt has not been read. */
  missing: number;
  questions: number;
  held: string;
  created_at: number;
  resolved_at: number;
};

export type AttemptRow = {
  n: number;
  text: string;
  questions: string[];
  window_words: number;
  window: string;
  words_total: number;
  labels: Label[];
  missing: number;
  verdict: '' | 'SKIMMABLE' | 'REWRITE' | 'SHELVED';
  created_at: number;
  resolved_at: number;
  judged_by: string;
};

export type Proposal = Row & {
  found: true;
  attempt_rows: AttemptRow[];
  cooldown_until: number;
  waived_by: string;
  card_fee: string;
  card_owner: string;
  totals: Totals;
};

export type Listing = { found: boolean; card_id: number; offset: number; items: Row[]; totals: Totals };

export type Account = { found: true; account: string; balance: string; earned: string; withdrawn: string; proposal_count: number; proposals: number[]; totals: Totals };
