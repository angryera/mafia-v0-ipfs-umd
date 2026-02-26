#!/usr/bin/env node
/**
 * CLI: Fetch items by category
 * Usage: npx tsx src/runGetItemsByCategory.ts <categoryId>
 * Example: npx tsx src/runGetItemsByCategory.ts 0
 */
import { getItemsByCategory } from './getItemsByCategory.js';

const categoryId = parseInt(process.argv[2] ?? '0', 10);
if (isNaN(categoryId)) {
  console.error('Usage: npx tsx src/runGetItemsByCategory.ts <categoryId>');
  process.exit(1);
}

const BAR_WIDTH = 20;

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function renderProgressBar(batchIndex: number, fetched: number, elapsedSec: number): string {
  const filled = Math.min(batchIndex, BAR_WIDTH);
  const bar = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
  return `  [${bar}] ${formatNumber(fetched).padStart(10)} items | ${elapsedSec.toFixed(1)}s`;
}

async function main() {
  const start = Date.now();
  const isTTY = process.stdout.isTTY === true;
  console.log(`Fetching items for category ${categoryId}...\n`);

  const items = await getItemsByCategory(categoryId, 100_000, ({ fetched, batchIndex }) => {
    const elapsed = (Date.now() - start) / 1000;
    const line = renderProgressBar(batchIndex, fetched, elapsed);
    if (isTTY) {
      process.stdout.write(`\r${line}    `);
    } else {
      console.log(line);
    }
  });

  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  if (isTTY) process.stdout.write('\r' + ' '.repeat(80) + '\r');
  console.log(`Done: ${formatNumber(items.length)} items in ${elapsed}s`);
  if (items.length > 0) {
    console.log('\nFirst 3:', JSON.stringify(items.slice(0, 3), null, 2));
  }
}

main().catch((err) => {
  process.stdout.write('\r' + ' '.repeat(60) + '\r');
  console.error(err);
  process.exit(1);
});
