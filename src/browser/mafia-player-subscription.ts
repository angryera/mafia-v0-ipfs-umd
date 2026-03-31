import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';

export type ProfilePlanType = 0 | 1 | 2; // Free, Plus, Unlimited

export interface SubscriptionInfo {
  planType: number;
  startedAt: number;
}

export interface GetSubscriptionInfoOptions {
  chain: 'bnb' | 'pulse';
  playerAddress: string;
  contractAddress?: string;
  rpcUrl?: string;
}

type RawResult = readonly [
  { planType: bigint; startedAt: bigint } | readonly [bigint, bigint],
  boolean
];

export async function getSubscriptionInfo(
  options: GetSubscriptionInfoOptions
): Promise<{ subscription: SubscriptionInfo; isActive: boolean }> {
  const { chain, playerAddress, contractAddress: customAddress, rpcUrl } = options;
  const address = (customAddress ?? CONTRACTS.MafiaPlayerSubscription.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaPlayerSubscription.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const raw = (await client.readContract({
    address,
    abi,
    functionName: 'getSubscriptionInfo',
    args: [playerAddress as `0x${string}`],
  })) as unknown as RawResult;

  const sub = raw?.[0] as any;
  const isActive = Boolean(raw?.[1]);

  // Support both tuple-array and named tuple object shapes
  const planType = Number(sub?.planType ?? sub?.[0] ?? 0n);
  const startedAt = Number(sub?.startedAt ?? sub?.[1] ?? 0n);

  return { subscription: { planType, startedAt }, isActive };
}

export const MafiaPlayerSubscription = { getSubscriptionInfo };

