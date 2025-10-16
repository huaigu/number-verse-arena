# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Number Verse Arena is a privacy-preserving multiplayer number guessing game powered by Zama's Fully Homomorphic Encryption (FHE). Players select numbers that remain encrypted on-chain until game completion, ensuring complete privacy and fairness in Web3 gaming.

**Key Technologies:**
- Frontend: React 18 + TypeScript + Vite
- Web3: Wagmi v2 + RainbowKit for wallet integration
- UI: shadcn/ui components + Tailwind CSS
- Privacy: Zama FHE for encrypted number storage and computation
- Blockchain: Sepolia Testnet with Zama FHEVM support
- Contract: `0x6B674fDfC6A70ff1932CfED6F0C53d57e7F4F27a` (UniqueNumberGameFactory)

## Development Commands

```bash
# Development
npm run dev          # Start development server at http://localhost:8080

# Build
npm run build        # Production build
npm run build:dev    # Development build with debug info
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint for code linting

# Smart Contract Testing (in contracts/ submodule)
cd contracts && npm test           # Run contract tests
cd contracts && npx hardhat test   # Alternative test command
```

## Architecture Overview

### Application Structure
- **Single Page Application** with React Router v6
- **Context Providers**: WagmiProvider → QueryClientProvider → RainbowKitProvider → TooltipProvider
- **State Management**: React hooks with local component state (no Redux/Zustand)
- **Routing**: Main routes: `/` (Landing), `/create-room`, `/join-room`, `/game`, `/leaderboard`

### Key Pages
1. **LandingPage** (`/`) - Entry point with demo video and room discovery
2. **CreateRoom** (`/create-room`) - Game room creation (calls `createGame()` contract method)
3. **JoinRoom** (`/join-room`) - Browse and join active games (calls `getAllGames()`, `getActiveGames()`)
4. **GamePage** (`/game`) - Number selection and submission (calls `submitNumber()` with FHE encryption)
5. **Leaderboard** (`/leaderboard`) - Winner history with caching

### Smart Contract Integration

**Contract Configuration** (`src/contracts/config.ts`):
- Factory Address: `0xB1fd5432362aAd52f9B71160cDB9C585A0Ea8577`
- ABI: `src/contracts/UniqueNumberGameFactory.json`
- Network: Sepolia (chainId: 11155111)

**Key Hooks** (`src/hooks/contract/useGameContract.ts`):
- `useCreateGame()` - Create new game room with parameters
- `useGetAllGames()` / `useGetActiveGames()` - Fetch game lists
- `useGetGameSummary(gameId)` - Get specific game details
- `useSubmitNumber()` - Submit encrypted number selection with entry fee
- `useFindWinner()` - Trigger winner calculation after deadline
- `useClaimPrize()` - Claim winnings for won games
- `useHasPlayerSubmitted(gameId, address)` - Check submission status
- `useHasPlayerClaimed(gameId, address)` - Check claim status
- `useCanFinalizeGame(gameId)` - Check if game can be finalized

**Game States** (CONTRACT_CONFIG.GameStatus):
- `Open (0)` - Accepting players
- `Calculating (1)` - Finding winners
- `Finished (2)` - Winners determined
- `PrizeClaimed (3)` - Prizes claimed

### FHE Integration

**Encryption Flow** (`src/lib/fhe.ts`):
1. Initialize FHEVM instance with Zama Relayer SDK (loaded via CDN in index.html)
2. Create encrypted input buffer for contract address and user address
3. Encrypt 32-bit unsigned integer using `add32()` and `encrypt()`
4. Returns `{ encryptedData, inputProof }` as hex strings
5. Submit to contract via `submitNumber(gameId, encryptedData, inputProof)`

**Key Functions:**
- `initializeFHE()` - Initialize Zama SDK and create FHEVM instance
- `getFhevmInstance()` - Get or create FHEVM instance
- `encryptNumber(value, contractAddress, userAddress)` - Encrypt number for submission
- Uses Sepolia FHE config with Zama relayer at `https://relayer.testnet.zama.cloud`

**Privacy Guarantees:**
- Numbers encrypted client-side before blockchain submission
- Smart contract stores only `euint32` encrypted values
- Decryption happens on-chain during winner calculation
- No player (including creator) can see others' selections until reveal

## Development Patterns

### State Management
- Local component state using React hooks (`useState`, `useEffect`)
- Web3 state managed through Wagmi hooks (`useAccount`, `useReadContract`, `useWriteContract`)
- Custom hooks for contract interactions in `src/hooks/contract/`
- Leaderboard caching with `useWinnerCache()` and `useLeaderboardData()`

### Styling
- Tailwind CSS with custom design system
- Custom components: `GameCard` (number grid), `GradientButton` (themed buttons)
- Glass-morphism effects and gradient backgrounds
- Responsive design (mobile-first)
- **Page Container Width**: Use `max-w-page` (1060px) for all main pages
  - Defined in `tailwind.config.ts` as custom maxWidth
  - Applied to: JoinRoom, CreateRoom, Leaderboard, GamePage
  - Alias: `max-w-content` (same 1060px value)

### Error Handling
- Toast notifications via `sonner` library
- Wallet connection validation before all game actions
- Contract error handling with retry logic in hooks
- Network error recovery in `useGetGameSummary()`

### Transaction Flow
1. User initiates action (create game, submit number, claim prize)
2. Hook calls `writeContract()` with contract address, ABI, function, and args
3. `useWaitForTransactionReceipt()` monitors transaction confirmation
4. On success: Parse event logs (e.g., `GameCreated` event) to extract data
5. Update UI state and show success toast

## Project Structure

```
src/
├── components/ui/          # shadcn/ui + custom components (GameCard, GradientButton)
├── pages/                  # Main pages (LandingPage, CreateRoom, JoinRoom, GamePage, Leaderboard)
├── hooks/
│   ├── contract/          # Contract interaction hooks (useGameContract.ts, useStatsContract.ts)
│   ├── useWinnerCache.ts  # Leaderboard caching logic
│   └── useLeaderboardData.ts
├── contracts/
│   ├── config.ts          # Contract address, types, helper functions
│   └── UniqueNumberGameFactory.json  # Contract ABI
├── config/wagmi.ts        # Wagmi config (Sepolia + Zama testnet)
├── lib/
│   ├── fhe.ts            # FHE encryption utilities
│   ├── utils.ts          # General utilities (cn(), etc.)
│   └── leaderboard-utils.ts
└── main.tsx              # App entry point

contracts/                  # Git submodule: Smart contract source
├── contracts/             # Solidity contracts (UniqueNumberGameFactory.sol)
├── deploy/                # Deployment scripts
├── test/                  # Contract tests
└── docs/                  # Contract documentation
```

## Important Implementation Notes

### Wagmi Configuration (`src/config/wagmi.ts`)
- Currently has placeholder `YOUR_PROJECT_ID` for WalletConnect
- Get real Project ID from https://cloud.walletconnect.com
- Configured chains: Sepolia (primary), Zama FHE Testnet (id: 8009)

### FHE SDK Loading
- Zama Relayer SDK loaded via CDN in `index.html` (check `<script>` tags)
- SDK must be loaded before calling `initializeFHE()`
- Global objects checked: `RelayerSDK`, `FHE`, `Zama`, `relayerSDK`, `fhe`
- Manual config fallback if `SepoliaConfig` not found

### Contract Addresses
- **Factory**: `0xB1fd5432362aAd52f9B71160cDB9C585A0Ea8577` (Sepolia)
- Update in `src/contracts/config.ts` if redeploying
- Submodule `contracts/` contains source code and deployment scripts

### Game Lifecycle
1. **Create**: `createGame()` → emits `GameCreated(gameId)` event
2. **Join**: Players call `submitNumber()` with encrypted value + entry fee
3. **Deadline**: When time expires or all players join
4. **Finalize**: Anyone calls `findWinnerByDeadline()` → triggers FHE decryption
5. **Claim**: Winners call `claimPrize()` to receive ETH

### Testing
- Frontend: Manual testing with Sepolia testnet and MetaMask
- Contracts: `cd contracts && npm test` for Hardhat test suite
- FHE encryption: Test with small numbers (1-100) first
- Monitor gas costs for FHE operations (higher than standard txs)

## Documentation

Key docs in `docs/`:
- `API_REFERENCE.md` - Contract methods and events
- `GAME_FLOW.md` - Complete game mechanics
- `CONTRACT_INTEGRATION.md` - Frontend integration guide
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `TESTING_PLAN.md` - Test strategy

Contract docs in `contracts/docs/`:
- `game-flow.md` - Contract-level game logic
- `DEPLOYMENT.md` - Contract deployment

提交代码的comment总是用英文，不要太复杂，简洁清晰。
- 任何涉及UI的修改，包括Html元素和使用代码控制UI元素的显示，文字部分都要实现中英双语，默认英语