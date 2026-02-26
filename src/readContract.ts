/**
 * Contract value reader using viem
 *
 * When you provide the contract address and ABI, you can add read functions here.
 * Example usage:
 *   const value = await readContractValue(client, 'functionName', [arg1, arg2]);
 */
import type { Abi, PublicClient } from 'viem';
import { CONTRACT_ADDRESSES, CONTRACT_ABIS } from './config.js';
import { getClient } from './chains.js';
import type { ChainName } from './chains.js';

/**
 * Read a value from the contract
 */
export async function readContractValue<T = unknown>(
  client: PublicClient,
  address: `0x${string}`,
  abi: Abi,
  functionName: string,
  args: unknown[] = []
): Promise<T> {
  return client.readContract({
    address,
    abi,
    functionName,
    args,
  }) as Promise<T>;
}

/**
 * Convenience: read from BNB chain (MafiaInventory)
 */
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

/**
 * Convenience: read from PulseChain (MafiaInventoryPLS)
 */
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
