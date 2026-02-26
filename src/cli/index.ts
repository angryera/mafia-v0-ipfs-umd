#!/usr/bin/env node
/**
 * CLI - Connectivity test for BNB & PulseChain
 */
import type { ChainName } from '../core/chains.js';
import { getClient, getChainInfo } from '../core/chains.js';

async function testChain(chainName: ChainName): Promise<void> {
  const client = getClient(chainName);
  const info = getChainInfo(chainName);
  try {
    const blockNumber = await client.getBlockNumber();
    console.log(`[${chainName}] ${info.name} (chainId ${info.id}): block #${blockNumber}`);
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
