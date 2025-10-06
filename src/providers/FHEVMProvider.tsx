import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { createInstance, FhevmInstance } from '@zama-fhe/relayer-sdk/web';
import { useAccount, usePublicClient } from 'wagmi';
import { BrowserProvider } from 'ethers';

interface FHEVMContextValue {
  instance: FhevmInstance | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
}

const FHEVMContext = createContext<FHEVMContextValue>({
  instance: null,
  isInitialized: false,
  isLoading: true,
  error: null,
});

export const useFHEVM = () => {
  const context = useContext(FHEVMContext);
  if (!context) {
    throw new Error('useFHEVM must be used within FHEVMProvider');
  }
  return context;
};

interface FHEVMProviderProps {
  children: ReactNode;
}

export const FHEVMProvider = ({ children }: FHEVMProviderProps) => {
  const { chain } = useAccount();
  const publicClient = usePublicClient();
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initFHEVM = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Only initialize for Sepolia network
        if (!chain || chain.id !== 11155111) {
          setError('Please connect to Sepolia network');
          setIsLoading(false);
          return;
        }

        // Get provider from window.ethereum
        if (!window.ethereum) {
          setError('MetaMask not found');
          setIsLoading(false);
          return;
        }

        const provider = new BrowserProvider(window.ethereum);

        // Sepolia FHE configuration
        const config = {
          aclContractAddress: '0x687820221192C5B662b25367F70076A37bc79b6c' as `0x${string}`,
          kmsContractAddress: '0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC' as `0x${string}`,
          inputVerifierContractAddress: '0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4' as `0x${string}`,
          verifyingContractAddressDecryption: '0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1' as `0x${string}`,
          verifyingContractAddressInputVerification: '0x7048C39f048125eDa9d678AEbaDfB22F7900a29F' as `0x${string}`,
          chainId: 11155111,
          gatewayChainId: 55815,
          network: provider,
          relayerUrl: 'https://relayer.testnet.zama.cloud',
        };

        console.log('Initializing FHEVM instance with config:', config);
        const fhevmInstance = await createInstance(config);

        setInstance(fhevmInstance);
        setIsInitialized(true);
        console.log('FHEVM instance initialized successfully');
      } catch (err) {
        console.error('Failed to initialize FHEVM:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize FHEVM');
      } finally {
        setIsLoading(false);
      }
    };

    initFHEVM();
  }, [chain, publicClient]);

  return (
    <FHEVMContext.Provider value={{ instance, isInitialized, isLoading, error }}>
      {children}
    </FHEVMContext.Provider>
  );
};
