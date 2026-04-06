#!/usr/bin/env node
/**
 * CLI: get-inventory-marketplace-active-listings <chain> [pageSize]
 *
 * Usage:
 *   npx tsx src/cli/get-inventory-marketplace-active-listings.ts bnb
 *   npx tsx src/cli/get-inventory-marketplace-active-listings.ts pulse 100
 */
import { getInventoryMarketplaceActiveListings } from '../features/index.js';
import type { ChainName } from '../core/chains.js';

const chain = (process.argv[2] ?? 'bnb').toLowerCase() as ChainName;
const pageSize = parseInt(process.argv[3] ?? '200', 10);

if (chain !== 'bnb' && chain !== 'pulse') {
  console.error('Usage: npx tsx src/cli/get-inventory-marketplace-active-listings.ts <bnb|pulse> [pageSize]');
  process.exit(1);
}

if (isNaN(pageSize) || pageSize <= 0) {
  console.error('Error: Invalid pageSize (must be > 0)');
  process.exit(1);
}

async function main() {
  const start = Date.now();
  console.log(`Fetching inventory marketplace active listings on ${chain} (pageSize=${pageSize})...\n`);
  try {
    const listings = await getInventoryMarketplaceActiveListings(chain, pageSize);
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    console.log(
      `Done: ${listings.length.toLocaleString()} listings in ${elapsed}s`
    );
    if (listings.length > 0) {
      console.log('\nFirst 5 listings:');
      listings.slice(0, 5).forEach((l, i) => {
        console.log(
          `  [${i + 1}] itemId=${l.itemId} cat=${l.item.categoryId} typeId=${l.item.typeId} listingId=${l.listingId} type=${l.listingType} status=${l.status} seller=${l.seller.slice(0, 8)}... bids=${l.bids.length}`
        );
      });
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();

