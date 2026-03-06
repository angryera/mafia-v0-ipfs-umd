/**
 * Contract configuration - re-exports from registry for backward compatibility.
 * New code should import from '../contracts' directly.
 */
import type { ChainName } from '../core/chains.js';
import { CONTRACTS, getContractAbi } from '../contracts/index.js';

/** @deprecated Use CONTRACTS.MafiaInventory.addresses instead */
export const CONTRACT_ADDRESSES: Record<ChainName, `0x${string}`> =
  CONTRACTS.MafiaInventory.addresses;

/** @deprecated Use getContractAbi(CONTRACTS.MafiaInventory, chain) instead */
export const CONTRACT_ABIS: Record<ChainName, import('viem').Abi> = {
  bnb: getContractAbi(CONTRACTS.MafiaInventory, 'bnb'),
  pulse: getContractAbi(CONTRACTS.MafiaInventory, 'pulse'),
};

/** @deprecated Use CONTRACTS.MafiaProfile.addresses instead */
export const MAFIA_PROFILE_ADDRESSES: Record<ChainName, `0x${string}`> =
  CONTRACTS.MafiaProfile.addresses;

/** @deprecated Use CONTRACTS.MafiaProfile.abi instead */
export const MAFIA_PROFILE_ABI = CONTRACTS.MafiaProfile.abi;
