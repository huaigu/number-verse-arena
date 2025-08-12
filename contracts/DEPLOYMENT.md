# UniqueNumberGameFactory Sepolia Deployment Guide

本指南介绍如何将 UniqueNumberGameFactory 合约部署到 Sepolia 测试网。

## 📋 前置条件

### 1. 环境变量设置

首先设置必要的环境变量：

```bash
# 设置 Hardhat 变量
npx hardhat vars setup

# 推荐方式一：使用私钥 (更安全)
npx hardhat vars set PRIVATE_KEY
# 输入私钥时不包含 0x 前缀

# 方式二：使用助记词
npx hardhat vars set MNEMONIC
# 输入12或24个单词的助记词

# 必需的 API 密钥
npx hardhat vars set INFURA_API_KEY      # Infura API 密钥
npx hardhat vars set ETHERSCAN_API_KEY   # Etherscan API 密钥（用于合约验证）
```

### 2. Sepolia ETH

确保你的钱包有足够的 Sepolia ETH：
- 获取方式: [Sepolia Faucet](https://sepoliafaucet.com/)
- 部署大约需要: 0.01-0.02 ETH

### 3. API 密钥

- **Infura**: 在 [Infura](https://infura.io/) 获取免费 API 密钥
- **Etherscan**: 在 [Etherscan](https://etherscan.io/apis) 获取免费 API 密钥

## 🚀 部署步骤

### 1. 编译合约

```bash
# 清理并编译合约
npm run clean
npm run compile
```

### 2. 部署到 Sepolia

三种部署方式可供选择：

#### 方式一：使用自定义脚本 (推荐)
```bash
npm run deploy:sepolia
```

#### 方式二：使用 Hardhat Deploy 插件
```bash
npm run deploy:hardhat-deploy
```

#### 方式三：直接运行脚本
```bash
npx hardhat run scripts/deploy-sepolia.ts --network sepolia
```

### 部署脚本功能

自定义部署脚本 (`scripts/deploy-sepolia.ts`) 将自动：
- ✅ 检查部署账户余额 (至少 0.01 ETH)
- ✅ 估算 Gas 费用
- ✅ 部署 UniqueNumberGameFactory 合约
- ✅ 验证部署成功并测试基本功能
- ✅ 显示详细的部署摘要
- ✅ 提供 Etherscan 验证命令

Hardhat Deploy 脚本 (`deploy/deploy-game.ts`) 将额外提供：
- ✅ 等待 5 个区块确认
- ✅ 自动 Etherscan 验证
- ✅ FHEVM 兼容性检查

### 3. 验证部署

#### 自动验证
部署脚本会自动进行以下验证：
- 合约初始状态检查 (gameCounter = 0)
- 基本函数调用测试 (getTotalGamesCount)
- 部署成功确认

#### 手动验证
```bash
# 验证合约源码到 Etherscan
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>

# 检查 FHEVM 兼容性 (使用 Hardhat Deploy 方式时)
npx hardhat fhevm:check-fhevm-compatibility --network sepolia --address <CONTRACT_ADDRESS>
```

## 🎮 与合约交互

### 查看可用任务

```bash
npx hardhat --network sepolia --help
```

### 基本操作

```bash
# 1. 创建新游戏
npx hardhat game:create \
  --min 1 \
  --max 10 \
  --players 3 \
  --fee "0.01" \
  --duration 3600 \
  --network sepolia

# 2. 查看游戏信息
npx hardhat game:info --id 0 --network sepolia

# 3. 列出最近的游戏
npx hardhat game:list --count 5 --network sepolia

# 4. 手动触发开奖（截止时间后）
npx hardhat game:calculate --id 0 --network sepolia

# 5. 领取奖金（获胜者）
npx hardhat game:claim --id 0 --network sepolia
```

## 📝 部署示例

### 完整的部署流程示例

```bash
# 1. 设置环境变量 (推荐使用私钥方式)
npx hardhat vars set PRIVATE_KEY        # 输入不含0x前缀的私钥
npx hardhat vars set INFURA_API_KEY     # 输入 Infura API 密钥
npx hardhat vars set ETHERSCAN_API_KEY  # 输入 Etherscan API 密钥

# 2. 编译合约
npm run clean
npm run compile

# 3. 部署合约 (推荐方式)
npm run deploy:sepolia

# 4. 手动验证源码 (如果需要)
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

### 部署输出示例

成功部署后，你会看到类似的输出：

```
Starting UniqueNumberGameFactory deployment to Sepolia...
Deploying with account: 0x1234...
Account balance: 0.1 ETH

Deploying UniqueNumberGameFactory contract...
Estimated gas for deployment: 2,345,678
Transaction hash: 0xabcd...
Waiting for deployment confirmation...

✅ Deployment successful!
Contract address: 0x5678...
Gas used: 2,300,000
Gas price: 20.5 gwei
Transaction cost: 0.047 ETH

🔍 Verifying contract deployment...
Initial game counter: 0
Total games count: 0
✅ Contract is working correctly!

=== DEPLOYMENT SUMMARY ===
Network: Sepolia Testnet
Contract: UniqueNumberGameFactory
Address: 0x5678...
Deployer: 0x1234...
Explorer: https://sepolia.etherscan.io/address/0x5678...

📋 NEXT STEPS:
1. Update frontend contract address in src/contracts/config.ts
2. Verify contract on Etherscan (optional):
   npx hardhat verify --network sepolia 0x5678...
3. Test basic functionality:
   npx hardhat --network sepolia task:create-game --address 0x5678...

⚠️  IMPORTANT: Save the contract address for future use!
```

## ⚠️ 重要注意事项

### FHE 加密差异

**本地测试 vs Sepolia**：
- **本地**: 使用 mock 加密，快速测试
- **Sepolia**: 使用真实 FHE 加密，需要完整的客户端设置

### 数字提交限制

在 Sepolia 上提交加密数字需要：
1. 完整的 FHE 客户端设置
2. 密钥生成和管理
3. 加密输入创建

推荐流程：
1. 在本地完成游戏逻辑测试
2. 在 Sepolia 测试部署和基本功能
3. 集成 FHE 客户端进行完整测试

### Gas 费用

Sepolia 上的操作消耗更多 Gas：
- 合约部署: ~0.01-0.02 ETH
- 创建游戏: ~0.001-0.002 ETH
- FHE 操作: 比普通操作消耗更多

### 网络延迟

Sepolia 操作比本地测试慢：
- 交易确认: 15-30 秒
- 区块时间: ~15 秒
- 解密回调: 可能需要几分钟

## 🔧 故障排除

### 常见错误及解决方案

#### 1. "insufficient balance" / "insufficient funds for gas"
**原因**: 账户余额不足
**解决方案**: 
- 从 [Sepolia Faucet](https://sepoliafaucet.com/) 获取更多测试 ETH
- 检查账户余额：`npx hardhat accounts --network sepolia`

#### 2. "nonce too low" 错误
**原因**: 交易 nonce 冲突
**解决方案**: 
- 等待几分钟后重试
- 检查是否有 pending 交易

#### 3. "gas estimation failed" 错误
**原因**: 合约部署参数错误或网络问题
**解决方案**: 
- 确认合约编译无误：`npm run compile`
- 检查网络连接
- 尝试增加 gas limit

#### 4. "network not supported" 错误
**原因**: 网络配置错误
**解决方案**: 
- 验证 `hardhat.config.ts` 中的 Sepolia 配置
- 检查 Infura API 密钥是否正确

#### 5. "private key not found" / "invalid mnemonic" 错误
**原因**: 私钥或助记词未正确设置
**解决方案**: 
- 重新设置：`npx hardhat vars set PRIVATE_KEY`
- 确保私钥不包含 `0x` 前缀
- 助记词应该是 12 或 24 个单词

#### 6. "Contract verification failed"
**原因**: Etherscan 验证失败
**解决方案**: 
- 检查 Etherscan API 密钥：`npx hardhat vars get ETHERSCAN_API_KEY`
- 等待几个区块后再尝试验证
- 确认网络配置正确

#### 7. "FHEVM compatibility check failed"
**原因**: FHE 兼容性问题
**解决方案**: 
- 确认合约继承了 `SepoliaConfig`
- 检查 `@fhevm/solidity` 库版本

### 调试工具

```bash
# 查看配置的环境变量
npx hardhat vars get PRIVATE_KEY       # 检查私钥是否设置
npx hardhat vars get INFURA_API_KEY    # 检查 Infura API 密钥
npx hardhat vars get ETHERSCAN_API_KEY # 检查 Etherscan API 密钥

# 查看账户信息
npx hardhat accounts --network sepolia # 显示部署账户地址

# 检查网络连接
npx hardhat compile --network sepolia  # 测试网络连接和编译

# 查看部署历史 (如果使用 hardhat-deploy)
npx hardhat deployments --network sepolia

# 启用详细日志输出
DEBUG=* npm run deploy:sepolia
```

## 🔗 有用链接

- [Sepolia Faucet](https://sepoliafaucet.com/) - 获取测试 ETH
- [Sepolia Explorer](https://sepolia.etherscan.io/) - 区块浏览器
- [Infura Dashboard](https://infura.io/dashboard) - API 管理
- [Zama FHEVM Docs](https://docs.zama.ai/fhevm) - FHE 详细文档

## 📊 部署检查清单

### 部署前检查
- [ ] 设置环境变量 (`PRIVATE_KEY` 或 `MNEMONIC`, `INFURA_API_KEY`, `ETHERSCAN_API_KEY`)
- [ ] 获取足够的 Sepolia ETH (至少 0.01 ETH)
- [ ] 合约编译无错误 (`npm run compile`)
- [ ] 网络配置正确 (`hardhat.config.ts`)

### 部署过程检查
- [ ] 部署成功并获得合约地址
- [ ] Gas 费用合理 (通常 0.01-0.02 ETH)
- [ ] 交易在 Sepolia Etherscan 上可见
- [ ] 合约基本功能验证通过

### 部署后检查
- [ ] 合约在 Etherscan 上验证成功 (可选)
- [ ] FHEVM 兼容性检查通过 (使用 hardhat-deploy 时)
- [ ] 可以调用基本查询函数 (`getTotalGamesCount()`)
- [ ] 部署记录和合约地址已保存

### 前端集成检查
- [ ] 更新前端合约地址配置
- [ ] 测试前端与合约的连接
- [ ] 验证基本功能在前端正常工作

**🎉 部署完成！请务必保存合约地址以供后续使用。**

---

## 📋 部署记录模板

```
=== UniqueNumberGameFactory 部署记录 ===
部署日期: [YYYY-MM-DD HH:mm:ss]
网络: Sepolia Testnet
合约名称: UniqueNumberGameFactory
合约地址: [0x...]
部署者地址: [0x...]
交易哈希: [0x...]
区块号: [#...]
Gas 使用量: [gas_used]
Gas 价格: [gas_price] gwei
部署成本: [cost] ETH

验证状态:
✅ 部署成功
✅ 基本功能测试通过
[ ] Etherscan 验证
[ ] 前端集成完成

备注: [任何重要备注]
```