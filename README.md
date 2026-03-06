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

## Browser bundle (script tag)

Build all browser bundles:

```bash
npm run build:browser
```

Produces:
- `dist/mafia-inventory.js` – `window.MafiaInventory`
- `dist/mafia-profile.js` – `window.MafiaProfile`
- `dist/mafia-utils.js` – unified (sets `window.MafiaInventory` and `window.MafiaProfile`)

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
</script>
```

**Standalone bundles** (smaller, load one contract): Use `mafia-inventory.js` or `mafia-profile.js`; each sets its own `window.MafiaInventory` or `window.MafiaProfile`.

**Options:** `chain`, `contractAddress` (optional override), `rpcUrl`, `onProgress`

Test: Run `npm run build:browser`, then `npx serve .` and open `browser-example.html`.

**Types:** Copy `mafia-utils.d.ts` (or `mafia-inventory.d.ts` for inventory only) for TypeScript support.

---

## Project Structure

```
src/
  contracts/               # Registry (single source of truth)
    registry.ts            # Addresses & ABIs for all contracts
  core/                    # Shared infrastructure
    chains.ts              # BNB & PulseChain client
    readContract.ts        # Generic read helpers
  config/                  # Re-exports from registry (backward compat)
  types/                   # Shared types
  constants/               # Static data
  features/                # Feature modules
    mafia-inventory/       # getItemsByCategory
    mafia-profile/         # getUsersInfo
  cli/                     # CLI entry points
  browser/                 # Browser bundles
    shared.ts              # Client, chains, RPC (browser-safe)
    mafia-inventory.ts
    mafia-profile.ts
    index.ts               # Unified entry (assigns window.Mafia*)
  abis/                    # Contract ABIs (JSON)
  index.ts                 # Library re-exports
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
