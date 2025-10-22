import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';
import { http } from 'viem';

export const config = getDefaultConfig({
  appName: 'Number Verse Arena',
  projectId: 'YOUR_PROJECT_ID', // Get this from https://cloud.walletconnect.com
  chains: [sepolia],
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
  },
  ssr: false, // If your dApp uses server side rendering (SSR)
});