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

## Adding Your Contract

1. **Update `src/config/contracts.ts`:**
   - Set `CONTRACT_ADDRESSES` for each chain
   - Add ABI imports if using a new contract

2. **Read values in code:**

```typescript
import { readOnBnb, readOnPulse, getItemsByCategory } from 'bnbmafia-ifps-support';

const valueOnBnb = await readOnBnb('yourFunctionName', [arg1, arg2]);
const items = await getItemsByCategory(15);
```

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

Build a single JS file for use in HTML:

```bash
npm run build:browser
```

Load in HTML:

```html
<script src="mafia-inventory.js" defer></script>
<script>
  const items = await window.MafiaInventory.getItemsByCategory({
    chain: 'bnb',
    contractAddress: '0x2CB8352Be090846d4878Faa92825188D7bf50654',
    categoryId: 15,
    maxItems: 5000,
    onProgress: (info) => console.log(info.fetched, 'items'),
  });
</script>
```

**Options:** `chain`, `contractAddress`, `categoryId`, `maxItems`, `rpcUrl`, `onProgress`

**Note:** `getItemsByCategory` exists only on BNB (MafiaInventory). PulseChain does not support it.

Test: Run `npm run build:browser`, then `npx serve .` and open `browser-example.html`.

**Types:** Copy `mafia-inventory.d.ts` to your project for TypeScript support.

---

## Project Structure

```
src/
  core/                    # Shared infrastructure
    chains.ts              # BNB & PulseChain client
    readContract.ts        # Generic read helpers
  config/                  # Configuration
    contracts.ts           # Addresses & ABIs per chain
  types/                   # Shared types
    CarType.ts
  constants/               # Static data
    cars.ts                # Car list (categoryId 15)
  features/                # Feature modules
    mafia-inventory/       # getItemsByCategory, car enrichment
  cli/                     # CLI entry points
    index.ts               # Connectivity test
    get-items.ts           # get-items command
  browser/                 # Browser bundle
    mafia-inventory.ts
  abis/                    # Contract ABIs (JSON)
  index.ts                 # Library re-exports
dist/
  mafia-inventory.js       # Browser bundle
browser-example.html       # Demo page
```

### Extending the project

- **New contract:** Add config in `config/contracts.ts`, ABI in `abis/`
- **New feature:** Create `features/<name>/` with domain logic
- **New CLI command:** Add `cli/<command>.ts` and npm script
- **New browser module:** Add `browser/<name>.ts` and build script
