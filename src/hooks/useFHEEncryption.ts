import { useState } from 'react';
import { useFhevm } from '@/fhevm-react/useFhevm';
import { usePublicClient } from 'wagmi';

interface EncryptionResult {
  encryptedData: string;
  inputProof: string;
}

interface UseEncryptionReturn {
  encryptNumber: (value: number, contractAddress: string, userAddress: string) => Promise<EncryptionResult>;
  isEncrypting: boolean;
  encryptionError: string | null;
}

/**
 * Hook for encrypting numbers using FHEVM
 *
 * Now uses @fhevm/react hooks instead of @zama-fhe/relayer-sdk
 *
 * @example
 * const { encryptNumber, isEncrypting } = useFHEEncryption();
 * const result = await encryptNumber(42, contractAddress, userAddress);
 */
export const useFHEEncryption = (): UseEncryptionReturn => {
  const publicClient = usePublicClient();
  const { instance, status } = useFhevm({
    provider: publicClient ? publicClient : undefined,
    chainId: publicClient?.chain?.id,
    enabled: true,
  });

  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptionError, setEncryptionError] = useState<string | null>(null);

  const encryptNumber = async (
    value: number,
    contractAddress: string,
    userAddress: string
  ): Promise<EncryptionResult> => {
    if (!instance || status !== 'ready') {
      throw new Error(`FHEVM instance not ready (status: ${status})`);
    }

    setIsEncrypting(true);
    setEncryptionError(null);

    try {
      console.log('Encrypting number:', { value, contractAddress, userAddress });

      // Create encrypted input buffer
      const input = instance.createEncryptedInput(contractAddress, userAddress);

      // Add 32-bit unsigned integer
      input.add32(value);

      // Encrypt and generate proof
      const encrypted = await input.encrypt();

      console.log('Encryption successful:', {
        handles: encrypted.handles,
        inputProof: encrypted.inputProof
      });

      // Convert Uint8Array to hex string if needed
      const toHex = (data: Uint8Array | string): string => {
        if (typeof data === 'string') return data;
        return '0x' + Array.from(data)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join('');
      };

      const result: EncryptionResult = {
        encryptedData: toHex(encrypted.handles[0]),
        inputProof: toHex(encrypted.inputProof),
      };

      console.log('Encryption result:', result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Encryption failed';
      console.error('Encryption error:', error);
      setEncryptionError(errorMessage);
      throw new Error(`Failed to encrypt number: ${errorMessage}`);
    } finally {
      setIsEncrypting(false);
    }
  };

  return {
    encryptNumber,
    isEncrypting,
    encryptionError,
  };
};
