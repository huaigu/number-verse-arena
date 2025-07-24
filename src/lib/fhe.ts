// 声明全局类型
declare global {
  interface Window {
    [key: string]: any; // 允许访问任何全局属性
  }
}

// FHE 实例管理
let fhevmInstance: any = null;
let sdkInitialized = false;

/**
 * 初始化 FHEVM 实例
 * 使用 CDN 加载的 SDK 和 Sepolia 配置
 */
export async function initializeFHE() {
  try {
    if (!fhevmInstance) {
      console.log('Checking available global objects...');
      console.log('Available keys:', Object.keys(window).filter(key => key.toLowerCase().includes('relayer') || key.toLowerCase().includes('fhe') || key.toLowerCase().includes('zama')));

      // 检查可能的全局对象名称
      const possibleNames = ['RelayerSDK', 'FHE', 'Zama', 'relayerSDK', 'fhe'];
      let sdk = null;

      for (const name of possibleNames) {
        if (window[name]) {
          sdk = window[name];
          console.log(`Found SDK at window.${name}:`, sdk);
          break;
        }
      }

      if (!sdk) {
        // 如果没有找到明确的SDK对象，检查是否有直接的函数
        if (window.initSDK && window.createInstance) {
          sdk = window;
          console.log('Found SDK functions directly on window object');
        } else {
          throw new Error('FHE SDK not found. Available window keys: ' + Object.keys(window).join(', '));
        }
      }

      // 初始化 SDK
      if (!sdkInitialized && sdk.initSDK) {
        console.log('Initializing FHE SDK from CDN...');
        await sdk.initSDK();
        sdkInitialized = true;
        console.log('FHE SDK initialized successfully');
      }

      console.log('Creating FHEVM instance...');

      // 尝试使用 SepoliaConfig 或手动配置
      let config;
      if (sdk.SepoliaConfig) {
        config = {
          ...sdk.SepoliaConfig,
          network: (window as any).ethereum || "https://eth-sepolia.public.blastapi.io",
        };
        console.log('Using SepoliaConfig:', config);
      } else {
        // 手动配置
        config = {
          aclContractAddress: "0x687820221192C5B662b25367F70076A37bc79b6c",
          kmsContractAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
          inputVerifierContractAddress: "0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4",
          verifyingContractAddressDecryption: "0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1",
          verifyingContractAddressInputVerification: "0x7048C39f048125eDa9d678AEbaDfB22F7900a29F",
          chainId: 11155111,
          gatewayChainId: 55815,
          network: (window as any).ethereum || "https://eth-sepolia.public.blastapi.io",
          relayerUrl: "https://relayer.testnet.zama.cloud",
        };
        console.log('Using manual config:', config);
      }

      fhevmInstance = await sdk.createInstance(config);

      console.log('FHEVM relayer SDK instance initialized successfully');
    }
    return fhevmInstance;
  } catch (error) {
    console.error('Failed to initialize FHEVM relayer SDK:', error);
    console.error('Error details:', error);
    throw new Error('Failed to initialize FHE encryption');
  }
}

/**
 * 获取已初始化的 FHEVM 实例
 */
export async function getFhevmInstance() {
  if (!fhevmInstance) {
    await initializeFHE();
  }
  return fhevmInstance;
}

/**
 * 加密32位无符号整数
 * @param value - 要加密的数值
 * @param contractAddress - 合约地址  
 * @param userAddress - 用户地址
 * @returns 加密后的数据和证明
 */
export async function encryptNumber(
  value: number,
  contractAddress: string,
  userAddress: string
): Promise<{ encryptedData: string; inputProof: string }> {
  try {
    const instance = await getFhevmInstance();

    if (!instance || !instance.createEncryptedInput) {
      throw new Error('FHEVM relayer SDK instance not properly initialized');
    }

    console.log('Creating encrypted input for:', { value, contractAddress, userAddress });

    // 创建加密输入缓冲区
    const buffer = instance.createEncryptedInput(contractAddress, userAddress);

    // 添加32位无符号整数到加密输入
    buffer.add32(value);

    // 执行加密并生成证明
    console.log('Encrypting value...');
    const ciphertexts = await buffer.encrypt();

    console.log('Encryption result:', ciphertexts);
    console.log('Handles:', ciphertexts.handles);
    console.log('Input proof:', ciphertexts.inputProof);

    // 确保返回的数据是正确的格式
    const encryptedData = ciphertexts.handles[0];
    const inputProof = ciphertexts.inputProof;

    console.log('Encrypted data type:', typeof encryptedData, encryptedData);
    console.log('Input proof type:', typeof inputProof, inputProof);

    // 将 Uint8Array 转换为十六进制字符串
    const toHex = (uint8Array: Uint8Array): string => {
      return '0x' + Array.from(uint8Array)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    };

    const result = {
      encryptedData: encryptedData instanceof Uint8Array ? toHex(encryptedData) : encryptedData,
      inputProof: inputProof instanceof Uint8Array ? toHex(inputProof) : inputProof,
    };

    console.log('Converted result:', result);
    console.log('Encrypted data hex:', result.encryptedData);
    console.log('Input proof hex:', result.inputProof);

    return result;
  } catch (error) {
    console.error('Failed to encrypt number:', error);
    throw new Error(`Failed to encrypt number: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 检查 FHEVM 实例是否已初始化
 */
export function isFhevmInitialized(): boolean {
  return fhevmInstance !== null;
}

/**
 * 重置 FHEVM 实例（用于测试或重新初始化）
 */
export function resetFhevmInstance() {
  fhevmInstance = null;
}