import { task, types } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";

// Get the deployed contract address
task("game:address", "Get the deployed UniqueNumberGameFactory address")
  .setAction(async (_, hre: HardhatRuntimeEnvironment) => {
    const deployment = await hre.deployments.get("UniqueNumberGameFactory");
    console.log("UniqueNumberGameFactory address:", deployment.address);
    return deployment.address;
  });

// Create a default 3-player game
task("game:create-default", "Create a default 3-player game")
  .addOptionalParam("address", "Contract address (if not using deployment)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();

    // Get contract address
    const contractAddress = taskArgs.address || (await hre.deployments.get("UniqueNumberGameFactory")).address;
    const gameFactory = await ethers.getContractAt("UniqueNumberGameFactory", contractAddress);

    // Default parameters for 3-player game
    const defaultParams = {
      name: "Default 3-Player Game",
      min: 1,
      max: 10,
      players: 3,
      fee: "0.01", // 0.01 ETH
      duration: 1800 // 30 minutes
    };

    console.log(`🎮 Creating default 3-player game with params:`);
    console.log(`  Room Name: ${defaultParams.name}`);
    console.log(`  Number Range: ${defaultParams.min} - ${defaultParams.max}`);
    console.log(`  Max Players: ${defaultParams.players}`);
    console.log(`  Entry Fee: ${defaultParams.fee} ETH`);
    console.log(`  Duration: ${Math.floor(defaultParams.duration / 60)} minutes`);
    console.log(`  Creator: ${deployer.address}`);

    const entryFee = ethers.parseEther(defaultParams.fee);
    
    try {
      const tx = await gameFactory
        .connect(deployer)
        .createGame(
          defaultParams.name,
          defaultParams.min,
          defaultParams.max,
          defaultParams.players,
          entryFee,
          defaultParams.duration
        );

      console.log(`\n⏳ Transaction submitted: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`✅ Game created! Transaction confirmed in block: ${receipt?.blockNumber}`);

      // Get the game ID from events
      const gameCreatedEvent = receipt?.logs.find((log: any) => {
        try {
          const parsed = gameFactory.interface.parseLog(log);
          return parsed?.name === "GameCreated";
        } catch {
          return false;
        }
      });

      if (gameCreatedEvent) {
        const parsed = gameFactory.interface.parseLog(gameCreatedEvent);
        const gameId = parsed?.args.gameId;
        console.log(`🎯 Game ID: ${gameId}`);
        console.log(`\n📋 Quick Commands:`);
        console.log(`  View game info: npx hardhat --network sepolia game:info --id ${gameId}`);
        console.log(`  Debug callbacks: npx hardhat --network sepolia game:debug-callbacks --id ${gameId}`);
        
        const deadline = new Date(Date.now() + defaultParams.duration * 1000);
        console.log(`\n⏰ Game Details:`);
        console.log(`  Deadline: ${deadline.toLocaleString()}`);
        console.log(`  Players needed: ${defaultParams.players}`);
        console.log(`  Prize pool will be: ${(parseFloat(defaultParams.fee) * defaultParams.players).toFixed(3)} ETH`);
        
        return { gameId: gameId.toString(), txHash: receipt?.hash };
      } else {
        console.log("⚠️  Could not extract game ID from transaction events");
        return { txHash: receipt?.hash };
      }
      
    } catch (error) {
      console.error("❌ Error creating game:", error);
      throw error;
    }
  });

// Create a new game
task("game:create", "Create a new game")
  .addOptionalParam("name", "Room name", "Hardhat Test Room", types.string)
  .addParam("min", "Minimum number", 1, types.int)
  .addParam("max", "Maximum number", 10, types.int)
  .addParam("players", "Maximum players", 3, types.int)
  .addParam("fee", "Entry fee in ETH", "0.01", types.string)
  .addParam("duration", "Game duration in seconds", 3600, types.int)
  .addOptionalParam("address", "Contract address (if not using deployment)")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const [deployer] = await ethers.getSigners();

    // Get contract address
    const contractAddress = taskArgs.address || (await hre.deployments.get("UniqueNumberGameFactory")).address;
    const gameFactory = await ethers.getContractAt("UniqueNumberGameFactory", contractAddress);

    // Validate parameters
    if (taskArgs.players > 10) {
      throw new Error("❌ Max players cannot exceed 10 (contract limit)");
    }
    if (taskArgs.players < 2) {
      throw new Error("❌ Max players must be at least 2");
    }

    console.log(`Creating game with params:`);
    console.log(`  Room Name: ${taskArgs.name}`);
    console.log(`  Min Number: ${taskArgs.min}`);
    console.log(`  Max Number: ${taskArgs.max}`);
    console.log(`  Max Players: ${taskArgs.players}`);
    console.log(`  Entry Fee: ${taskArgs.fee} ETH`);
    console.log(`  Duration: ${taskArgs.duration} seconds`);

    const entryFee = ethers.parseEther(taskArgs.fee);
    const tx = await gameFactory
      .connect(deployer)
      .createGame(
        taskArgs.name,
        taskArgs.min,
        taskArgs.max,
        taskArgs.players,
        entryFee,
        taskArgs.duration
      );

    const receipt = await tx.wait();
    console.log(`Game created! Transaction hash: ${receipt?.hash}`);

    // Get the game ID from events
    const gameCreatedEvent = receipt?.logs.find((log: any) => {
      try {
        const parsed = gameFactory.interface.parseLog(log);
        return parsed?.name === "GameCreated";
      } catch {
        return false;
      }
    });

    if (gameCreatedEvent) {
      const parsed = gameFactory.interface.parseLog(gameCreatedEvent);
      console.log(`Game ID: ${parsed?.args.gameId}`);
    }

    return receipt?.hash;
  });

// View game details
task("game:info", "Get game information")
  .addParam("id", "Game ID", undefined, types.int)
  .addOptionalParam("address", "Contract address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;

    const contractAddress = taskArgs.address || (await hre.deployments.get("UniqueNumberGameFactory")).address;
    const gameFactory = await ethers.getContractAt("UniqueNumberGameFactory", contractAddress);

    const game = await gameFactory.games(taskArgs.id);
    const pot = await gameFactory.gamePots(taskArgs.id);

    console.log(`\n=== Game ${taskArgs.id} Information ===`);
    console.log(`Creator: ${game.creator}`);
    console.log(`Status: ${["Open", "Calculating", "Finished", "PrizeClaimed"][game.status]}`);
    console.log(`Number Range: ${game.minNumber} - ${game.maxNumber}`);
    console.log(`Players: ${game.playerCount} / ${game.maxPlayers}`);
    console.log(`Entry Fee: ${ethers.formatEther(game.entryFee)} ETH`);
    console.log(`Prize Pool: ${ethers.formatEther(pot)} ETH`);
    console.log(`Deadline: ${new Date(Number(game.deadline) * 1000).toLocaleString()}`);
    
    if (game.decryptedWinner > 0) {
      console.log(`Winner Number: ${game.decryptedWinner}`);
      const winnerAddress = await gameFactory.gameWinners(taskArgs.id);
      if (winnerAddress !== ethers.ZeroAddress) {
        console.log(`Winner Address: ${winnerAddress}`);
      }
    }
    
    // Add callback debug information
    console.log(`\n🔍 Callback Debug Information:`);
    try {
      const debugInfo = await gameFactory.getCallbackDebugInfo(taskArgs.id);
      console.log(`Is Decryption Pending: ${debugInfo.isPending}`);
      console.log(`Latest Request ID: ${debugInfo.requestId}`); 
      if (debugInfo.lastError && debugInfo.lastError.length > 0) {
        console.log(`Last Error: ${debugInfo.lastError}`);
      } else {
        console.log(`Last Error: None`);
      }
      
      // Global callback stats - removed for optimization
      
    } catch (error) {
      console.log(`Error fetching debug info: ${error}`);
    }

    return game;
  });

// Submit a number to a game (Note: This requires real FHE encryption on Sepolia)
task("game:submit", "Submit a number to a game (Sepolia only - requires FHE encryption)")
  .addParam("id", "Game ID", undefined, types.int)
  .addParam("number", "Number to submit", undefined, types.int)
  .addOptionalParam("address", "Contract address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    if (hre.network.name !== "sepolia") {
      throw new Error("This task only works on Sepolia network with real FHE encryption");
    }

    console.log("⚠️  Note: Submitting numbers requires FHE encryption setup on Sepolia");
    console.log("This is a complex operation that requires:");
    console.log("1. Proper FHE client setup");
    console.log("2. Key generation and management");
    console.log("3. Encrypted input creation");
    console.log("\nRefer to Zama FHEVM documentation for complete implementation.");
    console.log("For testing purposes, use the local hardhat network with mock encryption.");

    // This would require FHE client setup which is beyond basic deployment
    // Users should refer to Zama docs for complete FHE client integration
  });

// Manually trigger winner calculation (after deadline)
task("game:calculate", "Manually trigger winner calculation")
  .addParam("id", "Game ID", undefined, types.int)
  .addOptionalParam("address", "Contract address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const [signer] = await ethers.getSigners();

    const contractAddress = taskArgs.address || (await hre.deployments.get("UniqueNumberGameFactory")).address;
    const gameFactory = await ethers.getContractAt("UniqueNumberGameFactory", contractAddress);

    console.log(`Triggering winner calculation for game ${taskArgs.id}...`);

    const tx = await gameFactory
      .connect(signer)
      .findWinnerByDeadline(taskArgs.id);

    const receipt = await tx.wait();
    console.log(`Winner calculation triggered! Transaction hash: ${receipt?.hash}`);

    return receipt?.hash;
  });

// Claim prize (winner only)
task("game:claim", "Claim prize from a finished game")
  .addParam("id", "Game ID", undefined, types.int)
  .addOptionalParam("address", "Contract address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const [signer] = await ethers.getSigners();

    const contractAddress = taskArgs.address || (await hre.deployments.get("UniqueNumberGameFactory")).address;
    const gameFactory = await ethers.getContractAt("UniqueNumberGameFactory", contractAddress);

    console.log(`Attempting to claim prize for game ${taskArgs.id}...`);

    const tx = await gameFactory
      .connect(signer)
      .claimPrize(taskArgs.id);

    const receipt = await tx.wait();
    console.log(`Prize claimed! Transaction hash: ${receipt?.hash}`);

    return receipt?.hash;
  });

// Claim refund for a game with no winner
task("game:refund", "Claim refund from a game with no winner")
  .addParam("id", "Game ID", undefined, types.int)
  .addOptionalParam("address", "Contract address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const [signer] = await ethers.getSigners();

    const contractAddress = taskArgs.address || (await hre.deployments.get("UniqueNumberGameFactory")).address;
    const gameFactory = await ethers.getContractAt("UniqueNumberGameFactory", contractAddress);

    console.log(`Attempting to claim refund for game ${taskArgs.id}...`);

    // Check if player can claim refund
    const canClaim = await gameFactory.canClaimRefund(taskArgs.id, signer.address);
    if (!canClaim) {
      console.log("❌ You cannot claim refund for this game. Possible reasons:");
      console.log("   - Game is not finished");
      console.log("   - Game has a winner");
      console.log("   - You did not participate in this game");
      console.log("   - You already claimed your refund");
      return;
    }

    const tx = await gameFactory
      .connect(signer)
      .claimRefund(taskArgs.id);

    const receipt = await tx.wait();
    console.log(`✅ Refund claimed! Transaction hash: ${receipt?.hash}`);

    // Show refund amount from events
    const refundEvent = receipt?.logs.find((log: any) => {
      try {
        const parsed = gameFactory.interface.parseLog(log);
        return parsed?.name === "RefundClaimed";
      } catch {
        return false;
      }
    });

    if (refundEvent) {
      const parsed = gameFactory.interface.parseLog(refundEvent);
      const refundAmount = ethers.formatEther(parsed?.args.amount);
      console.log(`💰 Refund amount: ${refundAmount} ETH`);
    }

    return receipt?.hash;
  });

// Withdraw platform fees (owner only)
task("game:withdraw-fees", "Withdraw accumulated platform fees (owner only)")
  .addOptionalParam("address", "Contract address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const [signer] = await ethers.getSigners();

    const contractAddress = taskArgs.address || (await hre.deployments.get("UniqueNumberGameFactory")).address;
    const gameFactory = await ethers.getContractAt("UniqueNumberGameFactory", contractAddress);

    const owner = await gameFactory.owner();
    if (signer.address !== owner) {
      console.log(`❌ Only the contract owner can withdraw platform fees.`);
      console.log(`   Current owner: ${owner}`);
      console.log(`   Your address: ${signer.address}`);
      return;
    }

    const platformFees = await gameFactory.getPlatformFees();
    if (platformFees === 0n) {
      console.log("ℹ️  No platform fees to withdraw.");
      return;
    }

    console.log(`Withdrawing platform fees: ${ethers.formatEther(platformFees)} ETH...`);

    const tx = await gameFactory
      .connect(signer)
      .withdrawPlatformFees();

    const receipt = await tx.wait();
    console.log(`✅ Platform fees withdrawn! Transaction hash: ${receipt?.hash}`);

    return receipt?.hash;
  });

// Check refund eligibility
task("game:check-refund", "Check if you can claim refund for a game")
  .addParam("id", "Game ID", undefined, types.int)
  .addOptionalParam("player", "Player address (defaults to current signer)")
  .addOptionalParam("address", "Contract address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;
    const [signer] = await ethers.getSigners();

    const contractAddress = taskArgs.address || (await hre.deployments.get("UniqueNumberGameFactory")).address;
    const gameFactory = await ethers.getContractAt("UniqueNumberGameFactory", contractAddress);

    const playerAddress = taskArgs.player || signer.address;
    const gameId = taskArgs.id;

    console.log(`\n🔍 Checking refund eligibility for game ${gameId}:`);
    console.log(`   Player: ${playerAddress}`);

    const game = await gameFactory.games(gameId);
    const canClaim = await gameFactory.canClaimRefund(gameId, playerAddress);
    const hasSubmitted = await gameFactory.hasPlayerSubmitted(gameId, playerAddress);
    const hasClaimedRefund = await gameFactory.hasClaimedRefund(gameId, playerAddress);
    const winnerAddress = await gameFactory.gameWinners(gameId);

    console.log(`\n📊 Game Status:`);
    console.log(`   Status: ${["Open", "Calculating", "Finished", "PrizeClaimed"][game.status]}`);
    console.log(`   Has Winner: ${winnerAddress !== ethers.ZeroAddress ? "Yes" : "No"}`);
    if (winnerAddress !== ethers.ZeroAddress) {
      console.log(`   Winner: ${winnerAddress}`);
    }

    console.log(`\n👤 Player Status:`);
    console.log(`   Participated: ${hasSubmitted ? "✅ Yes" : "❌ No"}`);
    console.log(`   Already Claimed Refund: ${hasClaimedRefund ? "✅ Yes" : "❌ No"}`);
    console.log(`   Can Claim Refund: ${canClaim ? "✅ Yes" : "❌ No"}`);

    if (canClaim) {
      const refundAmount = (game.entryFee * BigInt(9000)) / BigInt(10000);
      console.log(`\n💰 Refund Details:`);
      console.log(`   Entry Fee: ${ethers.formatEther(game.entryFee)} ETH`);
      console.log(`   Refund Amount: ${ethers.formatEther(refundAmount)} ETH (90%)`);
      console.log(`   Platform Fee: ${ethers.formatEther(game.entryFee - refundAmount)} ETH (10%)`);
    }

    return { canClaim, hasSubmitted, hasClaimedRefund, gameStatus: game.status };
  });

// List all games with detailed information
task("game:list", "List games with complete details")
  .addOptionalParam("count", "Number of games to show (0 for all)", 5, types.int)
  .addOptionalParam("address", "Contract address")
  .addOptionalParam("status", "Filter by status: open, calculating, finished, claimed")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;

    const contractAddress = taskArgs.address || (await hre.deployments.get("UniqueNumberGameFactory")).address;
    const gameFactory = await ethers.getContractAt("UniqueNumberGameFactory", contractAddress);

    const gameCounter = await gameFactory.gameCounter();
    const totalGames = Number(gameCounter);

    console.log(`\n=== Game List (Total Games: ${totalGames}) ===`);
    
    if (totalGames === 0) {
      console.log("No games found.");
      return;
    }

    // Determine which games to show
    let gamesToShow: number[] = [];
    if (taskArgs.count === 0) {
      // Show all games
      gamesToShow = Array.from({ length: totalGames }, (_, i) => i);
    } else {
      // Show recent games
      const startId = Math.max(0, totalGames - taskArgs.count);
      gamesToShow = Array.from({ length: totalGames - startId }, (_, i) => startId + i);
    }

    const statusNames = ["Open", "Calculating", "Finished", "PrizeClaimed"];
    const statusFilter = taskArgs.status?.toLowerCase();

    for (const gameId of gamesToShow) {
      const game = await gameFactory.games(gameId);
      const pot = await gameFactory.gamePots(gameId);
      const winnerAddress = await gameFactory.gameWinners(gameId);
      
      const gameStatus = statusNames[game.status];
      
      // Apply status filter if specified
      if (statusFilter && gameStatus.toLowerCase() !== statusFilter) {
        continue;
      }

      console.log(`\n${"=".repeat(50)}`);
      console.log(`🎮 GAME ${gameId}`);
      console.log(`${"=".repeat(50)}`);
      
      // Basic game info
      console.log(`📋 Room Name: ${game.roomName || "Unnamed Room"}`);
      console.log(`👤 Creator: ${game.creator}`);
      console.log(`📊 Status: ${gameStatus}`);
      console.log(`🎯 Game ID: ${gameId}`);
      
      // Game rules
      console.log(`\n📏 Game Rules:`);
      console.log(`   Number Range: ${game.minNumber} - ${game.maxNumber}`);
      console.log(`   Max Players: ${game.maxPlayers}`);
      console.log(`   Entry Fee: ${ethers.formatEther(game.entryFee)} ETH`);
      
      // Game progress
      console.log(`\n⏱️  Game Progress:`);
      console.log(`   Current Players: ${game.playerCount}/${game.maxPlayers}`);
      console.log(`   Prize Pool: ${ethers.formatEther(pot)} ETH`);
      const deadline = new Date(Number(game.deadline) * 1000);
      const now = new Date();
      const isExpired = now > deadline;
      console.log(`   Deadline: ${deadline.toLocaleString()} ${isExpired ? "⏰ EXPIRED" : "✅ Active"}`);
      
      // Winner information
      if (game.status >= 2) { // Finished or PrizeClaimed
        console.log(`\n🏆 Winner Information:`);
        if (game.decryptedWinner > 0 && game.decryptedWinner <= game.maxNumber) {
          console.log(`   Winning Number: ${game.decryptedWinner}`);
          if (winnerAddress !== ethers.ZeroAddress) {
            console.log(`   Winner Address: ${winnerAddress}`);
            console.log(`   Prize Amount: ${ethers.formatEther(pot)} ETH`);
            console.log(`   Prize Status: ${game.status === 3 ? "✅ Claimed" : "⏳ Awaiting Claim"}`);
          } else {
            console.log(`   Winner: ❌ No winner found`);
          }
        } else {
          console.log(`   Result: 🤝 No unique winner (Tie/Refund situation)`);
          const refundAmount = (game.entryFee * BigInt(9000)) / BigInt(10000);
          const platformFeePerPlayer = (game.entryFee * BigInt(1000)) / BigInt(10000);
          console.log(`   Refund Available: ${ethers.formatEther(refundAmount)} ETH per player (90%)`);
          console.log(`   Platform Fee: ${ethers.formatEther(platformFeePerPlayer)} ETH per player (10%)`);
        }
      } else if (game.status === 1) {
        console.log(`\n🔄 Calculation in Progress:`);
        console.log(`   Status: Winner calculation started`);
        console.log(`   Note: Waiting for FHE oracle callback`);
      }
      
      // Additional info for open games
      if (game.status === 0) {
        const canFinalize = (game.playerCount === game.maxPlayers) || 
                          (now > deadline && game.playerCount > 0);
        console.log(`\n🎯 Game Status:`);
        console.log(`   Can Finalize: ${canFinalize ? "✅ Yes" : "❌ No"}`);
        if (canFinalize) {
          if (game.playerCount === game.maxPlayers) {
            console.log(`   Trigger: Max players reached`);
          } else if (now > deadline && game.playerCount > 0) {
            console.log(`   Trigger: Deadline passed with players`);
          }
        }
      }
    }

    // Summary statistics
    console.log(`\n${"=".repeat(50)}`);
    console.log(`📈 SUMMARY STATISTICS:`);
    console.log(`${"=".repeat(50)}`);
    
    const allGames = [];
    for (let i = 0; i < totalGames; i++) {
      const game = await gameFactory.games(i);
      allGames.push(game);
    }
    
    const statusCounts = {
      open: allGames.filter(g => g.status === 0).length,
      calculating: allGames.filter(g => g.status === 1).length,
      finished: allGames.filter(g => g.status === 2).length,
      claimed: allGames.filter(g => g.status === 3).length
    };
    
    console.log(`📊 Games by Status:`);
    console.log(`   🟢 Open: ${statusCounts.open}`);
    console.log(`   🟡 Calculating: ${statusCounts.calculating}`);
    console.log(`   🔵 Finished: ${statusCounts.finished}`);
    console.log(`   ✅ Prize Claimed: ${statusCounts.claimed}`);
    
    // Platform statistics
    const platformFees = await gameFactory.getPlatformFees();
    console.log(`\n💰 Platform Statistics:`);
    console.log(`   Accumulated Fees: ${ethers.formatEther(platformFees)} ETH`);
    console.log(`   Contract Owner: ${await gameFactory.owner()}`);
    
    return { totalGames, statusCounts, platformFees: ethers.formatEther(platformFees) };
  });

// Debug callback status
task("game:debug-callbacks", "Debug callback status and errors")
  .addOptionalParam("id", "Game ID to check (if not provided, shows global stats)", undefined, types.int)
  .addOptionalParam("address", "Contract address")
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { ethers } = hre;

    const contractAddress = taskArgs.address || (await hre.deployments.get("UniqueNumberGameFactory")).address;
    const gameFactory = await ethers.getContractAt("UniqueNumberGameFactory", contractAddress);

    console.log(`\n🔍 Callback Debug Information`);
    console.log(`Contract: ${contractAddress}`);
    
    // Global callback statistics - removed for optimization
    
    if (taskArgs.id !== undefined) {
      // Specific game debug info
      console.log(`\n🎮 Game ${taskArgs.id} Debug Info:`);
      try {
        const debugInfo = await gameFactory.getCallbackDebugInfo(taskArgs.id);
        console.log(`Is Decryption Pending: ${debugInfo.isPending}`);
        console.log(`Latest Request ID: ${debugInfo.requestId}`);
        
        if (debugInfo.lastError && debugInfo.lastError.length > 0) {
          console.log(`\n❌ Last Error:`);
          console.log(`${debugInfo.lastError}`);
        } else {
          console.log(`Last Error: None`);
        }
        
        // Game status
        const game = await gameFactory.games(taskArgs.id);
        console.log(`\n📊 Game Status:`);
        console.log(`Status: ${["Open", "Calculating", "Finished", "PrizeClaimed"][Number(game.status)]}`);
        console.log(`Player Count: ${game.playerCount}`);
        
      } catch (error) {
        console.log(`Error fetching game debug info: ${error}`);
      }
    } else {
      // Check all games with pending decryptions
      console.log(`\n🔄 Checking all games for pending decryptions...`);
      try {
        const gameCounter = await gameFactory.gameCounter();
        const totalGames = Number(gameCounter);
        
        let pendingGames = [];
        for (let i = 0; i < totalGames; i++) {
          try {
            const debugInfo = await gameFactory.getCallbackDebugInfo(i);
            if (debugInfo.isPending) {
              pendingGames.push({
                gameId: i,
                requestId: debugInfo.requestId,
                lastError: debugInfo.lastError
              });
            }
          } catch (error) {
            // Skip games that don't exist or can't be read
          }
        }
        
        if (pendingGames.length > 0) {
          console.log(`\n⏳ Games with Pending Decryptions:`);
          pendingGames.forEach(game => {
            console.log(`Game ${game.gameId}: Request ID ${game.requestId}`);
            if (game.lastError && game.lastError.length > 0) {
              console.log(`  Last Error: ${game.lastError}`);
            }
          });
        } else {
          console.log(`✅ No games have pending decryptions`);
        }
        
      } catch (error) {
        console.log(`Error checking pending games: ${error}`);
      }
    }
  });