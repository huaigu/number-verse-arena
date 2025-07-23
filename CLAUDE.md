# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web3 frontend for a Unique Number Game built with React, TypeScript, and blockchain integration. The game implements a privacy-preserving system where players select numbers that remain encrypted on-chain until game completion. Players win rewards by choosing unique numbers that no other player selected.

**Key Technologies:**
- Frontend: React 18 + TypeScript + Vite
- Web3: Wagmi + RainbowKit for wallet integration
- UI: shadcn/ui components + Tailwind CSS
- Blockchain: Designed for Zama FHE (Fully Homomorphic Encryption) integration
- Network: Currently configured for Sepolia testnet

## Development Commands

```bash
# Development
npm run dev          # Start development server with hot reload
npm run dev          # Alternative: vite (same as npm run dev)

# Build
npm run build        # Production build
npm run build:dev    # Development build with debug info
npm run preview      # Preview production build locally

# Code Quality
npm run lint         # Run ESLint for code linting
```

## Architecture Overview

### Application Structure
- **Single Page Application** with React Router for navigation
- **Context Providers**: WagmiProvider → QueryClientProvider → RainbowKitProvider → TooltipProvider
- **State Management**: React hooks (useState) with local state per component
- **Web3 Integration**: Wagmi for blockchain interactions, RainbowKit for wallet connection UI

### Key Pages & Components
1. **LandingPage** (`/`) - Main entry point and room discovery
2. **CreateRoom** (`/create-room`) - Game room creation with customizable settings
3. **JoinRoom** (`/join-room`) - Join existing game rooms
4. **GamePage** (`/game`) - Main game interface with number selection
5. **NotFound** - 404 fallback

### Web3 Integration Patterns

**Wallet Connection:**
- Uses RainbowKit's `<ConnectButton />` for wallet connection UI
- `useAccount()` hook provides connection status and wallet address
- All game actions require wallet connection

**Game State Management:**
- Currently uses mock data for development/testing
- Designed for smart contract integration with encrypted number storage
- Player selections stored as encrypted values on-chain
- Game results revealed only after completion

**Blockchain Configuration:**
```typescript
// src/config/wagmi.ts
- Configured for Sepolia testnet
- Uses RainbowKit default configuration
- Project ID placeholder needs replacement
```

### Component Architecture

**UI Components:**
- Built on shadcn/ui foundation with customizations
- `GameCard` - Specialized for number selection grid
- `GradientButton` - Custom styled buttons with game theming
- Standard components: Card, Badge, Avatar, Input, Slider, etc.

**Game Logic Components:**
- Number grid generation (configurable range)
- Player state tracking (connected players, selections)
- Time-based game progression
- Entry fee and reward calculations

### Privacy & Encryption Design

The application is structured to support FHE (Fully Homomorphic Encryption):
- Player number selections intended to be encrypted client-side
- Smart contract stores encrypted values only
- Game resolution happens after all players commit
- Winners determined by unique number selection logic

## Development Patterns

### State Management
- Component-level state with React hooks
- No global state management (Redux, Zustand) currently implemented
- Web3 state managed through Wagmi hooks

### Styling Approach
- Tailwind CSS with custom design system
- CSS custom properties for theming
- Gradient backgrounds and glass-morphism effects
- Responsive design with mobile-first approach

### Error Handling
- Toast notifications using sonner
- Wallet connection validation before game actions
- Form validation for room creation
- Network error handling through Wagmi

### Mock Data Strategy
Current implementation uses mock data for:
- Game rooms and player information
- Number selections and game state
- Player avatars and wallet addresses
- Timer and game progression

This mock data structure provides clear interfaces for smart contract integration.

## Smart Contract Integration Points

**Expected Integration Areas:**
1. **Room Creation** - CreateRoom component needs contract deployment calls
2. **Game Joining** - JoinRoom needs contract interaction for room discovery
3. **Number Selection** - GamePage needs encrypted number submission
4. **Game Resolution** - Automatic winner determination and reward distribution
5. **Player Management** - Real-time player state synchronization

**Data Structures Ready for Blockchain:**
- Room settings (maxPlayers, numberRange, entryFee, timeLimit)
- Player selections (encrypted until reveal)
- Game state transitions (waiting → active → completed)
- Winner calculation and reward distribution

## File Structure Key Areas

```
src/
├── components/ui/          # shadcn/ui components + custom components
├── config/wagmi.ts        # Web3 configuration (needs project ID)
├── hooks/                 # Custom React hooks
├── lib/utils.ts          # Utility functions
├── pages/                # Main application pages
└── main.tsx              # Application entry point
```

## Known Development Notes

- `wagmi.ts` contains placeholder PROJECT_ID that needs real WalletConnect project ID
- Mock data throughout components should be replaced with smart contract calls
- Responsive design optimized for both desktop and mobile gameplay
- Toast notifications provide user feedback for all major actions
- Time-based gameplay requires careful state synchronization with blockchain

## Testing Considerations

When implementing tests, focus on:
- Web3 connection flow testing
- Game state transitions
- Number selection validation
- Responsive UI behavior
- Mock data replacement verification