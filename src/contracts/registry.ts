/**
 * Contract registry - single source of truth for all contracts.
 * Add new contracts here to scale the project.
 */
import type { Abi } from 'viem';
import mafiaInventoryAbi from '../abis/MafiaInventory.json' with { type: 'json' };
import mafiaInventoryPlsAbi from '../abis/MafiaInventoryPLS.json' with { type: 'json' };
import mafiaProfileAbi from '../abis/MafiaProfile.json' with { type: 'json' };
import mafiaFamilyAbi from '../abis/MafiaFamily.json' with { type: 'json' };
import mafiaMapAbi from '../abis/MafiaMap.json' with { type: 'json' };
import mafiaExchangeAbi from '../abis/MafiaExchange.json' with { type: 'json' };

export type ChainName = 'bnb' | 'pulse';

/** Contract config - addresses per chain, ABI(s) */
export interface ContractConfig {
  addresses: Record<ChainName, `0x${string}`>;
  /** Single ABI for all chains, or per-chain if contract differs (e.g. MafiaInventory BNB vs Pulse) */
  abi: Abi;
  abiPerChain?: Record<ChainName, Abi>;
}

/** Get ABI for a contract on a given chain */
export function getContractAbi<T extends ContractConfig>(config: T, chain: ChainName): Abi {
  return (config.abiPerChain?.[chain] ?? config.abi) as Abi;
}

/** Registry of all supported contracts */
export const CONTRACTS = {
  MafiaInventory: {
    addresses: {
      bnb: '0x2CB8352Be090846d4878Faa92825188D7bf50654' as `0x${string}`,
      pulse: '0x2c60de22Ec20CcE72245311579c4aD9e5394Adc4' as `0x${string}`,
    },
    abi: mafiaInventoryAbi as Abi,
    abiPerChain: {
      bnb: mafiaInventoryAbi as Abi,
      pulse: mafiaInventoryPlsAbi as Abi,
    },
  },
  MafiaProfile: {
    addresses: {
      bnb: '0xa08D627E071cB4b53C6D0611d77dbCB659902AA4' as `0x${string}`,
      pulse: '0x7FB6A056877c1da14a63bFECdE95ebbFa854f07F' as `0x${string}`,
    },
    abi: mafiaProfileAbi as Abi,
  },
  MafiaFamily: {
    addresses: {
      bnb: '0x1bC581fe134BdC7432eF8ba75BCeEd242F90BcD2' as `0x${string}`,
      pulse: '0x3363cf983ae23AF2D95a81bA4A39C36084f8BEc4' as `0x${string}`,
    },
    abi: mafiaFamilyAbi as Abi,
  },
  MafiaMap: {
    addresses: {
      bnb: '0x1c88060e4509c59b4064A7a9818f64AeC41ef19E' as `0x${string}`,
      pulse: '0xE571Aa670EDeEBd88887eb5687576199652A714F' as `0x${string}`,
    },
    abi: mafiaMapAbi as Abi,
  },
  MafiaExchange: {
    addresses: {
      bnb: '0x605694A29c5258D6c7Aed642D01111c4b7036966' as `0x${string}`,
      pulse: '0x11ee2732eD4C6BFe673e7b4BE15ece35D6a8cCD7' as `0x${string}`,
    },
    abi: mafiaExchangeAbi as Abi,
  },
} as const satisfies Record<string, ContractConfig>;

export type ContractName = keyof typeof CONTRACTS;
