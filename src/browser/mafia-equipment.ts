import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';

export interface GetCitiesTotalPowerOptions {
  chain: 'bnb' | 'pulse';
  playerAddress: string;
  message: string;
  signature: string; // bytes as 0x...
  contractAddress?: string;
  rpcUrl?: string;
}

type RawResult = readonly [readonly bigint[], readonly bigint[]];

export async function getCitiesTotalPower(
  options: GetCitiesTotalPowerOptions
): Promise<{ defense: number[]; offense: number[] }> {
  const {
    chain,
    playerAddress,
    message,
    signature,
    contractAddress: customAddress,
    rpcUrl,
  } = options;
  const address = (customAddress ?? CONTRACTS.MafiaEquipment.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaEquipment.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const raw = (await client.readContract({
    address,
    abi,
    functionName: 'getCitiesTotalPower',
    args: [playerAddress as `0x${string}`, message, signature as `0x${string}`],
  })) as unknown as RawResult;

  const defense = (raw?.[0] ?? []).map((x) => Number(x));
  const offense = (raw?.[1] ?? []).map((x) => Number(x));
  return { defense, offense };
}

export const MafiaEquipment = { getCitiesTotalPower };

