import type { State } from './types';

export const STATE_HELP: Record<State, string> = {
  SUBMITTED: 'Cut to its window and waiting for the validators to read it.',
  REWRITE: 'Some questions are MISSING from the window. The fee stays held for the next try.',
  SKIMMABLE: 'Every question is FOUND in the window. It opens for voting and the fees went back to its author.',
  SHELVED: 'The third attempt still had MISSING questions. The fees went to the card, and the author waits 7 days on this card.',
  WAIVED: 'The card owner waived the rule. It opens for voting, marked as waived, and the fees went back.',
};

/** What the verdict word says: "REWRITE · 3" names how many questions are missing. */
export function verdictWord(state: State, missing: number): string {
  return state === 'REWRITE' && missing > 0 ? `REWRITE · ${missing}` : state;
}

export function plural(n: number, one: string, many = one + 's'): string {
  return `${n.toLocaleString('en-US')} ${n === 1 ? one : many}`;
}

/** Days and hours until a chain time, from the browser's clock. */
export function until(seconds: number, nowMs = Date.now()): string {
  const left = seconds - Math.floor(nowMs / 1000);
  if (left <= 0) return 'now';
  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  return d >= 1 ? `${d} d ${h} h` : h >= 1 ? `${h} h` : `${Math.max(1, Math.floor(left / 60))} min`;
}
