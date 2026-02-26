/**
 * Chain configuration for BNB Smart Chain and PulseChain
 * Uses viem's built-in chain definitions
 */
import { type PublicClient, createPublicClient, http } from 'viem';
import { bsc } from 'viem/chains';
import { pulsechain } from 'viem/chains';

export type ChainName = 'bnb' | 'pulse';

const chains = {
  bnb: bsc,
  pulse: pulsechain,
} as const;

/**
 * Default RPC URLs - can be overridden via env vars
 * BNB: https://bsc-dataseed.binance.org/
 * PulseChain: https://rpc.pulsechain.com
 */
const rpcUrls: Record<ChainName, string> = {
  bnb: process.env.BNB_RPC_URL || 'https://bsc-dataseed.binance.org/',
  pulse: process.env.PULSE_RPC_URL || 'https://rpc.pulsechain.com',
};

/**
 * Create a viem public client for the specified chain
 */
export function getClient(chainName: ChainName): PublicClient {
  const chain = chains[chainName];
  const rpcUrl = rpcUrls[chainName];

  if (!chain || !rpcUrl) {
    throw new Error(`Unknown chain: ${chainName}. Use 'bnb' or 'pulse'.`);
  }

  return createPublicClient({
    chain,
    transport: http(rpcUrl),
  });
}

/**
 * Get chain info
 */
export function getChainInfo(chainName: ChainName) {
  const chain = chains[chainName];
  if (!chain) {
    throw new Error(`Unknown chain: ${chainName}. Use 'bnb' or 'pulse'.`);
  }
  return {
    id: chain.id,
    name: chain.name,
    nativeCurrency: chain.nativeCurrency,
  };
}

export { chains };
