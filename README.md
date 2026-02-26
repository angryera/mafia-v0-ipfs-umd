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

## Project Structure

```
src/
  chains.ts      # BNB & PulseChain client setup
  config.ts      # Contract address & ABI (add yours here)
  readContract.ts # Contract read helpers
  index.ts       # Entry point / connectivity test
dist/            # Compiled output (npm run build)
```
