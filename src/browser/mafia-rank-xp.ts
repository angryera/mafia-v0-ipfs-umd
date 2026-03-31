import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';

export interface GetRankXpOptions {
  chain: 'bnb' | 'pulse';
  playerAddress: string;
  message: string;
  signature: string; // bytes as 0x...
  contractAddress?: string;
  rpcUrl?: string;
}

export interface GetRankLevelOptions {
  chain: 'bnb' | 'pulse';
  playerAddress: string;
  contractAddress?: string;
  rpcUrl?: string;
}

export async function getRankXp(options: GetRankXpOptions): Promise<number> {
  const {
    chain,
    playerAddress,
    message,
    signature,
    contractAddress: customAddress,
    rpcUrl,
  } = options;
  const address = (customAddress ?? CONTRACTS.MafiaRankXp.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaRankXp.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const raw = await client.readContract({
    address,
    abi,
    functionName: 'getRankXp',
    args: [playerAddress as `0x${string}`, message, signature as `0x${string}`],
  });

  return Number(raw as unknown as bigint);
}

export async function getRankLevel(options: GetRankLevelOptions): Promise<number> {
  const {
    chain,
    playerAddress,
    contractAddress: customAddress,
    rpcUrl,
  } = options;
  const address = (customAddress ?? CONTRACTS.MafiaRankXp.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaRankXp.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const raw = await client.readContract({
    address,
    abi,
    functionName: 'getRankLevel',
    args: [playerAddress as `0x${string}`],
  });

  return Number(raw as unknown as bigint);
}

export const MafiaRankXp = { getRankXp, getRankLevel };

