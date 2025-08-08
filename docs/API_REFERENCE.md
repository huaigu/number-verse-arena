# API Reference Documentation

This document provides detailed information about all available methods and events of the UniqueNumberGameFactory smart contract.

## 📋 Contract Interface Overview

### Core Functions
- ✅ **Game Creation** - `createGame()`
- ✅ **Number Submission** - `submitNumber()`
- ✅ **Winner Determination** - `findWinnerByDeadline()`
- ✅ **Prize Claiming** - `claimPrize()`

### Query Functions
- ✅ **Game Discovery** - `getAllGames()`, `getActiveGames()`
- ✅ **Game Details** - `getGameSummary()`
- ✅ **Player Statistics** - `getPlayerStats()`
- ✅ **Leaderboard** - `getLeaderboard()`

## 🔧 Core Functions

### `createGame()`

Creates a new game room.

```solidity
function createGame(
    string calldata _roomName,
    uint32 _minNumber,
    uint32 _maxNumber, 
    uint32 _maxPlayers,
    uint256 _entryFee,
    uint256 _deadlineDuration
) public
```

**Parameters:**
- `_roomName`: Room name (1-64 characters)
- `_minNumber`: Lower bound of number range (>0)
- `_maxNumber`: Upper bound of number range (>_minNumber)
- `_maxPlayers`: Maximum number of players (≥2)
- `_entryFee`: Entry fee (in wei)
- `_deadlineDuration`: Game duration (in seconds)

**Constraints:**
- Room name length: 1-64 characters
- Number range: _maxNumber - _minNumber < 256 (FHE efficiency limit)
- Minimum players: 2

**Event:**
```solidity
event GameCreated(
    uint256 indexed gameId,
    address indexed creator,
    string roomName,
    uint256 entryFee,
    uint32 maxPlayers,
    uint256 deadline
);
```

### `submitNumber()`

Submits an encrypted number to participate in the game.

```solidity
function submitNumber(
    uint256 _gameId,
    externalEuint32 _encryptedNumber,
    bytes calldata inputProof
) public payable
```

**Parameters:**
- `_gameId`: Game ID
- `_encryptedNumber`: FHE-encrypted number
- `inputProof`: Zero-knowledge proof

**Requirements:**
- Game status must be Open
- Game must not have passed deadline
- Correct entry fee must be sent
- Player must not have already participated in this game

**Event:**
```solidity
event SubmissionReceived(
    uint256 indexed gameId,
    address indexed player,
    uint32 playerCount
);
```

### `findWinnerByDeadline()`

Manually triggers winner determination after deadline.

```solidity
function findWinnerByDeadline(uint256 _gameId) public
```

**Requirements:**
- Game status must be Open
- Game must have passed deadline
- Must have at least 1 participant

### `claimPrize()`

Winner claims the prize.

```solidity
function claimPrize(uint256 _gameId) public
```

**Requirements:**
- Game status must be Finished
- Caller must be the winner
- Prize pool must have balance

## 📊 Query Functions

### Game Discovery

#### `getAllGames()`
```solidity
function getAllGames() external view returns (Game[] memory)
```
Returns complete information for all games.

#### `getActiveGames()`
```solidity
function getActiveGames() external view returns (Game[] memory)
```
Returns all games with Open status.

#### `getGamesByStatus()`
```solidity
function getGamesByStatus(GameStatus status) external view returns (Game[] memory)
```
Filters games by specified status.

#### `getGamesWithPagination()`
```solidity
function getGamesWithPagination(uint256 offset, uint256 limit) external view returns (Game[] memory)
```
Returns paginated game list.

### Game Details

#### `getGameSummary()`
```solidity
function getGameSummary(uint256 gameId) external view returns (GameSummary memory)
```
Gets detailed game summary including prize pool, winner, etc.

**Return Structure:**
```solidity
struct GameSummary {
    uint256 gameId;
    string roomName;
    address creator;
    GameStatus status;
    uint32 playerCount;
    uint32 maxPlayers;
    uint32 minNumber;
    uint32 maxNumber;
    uint256 entryFee;
    uint256 deadline;
    uint256 prizePool;
    address winner;
    uint32 winningNumber;
}
```

#### `canFinalizeGame()`
```solidity
function canFinalizeGame(uint256 gameId) external view returns (bool)
```
Checks if game can start winner determination process.

### Player Functions

#### `getPlayerGames()`
```solidity
function getPlayerGames(address player) external view returns (uint256[] memory)
```
Gets all game IDs that a player has participated in.

#### `getPlayerStats()`
```solidity
function getPlayerStats(address player) external view returns (PlayerStats memory)
```
Gets player statistics.

**Return Structure:**
```solidity
struct PlayerStats {
    uint256 gamesPlayed;
    uint256 gamesWon;
    uint256 totalWinnings;
}
```

### Leaderboard & History

#### `getLeaderboard()`
```solidity
function getLeaderboard(uint256 limit) external view returns (
    address[] memory topPlayers,
    uint256[] memory winCounts,
    uint256[] memory totalWinnings
)
```
Gets leaderboard sorted by win count.

#### `getWinnerHistory()`
```solidity
function getWinnerHistory(uint256 limit) external view returns (WinnerRecord[] memory)
```
Gets winner history records (sorted by timestamp descending).

**Return Structure:**
```solidity
struct WinnerRecord {
    uint256 gameId;
    string roomName;
    address winner;
    uint32 winningNumber;
    uint256 prize;
    uint256 timestamp;
}
```

#### `getWinnerHistoryCount()`
```solidity
function getWinnerHistoryCount() external view returns (uint256)
```
Gets total count of winner records.

#### `getTotalGamesCount()`
```solidity
function getTotalGamesCount() external view returns (uint256)
```
Gets total number of games.

## 📋 State Variables

### Public Readable Mappings

```solidity
uint256 public gameCounter;
mapping(uint256 => Game) public games;
mapping(uint256 => mapping(address => bool)) public hasPlayerSubmitted;
mapping(uint256 => uint256) public gamePots;
mapping(uint256 => address) public gameWinners;
WinnerRecord[] public winnerHistory;
```

## 🏷️ Data Structures

### GameStatus Enum
```solidity
enum GameStatus {
    Open,        // 0 - Game is open for participation
    Calculating, // 1 - Calculating winner
    Finished,    // 2 - Game finished, prize claimable
    PrizeClaimed // 3 - Prize has been claimed
}
```

### Game Struct
```solidity
struct Game {
    uint256 gameId;
    address creator;
    GameStatus status;
    string roomName;
    uint32 minNumber;
    uint32 maxNumber;
    uint32 maxPlayers;
    uint256 entryFee;
    uint256 deadline;
    uint32 playerCount;
    euint32 encryptedWinner;
    uint32 decryptedWinner;
}
```

## 🎯 Events

### GameCreated
```solidity
event GameCreated(
    uint256 indexed gameId,
    address indexed creator,
    string roomName,
    uint256 entryFee,
    uint32 maxPlayers,
    uint256 deadline
);
```

### SubmissionReceived  
```solidity
event SubmissionReceived(
    uint256 indexed gameId,
    address indexed player,
    uint32 playerCount
);
```

### WinnerCalculationStarted
```solidity
event WinnerCalculationStarted(
    uint256 indexed gameId,
    address indexed trigger
);
```

### WinnerDetermined
```solidity
event WinnerDetermined(
    uint256 indexed gameId,
    uint32 winnerNumber,
    address indexed winnerAddress
);
```

### PrizeClaimed
```solidity
event PrizeClaimed(
    uint256 indexed gameId,
    address indexed winner,
    uint256 amount
);
```

## ⚠️ Error Handling

### Common Error Messages

- `"Invalid room name length"` - Room name length is invalid
- `"Invalid number range"` - Number range setting is incorrect
- `"Max players must be at least 2"` - Maximum players is less than 2
- `"Range is too large for efficient FHE"` - Number range exceeds FHE efficiency limit
- `"Game is not open"` - Game is not in Open status
- `"Game has passed deadline"` - Game has exceeded deadline
- `"Incorrect entry fee"` - Entry fee is incorrect
- `"Player has already submitted"` - Player has already participated
- `"Game does not exist"` - Game does not exist
- `"You are not the winner"` - Not the winner
- `"Prize already claimed or no prize"` - Prize already claimed or no prize available

## 📊 Gas Usage Estimates

| Function | Estimated Gas | Notes |
|----------|--------------|-------|
| `createGame()` | ~200K-500K | Depends on number range size |
| `submitNumber()` | ~150K-300K | FHE operations consume more gas |
| `findWinnerByDeadline()` | ~300K-800K | Depends on number of participants |
| `claimPrize()` | ~50K-80K | Simple transfer operation |
| Query functions | 0 Gas | Read-only operations |

## 🔗 Related Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Zama FHE Documentation](https://docs.zama.ai/fhevm)
- [Ethereum Developer Documentation](https://ethereum.org/developers/)