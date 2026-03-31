import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';
import { formatUnits } from '../utils/units.js';

export interface BalanceOfBulletOptions {
  chain: 'bnb' | 'pulse';
  playerAddress: string;
  message: string;
  signature: string; // bytes as 0x...
  contractAddress?: string;
  rpcUrl?: string;
}

export async function balanceOfBullet(options: BalanceOfBulletOptions): Promise<number> {
  const {
    chain,
    playerAddress,
    message,
    signature,
    contractAddress: customAddress,
    rpcUrl,
  } = options;
  const address = (customAddress ?? CONTRACTS.MafiaBullet.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaBullet.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const raw = await client.readContract({
    address,
    abi,
    functionName: 'balanceOf',
    args: [playerAddress as `0x${string}`, message, signature as `0x${string}`],
  });

  // Contract returns wei-like units (18 decimals). Convert to "ether" bullets.
  const rawBigInt = raw as unknown as bigint;
  return Number(formatUnits(rawBigInt, 18));
}

export const MafiaBullet = { balanceOfBullet };

