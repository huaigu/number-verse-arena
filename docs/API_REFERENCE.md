# API 参考文档

本文档详细介绍UniqueNumberGameFactory智能合约的所有可用方法和事件。

## 📋 合约接口概览

### 核心功能
- ✅ **游戏创建** - `createGame()`
- ✅ **数字提交** - `submitNumber()`
- ✅ **触发开奖** - `findWinnerByDeadline()`
- ✅ **领取奖金** - `claimPrize()`

### 查询功能
- ✅ **游戏发现** - `getAllGames()`, `getActiveGames()`
- ✅ **游戏详情** - `getGameSummary()`
- ✅ **玩家统计** - `getPlayerStats()`
- ✅ **排行榜** - `getLeaderboard()`

## 🔧 核心函数

### `createGame()`

创建一个新的游戏房间。

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

**参数：**
- `_roomName`: 房间名称 (1-64字符)
- `_minNumber`: 数字范围下限 (>0)
- `_maxNumber`: 数字范围上限 (>_minNumber)
- `_maxPlayers`: 最大玩家数 (≥2)
- `_entryFee`: 参与费用 (wei)
- `_deadlineDuration`: 游戏时长 (秒)

**限制：**
- 房间名称长度: 1-64字符
- 数字范围: _maxNumber - _minNumber < 256 (FHE效率限制)
- 最小玩家数: 2人

**事件：**
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

提交加密的数字参与游戏。

```solidity
function submitNumber(
    uint256 _gameId,
    externalEuint32 _encryptedNumber,
    bytes calldata inputProof
) public payable
```

**参数：**
- `_gameId`: 游戏ID
- `_encryptedNumber`: FHE加密的数字
- `inputProof`: 零知识证明

**要求：**
- 游戏状态为Open
- 未超过截止时间
- 发送正确的参与费用
- 玩家未曾参与此游戏

**事件：**
```solidity
event SubmissionReceived(
    uint256 indexed gameId,
    address indexed player,
    uint32 playerCount
);
```

### `findWinnerByDeadline()`

在截止时间后手动触发开奖。

```solidity
function findWinnerByDeadline(uint256 _gameId) public
```

**要求：**
- 游戏状态为Open
- 已超过截止时间
- 至少有1个参与者

### `claimPrize()`

获胜者领取奖金。

```solidity
function claimPrize(uint256 _gameId) public
```

**要求：**
- 游戏状态为Finished
- 调用者是获胜者
- 奖金池有余额

## 📊 查询函数

### 游戏发现

#### `getAllGames()`
```solidity
function getAllGames() external view returns (Game[] memory)
```
返回所有游戏的完整信息。

#### `getActiveGames()`
```solidity
function getActiveGames() external view returns (Game[] memory)
```
返回状态为Open的活跃游戏。

#### `getGamesByStatus()`
```solidity
function getGamesByStatus(GameStatus status) external view returns (Game[] memory)
```
根据指定状态筛选游戏。

#### `getGamesWithPagination()`
```solidity
function getGamesWithPagination(uint256 offset, uint256 limit) external view returns (Game[] memory)
```
分页获取游戏列表。

### 游戏详情

#### `getGameSummary()`
```solidity
function getGameSummary(uint256 gameId) external view returns (GameSummary memory)
```
获取游戏的详细摘要信息，包括奖池、获胜者等。

**返回结构：**
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
检查游戏是否可以开始开奖流程。

### 玩家相关

#### `getPlayerGames()`
```solidity
function getPlayerGames(address player) external view returns (uint256[] memory)
```
获取玩家参与的所有游戏ID。

#### `getPlayerStats()`
```solidity
function getPlayerStats(address player) external view returns (PlayerStats memory)
```
获取玩家的统计信息。

**返回结构：**
```solidity
struct PlayerStats {
    uint256 gamesPlayed;
    uint256 gamesWon;
    uint256 totalWinnings;
}
```

### 排行榜与历史

#### `getLeaderboard()`
```solidity
function getLeaderboard(uint256 limit) external view returns (
    address[] memory topPlayers,
    uint256[] memory winCounts,
    uint256[] memory totalWinnings
)
```
获取按获胜次数排序的排行榜。

#### `getWinnerHistory()`
```solidity
function getWinnerHistory(uint256 limit) external view returns (WinnerRecord[] memory)
```
获取获胜历史记录（按时间倒序）。

**返回结构：**
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
获取获胜记录总数。

#### `getTotalGamesCount()`
```solidity
function getTotalGamesCount() external view returns (uint256)
```
获取游戏总数。

## 📋 状态变量

### 公开可读的映射

```solidity
uint256 public gameCounter;
mapping(uint256 => Game) public games;
mapping(uint256 => mapping(address => bool)) public hasPlayerSubmitted;
mapping(uint256 => uint256) public gamePots;
mapping(uint256 => address) public gameWinners;
WinnerRecord[] public winnerHistory;
```

## 🏷️ 数据结构

### GameStatus枚举
```solidity
enum GameStatus {
    Open,        // 0 - 游戏开放，可以参与
    Calculating, // 1 - 正在计算获胜者
    Finished,    // 2 - 游戏结束，可领奖
    PrizeClaimed // 3 - 奖金已领取
}
```

### Game结构体
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

## 🎯 事件

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

## ⚠️ 错误处理

### 常见错误消息

- `"Invalid room name length"` - 房间名称长度不合法
- `"Invalid number range"` - 数字范围设置错误
- `"Max players must be at least 2"` - 最大玩家数小于2
- `"Range is too large for efficient FHE"` - 数字范围超过FHE效率限制
- `"Game is not open"` - 游戏不在开放状态
- `"Game has passed deadline"` - 游戏已超过截止时间
- `"Incorrect entry fee"` - 参与费用不正确
- `"Player has already submitted"` - 玩家已经参与过
- `"Game does not exist"` - 游戏不存在
- `"You are not the winner"` - 不是获胜者
- `"Prize already claimed or no prize"` - 奖金已领取或无奖金

## 📊 Gas消耗估算

| 函数 | 预估Gas消耗 | 说明 |
|------|------------|------|
| `createGame()` | ~200K-500K | 取决于数字范围大小 |
| `submitNumber()` | ~150K-300K | FHE操作消耗较高 |
| `findWinnerByDeadline()` | ~300K-800K | 取决于参与人数 |
| `claimPrize()` | ~50K-80K | 简单转账操作 |
| 查询函数 | 0 Gas | 只读操作 |

## 🔗 相关资源

- [Solidity文档](https://docs.soliditylang.org/)
- [Zama FHE文档](https://docs.zama.ai/fhevm)
- [以太坊开发者文档](https://ethereum.org/developers/)