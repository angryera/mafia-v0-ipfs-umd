#!/usr/bin/env node
/**
 * CLI: get-liquidity-positions <chain> <contractAddress> <startIndex> <length>
 * Usage:
 *   npx tsx src/cli/get-liquidity-positions.ts pulse 0 20
 *   npx tsx src/cli/get-liquidity-positions.ts pulse 0xYourDepositContract 0 20
 */
import type { ChainName } from '../core/chains.js';
import { getLiquidityPositions } from '../features/mafia-deposit/index.js';

const chain = (process.argv[2] ?? 'pulse').toLowerCase() as ChainName;
const third = process.argv[3] ?? '';

const isAddressArg = /^0x[a-fA-F0-9]{40}$/.test(third);
const contractAddress = (isAddressArg ? third : undefined) as `0x${string}` | undefined;
const startIndex = parseInt((isAddressArg ? process.argv[4] : process.argv[3]) ?? '0', 10);
const length = parseInt((isAddressArg ? process.argv[5] : process.argv[4]) ?? '20', 10);

if (chain !== 'bnb' && chain !== 'pulse') {
  console.error(
    'Usage: npx tsx src/cli/get-liquidity-positions.ts <bnb|pulse> [contractAddress] <startIndex> <length>'
  );
  process.exit(1);
}

if (third.length > 0 && third !== '0' && !isAddressArg && isNaN(parseInt(third, 10))) {
  console.error('Error: Invalid contractAddress (expected 0x + 40 hex chars) or startIndex');
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
  console.log(
    `Fetching cash swap liquidity on ${chain}${
      contractAddress ? ` from ${contractAddress}` : ''
    } (startIndex=${startIndex}, length=${length})...\n`
  );

  try {
    const list = await getLiquidityPositions({
      chain,
      address: contractAddress,
      startIndex,
      length,
    });
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);

    console.log(`Done: ${list.length.toLocaleString()} liquidity positions in ${elapsed}s`);
    if (list.length > 0) {
      console.log('\nSample positions:');
      list.slice(0, 10).forEach((p, i) => {
        console.log(
          `  [${i + 1}] id=${p.id} provider=${p.provider.slice(0, 8)}... cashLeft=${p.cashAmount} cashPerMafia=${p.cashPerMafia} active=${p.active}`
        );
      });
    }
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
}

main();

