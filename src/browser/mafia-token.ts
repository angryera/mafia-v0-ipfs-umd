import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';
import { formatUnits } from '../utils/units.js';

export interface MafiaTokenBalanceOptions {
  chain: 'bnb' | 'pulse';
  playerAddress: string;
  contractAddress?: string;
  rpcUrl?: string;
}

export async function balanceOf(options: MafiaTokenBalanceOptions): Promise<number> {
  const { chain, playerAddress, contractAddress: customAddress, rpcUrl } = options;
  const address = (customAddress ?? CONTRACTS.MafiaToken.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaToken.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const raw = await client.readContract({
    address,
    abi,
    functionName: 'balanceOf',
    args: [playerAddress as `0x${string}`],
  });

  // Assume 18 decimals for $MAFIA
  return Number(formatUnits(raw as unknown as bigint, 18));
}

export const MafiaToken = { balanceOf };

