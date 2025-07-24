# 部署指南

本文档提供了Number Verse Arena项目的完整部署说明，包括智能合约部署和前端应用部署。

## 🏗️ 项目架构

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Frontend (React)  │───▶│  Smart Contract      │───▶│   Zama FHE Network  │
│   - React + Vite    │    │  - UniqueNumberGame  │    │   - FHE Operations  │
│   - Wagmi + RainKit │    │  - View Functions    │    │   - Decryption      │
│   - TypeScript      │    │  - Event Logs        │    │   - Privacy Layer   │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
```

## 🚀 合约部署

### 环境准备

1. **安装依赖**
   ```bash
   cd zama-unique-number-game-contract
   npm install
   ```

2. **环境变量配置**
   
   创建 `.env` 文件：
   ```bash
   # 私钥（不要上传到GitHub）
   PRIVATE_KEY=your_private_key_here
   
   # 网络RPC URLs
   SEPOLIA_RPC_URL=https://rpc.sepolia.org
   ZAMA_TESTNET_RPC_URL=https://devnet.zama.ai
   
   # Etherscan API (可选，用于验证合约)
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

3. **更新Hardhat配置**
   
   确保 `hardhat.config.ts` 包含正确的网络配置：
   ```typescript
   const config: HardhatUserConfig = {
     networks: {
       sepolia: {
         url: process.env.SEPOLIA_RPC_URL,
         accounts: [process.env.PRIVATE_KEY!],
       },
       zamaTestnet: {
         url: process.env.ZAMA_TESTNET_RPC_URL,
         accounts: [process.env.PRIVATE_KEY!],
         chainId: 8009, // 实际的Zama测试网链ID
       },
     },
     // ... 其他配置
   };
   ```

### 部署步骤

1. **编译合约**
   ```bash
   npm run compile
   ```

2. **运行测试**
   ```bash
   npm test
   ```

3. **部署到测试网**
   
   **Sepolia测试网：**
   ```bash
   npx hardhat --network sepolia deploy
   ```
   
   **Zama FHE测试网：**
   ```bash
   npx hardhat --network zamaTestnet deploy
   ```

4. **记录合约地址**
   
   部署成功后，记录显示的合约地址：
   ```
   UniqueNumberGameFactory deployed to: 0x1234567890123456789012345678901234567890
   ```

5. **验证合约（可选）**
   ```bash
   npx hardhat verify --network sepolia 0x1234567890123456789012345678901234567890
   ```

### 部署脚本示例

创建 `deploy/deploy-game.ts`：

```typescript
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const result = await deploy('UniqueNumberGameFactory', {
    from: deployer,
    args: [], // 构造函数参数
    log: true,
  });

  console.log(`UniqueNumberGameFactory deployed at: ${result.address}`);
  
  // 可选：设置初始参数或执行初始化
  const contract = await hre.ethers.getContractAt(
    'UniqueNumberGameFactory',
    result.address
  );
  
  console.log('Contract deployed and ready!');
};

export default func;
func.tags = ['UniqueNumberGameFactory'];
```

## 🌐 前端部署

### 环境配置

1. **安装依赖**
   ```bash
   cd number-verse-arena
   npm install
   ```

2. **更新合约配置**
   
   编辑 `src/contracts/config.ts`：
   ```typescript
   export const CONTRACT_CONFIG = {
     // 使用实际部署的合约地址
     address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
     // ... 其他配置
   };
   ```

3. **配置WalletConnect**
   
   编辑 `src/config/wagmi.ts`：
   ```typescript
   export const config = getDefaultConfig({
     projectId: 'your-actual-walletconnect-project-id',
     // ... 其他配置
   });
   ```

4. **更新网络配置**
   
   根据实际的Zama网络信息更新：
   ```typescript
   const zamaTestnet = defineChain({
     id: 8009, // 实际的链ID
     name: 'Zama FHE Testnet',
     rpcUrls: {
       default: {
         http: ['https://actual-rpc-url.com'],
       },
     },
     blockExplorers: {
       default: { 
         name: 'Zama Explorer', 
         url: 'https://actual-explorer-url.com' 
       },
     },
   });
   ```

### 构建和部署

#### 本地开发

```bash
npm run dev
```

#### 生产构建

```bash
npm run build
```

#### 部署到静态托管

**Vercel部署：**

1. 连接GitHub仓库到Vercel
2. 设置构建命令：`npm run build`
3. 设置输出目录：`dist`
4. 配置环境变量（如果需要）

**Netlify部署：**

1. 连接GitHub仓库到Netlify
2. 构建设置：
   - Build command: `npm run build` 
   - Publish directory: `dist`

**手动部署：**

```bash
# 构建生产版本
npm run build

# 上传dist目录到你的服务器
scp -r dist/* user@server:/var/www/html/
```

### 环境变量（可选）

如果需要环境变量，创建 `.env` 文件：

```bash
# WalletConnect项目ID
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# 合约地址（可选，也可以在代码中硬编码）
VITE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# API端点（如果有后端服务）
VITE_API_URL=https://api.yourapp.com
```

在代码中使用：
```typescript
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
```

## 🔧 配置检查清单

### 合约部署检查

- [ ] 合约成功编译
- [ ] 测试全部通过
- [ ] 部署到目标网络
- [ ] 合约地址已记录
- [ ] 合约验证（可选）
- [ ] 基本功能测试

### 前端配置检查

- [ ] 合约地址已更新
- [ ] WalletConnect项目ID已配置
- [ ] 网络配置正确
- [ ] 构建成功无错误
- [ ] 本地测试通过
- [ ] 部署到托管平台

### 集成测试检查

- [ ] 钱包连接正常
- [ ] 创建游戏功能
- [ ] 加入游戏功能
- [ ] 游戏列表显示
- [ ] 玩家统计显示
- [ ] 排行榜显示
- [ ] 事件监听工作

## 🛠️ 故障排除

### 常见问题

**1. 合约部署失败**
```bash
Error: insufficient funds for gas * price + value
```
解决：确保部署账户有足够的测试币。

**2. 前端无法连接合约**
```javascript
Error: call revert exception
```
解决：检查合约地址和ABI是否正确，网络是否匹配。

**3. FHE功能不工作**
```javascript
Error: FHE operation failed
```
解决：确保使用正确的Zama FHE网络和配置。

**4. 交易失败**
```javascript
Error: execution reverted
```
解决：检查交易参数，确保满足合约要求。

### 调试技巧

1. **使用浏览器开发者工具**
   - 检查控制台错误
   - 查看网络请求
   - 监控钱包交互

2. **使用区块链浏览器**
   - 查看交易状态
   - 检查合约调用
   - 分析事件日志

3. **本地测试**
   ```bash
   # 启动本地Hardhat网络
   npx hardhat node
   
   # 在另一个终端部署合约
   npx hardhat --network localhost deploy
   ```

## 📊 监控和维护

### 合约监控

1. **事件监听**
   - 监控GameCreated事件
   - 跟踪SubmissionReceived事件
   - 记录WinnerDetermined事件

2. **状态查询**
   - 定期检查活跃游戏数量
   - 监控奖池总额
   - 跟踪玩家统计

### 前端监控

1. **性能监控**
   - 页面加载速度
   - 交易确认时间
   - 用户交互响应

2. **错误追踪**
   - JavaScript错误
   - 合约调用失败
   - 网络连接问题

## 🔄 更新流程

### 合约更新

由于智能合约不可变，更新需要：

1. 部署新版本合约
2. 更新前端合约地址
3. 通知用户迁移（如需要）

### 前端更新

1. 开发新功能
2. 测试通过
3. 构建生产版本
4. 部署到托管平台

## 🎯 生产环境建议

### 安全性

- [ ] 使用多重签名钱包管理合约
- [ ] 实施合约访问控制
- [ ] 定期安全审计
- [ ] 监控异常活动

### 性能

- [ ] 启用CDN加速
- [ ] 优化图片和资源
- [ ] 实施缓存策略
- [ ] 监控响应时间

### 用户体验

- [ ] 提供详细的用户指南
- [ ] 实施错误恢复机制
- [ ] 优化移动端体验
- [ ] 提供客户支持

## 📞 支持和联系

如果在部署过程中遇到问题，请：

1. 检查本文档的故障排除部分
2. 查看相关日志和错误信息
3. 参考官方文档：
   - [Hardhat文档](https://hardhat.org/docs)
   - [Wagmi文档](https://wagmi.sh/)
   - [Zama文档](https://docs.zama.ai/)