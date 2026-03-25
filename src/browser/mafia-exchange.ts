import type { Abi } from 'viem';
import { createBrowserClient } from './shared.js';
import { CONTRACTS } from '../contracts/index.js';

export interface OTCRequestItem {
  itemType: number;
  categoryId: number;
  typeId: number;
  cityId: number;
  x: number;
  y: number;
}

export interface OTCOffer {
  offerItemIds: number[];
  requestItems: OTCRequestItem[];
  creator: string;
  createdAt: number;
  expireAt: number;
  status: number;
  offeredItems: OfferedItemDetail[];
}

export interface InventoryItem {
  categoryId: number;
  typeId: number;
  owner: string;
}

export interface OfferedItemDetail extends InventoryItem {
  itemId: number;
}

export interface GetOTCOffersOptions {
  chain: 'bnb' | 'pulse';
  startIndex: number;
  length: number;
  contractAddress?: string;
  rpcUrl?: string;
}

type RawOTCRequestItem = {
  itemType: bigint | number;
  categoryId: bigint | number;
  typeId: bigint | number;
  cityId: bigint | number;
  x: bigint | number;
  y: bigint | number;
};

type RawOTCOffer = {
  offerItemIds: readonly bigint[];
  requestItems: readonly RawOTCRequestItem[];
  creator: string;
  createdAt: bigint;
  expireAt: bigint;
  status: bigint | number;
};

type RawInventoryItem = {
  categoryId: bigint | number;
  typeId: bigint | number;
  owner: string;
};

type GetOTCOffersRaw = readonly [readonly RawOTCOffer[], readonly RawInventoryItem[]];

function parseOffer(raw: RawOTCOffer): Omit<OTCOffer, 'offeredItems'> {
  return {
    offerItemIds: (raw.offerItemIds ?? []).map((itemId) => Number(itemId)),
    requestItems: (raw.requestItems ?? []).map((requestItem) => ({
      itemType: Number(requestItem.itemType ?? 0),
      categoryId: Number(requestItem.categoryId ?? 0),
      typeId: Number(requestItem.typeId ?? 0),
      cityId: Number(requestItem.cityId ?? 0),
      x: Number(requestItem.x ?? 0),
      y: Number(requestItem.y ?? 0),
    })),
    creator: raw.creator,
    createdAt: Number(raw.createdAt ?? 0n),
    expireAt: Number(raw.expireAt ?? 0n),
    status: Number(raw.status ?? 0),
  };
}

function parseInventoryItem(raw: RawInventoryItem): InventoryItem {
  return {
    categoryId: Number(raw.categoryId ?? 0),
    typeId: Number(raw.typeId ?? 0),
    owner: raw.owner,
  };
}

function attachOfferItems(
  offers: Omit<OTCOffer, 'offeredItems'>[],
  offerItems: InventoryItem[]
): OTCOffer[] {
  let offerItemIndex = 0;
  return offers.map((offer) => {
    const detailedOfferedItems: OfferedItemDetail[] = offer.offerItemIds.map((itemId) => {
      const item = offerItems[offerItemIndex] ?? {
        categoryId: 0,
        typeId: 0,
        owner: '0x0000000000000000000000000000000000000000',
      };
      offerItemIndex += 1;
      return {
        itemId,
        categoryId: item.categoryId,
        typeId: item.typeId,
        owner: item.owner,
      };
    });

    return {
      ...offer,
      offeredItems: detailedOfferedItems,
    };
  });
}

export async function getOTCOffers(options: GetOTCOffersOptions): Promise<OTCOffer[]> {
  const {
    chain,
    startIndex,
    length,
    contractAddress: customAddress,
    rpcUrl,
  } = options;
  const address = (customAddress ?? CONTRACTS.MafiaExchange.addresses[chain]) as `0x${string}`;
  const abi = CONTRACTS.MafiaExchange.abi as Abi;
  const client = createBrowserClient(chain, rpcUrl);

  const raw = (await client.readContract({
    address,
    abi,
    functionName: 'getOTCOffers',
    args: [BigInt(startIndex), BigInt(length)],
  })) as unknown as GetOTCOffersRaw;

  const list = (raw[0] ?? []).map(parseOffer);
  const offerItems = (raw[1] ?? []).map(parseInventoryItem);

  return attachOfferItems(list, offerItems);
}

export const MafiaExchange = { getOTCOffers };
