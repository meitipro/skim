// The skim window, word for word what contracts/skim.py computes:
//
//   " ".join((title + " " + text).split()[:words])
//
// Python's str.split() with no argument splits on runs of whitespace, where
// whitespace is exactly the code points for which str.isspace() is true. The
// same set is spelled out here, so the browser, the server and the contract cut
// the same text at the same word. scripts/hash-parity.mjs holds this file to
// tests/vectors.json, which scripts/gen_vectors.py writes from the contract.

// Exactly the code points for which Python's str.isspace() is true.
const SPACE =
  '\\t\\n\\u000b\\u000c\\r\\u001c-\\u001f \\u0085\\u00a0\\u1680\\u2000-\\u200a\\u2028\\u2029\\u202f\\u205f\\u3000';
const RUNS = new RegExp('[' + SPACE + ']+');

/** Python's str.split(): the words of a text, with no empty ones. */
export function words(text) {
  return String(text ?? '')
    .split(RUNS)
    .filter((w) => w !== '');
}

/** The window: the first n words of the title and then the text, joined by single spaces. */
export function cutWindow(title, text, n) {
  return words(String(title ?? '') + ' ' + String(text ?? ''))
    .slice(0, n)
    .join(' ');
}

export function wordCount(title, text) {
  return words(String(title ?? '') + ' ' + String(text ?? '')).length;
}

/**
 * The text split at the skim line, for the live ruler: what a reader sees
 * (`lit`) and what they never reach (`dim`), each with its original spacing.
 * The line falls after the n-th word of title + text.
 */
export function splitAtLine(title, text, n) {
  const all = String(title ?? '') + ' ' + String(text ?? '');
  const re = new RegExp('[^' + SPACE + ']+', 'g');
  let count = 0;
  let cut = all.length;
  let match;
  while ((match = re.exec(all)) !== null) {
    count++;
    if (count === n) {
      cut = match.index + match[0].length;
      break;
    }
  }
  const titleLen = String(title ?? '').length + 1;
  return { total: wordCount(title, text), cut, titleLen, lit: all.slice(0, cut), dim: all.slice(cut) };
}

/** Length in characters as Python counts them: code points, not UTF-16 units. */
export function length(text) {
  let n = 0;
  for (const _ of String(text)) n++; // eslint-disable-line no-unused-vars
  return n;
}
