/**
 * Cut the skim window of a proposal in the browser or in Node, with no wallet and no network.
 *
 *   node examples/cut-a-window.mjs
 *
 * This is the same file the writing box runs (lib/cut.mjs), held word for word to
 * the contract's own cut by tests/vectors.json. The sample on the docs page "Window cutting".
 */
import { cutWindow, wordCount } from '../lib/cut.mjs';

const title = 'Rewrite the developer docs';
const text = 'We ask for 40,000 USDC to rewrite the docs in Q1, paid in two halves. We need a decision by December 5.';
console.log(cutWindow(title, text, 12));
console.log(wordCount(title, text), 'words in all');
