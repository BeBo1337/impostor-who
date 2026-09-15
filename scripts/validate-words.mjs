// Validates the word library files without a build step.
// Usage: node scripts/validate-words.mjs            (all categories)
//        node scripts/validate-words.mjs sports food (specific categories)
import { readFileSync, readdirSync } from 'node:fs';

const DIR = new URL('../src/data/words/', import.meta.url);
const MIN_HINTS = 3;
const MIN_DISTINCT_HINT_RATIO = 0.3;

const args = process.argv.slice(2);
const files = args.length
  ? args.map((a) => (a.endsWith('.ts') ? a : `${a}.ts`))
  : readdirSync(DIR).filter((f) => f.endsWith('.ts') && f !== 'index.ts');

const norm = (s) =>
  s
    .normalize('NFC')
    .replace(/[׳״'"״׳.\-–:!?]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const tokens = (s) =>
  norm(s)
    .split(' ')
    .filter((t) => t.length >= 3);

function extractStrings(line) {
  const res = [];
  let i = 0;
  while (i < line.length) {
    const c = line[i];
    if (c === "'" || c === '"') {
      let j = i + 1;
      let s = '';
      while (j < line.length && line[j] !== c) {
        if (line[j] === '\\') {
          s += line[j + 1];
          j += 2;
          continue;
        }
        s += line[j];
        j += 1;
      }
      res.push(s);
      i = j + 1;
    } else {
      i += 1;
    }
  }
  return res;
}

let problems = 0;
let grandWords = 0;
const report = (msg) => {
  problems += 1;
  console.log('  ✗', msg);
};

for (const file of files) {
  const category = file.replace(/\.ts$/, '');
  const text = readFileSync(new URL(file, DIR), 'utf8');
  const lines = text.split(/\r?\n/);
  const words = new Map();
  const allHints = [];
  let count = 0;
  console.log(`\n${category}`);

  lines.forEach((raw, index) => {
    const line = raw.trim();
    if (!line.startsWith('[')) return;
    const lineNo = index + 1;
    const strings = extractStrings(line);
    const [word, ...hints] = strings;
    count += 1;

    if (!word || !word.trim()) {
      report(`line ${lineNo}: empty word`);
      return;
    }
    if (hints.length < MIN_HINTS) report(`line ${lineNo}: "${word}" has ${hints.length} hints, needs ${MIN_HINTS}`);
    for (const s of strings) {
      if (/[֐-׿]['"]|['"][֐-׿]/.test(s)) {
        report(`line ${lineNo}: ASCII quote inside Hebrew text in "${s}", use ׳ or ״`);
      }
      if (/[؀-ۿ]/.test(s)) report(`line ${lineNo}: Arabic letters in "${s}"`);
    }

    const key = norm(word);
    if (words.has(key)) report(`line ${lineNo}: duplicate word "${word}" (also on line ${words.get(key)})`);
    else words.set(key, lineNo);

    const hintKeys = new Set(hints.map(norm));
    if (hintKeys.size !== hints.length) report(`line ${lineNo}: "${word}" repeats a hint`);

    const wordTokens = new Set(tokens(word));
    for (const hint of hints) {
      const h = norm(hint);
      if (!h) {
        report(`line ${lineNo}: "${word}" has an empty hint`);
        continue;
      }
      if (hint === 'TODO') report(`line ${lineNo}: "${word}" still has a TODO hint`);
      if (h === key) report(`line ${lineNo}: hint equals word "${word}"`);
      else if (h.includes(key)) report(`line ${lineNo}: hint "${hint}" contains the word "${word}"`);
      else if (h.length >= 3 && key.includes(h)) report(`line ${lineNo}: word "${word}" contains the hint "${hint}"`);
      for (const t of tokens(hint)) {
        if (wordTokens.has(t)) report(`line ${lineNo}: "${word}" shares the token "${t}" with hint "${hint}"`);
      }
      allHints.push(h);
    }
  });

  const distinct = new Set(allHints).size;
  const ratio = allHints.length ? distinct / allHints.length : 0;
  if (ratio < MIN_DISTINCT_HINT_RATIO) report(`hints are too repetitive: ${distinct} distinct of ${allHints.length}`);
  grandWords += count;
  console.log(`  ${count} words, ${allHints.length} hints, ${distinct} distinct (${Math.round(ratio * 100)}%)`);
}

console.log(`\n${files.length} categories, ${grandWords} words, average ${Math.round(grandWords / files.length)} per category`);
if (problems > 0) {
  console.log(`\n${problems} problem(s) found`);
  process.exit(1);
}
console.log('\nOK');
