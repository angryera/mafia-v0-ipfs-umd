#!/usr/bin/env node
/**
 * CLI: get-land-slots-by-owner <chain> <ownerAddress> <cityIdsCsv>
 *
 * Examples:
 *   npx tsx src/cli/get-land-slots-by-owner.ts bnb 0xabc... 1,2,3
 *   npx tsx src/cli/get-land-slots-by-owner.ts pulse 0xabc... 1,2,3
 */
import { getLandSlotsByOwner } from '../features/mafia-map/getLandSlotsByOwner.js';
import type { ChainName } from '../core/chains.js';

const chain = (process.argv[2] ?? 'bnb').toLowerCase() as ChainName;
const owner = (process.argv[3] ?? '').trim();
const cityIdsCsv = (process.argv[4] ?? '').trim();

if (chain !== 'bnb' && chain !== 'pulse') {
  console.error('Usage: npx tsx src/cli/get-land-slots-by-owner.ts <bnb|pulse> <ownerAddress> <cityIdsCsv>');
  process.exit(1);
}

if (!owner || !owner.startsWith('0x')) {
  console.error('Error: Invalid ownerAddress. Expected 0x... address.');
  process.exit(1);
}

const cityIds = cityIdsCsv
  .split(',')
  .map((s) => parseInt(s.trim(), 10))
  .filter((n) => Number.isFinite(n) && n >= 0);

if (cityIds.length === 0) {
  console.error('Error: Invalid cityIdsCsv. Example: 1,2,3');
  process.exit(1);
}

async function main() {
  const start = Date.now();
  console.log(`Scanning land slots for owner ${owner} on ${chain} (cities: ${cityIds.join(',')})...\n`);

  const slots = await getLandSlotsByOwner(
    { chain, owner, cityIds, requireInventoryItem: true },
    (p) => {
      process.stdout.write(
        `\rCity ${p.cityId} (${p.cityIndex + 1}/${p.cityCount}) | matched=${p.matchedSlots.toLocaleString()}     `
      );
    }
  );

  process.stdout.write('\n');
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log(`Done: ${slots.length.toLocaleString()} land slots matched in ${elapsed}s`);
  if (slots.length > 0) {
    console.log('\nFirst 5:');
    slots.slice(0, 5).forEach((slot, i) => {
      console.log(
        `  [${i + 1}] city=${slot.cityId} pos=(${slot.x},${slot.y}) itemId=${slot.inventoryItemId} owner=${slot.owner}`
      );
    });
  }
}

main().catch((err) => {
  console.error('\nError:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});

