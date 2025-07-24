# 测试计划

本文档描述了Number Verse Arena项目的完整测试策略和测试用例。

## 📋 测试概述

### 测试目标
- 确保智能合约功能正确性和安全性
- 验证前端与合约的集成工作正常
- 保证用户体验流畅和错误处理得当
- 验证FHE加密功能的隐私保护

### 测试层级
1. **单元测试** - 智能合约函数级别测试
2. **集成测试** - 前端与合约交互测试
3. **端到端测试** - 完整用户流程测试
4. **安全测试** - 合约安全性和漏洞测试

## 🧪 智能合约测试

### 已完成的测试 ✅

#### 游戏创建测试
- [x] 正确参数创建游戏
- [x] 房间名字验证（长度1-64字符）
- [x] 参数验证（数字范围、玩家数、FHE限制）
- [x] 游戏计数器递增
- [x] GameCreated事件触发

#### 数字提交测试
- [x] 有效数字提交
- [x] 参与费用验证
- [x] 重复提交拒绝
- [x] 截止时间后提交拒绝
- [x] 最大玩家数触发开奖
- [x] SubmissionReceived事件触发

#### 开奖机制测试
- [x] 截止时间后手动开奖
- [x] 截止时间前拒绝开奖
- [x] 无玩家时拒绝开奖
- [x] WinnerCalculationStarted事件触发

#### 奖池管理测试
- [x] 奖池金额正确累积
- [x] 初始奖池为零

#### 游戏状态管理测试
- [x] 状态转换正确性（Open → Calculating）

#### View函数测试
- [x] getAllGames() 返回所有游戏
- [x] getActiveGames() 仅返回开放游戏
- [x] getGamesByStatus() 按状态筛选
- [x] getGamesWithPagination() 分页查询
- [x] getGameSummary() 游戏详细信息
- [x] getTotalGamesCount() 游戏总数
- [x] getPlayerGames() 玩家参与的游戏
- [x] canFinalizeGame() 开奖条件检查

#### 统计功能测试
- [x] getPlayerStats() 空玩家统计
- [x] getWinnerHistory() 空获胜历史
- [x] getWinnerHistoryCount() 获胜记录计数
- [x] getLeaderboard() 空排行榜

### 待补充的测试 📋

#### 完整游戏流程测试
- [ ] 完整的获胜者确定流程（需要模拟FHE解密回调）
- [ ] 奖金领取流程测试
- [ ] 多个获胜者情况处理
- [ ] 无获胜者情况处理

#### 边缘情况测试
- [ ] 所有数字都被选择的情况
- [ ] 仅一个玩家参与的情况
- [ ] 达到最大数字范围限制的情况
- [ ] 超大奖池的处理

#### 安全性测试
- [ ] 重入攻击防护测试
- [ ] 权限控制测试
- [ ] 溢出/下溢保护测试
- [ ] 恶意输入处理测试

#### Gas优化测试
- [ ] 各函数Gas消耗测量
- [ ] 大数据量情况下的性能测试
- [ ] 批量操作效率测试

### 测试运行
```bash
cd zama-unique-number-game-contract
npm test
```

当前测试结果：**32个测试全部通过** ✅

## 🌐 前端测试

### 组件单元测试

#### GameCard组件
```typescript
describe('GameCard', () => {
  it('should render number correctly', () => {
    // 测试数字显示
  });
  
  it('should handle click events', () => {
    // 测试点击事件
  });
  
  it('should show different variants', () => {
    // 测试不同状态（available, selected, highlighted）
  });
});
```

#### CreateRoom页面
```typescript
describe('CreateRoom', () => {
  it('should validate room name input', () => {
    // 测试房间名字验证
  });
  
  it('should calculate total prize pool', () => {
    // 测试奖池计算
  });
  
  it('should show wallet connection warning', () => {
    // 测试钱包连接提示
  });
});
```

#### GamePage页面
```typescript
describe('GamePage', () => {
  it('should display game information correctly', () => {
    // 测试游戏信息显示
  });
  
  it('should handle number selection', () => {
    // 测试数字选择
  });
  
  it('should show submission status', () => {
    // 测试提交状态显示
  });
});
```

### Hooks测试

#### useCreateGame Hook
```typescript
describe('useCreateGame', () => {
  it('should create game with valid parameters', () => {
    // 测试游戏创建
  });
  
  it('should handle transaction errors', () => {
    // 测试错误处理
  });
  
  it('should update loading states correctly', () => {
    // 测试加载状态
  });
});
```

#### useGameContract Hooks
```typescript
describe('Game Contract Hooks', () => {
  it('should fetch active games', () => {
    // 测试获取活跃游戏
  });
  
  it('should submit numbers correctly', () => {
    // 测试数字提交
  });
  
  it('should handle contract errors', () => {
    // 测试合约错误
  });
});
```

### 集成测试

#### 钱包连接集成
- [ ] RainbowKit连接流程
- [ ] 网络切换功能
- [ ] 账户变更处理
- [ ] 断开连接处理

#### 合约交互集成
- [ ] 合约函数调用
- [ ] 事件监听
- [ ] 交易状态跟踪
- [ ] 错误信息显示

## 🔄 端到端测试

### 用户流程测试

#### 创建游戏流程
```gherkin
Feature: 创建游戏
  Scenario: 用户成功创建游戏房间
    Given 用户已连接钱包
    When 用户填写房间信息
    And 点击创建房间按钮
    Then 应该显示交易确认
    And 交易成功后跳转到游戏页面
```

#### 加入游戏流程
```gherkin
Feature: 加入游戏
  Scenario: 用户成功加入游戏
    Given 存在开放的游戏房间
    When 用户选择数字
    And 确认提交
    Then 应该发送交易
    And 显示参与成功消息
```

#### 完整游戏流程
```gherkin
Feature: 完整游戏
  Scenario: 从创建到结束的完整流程
    Given 用户A创建游戏房间
    When 用户B和C加入游戏
    And 所有用户提交数字
    And 游戏自动开奖
    Then 获胜者应该能够领取奖金
```

### 错误处理测试

#### 网络错误
- [ ] RPC连接失败
- [ ] 交易超时
- [ ] Gas不足
- [ ] 网络拥堵

#### 合约错误
- [ ] 合约函数revert
- [ ] 参数验证失败
- [ ] 权限错误
- [ ] 状态不匹配

#### 用户错误
- [ ] 钱包未连接
- [ ] 余额不足
- [ ] 重复操作
- [ ] 无效输入

## 🛡️ 安全测试

### 智能合约安全

#### 常见漏洞测试
- [ ] 重入攻击（Reentrancy）
- [ ] 整数溢出/下溢
- [ ] 访问控制漏洞
- [ ] 前置运行攻击（Front-running）
- [ ] 时间戳依赖
- [ ] DoS攻击

#### FHE特定安全
- [ ] 加密数据泄露
- [ ] 解密权限控制
- [ ] 零知识证明验证
- [ ] 侧信道攻击防护

### 前端安全

#### Web安全
- [ ] XSS攻击防护
- [ ] CSRF攻击防护
- [ ] 输入验证
- [ ] 内容安全策略（CSP）

#### Web3安全
- [ ] 私钥保护
- [ ] 交易签名验证
- [ ] 钓鱼攻击防护
- [ ] 恶意DApp检测

## 📊 性能测试

### 合约性能

#### Gas消耗测试
```typescript
describe('Gas Usage', () => {
  it('should measure createGame gas cost', () => {
    // 测量创建游戏的Gas消耗
  });
  
  it('should measure submitNumber gas cost', () => {
    // 测量提交数字的Gas消耗
  });
});
```

#### 可扩展性测试
- [ ] 大量玩家同时参与
- [ ] 大量游戏同时进行
- [ ] 长时间运行稳定性

### 前端性能

#### 加载性能
- [ ] 首次加载时间
- [ ] 资源加载优化
- [ ] 代码分割效果
- [ ] 图片懒加载

#### 运行时性能
- [ ] 组件渲染性能
- [ ] 内存泄漏检测
- [ ] 事件处理效率
- [ ] 数据更新频率

## 🔧 测试工具和框架

### 智能合约测试
- **Hardhat** - 测试框架
- **Chai** - 断言库
- **FHEVM Mock** - FHE功能模拟
- **Time Helpers** - 时间控制

### 前端测试
- **Vitest** - 测试运行器
- **React Testing Library** - 组件测试
- **MSW** - API模拟
- **Wagmi Test Utils** - Web3测试工具

### 端到端测试
- **Playwright** - 浏览器自动化
- **Metamask Test Utils** - 钱包交互测试
- **Local Testnet** - 本地测试网络

## 📅 测试计划时间表

### 第一阶段：基础测试 (1周)
- [x] 智能合约单元测试
- [ ] 前端组件单元测试
- [ ] 基础集成测试

### 第二阶段：集成测试 (1周)
- [ ] 完整合约流程测试
- [ ] 前端与合约集成测试
- [ ] 错误处理测试

### 第三阶段：端到端测试 (1周)
- [ ] 用户流程测试
- [ ] 跨浏览器测试
- [ ] 移动端测试

### 第四阶段：安全和性能测试 (1周)
- [ ] 安全漏洞扫描
- [ ] 性能基准测试
- [ ] 压力测试

## 🚨 测试环境

### 本地开发环境
- Hardhat本地网络
- FHEVM Mock环境
- 测试钱包和账户

### 测试网环境
- Sepolia测试网
- Zama FHE测试网
- 测试代币和资金

### CI/CD环境
- GitHub Actions
- 自动化测试运行
- 测试结果报告

## 📈 测试指标

### 覆盖率目标
- **合约代码覆盖率**: ≥ 90%
- **前端代码覆盖率**: ≥ 80%
- **集成测试覆盖率**: ≥ 70%

### 质量指标
- **Bug密度**: < 1 bug/KLOC
- **回归测试通过率**: ≥ 95%
- **性能回归**: < 5%降级

### 安全指标
- **安全漏洞**: 0个高危漏洞
- **代码审计**: 通过第三方审计
- **渗透测试**: 通过安全测试

## 🔍 测试报告

### 日常测试报告
- 测试执行结果
- 代码覆盖率报告
- 性能监控数据
- 安全扫描结果

### 里程碑测试报告
- 功能完整性评估
- 质量指标达成情况
- 风险评估和缓解措施
- 发布就绪性评估

---

**最后更新**: 2024-01-XX  
**维护者**: 测试团队  
**审查周期**: 每周更新