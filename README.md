# BNB Mafia IFPS Support

Node.js project for reading contract values on **BNB Smart Chain** and **PulseChain** using [viem](https://viem.sh).

## Setup

```bash
npm install
npm run build
```

## Quick Test

Verify connectivity to both chains:

```bash
npm start
```

Or run without building (using tsx):

```bash
npm run dev
```

Test chains individually:

```bash
npm run read:bnb
npm run read:pulse
```

## Fetch Items by Category

```bash
npm run get-items <categoryId>
# Example: npm run get-items 15
```

## Fetch User Profiles (MafiaProfile)

```bash
npm run get-users-info bnb
npm run get-users-info pulse
```

## Fetch OTC Offers (MafiaExchange)

```bash
npm run get-otc-offers bnb 0 20
npm run get-otc-offers pulse 0 20
```

## Fetch Liquidity Positions (MafiaDeposit)

Feature API defaults to fetching all listings, with optional range support:

```ts
import { getLiquidityPositions } from './src/features/index.js';

// Fetch all liquidity listings
const all = await getLiquidityPositions({ chain: 'pulse' });

// Fetch a specific range
const page = await getLiquidityPositions({ chain: 'bnb', startIndex: 0, length: 500 });
```

CLI usage:

```bash
# Uses registry address for chain
npx tsx src/cli/get-liquidity-positions.ts pulse 0 500

# Custom contract address override
npx tsx src/cli/get-liquidity-positions.ts pulse 0xYourDepositContract 0 500
```

## Adding a New Contract (Scalable)

1. **Add ABI** in `src/abis/YourContract.json`
2. **Register in `src/contracts/registry.ts`:**

```typescript
import yourContractAbi from '../abis/YourContract.json' with { type: 'json' };

// In CONTRACTS:
YourContract: {
  addresses: { bnb: '0x...', pulse: '0x...' },
  abi: yourContractAbi as Abi,
},
```

3. **Create feature** in `src/features/your-contract/` (or use `readContract` with registry)
4. **Add browser module** in `src/browser/your-contract.ts` and add to `esbuild.config.js` BROWSER_BUNDLES
5. **Add CLI** in `src/cli/` and npm script if needed

## Environment Variables (optional)

| Variable | Description |
|----------|-------------|
| `CONTRACT_ADDRESS` | Override default contract address |
| `BNB_RPC_URL` | Custom BNB RPC (default: `https://bsc-dataseed.binance.org/`) |
| `PULSE_RPC_URL` | Custom PulseChain RPC (default: `https://rpc.pulsechain.com`) |

## Supported Chains

- **BNB Smart Chain** (chainId: 56) – `bsc` from viem/chains
- **PulseChain** (chainId: 369) – `pulsechain` from viem/chains

## All Features

Current feature APIs exported from `src/features/index.ts`:

- `getItemsByCategory` (MafiaInventory)
- `getUsersInfo` (MafiaProfile)
- `getFamilies` (MafiaFamily)
- `getPlayersInfo` (MafiaFamily)
- `getFamiliesWithPlayers` (MafiaFamily)
- `getSlots` (MafiaMap)
- `getLandSlotsByOwner` (MafiaMap)
- `getSlotsByCities` (MafiaMap)
- `getXpListings` (XpMarket)
- `getInventoryMarketplaceActiveListings` (MafiaInventoryMarketplace)
- `getRaces` (MafiaRaceLobby)
- `getOTCOffers` (MafiaExchange)
- `getLiquidityPositions` (MafiaDeposit)

Browser `window.*` modules available in unified `dist/mafia-utils.js` include:

- `window.MafiaInventory`
- `window.MafiaProfile`
- `window.MafiaFamily`
- `window.MafiaMap`
- `window.MafiaExchange`
- `window.MafiaDeposit`
- `window.XpMarket`
- `window.MafiaInventoryMarketplace`
- `window.MafiaRaceLobby`
- `window.MafiaRankXp`
- `window.MafiaRaceXp`
- `window.MafiaKillSkill`
- `window.BustOutSkill`
- `window.MafiaEquipment`
- `window.MafiaBullet`
- `window.MafiaGameBank`
- `window.MafiaHelperCredit`
- `window.MafiaToken`
- `window.MafiaWorth`
- `window.MafiaPlayerSubscription`
- `window.MafiaPerkManager`

## Browser bundle (script tag)

Build all browser bundles:

```bash
npm run build:browser
```

Produces:
- `dist/mafia-inventory.js` – `window.MafiaInventory`
- `dist/mafia-profile.js` – `window.MafiaProfile`
- `dist/mafia-utils.js` – unified (sets `window.MafiaInventory`, `window.MafiaProfile`, `window.MafiaFamily`, `window.MafiaMap`, `window.MafiaExchange`, `window.MafiaDeposit`, and other modules)

**Unified bundle (recommended):**

```html
<script src="dist/mafia-utils.js" defer></script>
<script>
  const items = await window.MafiaInventory.getItemsByCategory({
    chain: 'bnb',
    categoryId: 15,
    maxItems: 5000,
    onProgress: (info) => console.log(info.fetched, 'items'),
  });

  const users = await window.MafiaProfile.getUsersInfo({
    chain: 'bnb',
    maxUsers: 5000,
    onProgress: (info) => console.log(info.fetched, 'users'),
  });

  const liquidity = await window.MafiaDeposit.getLiquidityPositions({
    chain: 'pulse', // fetches all by default
  });
  console.log('liquidity listings:', liquidity.length);
</script>
```

**Standalone bundles** (smaller, load one contract): Use `mafia-inventory.js` or `mafia-profile.js`; each sets its own `window.MafiaInventory` or `window.MafiaProfile`.

**Options:** depend on module, commonly `chain`, `contractAddress` (optional override), `rpcUrl`, `startIndex`, `length`, `onProgress`

Test: Run `npm run build:browser`, then `npx serve .` and open `browser-example.html` (includes the `MafiaDeposit` cash swap liquidity card).

**Types:** Copy `mafia-utils.d.ts` (or `mafia-inventory.d.ts` for inventory only) for TypeScript support.

---

## Project Structure

```
src/
  contracts/               # Registry (single source of truth)
    registry.ts            # Addresses & ABIs for all contracts
    index.ts
  core/                    # Shared infrastructure
    chains.ts              # BNB & PulseChain client
    readContract.ts        # Generic read helpers
    index.ts
  config/                  # Re-exports from registry (backward compat)
    contracts.ts
    index.ts
  abis/                    # Contract ABIs (JSON)
  types/                   # Shared types
    index.ts
  constants/               # Static data
    cars.ts
    itemCategories.ts
  utils/
    units.ts
  features/                # Feature modules
    index.ts               # Public feature exports
    mafia-inventory/       # getItemsByCategory, getAllItemsByOwner
    mafia-profile/         # getUsersInfo
    mafia-family/          # getFamilies, getPlayersInfo, getFamiliesWithPlayers
    mafia-map/             # getSlots, getLandSlotsByOwner, getSlotsByCities
    mafia-exchange/        # getOTCOffers
    inventory-marketplace/ # getActiveListings
    race-lobby/            # getRaces
    xp-market/             # getListings
    mafia-deposit/         # getLiquidityPositions (all listings + ranged)
  cli/                     # CLI entry points
    index.ts
    get-items.ts
    get-all-items-by-owner.ts
    get-users-info.ts
    get-families.ts
    get-slots.ts
    get-land-slots-by-owner.ts
    get-otc-offers.ts
    get-xp-listings.ts
    get-inventory-marketplace-active-listings.ts
    get-races.ts
    get-liquidity-positions.ts
  browser/                 # Browser bundles
    shared.ts              # Client, chains, RPC (browser-safe)
    index.ts               # Unified entry (assigns window.Mafia*)
    mafia-inventory.ts
    mafia-profile.ts
    mafia-family.ts
    mafia-map.ts
    mafia-exchange.ts
    inventory-marketplace.ts
    race-lobby.ts
    xp-market.ts
    mafia-deposit.ts
    mafia-rank-xp.ts
    mafia-race-xp.ts
    mafia-kill-skill.ts
    bust-out-skill.ts
    mafia-equipment.ts
    mafia-bullet.ts
    mafia-game-bank.ts
    mafia-helper-credit.ts
    mafia-token.ts
    mafia-player-subscription.ts
    mafia-perk-manager.ts
    worth.ts
  index.ts                 # Library root exports
dist/
  mafia-inventory.js       # Standalone bundle
  mafia-profile.js         # Standalone bundle
  mafia-utils.js           # Unified bundle
esbuild.config.js          # Browser build config (add bundles here)
browser-example.html       # Demo page
```

### Extending the project

- **New contract:** Add to `contracts/registry.ts`, ABI in `abis/`
- **New feature:** Create `features/<name>/` with domain logic
- **New CLI command:** Add `cli/<command>.ts` and npm script
- **New browser module:** Add `browser/<name>.ts` and entry in `esbuild.config.js` BROWSER_BUNDLES
