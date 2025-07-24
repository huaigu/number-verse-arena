import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';

// 定义Zama FHE测试网络（示例配置，需要根据实际情况调整）
const zamaTestnet = defineChain({
  id: 8009,
  name: 'Zama FHE Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['https://devnet.zama.ai'], // 示例RPC，需要替换为实际URL
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.zama.ai' }, // 示例浏览器
  },
});

export const config = getDefaultConfig({
  appName: 'Number Verse Arena',
  projectId: 'YOUR_PROJECT_ID', // Get this from https://cloud.walletconnect.com
  chains: [sepolia, zamaTestnet],
  ssr: false, // If your dApp uses server side rendering (SSR)
});