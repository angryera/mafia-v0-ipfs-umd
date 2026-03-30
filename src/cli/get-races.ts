#!/usr/bin/env node
/**
 * CLI: get-races <chain> [pageSize]
 *
 * Usage:
 *   npx tsx src/cli/get-races.ts bnb
 *   npx tsx src/cli/get-races.ts pulse 200
 */
import { getRaces } from '../features/race-lobby/index.js';
import type { ChainName } from '../core/chains.js';

const chain = (process.argv[2] ?? 'bnb').toLowerCase() as ChainName;
const pageSize = parseInt(process.argv[3] ?? '200', 10);

if (chain !== 'bnb' && chain !== 'pulse') {
  console.error('Usage: npx tsx src/cli/get-races.ts <bnb|pulse> [pageSize]');
  process.exit(1);
}

if (isNaN(pageSize) || pageSize <= 0) {
  console.error('Error: Invalid pageSize (must be > 0)');
  process.exit(1);
}

async function main() {
  const start = Date.now();
  console.log(`Fetching ALL races on ${chain} (pageSize=${pageSize})...\n`);
  try {
    const races = await getRaces(chain, pageSize);
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    console.log(`Done: ${races.length.toLocaleString()} races in ${elapsed}s`);
    if (races.length > 0) {
      console.log('\nFirst 5 races:');
      races.slice(0, 5).forEach((r, i) => {
        console.log(
          `  [${i + 1}] id=${r.id} city=${r.cityId} status=${r.status} result=${r.result} creator=${r.creator.slice(0, 8)}... opponent=${r.opponent.slice(0, 8)}... dmg=${r.creatorCarDamagePercent}/${r.opponentCarDamagePercent}`
        );
      });
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();

