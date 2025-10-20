import React, { createContext, useContext, ReactNode } from 'react';
import { usePublicClient } from 'wagmi';
import { useFhevm, FhevmGoState } from '@/fhevm-react/useFhevm';
import type { FhevmInstance } from '@/fhevm-react/fhevmTypes';

interface FhevmContextValue {
  instance: FhevmInstance | undefined;
  status: FhevmGoState;
  error: Error | undefined;
  refresh: () => void;
}

const FhevmContext = createContext<FhevmContextValue | undefined>(undefined);

export const useFhevmContext = () => {
  const context = useContext(FhevmContext);
  if (!context) {
    throw new Error('useFhevmContext must be used within FhevmProvider');
  }
  return context;
};

interface FhevmProviderProps {
  children: ReactNode;
}

/**
 * Global FHEVM Provider that initializes the FHEVM instance once at app level
 * and shares it across all components to avoid multiple SDK loads
 */
export const FhevmProvider: React.FC<FhevmProviderProps> = ({ children }) => {
  const publicClient = usePublicClient();

  // Initialize FHEVM instance globally - this will load the SDK only once
  const { instance, status, error, refresh } = useFhevm({
    provider: publicClient ? publicClient : undefined,
    chainId: publicClient?.chain?.id,
    enabled: true, // Always enabled at app level
  });

  // Log initialization progress for debugging
  React.useEffect(() => {
    console.log('[FhevmProvider] FHEVM Status:', status);
    if (error) {
      console.error('[FhevmProvider] FHEVM Error:', error);
    }
    if (instance) {
      console.log('[FhevmProvider] FHEVM Instance ready!');
    }
  }, [status, error, instance]);

  return (
    <FhevmContext.Provider value={{ instance, status, error, refresh }}>
      {children}
    </FhevmContext.Provider>
  );
};
