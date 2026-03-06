/**
 * Shared browser utilities - chains, RPC, client creation.
 * No Node.js dependencies (no process.env) - safe for browser bundles.
 */
import { createPublicClient, http } from 'viem';
import { bsc } from 'viem/chains';
import { pulsechain } from 'viem/chains';
import type { Chain, PublicClient } from 'viem';

export type ChainName = 'bnb' | 'pulse';

export const CHAINS: Record<ChainName, Chain> = {
  bnb: bsc,
  pulse: pulsechain,
};

export const DEFAULT_RPC: Record<ChainName, string> = {
  bnb: 'https://bsc-dataseed.binance.org/',
  pulse: 'https://rpc.pulsechain.com',
};

export function createBrowserClient(
  chain: ChainName,
  rpcUrl?: string
): PublicClient {
  const url = rpcUrl ?? DEFAULT_RPC[chain];
  const viemChain = CHAINS[chain];
  return createPublicClient({ chain: viemChain, transport: http(url) });
}
