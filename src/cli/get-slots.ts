#!/usr/bin/env node
/**
 * CLI: get-slots <chain> <cityId>
 * Fetches slot information for a city from MafiaMap contract.
 * Usage: npx tsx src/cli/get-slots.ts bnb 1
 *        npx tsx src/cli/get-slots.ts pulse 1
 */
import { getSlots } from '../features/mafia-map/index.js';
import type { ChainName } from '../core/chains.js';

const chain = (process.argv[2] ?? 'bnb').toLowerCase() as ChainName;
const cityId = parseInt(process.argv[3] ?? '1', 10);

if (chain !== 'bnb' && chain !== 'pulse') {
  console.error('Usage: npx tsx src/cli/get-slots.ts <bnb|pulse> <cityId>');
  process.exit(1);
}

if (isNaN(cityId)) {
  console.error('Error: Invalid cityId');
  process.exit(1);
}

async function main() {
  const start = Date.now();
  console.log(`Fetching slots for city ${cityId} on ${chain}...\n`);

  try {
    const slots = await getSlots(chain, cityId);
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    console.log(`Done: ${slots.length.toLocaleString()} slots in ${elapsed}s`);
    
    if (slots.length > 0) {
      console.log('\nSample slots:');
      slots.slice(0, 5).forEach((slot, i) => {
        console.log(
          `  [${i + 1}] (${slot.x},${slot.y}) Type:${slot.slotType} SubType:${slot.slotSubType} Owner:${slot.owner.slice(0, 6)}...`
        );
      });
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();
