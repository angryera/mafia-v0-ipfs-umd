#!/usr/bin/env node
/**
 * CLI: get-users-info <chain>
 * Fetches user profiles from MafiaProfile contract in batch.
 * Usage: npx tsx src/cli/get-users-info.ts bnb
 *        npx tsx src/cli/get-users-info.ts pulse
 */
import { getUsersInfo } from '../features/mafia-profile/index.js';
import type { ChainName } from '../core/chains.js';

const chain = (process.argv[2] ?? 'bnb').toLowerCase() as ChainName;
if (chain !== 'bnb' && chain !== 'pulse') {
  console.error('Usage: npx tsx src/cli/get-users-info.ts <bnb|pulse>');
  process.exit(1);
}

const BAR_WIDTH = 20;

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function renderProgressBar(batchIndex: number, fetched: number, elapsedSec: number): string {
  const filled = Math.min(batchIndex, BAR_WIDTH);
  const bar = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
  return `  [${bar}] ${formatNumber(fetched).padStart(10)} users | ${elapsedSec.toFixed(1)}s`;
}

async function main() {
  const start = Date.now();
  const isTTY = process.stdout.isTTY === true;
  console.log(`Fetching user profiles from MafiaProfile on ${chain}...\n`);

  const users = await getUsersInfo(chain, 100_000, ({ fetched, batchIndex }) => {
    const elapsed = (Date.now() - start) / 1000;
    const line = renderProgressBar(batchIndex, fetched, elapsed);
    if (isTTY) process.stdout.write(`\r${line}    `);
    else console.log(line);
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  if (isTTY) process.stdout.write('\r' + ' '.repeat(80) + '\r');
  console.log(`Done: ${formatNumber(users.length)} users in ${elapsed}s`);
  if (users.length > 0) {
    console.log('\nFirst 3:');
    users.slice(0, 3).forEach((user, i) => {
      console.log(`  [${i + 1}]`, JSON.stringify(user, null, 2));
    });
  }
}

main().catch((err) => {
  process.stdout.write('\r' + ' '.repeat(60) + '\r');
  console.error(err);
  process.exit(1);
});
