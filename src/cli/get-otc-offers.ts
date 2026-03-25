#!/usr/bin/env node
/**
 * CLI: get-otc-offers <chain> <startIndex> <length>
 * Usage:
 *   npx tsx src/cli/get-otc-offers.ts bnb 0 20
 *   npx tsx src/cli/get-otc-offers.ts pulse 0 20
 */
import { getOTCOffers } from '../features/mafia-exchange/index.js';
import type { ChainName } from '../core/chains.js';

const chain = (process.argv[2] ?? 'bnb').toLowerCase() as ChainName;
const startIndex = parseInt(process.argv[3] ?? '0', 10);
const length = parseInt(process.argv[4] ?? '20', 10);

if (chain !== 'bnb' && chain !== 'pulse') {
  console.error('Usage: npx tsx src/cli/get-otc-offers.ts <bnb|pulse> <startIndex> <length>');
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
  console.log(`Fetching OTC offers on ${chain} (startIndex=${startIndex}, length=${length})...\n`);
  try {
    const list = await getOTCOffers(chain, startIndex, length);
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    const totalOfferedItems = list.reduce((sum, o) => sum + (o.offeredItems?.length ?? 0), 0);
    console.log(`Done: ${list.length.toLocaleString()} offers, ${totalOfferedItems.toLocaleString()} offered items in ${elapsed}s`);

    if (list.length > 0) {
      console.log('\nSample offers:');
      list.slice(0, 5).forEach((offer, i) => {
        console.log(
          `  [${i + 1}] creator=${offer.creator.slice(0, 8)}... status=${offer.status} offerItems=${offer.offerItemIds.length} requestItems=${offer.requestItems.length}`
        );
      });
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
