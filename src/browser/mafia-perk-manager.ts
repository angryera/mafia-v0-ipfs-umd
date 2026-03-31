import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';

export interface GetActivePerkInfoOptions {
  chain: 'bnb' | 'pulse';
  playerAddress: string;
  categoryId: number;
  contractAddress?: string;
  rpcUrl?: string;
}

export interface ActivePerkInfo {
  hasActivePerk: boolean;
  effectStrength: number;
  duration: number;
  remainingDuration: number;
  slotIndex: number;
}

type RawResult = readonly [
  boolean,
  bigint,
  bigint,
  bigint,
  number | bigint
];

export async function getActivePerkInfo(options: GetActivePerkInfoOptions): Promise<ActivePerkInfo> {
  const { chain, playerAddress, categoryId, contractAddress: customAddress, rpcUrl } = options;
  const address = (customAddress ?? CONTRACTS.MafiaPerkManager.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaPerkManager.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const raw = (await client.readContract({
    address,
    abi,
    functionName: 'getActivePerkInfo',
    args: [playerAddress as `0x${string}`, BigInt(categoryId)],
  })) as unknown as RawResult;

  return {
    hasActivePerk: Boolean(raw?.[0]),
    effectStrength: Number(raw?.[1] ?? 0n),
    duration: Number(raw?.[2] ?? 0n),
    remainingDuration: Number(raw?.[3] ?? 0n),
    slotIndex: Number(raw?.[4] ?? 0),
  };
}

export const MafiaPerkManager = { getActivePerkInfo };

