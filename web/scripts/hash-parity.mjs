// Holds web/lib/cut.mjs to tests/vectors.json, which scripts/gen_vectors.py
// writes from the contract's own cut_window. Run: node web/scripts/hash-parity.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { cutWindow, splitAtLine, wordCount } from '../lib/cut.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const { vectors } = JSON.parse(readFileSync(join(root, 'tests', 'vectors.json'), 'utf8'));
let failed = 0;
for (const v of vectors) {
  const same = cutWindow(v.title, v.text, v.words) === v.window && wordCount(v.title, v.text) === v.word_count;
  // The live ruler must put the line at the same word: what is lit, re-cut, is the window.
  const split = splitAtLine(v.title, v.text, v.words);
  const lit = cutWindow(split.lit, '', v.words) === v.window;
  if (!same || !lit) {
    failed++;
    console.log('MISMATCH', v.name);
  }
}
console.log(failed === 0 ? `window parity ok: ${vectors.length} vectors` : `window parity FAILED: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
