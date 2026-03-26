#!/usr/bin/env node
/**
 * CLI: get-xp-listings <chain> <startIndex> <length>
 *
 * Usage:
 *   npx tsx src/cli/get-xp-listings.ts bnb 0 20
 *   npx tsx src/cli/get-xp-listings.ts pulse 0 20
 */
import { getXpListings } from '../features/index.js';
import type { ChainName } from '../core/chains.js';

const chain = (process.argv[2] ?? 'bnb').toLowerCase() as ChainName;
const startIndex = parseInt(process.argv[3] ?? '0', 10);
const length = parseInt(process.argv[4] ?? '20', 10);

if (chain !== 'bnb' && chain !== 'pulse') {
  console.error('Usage: npx tsx src/cli/get-xp-listings.ts <bnb|pulse> <startIndex> <length>');
  process.exit(1);
}

if (isNaN(startIndex) || startIndex < 0) {
  console.error('Error: Invalid startIndex (must be >= 0)');
  process.exit(1);
}

if (isNaN(length) || length <= 0) {
  console.error('Error: Invalid length (must be > 0)');
  process.exit(1);
}

async function main() {
  const start = Date.now();
  console.log(`Fetching XP listings on ${chain} (startIndex=${startIndex}, length=${length})...\n`);
  try {
    const list = await getXpListings(chain, startIndex, length);
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    console.log(`Done: ${list.length.toLocaleString()} listings in ${elapsed}s`);

    if (list.length > 0) {
      console.log('\nSample listings:');
      list.slice(0, 5).forEach((item, i) => {
        console.log(
          `  [${i + 1}] id=${item.id.toString()} xpType=${item.xpType} type=${item.listingType} status=${item.status} owner=${item.owner.slice(0, 8)}... bids=${item.bids.length}`
        );
      });
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();

