import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';
import { formatUnits } from '../utils/units.js';

export interface UserSpentCreditsOptions {
    chain: 'bnb' | 'pulse';
    playerAddress: string;
    contractAddress?: string;
    rpcUrl?: string;
}

export async function userSpentCredits(options: UserSpentCreditsOptions): Promise<number> {
    const { chain, playerAddress, contractAddress: customAddress, rpcUrl } = options;
    const address = (customAddress ?? CONTRACTS.MafiaHelperCredit.addresses[chain]) as `0x${string}`;
    const abi = CONTRACTS.MafiaHelperCredit.abi as Abi;
    const client = createBrowserClient(chain, rpcUrl);

    const raw = await client.readContract({
        address,
        abi,
        functionName: 'userSpentCredits',
        args: [playerAddress as `0x${string}`],
    });

    // userSpentCredits is returned in wei-like units (18 decimals).
    const rawBigInt = raw as unknown as bigint;
    return Number(formatUnits(rawBigInt, 18));
}

export const MafiaHelperCredit = { userSpentCredits };

