# Deployment Guide

This document provides complete deployment instructions for the Number Verse Arena project, including smart contract deployment and frontend application deployment.

## 🏗️ Project Architecture

```
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Frontend (React)  │───▶│  Smart Contract      │───▶│   Zama FHE Network  │
│   - React + Vite    │    │  - UniqueNumberGame  │    │   - FHE Operations  │
│   - Wagmi + RainKit │    │  - View Functions    │    │   - Decryption      │
│   - TypeScript      │    │  - Event Logs        │    │   - Privacy Layer   │
└─────────────────────┘    └──────────────────────┘    └─────────────────────┘
```

## 🚀 Contract Deployment

### Environment Setup

1. **Install Dependencies**
   ```bash
   cd zama-unique-number-game-contract
   npm install
   ```

2. **Environment Variables Configuration**
   
   Create a `.env` file:
   ```bash
   # Private key (do not upload to GitHub)
   PRIVATE_KEY=your_private_key_here
   
   # Network RPC URLs
   SEPOLIA_RPC_URL=https://rpc.sepolia.org
   ZAMA_TESTNET_RPC_URL=https://devnet.zama.ai
   
   # Etherscan API (optional, for contract verification)
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

3. **Update Hardhat Configuration**
   
   Ensure `hardhat.config.ts` contains the correct network configuration:
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
         chainId: 8009, // Actual Zama testnet chain ID
       },
     },
     // ... other configurations
   };
   ```

### Deployment Steps

1. **Compile Contracts**
   ```bash
   npm run compile
   ```

2. **Run Tests**
   ```bash
   npm test
   ```

3. **Deploy to Testnet**
   
   **Sepolia Testnet:**
   ```bash
   npx hardhat --network sepolia deploy
   ```
   
   **Zama FHE Testnet:**
   ```bash
   npx hardhat --network zamaTestnet deploy
   ```

4. **Record Contract Address**
   
   After successful deployment, record the displayed contract address:
   ```
   UniqueNumberGameFactory deployed to: 0x1234567890123456789012345678901234567890
   ```

5. **Verify Contract (Optional)**
   ```bash
   npx hardhat verify --network sepolia 0x1234567890123456789012345678901234567890
   ```

### Deployment Script Example

Create `deploy/deploy-game.ts`:

```typescript
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const result = await deploy('UniqueNumberGameFactory', {
    from: deployer,
    args: [], // Constructor parameters
    log: true,
  });

  console.log(`UniqueNumberGameFactory deployed at: ${result.address}`);
  
  // Optional: Set initial parameters or perform initialization
  const contract = await hre.ethers.getContractAt(
    'UniqueNumberGameFactory',
    result.address
  );
  
  console.log('Contract deployed and ready!');
};

export default func;
func.tags = ['UniqueNumberGameFactory'];
```

## 🌐 Frontend Deployment

### Environment Configuration

1. **Install Dependencies**
   ```bash
   cd number-verse-arena
   npm install
   ```

2. **Update Contract Configuration**
   
   Edit `src/contracts/config.ts`:
   ```typescript
   export const CONTRACT_CONFIG = {
     // Use the actual deployed contract address
     address: '0x1234567890123456789012345678901234567890' as `0x${string}`,
     // ... other configurations
   };
   ```

3. **Configure WalletConnect**
   
   Edit `src/config/wagmi.ts`:
   ```typescript
   export const config = getDefaultConfig({
     projectId: 'your-actual-walletconnect-project-id',
     // ... other configurations
   });
   ```

4. **Update Network Configuration**
   
   Update with actual Zama network information:
   ```typescript
   const zamaTestnet = defineChain({
     id: 8009, // Actual chain ID
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

### Build and Deploy

#### Local Development

```bash
npm run dev
```

#### Production Build

```bash
npm run build
```

#### Deploy to Static Hosting

**Vercel Deployment:**

1. Connect GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Configure environment variables (if needed)

**Netlify Deployment:**

1. Connect GitHub repository to Netlify
2. Build settings:
   - Build command: `npm run build` 
   - Publish directory: `dist`

**Manual Deployment:**

```bash
# Build production version
npm run build

# Upload dist directory to your server
scp -r dist/* user@server:/var/www/html/
```

### Environment Variables (Optional)

If environment variables are needed, create a `.env` file:

```bash
# WalletConnect project ID
VITE_WALLETCONNECT_PROJECT_ID=your_project_id

# Contract address (optional, can also be hardcoded in code)
VITE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# API endpoint (if there's a backend service)
VITE_API_URL=https://api.yourapp.com
```

Use in code:
```typescript
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
```

## 🔧 Configuration Checklist

### Contract Deployment Checklist

- [ ] Contract compiled successfully
- [ ] All tests pass
- [ ] Deployed to target network
- [ ] Contract address recorded
- [ ] Contract verified (optional)
- [ ] Basic functionality tested

### Frontend Configuration Checklist

- [ ] Contract address updated
- [ ] WalletConnect project ID configured
- [ ] Network configuration correct
- [ ] Build succeeds without errors
- [ ] Local testing passes
- [ ] Deployed to hosting platform

### Integration Testing Checklist

- [ ] Wallet connection working
- [ ] Create game functionality
- [ ] Join game functionality
- [ ] Game list display
- [ ] Player statistics display
- [ ] Leaderboard display
- [ ] Event listening working

## 🛠️ Troubleshooting

### Common Issues

**1. Contract deployment fails**
```bash
Error: insufficient funds for gas * price + value
```
Solution: Ensure deployment account has enough test tokens.

**2. Frontend cannot connect to contract**
```javascript
Error: call revert exception
```
Solution: Check if contract address and ABI are correct, and if network matches.

**3. FHE functionality not working**
```javascript
Error: FHE operation failed
```
Solution: Ensure using correct Zama FHE network and configuration.

**4. Transaction failures**
```javascript
Error: execution reverted
```
Solution: Check transaction parameters and ensure they meet contract requirements.

### Debugging Tips

1. **Use Browser Developer Tools**
   - Check console errors
   - View network requests
   - Monitor wallet interactions

2. **Use Blockchain Explorer**
   - View transaction status
   - Check contract calls
   - Analyze event logs

3. **Local Testing**
   ```bash
   # Start local Hardhat network
   npx hardhat node
   
   # Deploy contract in another terminal
   npx hardhat --network localhost deploy
   ```

## 📊 Monitoring and Maintenance

### Contract Monitoring

1. **Event Listening**
   - Monitor GameCreated events
   - Track SubmissionReceived events
   - Record WinnerDetermined events

2. **State Queries**
   - Regularly check active game count
   - Monitor total prize pool
   - Track player statistics

### Frontend Monitoring

1. **Performance Monitoring**
   - Page load speed
   - Transaction confirmation time
   - User interaction response

2. **Error Tracking**
   - JavaScript errors
   - Contract call failures
   - Network connection issues

## 🔄 Update Process

### Contract Updates

Since smart contracts are immutable, updates require:

1. Deploy new version contract
2. Update frontend contract address
3. Notify users to migrate (if needed)

### Frontend Updates

1. Develop new features
2. Pass testing
3. Build production version
4. Deploy to hosting platform

## 🎯 Production Environment Recommendations

### Security

- [ ] Use multi-signature wallet for contract management
- [ ] Implement contract access controls
- [ ] Regular security audits
- [ ] Monitor abnormal activities

### Performance

- [ ] Enable CDN acceleration
- [ ] Optimize images and resources
- [ ] Implement caching strategies
- [ ] Monitor response times

### User Experience

- [ ] Provide detailed user guides
- [ ] Implement error recovery mechanisms
- [ ] Optimize mobile experience
- [ ] Provide customer support

## 📞 Support and Contact

If you encounter issues during deployment:

1. Check the troubleshooting section of this document
2. Review related logs and error information
3. Refer to official documentation:
   - [Hardhat Documentation](https://hardhat.org/docs)
   - [Wagmi Documentation](https://wagmi.sh/)
   - [Zama Documentation](https://docs.zama.ai/)