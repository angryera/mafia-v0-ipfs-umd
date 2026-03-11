#!/usr/bin/env node
/**
 * CLI: get-families <chain>
 * Fetches family info from MafiaFamily contract in batch.
 * Usage: npx tsx src/cli/get-families.ts bnb
 *        npx tsx src/cli/get-families.ts pulse
 */
import { getFamilies } from '../features/mafia-family/index.js';
import type { ChainName } from '../core/chains.js';

const chain = (process.argv[2] ?? 'bnb').toLowerCase() as ChainName;
if (chain !== 'bnb' && chain !== 'pulse') {
  console.error('Usage: npx tsx src/cli/get-families.ts <bnb|pulse>');
  process.exit(1);
}

const BAR_WIDTH = 20;

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function renderProgressBar(batchIndex: number, fetched: number, elapsedSec: number): string {
  const filled = Math.min(batchIndex, BAR_WIDTH);
  const bar = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
  return `  [${bar}] ${formatNumber(fetched).padStart(10)} families | ${elapsedSec.toFixed(1)}s`;
}

async function main() {
  const start = Date.now();
  const isTTY = process.stdout.isTTY === true;
  console.log(`Fetching families from MafiaFamily on ${chain}...\n`);

  const families = await getFamilies(chain, 100_000, ({ fetched, batchIndex }) => {
    const elapsed = (Date.now() - start) / 1000;
    const line = renderProgressBar(batchIndex, fetched, elapsed);
    if (isTTY) process.stdout.write(`\r${line}    `);
    else console.log(line);
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  if (isTTY) process.stdout.write('\r' + ' '.repeat(80) + '\r');
  console.log(`Done: ${formatNumber(families.length)} families in ${elapsed}s`);
  if (families.length > 0) {
    console.log('\nFirst 3:');
    families.slice(0, 3).forEach((family, i) => {
      console.log(`  [${i + 1}]`, JSON.stringify(family, null, 2));
    });
  }
}

main().catch((err) => {
  process.stdout.write('\r' + ' '.repeat(60) + '\r');
  console.error(err);
  process.exit(1);
});

