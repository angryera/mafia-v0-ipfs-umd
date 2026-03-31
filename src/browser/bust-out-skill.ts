import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';

export interface GetBustOutXpOptions {
  chain: 'bnb' | 'pulse';
  playerAddress: string;
  message: string;
  signature: string; // bytes as 0x...
  contractAddress?: string;
  rpcUrl?: string;
}

export async function getBustOutXp(options: GetBustOutXpOptions): Promise<number> {
  const {
    chain,
    playerAddress,
    message,
    signature,
    contractAddress: customAddress,
    rpcUrl,
  } = options;
  const address = (customAddress ?? CONTRACTS.BustOutSkill.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.BustOutSkill.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const raw = await client.readContract({
    address,
    abi,
    functionName: 'getSkillXp',
    args: [playerAddress as `0x${string}`, message, signature as `0x${string}`],
  });

  return Number(raw as unknown as bigint);
}

export const BustOutSkill = { getBustOutXp };

