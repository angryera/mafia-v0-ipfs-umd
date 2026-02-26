#!/usr/bin/env node
/**
 * BNB Mafia IFPS Support - Contract reader for BNB & PulseChain
 *
 * Usage:
 *   npm start              # Test both chains (block numbers)
 *   npm run read:bnb       # Test BNB chain only
 *   npm run read:pulse     # Test PulseChain only
 *   npm run dev            # Run with tsx (no build)
 *
 * When you add contract address and ABI to src/config.ts,
 * use readContractValue(), readOnBnb(), or readOnPulse() to fetch values.
 */
import type { ChainName } from './chains.js';
import { getClient, getChainInfo } from './chains.js';

async function testChain(chainName: ChainName): Promise<void> {
  const client = getClient(chainName);
  const info = getChainInfo(chainName);

  try {
    const blockNumber = await client.getBlockNumber();
    console.log(
      `[${chainName}] ${info.name} (chainId ${info.id}): block #${blockNumber}`
    );
  } catch (err) {
    console.error(
      `[${chainName}] Error:`,
      err instanceof Error ? err.message : String(err)
    );
  }
}

async function main(): Promise<void> {
  const chainArg = process.argv[2]?.toLowerCase();

  if (chainArg === 'bnb' || chainArg === 'pulse') {
    await testChain(chainArg);
  } else {
    console.log('Testing BNB and PulseChain connectivity...\n');
    await testChain('bnb');
    await testChain('pulse');
  }
}

main();
