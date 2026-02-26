/**
 * Generic contract read helpers
 */
import type { Abi, PublicClient } from 'viem';
import { getClient } from './chains.js';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from '../config/index.js';
export async function readContractValue<T = unknown>(
  client: PublicClient,
  address: `0x${string}`,
  abi: Abi,
  functionName: string,
  args: unknown[] = []
): Promise<T> {
  return client.readContract({ address, abi, functionName, args }) as Promise<T>;
}

export async function readOnBnb<T = unknown>(
  functionName: string,
  args: unknown[] = []
): Promise<T> {
  const client = getClient('bnb');
  return readContractValue<T>(
    client,
    CONTRACT_ADDRESSES.bnb,
    CONTRACT_ABIS.bnb,
    functionName,
    args
  );
}

export async function readOnPulse<T = unknown>(
  functionName: string,
  args: unknown[] = []
): Promise<T> {
  const client = getClient('pulse');
  return readContractValue<T>(
    client,
    CONTRACT_ADDRESSES.pulse,
    CONTRACT_ABIS.pulse,
    functionName,
    args
  );
}
