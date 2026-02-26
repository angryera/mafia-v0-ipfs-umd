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

## Adding Your Contract

1. **Update `src/config.ts`:**
   - Set `CONTRACT_ADDRESS` to your contract address
   - Add your contract ABI to `CONTRACT_ABI` (read functions only needed)

2. **Read values in code:**

```typescript
import { readOnBnb, readOnPulse } from './src/readContract.js';

// Read on BNB Smart Chain
const valueOnBnb = await readOnBnb('yourFunctionName', [arg1, arg2]);

// Read on PulseChain
const valueOnPulse = await readOnPulse('yourFunctionName', [arg1, arg2]);
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
  chains.ts                  # BNB & PulseChain client setup
  config.ts                  # Contract address & ABI
  readContract.ts            # Contract read helpers
  getItemsByCategory.ts      # Chunked multicall + car enrichment
  mafia-inventory.browser.ts # Browser bundle entry
  constants/cars.ts          # Car list (categoryId 15)
dist/
  mafia-inventory.js         # Browser bundle (npm run build:browser)
browser-example.html         # Demo page for browser bundle
```
