#!/usr/bin/env node
/**
 * CLI: get-all-items-by-owner <ownerAddress>
 * BNB-only (uses MafiaInventory.getItemsByCategory).
 *
 * Usage:
 *   npx tsx src/cli/get-all-items-by-owner.ts 0xabc...
 */
import { getAllItemsByOwner } from '../features/mafia-inventory/index.js';

const owner = (process.argv[2] ?? '').trim();
if (!owner || !owner.startsWith('0x')) {
  console.error('Usage: npx tsx src/cli/get-all-items-by-owner.ts <ownerAddress>');
  process.exit(1);
}

async function main() {
  const start = Date.now();
  console.log(`Fetching all items for owner ${owner} (BNB only)...\n`);

  const items = await getAllItemsByOwner({
    owner,
    onProgress: (p) => {
      // lightweight progress (category-level)
      process.stdout.write(
        `\rCategory ${p.categoryId} (${p.categoryIndex + 1}/${p.categoryCount}) | ` +
        `fetched=${p.fetchedCategoryItems.toLocaleString()} | ` +
        `matched=${p.matchedOwnerItems.toLocaleString()}     `
      );
    },
  });

  process.stdout.write('\n');
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`Done: ${items.length.toLocaleString()} items matched in ${elapsed}s`);
  if (items.length > 0) {
    console.log('\nFirst 5:');
    items.slice(0, 5).forEach((item, i) => {
      console.log(`  [${i + 1}]`, JSON.stringify(item, null, 2));
    });
  }
}

main().catch((err) => {
  console.error('\nError:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});

