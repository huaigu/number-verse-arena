# UniqueNumberGameFactory 测试使用示例

## 合约功能

UniqueNumberGameFactory 是一个基于 Zama FHE（完全同态加密）的唯一数字游戏合约，允许玩家提交加密的数字，系统将找出最小的唯一数字作为获胜数字。

## 测试覆盖范围

### ✅ 游戏创建 (Game Creation)
- **创建游戏**: 验证游戏参数设置正确
- **参数验证**: 拒绝无效的游戏参数（数字范围、玩家数量、范围大小）
- **游戏计数器**: 多个游戏的ID自动递增

### ✅ 数字提交 (Number Submission)
- **有效提交**: 玩家可以提交加密数字并支付参与费
- **费用验证**: 拒绝错误的参与费金额
- **重复提交**: 防止同一玩家多次提交
- **截止时间**: 超过截止时间后拒绝提交
- **自动开奖**: 达到最大玩家数时自动触发开奖

### ✅ 获胜者计算 (Winner Calculation)
- **手动开奖**: 超过截止时间后可以手动触发开奖
- **时间验证**: 截止时间前拒绝手动开奖
- **玩家验证**: 没有玩家参与时拒绝开奖

### ✅ 奖金分配 (Prize Distribution)
- **奖金池管理**: 正确累积所有玩家的参与费

### ✅ 游戏状态管理 (Game State Management)
- **状态转换**: Open → Calculating → Finished
- **Mock环境**: 在测试环境中状态停留在 Calculating（因为回调函数不会被执行）

### ✅ 事件系统 (Events)
- **GameCreated**: 游戏创建时发出
- **SubmissionReceived**: 收到玩家提交时发出
- **WinnerCalculationStarted**: 开始计算获胜者时发出

## 重要说明

### FHE 权限管理
合约中所有 FHE 操作都正确设置了权限：
- `FHE.allowThis()` 允许合约访问加密值
- 加密数字比较、计算、选择都有适当的权限设置

### Mock 环境限制
在测试环境中：
- 解密回调函数不会被自动调用
- 游戏状态会停留在 `Calculating` 而不是 `Finished`
- 这是正常行为，在实际的 Sepolia 测试网或主网环境中会有完整的解密流程

### 解密流程（生产环境）
1. **第一阶段**: 解密获胜数字
2. **第二阶段**: 解密获胜者索引
3. **完成**: 设置获胜者地址并允许领取奖金

## 运行测试

```bash
# 运行 UniqueNumberGameFactory 测试
npx hardhat test test/UniqueNumberGameFactory.ts

# 运行所有测试
npx hardhat test
```

## 游戏流程示例

```typescript
// 1. 创建游戏
await gameContract.createGame(
  1,    // minNumber
  10,   // maxNumber  
  3,    // maxPlayers
  ethers.parseEther("0.1"), // entryFee
  3600  // deadlineDuration (1 hour)
);

// 2. 玩家提交加密数字
const encryptedNumber = await fhevm
  .createEncryptedInput(contractAddress, playerAddress)
  .add32(5) // 提交数字 5
  .encrypt();

await gameContract
  .connect(player)
  .submitNumber(0, encryptedNumber.handles[0], encryptedNumber.inputProof, {
    value: ethers.parseEther("0.1")
  });

// 3. 自动开奖（达到最大玩家数）或手动开奖（超过截止时间）
await gameContract.findWinnerByDeadline(0);

// 4. 获胜者领取奖金（生产环境中）
await gameContract.connect(winner).claimPrize(0);
```

测试套件全面验证了合约的所有核心功能，确保在 FHE 环境下的正确行为。