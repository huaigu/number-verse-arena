// Quick script to test contract accessibility
// Run with: node scripts/test-contract.js

import { ethers } from 'ethers';
import { readFileSync } from 'fs';

const CONTRACT_ADDRESS = '0xF0d12594D93950DfAe70011c4FAF04F1Cc9f9e06';
const RPC_URL = 'https://eth-sepolia.public.blastapi.io';

async function testContract() {
  console.log('🔍 Testing contract accessibility...');
  
  try {
    // Connect to provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    console.log('✅ Provider connected');

    // Check if contract exists
    const code = await provider.getCode(CONTRACT_ADDRESS);
    if (code === '0x') {
      console.log('❌ Contract not found at address');
      return;
    }
    console.log('✅ Contract found at address');

    // Load contract ABI
    const contractABI = JSON.parse(readFileSync('./src/contracts/UniqueNumberGameFactory.json', 'utf8'));
    console.log('✅ Contract ABI loaded');

    // Create contract instance
    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI.abi, provider);
    console.log('✅ Contract instance created');

    // Test basic read functions
    const gameCounter = await contract.gameCounter();
    console.log('✅ gameCounter:', gameCounter.toString());

    const totalGames = await contract.getTotalGamesCount();
    console.log('✅ totalGamesCount:', totalGames.toString());

    // Test network info
    const network = await provider.getNetwork();
    console.log('✅ Network:', network.name, '(chainId:', network.chainId.toString() + ')');

    console.log('\n🎉 Contract integration test successful!');
    console.log('\n📋 Summary:');
    console.log('- Contract Address:', CONTRACT_ADDRESS);
    console.log('- Network: Sepolia Testnet');
    console.log('- Initial Games:', totalGames.toString());
    console.log('- Frontend Ready: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testContract();