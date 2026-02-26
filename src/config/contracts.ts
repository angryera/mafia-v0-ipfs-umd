/**
 * Contract configuration - addresses and ABIs per chain
 */
import type { Abi } from 'viem';
import type { ChainName } from '../core/chains.js';
import mafiaInventoryAbi from '../abis/MafiaInventory.json' with { type: 'json' };
import mafiaInventoryPlsAbi from '../abis/MafiaInventoryPLS.json' with { type: 'json' };

export const CONTRACT_ADDRESSES: Record<ChainName, `0x${string}`> = {
  bnb: '0x2CB8352Be090846d4878Faa92825188D7bf50654',
  pulse: '0x2c60de22Ec20CcE72245311579c4aD9e5394Adc4',
};

export const CONTRACT_ABIS: Record<ChainName, Abi> = {
  bnb: mafiaInventoryAbi as Abi,
  pulse: mafiaInventoryPlsAbi as Abi,
};
