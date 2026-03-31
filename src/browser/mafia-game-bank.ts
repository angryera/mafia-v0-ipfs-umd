import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';
import { formatUnits } from '../utils/units.js';

export interface BalanceOfWithSignMsgOptions {
  chain: 'bnb' | 'pulse';
  playerAddress: string;
  message: string;
  signature: string; // bytes as 0x...
  contractAddress?: string;
  rpcUrl?: string;
}

export async function balanceOfWithSignMsg(
  options: BalanceOfWithSignMsgOptions
): Promise<number> {
  const {
    chain,
    playerAddress,
    message,
    signature,
    contractAddress: customAddress,
    rpcUrl,
  } = options;
  const address = (customAddress ?? CONTRACTS.MafiaGameBank.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaGameBank.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  // balanceOfWithSignMsg(address user, string message, bytes signature) -> uint256
  const raw = await client.readContract({
    address,
    abi,
    functionName: 'balanceOfWithSignMsg',
    args: [playerAddress as `0x${string}`, message, signature as `0x${string}`],
  });

  // In-game cash is returned in wei-like units (18 decimals).
  const rawBigInt = raw as unknown as bigint;
  return Number(formatUnits(rawBigInt, 18));
}

export const MafiaGameBank = { balanceOfWithSignMsg };

