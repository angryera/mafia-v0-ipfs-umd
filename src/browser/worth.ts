export type ChainName = 'bnb' | 'pulse';

export interface WorthBreakdownRow {
  group: 'Profile' | 'Assets';
  label: string;
  value: unknown;
  worth: number;
}

export interface ComputeWorthParams {
  chain: ChainName;
  player: string;
  signMsg: string;
  signature: string;
  /**
   * City IDs to scan for map-derived fields (default: 0..10).
   */
  cityIds?: readonly number[];
  /**
   * CategoryId used for "BoosterWorthPerk" in PerkManager.getActivePerkInfo.
   * Default: 39 (WORTH_BOOST from your item category list).
   */
  boosterWorthPerkCategoryId?: number;
}

export interface ComputeWorthResult {
  totalWorth: number;
  worthBoostPercent: number | null;
  breakdown: WorthBreakdownRow[];
  cityWinners: Array<{
    cityId: number;
    topDefenseOwner: string | null;
    topDefense: number;
  }>;
  businessOwned: unknown[];
  subscription?: {
    planType: number;
    startedAt: number;
    isActive: boolean;
    label: string;
    boostPercent: number;
  };
  perkWorthBooster?: {
    categoryId: number;
    hasActivePerk: boolean;
    effectStrength: number;
    duration: number;
    remainingDuration: number;
    slotIndex: number;
  };
}

declare global {
  interface Window {
    MafiaRankXp: { getRankLevel: (o: { chain: ChainName; playerAddress: string }) => Promise<number> };
    MafiaFamily: { getPlayersInfo: (o: { chain: ChainName; users: string[] }) => Promise<Array<{ familyId: number; level: number }>> };
    MafiaRaceXp: { getRaceXp: (o: { chain: ChainName; playerAddress: string; message: string; signature: string }) => Promise<number> };
    MafiaKillSkill: { getKillSkillXp: (o: { chain: ChainName; playerAddress: string; message: string; signature: string }) => Promise<number> };
    BustOutSkill: { getBustOutXp: (o: { chain: ChainName; playerAddress: string; message: string; signature: string }) => Promise<number> };
    MafiaEquipment: { getCitiesTotalPower: (o: { chain: ChainName; playerAddress: string; message: string; signature: string }) => Promise<{ defense: number[]; offense: number[] }> };
    MafiaBullet: { balanceOfBullet: (o: { chain: ChainName; playerAddress: string; message: string; signature: string }) => Promise<number> };
    MafiaGameBank: { balanceOfWithSignMsg: (o: { chain: ChainName; playerAddress: string; message: string; signature: string }) => Promise<number> };
    MafiaHelperCredit: { userSpentCredits: (o: { chain: ChainName; playerAddress: string }) => Promise<number> };
    MafiaToken: { balanceOf: (o: { chain: ChainName; playerAddress: string }) => Promise<number> };
    MafiaMap: { getSlotsByCities: (o: { chain: ChainName; cityIds: readonly number[] }) => Promise<any[]> };
    MafiaInventory: { getItemsByCategory: (o: { chain: ChainName; categoryId: number; maxItems?: number }) => Promise<any[]> };
    MafiaPlayerSubscription: {
      getSubscriptionInfo: (o: { chain: ChainName; playerAddress: string }) => Promise<{
        subscription: { planType: number; startedAt: number };
        isActive: boolean;
      }>;
    };
    MafiaPerkManager: {
      getActivePerkInfo: (o: { chain: ChainName; playerAddress: string; categoryId: number }) => Promise<{
        hasActivePerk: boolean;
        effectStrength: number;
        duration: number;
        remainingDuration: number;
        slotIndex: number;
      }>;
    };
  }
}

const DEFAULT_CITY_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

const RankXPName = [
  'Nobody', 'Apprentice', 'Pickpocket', 'Cloak', 'Thief', 'Locksmith', 'Runner', 'Associate', 'Dealer', 'Fixer',
  'Collector', 'Enforcer', 'Prospect', 'Lieutenant', 'Soldier', 'Mobster', 'Swindler', 'Whisperer', 'Architect',
  'Hitman', 'Assassin', 'Commander', 'Executioner', 'Widowmaker', 'Bone collector', 'Tactician', 'Chief', 'Warlord',
  'Capo bastone', 'Godfather',
] as const;

// Worth values per rank (index 0 = rankLevel 1 on-chain)
const RANK_WORTH_VALUES = [
  5, 10, 15, 25, 75, 150, 250, 450, 750, 900, 1100, 1450, 1600, 1750, 1900,
  2050, 2200, 2350, 2500, 2650, 2800, 2950, 3100, 3250, 3400, 3550, 3700,
  3850, 4000, 4150,
] as const;

const ROLE_WORTH_VALUES: Record<string, number> = {
  nonMember: 0,
  familyMember: 25,
  regimeMember: 50, // reserved
  Capo: 250,
  Capodecina: 500,
  Consigliere: 600,
  Don: 1000,
};

const PlayerLevelName = ['Normal', 'Capo', 'Capodecina', 'Consigliere', 'Don'] as const;

const REAL_ESTATE_TILES = [
  { name: 'Empty tile', worth: 10 },
  { name: 'Shed', worth: 30 },
  { name: 'House', worth: 50 },
  { name: 'Villa', worth: 70 },
  { name: 'Office', worth: 90 },
  { name: 'Apartment', worth: 110 },
  { name: 'Mansion', worth: 130 },
  { name: 'Hotel', worth: 150 },
] as const;

const BUSINESS_WORTH: Record<number, Record<number, { name: string; worth: number }>> = {
  4: {
    0: { name: 'Car crusher', worth: 200 },
    1: { name: 'Gunstore', worth: 200 },
    2: { name: 'Bank', worth: 300 },
    3: { name: 'Hospital', worth: 300 },
    4: { name: 'Detective Agency', worth: 200 },
    5: { name: 'Booze warehouse', worth: 400 },
    6: { name: 'Narcotics warehouse', worth: 400 },
    7: { name: 'Slotmachine', worth: 600 },
    8: { name: 'Roulette', worth: 600 },
    9: { name: 'Bullet factory', worth: 800 },
  },
  14: {
    0: { name: 'Jackpot', worth: 600 },
  },
};

function cashWorthFromBalance(cash: unknown): number {
  const c = Number(cash ?? 0);
  if (!Number.isFinite(c) || c <= 0) return 0;
  if (c < 100_000) return 5;
  if (c < 500_000) return 15;
  if (c < 5_000_000) return 35;
  if (c < 10_000_000) return 50;
  if (c < 25_000_000) return 75;
  if (c < 100_000_000) return 100;
  return 125;
}

function getBuildingStats(slotSubType: unknown): { offense: number; defense: number } {
  const map: Record<number, { offense: number; defense: number }> = {
    1: { offense: 3, defense: 5 },
    2: { offense: 15, defense: 15 },
    3: { offense: 30, defense: 30 },
    4: { offense: 50, defense: 75 },
    5: { offense: 60, defense: 90 },
    6: { offense: 75, defense: 110 },
    7: { offense: 75, defense: 150 },
  };
  return map[Number(slotSubType ?? 0)] ?? { offense: 0, defense: 0 };
}

// Mapping used elsewhere in this project: 0 Strategic, 1 Common, 2 Upper, 3 Elite
function getBuildingRarityAmplifier(defense: number, offense: number, rarity: unknown): { defense: number; offense: number } {
  const r = Number(rarity ?? 1);
  switch (r) {
    case 0:
      return { defense: defense * 1.3, offense: offense * 1.3 };
    case 3:
      return { defense: defense * 1.4, offense: offense * 1.4 };
    case 2:
      return { defense: defense * 1.15, offense: offense * 1.15 };
    case 1:
    default:
      return { defense, offense };
  }
}

export async function computeWorth(params: ComputeWorthParams): Promise<ComputeWorthResult> {
  const {
    chain,
    player,
    signMsg,
    signature,
    cityIds = DEFAULT_CITY_IDS,
    boosterWorthPerkCategoryId = 39,
  } = params;
  const ownerLc = String(player).toLowerCase();

  const [
    rankLevelRaw,
    playerInfo0,
    subInfo,
    perkInfo,
    raceXp,
    killSkillXp,
    bustOutXp,
    citiesPower,
    bullets,
    cash,
    spentCredits,
    mafiaToken,
    allCitySlots,
    businessItemsCat4,
    businessItemsCat14,
  ] = await Promise.all([
    window.MafiaRankXp.getRankLevel({ chain, playerAddress: player }),
    window.MafiaFamily.getPlayersInfo({ chain, users: [player] }).then((list) => list?.[0] ?? { familyId: 0, level: 0 }),
    window.MafiaPlayerSubscription.getSubscriptionInfo({ chain, playerAddress: player }).catch(() => ({
      subscription: { planType: 0, startedAt: 0 },
      isActive: false,
    })),
    window.MafiaPerkManager.getActivePerkInfo({ chain, playerAddress: player, categoryId: boosterWorthPerkCategoryId }).catch(() => ({
      hasActivePerk: false,
      effectStrength: 0,
      duration: 0,
      remainingDuration: 0,
      slotIndex: 0,
    })),
    window.MafiaRaceXp.getRaceXp({ chain, playerAddress: player, message: signMsg, signature }),
    window.MafiaKillSkill.getKillSkillXp({ chain, playerAddress: player, message: signMsg, signature }),
    window.BustOutSkill.getBustOutXp({ chain, playerAddress: player, message: signMsg, signature }),
    window.MafiaEquipment.getCitiesTotalPower({ chain, playerAddress: player, message: signMsg, signature }),
    window.MafiaBullet.balanceOfBullet({ chain, playerAddress: player, message: signMsg, signature }),
    window.MafiaGameBank.balanceOfWithSignMsg({ chain, playerAddress: player, message: signMsg, signature }),
    window.MafiaHelperCredit.userSpentCredits({ chain, playerAddress: player }),
    window.MafiaToken.balanceOf({ chain, playerAddress: player }),
    window.MafiaMap.getSlotsByCities({ chain, cityIds }),
    window.MafiaInventory.getItemsByCategory({ chain, categoryId: 4, maxItems: 100_000 }).catch(() => []),
    window.MafiaInventory.getItemsByCategory({ chain, categoryId: 14, maxItems: 100_000 }).catch(() => []),
  ]);

  // Subscription boost
  const planType = Number((subInfo as any)?.subscription?.planType ?? 0);
  const startedAt = Number((subInfo as any)?.subscription?.startedAt ?? 0);
  const isActive = Boolean((subInfo as any)?.isActive);
  let subscriptionLabel = 'Free';
  let worthBoostPercent = 0;
  if (isActive && planType === 1) {
    subscriptionLabel = 'Plus';
    worthBoostPercent = 5;
  } else if (isActive && planType === 2) {
    subscriptionLabel = 'Unlimited';
    worthBoostPercent = 15;
  }

  const perkHasActive = Boolean((perkInfo as any)?.hasActivePerk);
  const perkEffectStrength = Number((perkInfo as any)?.effectStrength ?? 0);

  // Role
  const familyId = Number((playerInfo0 as any)?.familyId ?? 0);
  const playerLevel = Number((playerInfo0 as any)?.level ?? 0);
  const levelName = PlayerLevelName[playerLevel] ?? 'Normal';
  let roleLabel = 'Non member';
  let roleWorth = ROLE_WORTH_VALUES.nonMember;
  if (familyId !== 0) {
    if (levelName === 'Don') { roleLabel = 'Don'; roleWorth = ROLE_WORTH_VALUES.Don; }
    else if (levelName === 'Consigliere') { roleLabel = 'Consigliere'; roleWorth = ROLE_WORTH_VALUES.Consigliere; }
    else if (levelName === 'Capodecina') { roleLabel = 'Capodecina'; roleWorth = ROLE_WORTH_VALUES.Capodecina; }
    else if (levelName === 'Capo') { roleLabel = 'Capo'; roleWorth = ROLE_WORTH_VALUES.Capo; }
    else { roleLabel = 'Family member'; roleWorth = ROLE_WORTH_VALUES.familyMember; }
  }

  // Rank
  const rankLevel = Number(rankLevelRaw ?? 0);
  const rankIndex = Math.max(0, rankLevel - 1);
  const rankName = RankXPName[rankIndex] ?? `Rank ${rankLevel}`;
  const rankWorth = Number(RANK_WORTH_VALUES[rankIndex] ?? 0);

  // XP worth
  const raceWorth = (Number(raceXp ?? 0) / 5000) * 13;
  const killSkillWorth = (Number(killSkillXp ?? 0) / 10000) * 22;
  const bustOutWorth = (Number(bustOutXp ?? 0) / 5000) * 4;

  // Equipment power worth
  const defensePowers = (citiesPower as any)?.defense ?? [];
  const offensePowers = (citiesPower as any)?.offense ?? [];
  const defensePower = (defensePowers as any[]).reduce((sum, x) => sum + (Number(x) || 0), 0);
  const offensePower = (offensePowers as any[]).reduce((sum, x) => sum + (Number(x) || 0), 0);
  const defenseWorth = defensePower * 0.3;
  const offenseWorth = offensePower * 0.4;

  // Bullets / Cash / Spent / Mafia
  const bulletsWorth = (Number(bullets ?? 0) / 1000) * 2;
  const cashWorth = cashWorthFromBalance(cash);
  const spentCreditsWorth = (Number(spentCredits ?? 0) / 100) * 1;
  const mafiaWorth = (Number(mafiaToken ?? 0) / 3000) * 1;

  // Land-derived fields from allCitySlots
  const slotsByOwner = (Array.isArray(allCitySlots) ? allCitySlots : []).filter(
    (s) => String((s as any)?.owner ?? '').toLowerCase() === ownerLc
  );
  const landSlots = slotsByOwner.filter((s) => Number((s as any)?.inventoryItemId ?? 0) !== 0);
  const activeLandSlots = landSlots.filter((s) => Boolean((s as any)?.isOperating));
  const activeLandCount = activeLandSlots.length;
  const activeLandWorth = activeLandSlots.reduce((sum, s) => {
    const subType = Number((s as any)?.slotSubType ?? 0);
    return sum + (subType >= 0 && subType <= 3 ? 1 : 10);
  }, 0);

  const highestSlotSubType = landSlots.reduce((max, s) => {
    const st = Number((s as any)?.slotSubType ?? 0);
    return st > max ? st : max;
  }, 0);
  const realEstateIndex = Math.max(0, Math.min(REAL_ESTATE_TILES.length - 1, highestSlotSubType));
  const realEstateTile = REAL_ESTATE_TILES[realEstateIndex] ?? REAL_ESTATE_TILES[0];
  const realEstateWorth = Number(realEstateTile?.worth ?? 0);
  const realEstateValue = String(realEstateTile?.name ?? 'Empty tile');

  // City developer (defense-only + rarity amplifier)
  const operatingSlots = (Array.isArray(allCitySlots) ? allCitySlots : []).filter((s) => Boolean((s as any)?.isOperating));
  const cityOwnerTotals: Map<number, Map<string, { defense: number }>> = new Map();
  for (const slot of operatingSlots) {
    const cityId = Number((slot as any)?.cityId ?? 0);
    const owner = String((slot as any)?.owner ?? '').toLowerCase();
    if (!owner) continue;
    const stats = getBuildingStats((slot as any)?.slotSubType);
    const amplified = getBuildingRarityAmplifier(stats.defense, stats.offense, (slot as any)?.rarity);
    if (!cityOwnerTotals.has(cityId)) cityOwnerTotals.set(cityId, new Map());
    const ownerMap = cityOwnerTotals.get(cityId)!;
    const prev = ownerMap.get(owner) ?? { defense: 0 };
    ownerMap.set(owner, { defense: prev.defense + Number(amplified.defense ?? 0) });
  }

  const cityWinners: ComputeWorthResult['cityWinners'] = [];
  let playerTopDefenseCities = 0;
  for (const [cityId, ownerMap] of cityOwnerTotals.entries()) {
    let topDefenseOwner: string | null = null;
    let topDefense = 0;
    for (const [owner, totals] of ownerMap.entries()) {
      const def = Number(totals.defense ?? 0);
      if (def > topDefense) {
        topDefense = def;
        topDefenseOwner = owner;
      }
    }
    if (topDefenseOwner === ownerLc) playerTopDefenseCities++;
    cityWinners.push({ cityId, topDefenseOwner, topDefense });
  }
  const cityDeveloperValue = `Top defense: ${playerTopDefenseCities}`;
  const cityDeveloperWorth = playerTopDefenseCities > 0 ? 200 : 0;

  // Business (highest worth only)
  const bizOwnerLc = ownerLc;
  const cat4Owned = (Array.isArray(businessItemsCat4) ? businessItemsCat4 : []).filter((it) => String((it as any)?.owner ?? '').toLowerCase() === bizOwnerLc);
  const cat14Owned = (Array.isArray(businessItemsCat14) ? businessItemsCat14 : []).filter((it) => String((it as any)?.owner ?? '').toLowerCase() === bizOwnerLc);
  const businessOwned = [...cat4Owned, ...cat14Owned];
  let bestBusiness = { name: '', worth: 0 };
  for (const it of businessOwned) {
    const c = Number((it as any)?.categoryId ?? 0);
    const t = Number((it as any)?.typeId ?? 0);
    const entry = BUSINESS_WORTH?.[c]?.[t];
    const worth = Number(entry?.worth ?? 0);
    if (worth > bestBusiness.worth) bestBusiness = { name: String(entry?.name ?? ''), worth };
  }
  const businessValue = bestBusiness.name ? bestBusiness.name : 'None';
  const businessWorth = bestBusiness.worth;

  const breakdown: WorthBreakdownRow[] = [
    { group: 'Profile', label: 'Rank', value: `${rankName} (Level ${rankLevel})`, worth: rankWorth },
    { group: 'Profile', label: 'Role', value: roleLabel, worth: roleWorth },
    { group: 'Profile', label: 'Subscription', value: subscriptionLabel, worth: 0 },
    { group: 'Profile', label: 'Worth booster perk', value: perkHasActive ? `Active (+${perkEffectStrength}%)` : 'Inactive', worth: 0 },
    { group: 'Profile', label: 'City developer', value: cityDeveloperValue, worth: cityDeveloperWorth },
    { group: 'Profile', label: 'Race', value: raceXp, worth: raceWorth },
    { group: 'Profile', label: 'Kill skill', value: killSkillXp, worth: killSkillWorth },
    { group: 'Profile', label: 'Bust out', value: bustOutXp, worth: bustOutWorth },
    { group: 'Profile', label: 'Offense Power', value: offensePower, worth: offenseWorth },
    { group: 'Profile', label: 'Defense Power', value: defensePower, worth: defenseWorth },

    { group: 'Assets', label: 'Bullets', value: bullets, worth: bulletsWorth },
    { group: 'Assets', label: 'Cash', value: cash, worth: cashWorth },
    { group: 'Assets', label: 'Business', value: businessValue, worth: businessWorth },
    { group: 'Assets', label: 'Real estate', value: realEstateValue, worth: realEstateWorth },
    { group: 'Assets', label: 'Active land', value: activeLandCount, worth: activeLandWorth },
    { group: 'Assets', label: '$Mafia', value: mafiaToken, worth: mafiaWorth },
    { group: 'Assets', label: 'Spent Credits', value: spentCredits, worth: spentCreditsWorth },
  ];

  const baseWorth = breakdown.reduce((sum, r) => sum + (Number(r.worth) || 0), 0);
  const afterSub = baseWorth + baseWorth * (worthBoostPercent / 100);
  const totalWorth = perkHasActive
    ? (afterSub * (100 + perkEffectStrength)) / 100
    : afterSub;

  const combinedBoostPercent = baseWorth > 0 ? ((totalWorth / baseWorth) - 1) * 100 : 0;
  return {
    totalWorth,
    worthBoostPercent: combinedBoostPercent,
    breakdown,
    cityWinners,
    businessOwned,
    subscription: {
      planType,
      startedAt,
      isActive,
      label: subscriptionLabel,
      boostPercent: worthBoostPercent,
    },
    perkWorthBooster: {
      categoryId: boosterWorthPerkCategoryId,
      hasActivePerk: perkHasActive,
      effectStrength: perkEffectStrength,
      duration: Number((perkInfo as any)?.duration ?? 0),
      remainingDuration: Number((perkInfo as any)?.remainingDuration ?? 0),
      slotIndex: Number((perkInfo as any)?.slotIndex ?? 0),
    },
  };
}

export const MafiaWorth = { computeWorth };

