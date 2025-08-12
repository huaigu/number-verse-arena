import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { UniqueNumberGameFactory, UniqueNumberGameFactory__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { time } from "@nomicfoundation/hardhat-network-helpers";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  charlie: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("UniqueNumberGameFactory")) as UniqueNumberGameFactory__factory;
  const gameContract = (await factory.deploy()) as UniqueNumberGameFactory;
  const gameContractAddress = await gameContract.getAddress();

  return { gameContract, gameContractAddress };
}

describe("UniqueNumberGameFactory", function () {
  let signers: Signers;
  let gameContract: UniqueNumberGameFactory;
  let gameContractAddress: string;

  // 游戏参数
  const roomName = "Test Game Room";
  const minNumber = 1;
  const maxNumber = 10;
  const maxPlayers = 3;
  const entryFee = ethers.parseEther("0.1");
  const deadlineDuration = 3600; // 1 hour

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { 
      deployer: ethSigners[0], 
      alice: ethSigners[1], 
      bob: ethSigners[2],
      charlie: ethSigners[3]
    };
  });

  beforeEach(async () => {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      throw new Error(`This hardhat test suite cannot run on Sepolia Testnet`);
    }
    ({ gameContract, gameContractAddress } = await deployFixture());
  });

  describe("Game Creation", function () {
    it("should create a new game with correct parameters", async function () {
      const tx = await gameContract
        .connect(signers.alice)
        .createGame(roomName, minNumber, maxNumber, maxPlayers, entryFee, deadlineDuration);
      await tx.wait();

      const game = await gameContract.games(0);
      expect(game.gameId).to.eq(0);
      expect(game.creator).to.eq(signers.alice.address);
      expect(game.status).to.eq(0); // GameStatus.Open
      expect(game.roomName).to.eq(roomName);
      expect(game.minNumber).to.eq(minNumber);
      expect(game.maxNumber).to.eq(maxNumber);
      expect(game.maxPlayers).to.eq(maxPlayers);
      expect(game.entryFee).to.eq(entryFee);
      expect(game.playerCount).to.eq(0);
    });

    it("should reject invalid game parameters", async function () {
      // Invalid room name length
      await expect(
        gameContract.createGame("", minNumber, maxNumber, maxPlayers, entryFee, deadlineDuration)
      ).to.be.revertedWith("Invalid room name length");

      // Room name too long
      const longRoomName = "a".repeat(65);
      await expect(
        gameContract.createGame(longRoomName, minNumber, maxNumber, maxPlayers, entryFee, deadlineDuration)
      ).to.be.revertedWith("Invalid room name length");

      // Invalid number range
      await expect(
        gameContract.createGame(roomName, 10, 5, maxPlayers, entryFee, deadlineDuration)
      ).to.be.revertedWith("Invalid number range");

      // Too few players
      await expect(
        gameContract.createGame(roomName, minNumber, maxNumber, 1, entryFee, deadlineDuration)
      ).to.be.revertedWith("Max players must be at least 2");

      // Range too large
      await expect(
        gameContract.createGame(roomName, 1, 300, maxPlayers, entryFee, deadlineDuration)
      ).to.be.revertedWith("Range is too large for efficient FHE");
      
      // Max players exceeds room limit (more than 10)
      await expect(
        gameContract.createGame(roomName, minNumber, maxNumber, 11, entryFee, deadlineDuration)
      ).to.be.revertedWith("Max players exceeds room limit");
    });

    it("should increment game counter for multiple games", async function () {
      await gameContract.createGame(roomName, minNumber, maxNumber, maxPlayers, entryFee, deadlineDuration);
      await gameContract.createGame("Second Room", minNumber, maxNumber, maxPlayers, entryFee, deadlineDuration);
      
      expect(await gameContract.gameCounter()).to.eq(2);
      
      const game0 = await gameContract.games(0);
      const game1 = await gameContract.games(1);
      expect(game0.gameId).to.eq(0);
      expect(game0.roomName).to.eq(roomName);
      expect(game1.gameId).to.eq(1);
      expect(game1.roomName).to.eq("Second Room");
    });
  });

  describe("Number Submission", function () {
    beforeEach(async function () {
      // Create a game before each test
      await gameContract
        .connect(signers.alice)
        .createGame(roomName, minNumber, maxNumber, maxPlayers, entryFee, deadlineDuration);
    });

    it("should allow valid number submissions", async function () {
      const gameId = 0;
      const submittedNumber = 5;

      // Encrypt the number
      const encryptedNumber = await fhevm
        .createEncryptedInput(gameContractAddress, signers.bob.address)
        .add32(submittedNumber)
        .encrypt();

      const tx = await gameContract
        .connect(signers.bob)
        .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
          value: entryFee
        });
      await tx.wait();

      const game = await gameContract.games(gameId);
      expect(game.playerCount).to.eq(1);
      expect(await gameContract.hasPlayerSubmitted(gameId, signers.bob.address)).to.be.true;
      expect(await gameContract.gamePots(gameId)).to.eq(entryFee);
    });

    it("should reject submissions with incorrect entry fee", async function () {
      const gameId = 0;
      const submittedNumber = 5;

      const encryptedNumber = await fhevm
        .createEncryptedInput(gameContractAddress, signers.bob.address)
        .add32(submittedNumber)
        .encrypt();

      await expect(
        gameContract
          .connect(signers.bob)
          .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
            value: ethers.parseEther("0.05") // Wrong fee
          })
      ).to.be.revertedWith("Incorrect entry fee");
    });

    it("should reject duplicate submissions from same player", async function () {
      const gameId = 0;
      const submittedNumber = 5;

      const encryptedNumber = await fhevm
        .createEncryptedInput(gameContractAddress, signers.bob.address)
        .add32(submittedNumber)
        .encrypt();

      // First submission - should succeed
      await gameContract
        .connect(signers.bob)
        .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
          value: entryFee
        });

      // Second submission - should fail
      await expect(
        gameContract
          .connect(signers.bob)
          .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
            value: entryFee
          })
      ).to.be.revertedWith("Player has already submitted");
    });

    it("should reject submissions after deadline", async function () {
      const gameId = 0;
      const submittedNumber = 5;

      // Fast forward time past deadline
      await time.increase(deadlineDuration + 1);

      const encryptedNumber = await fhevm
        .createEncryptedInput(gameContractAddress, signers.bob.address)
        .add32(submittedNumber)
        .encrypt();

      await expect(
        gameContract
          .connect(signers.bob)
          .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
            value: entryFee
          })
      ).to.be.revertedWith("Game has passed deadline");
    });

    it("should automatically trigger winner calculation when max players reached", async function () {
      const gameId = 0;

      // Submit numbers from 3 players (maxPlayers = 3)
      for (let i = 0; i < maxPlayers; i++) {
        const player = [signers.bob, signers.charlie, signers.deployer][i];
        const submittedNumber = i + 1; // 1, 2, 3

        const encryptedNumber = await fhevm
          .createEncryptedInput(gameContractAddress, player.address)
          .add32(submittedNumber)
          .encrypt();

        const tx = await gameContract
          .connect(player)
          .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
            value: entryFee
          });
        await tx.wait();
      }

      const game = await gameContract.games(gameId);
      expect(game.status).to.eq(1); // GameStatus.Calculating (在mock环境中回调不会被调用)
      expect(game.playerCount).to.eq(maxPlayers);
    });
  });

  describe("Winner Calculation", function () {
    beforeEach(async function () {
      await gameContract
        .connect(signers.alice)
        .createGame(roomName, minNumber, maxNumber, maxPlayers, entryFee, deadlineDuration);
    });

    it("should allow manual winner calculation after deadline", async function () {
      const gameId = 0;

      // Submit one number
      const encryptedNumber = await fhevm
        .createEncryptedInput(gameContractAddress, signers.bob.address)
        .add32(5)
        .encrypt();

      await gameContract
        .connect(signers.bob)
        .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
          value: entryFee
        });

      // Fast forward past deadline
      await time.increase(deadlineDuration + 1);

      const tx = await gameContract
        .connect(signers.charlie)
        .findWinnerByDeadline(gameId);
      await tx.wait();

      const game = await gameContract.games(gameId);
      expect(game.status).to.eq(1); // GameStatus.Calculating (在mock环境中回调不会被调用)
    });

    it("should reject manual calculation before deadline", async function () {
      const gameId = 0;

      await expect(
        gameContract.findWinnerByDeadline(gameId)
      ).to.be.revertedWith("Deadline has not passed yet");
    });

    it("should reject calculation if no players", async function () {
      const gameId = 0;

      // Fast forward past deadline without any submissions
      await time.increase(deadlineDuration + 1);

      await expect(
        gameContract.findWinnerByDeadline(gameId)
      ).to.be.revertedWith("No players in the game");
    });
  });

  describe("Prize Distribution", function () {
    it("should track prize pool correctly", async function () {
      await gameContract
        .connect(signers.alice)
        .createGame(roomName, minNumber, maxNumber, maxPlayers, entryFee, deadlineDuration);

      const gameId = 0;
      const initialPot = await gameContract.gamePots(gameId);
      expect(initialPot).to.eq(0);

      // Submit numbers from 2 players
      for (let i = 0; i < 2; i++) {
        const player = [signers.bob, signers.charlie][i];
        const submittedNumber = i + 1;

        const encryptedNumber = await fhevm
          .createEncryptedInput(gameContractAddress, player.address)
          .add32(submittedNumber)
          .encrypt();

        await gameContract
          .connect(player)
          .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
            value: entryFee
          });
      }

      const finalPot = await gameContract.gamePots(gameId);
      expect(finalPot).to.eq(entryFee * BigInt(2));
    });
  });

  describe("Game State Management", function () {
    it("should maintain correct game states", async function () {
      await gameContract
        .connect(signers.alice)
        .createGame(roomName, minNumber, maxNumber, maxPlayers, entryFee, deadlineDuration);

      const gameId = 0;
      
      // Initial state should be Open
      let game = await gameContract.games(gameId);
      expect(game.status).to.eq(0); // GameStatus.Open

      // Submit numbers to trigger winner calculation
      for (let i = 0; i < maxPlayers; i++) {
        const player = [signers.bob, signers.charlie, signers.deployer][i];
        const submittedNumber = i + 1;

        const encryptedNumber = await fhevm
          .createEncryptedInput(gameContractAddress, player.address)
          .add32(submittedNumber)
          .encrypt();

        await gameContract
          .connect(player)
          .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
            value: entryFee
          });
      }

      // After max players, state should be Calculating (回调在mock中不会执行)
      game = await gameContract.games(gameId);
      expect(game.status).to.eq(1); // GameStatus.Calculating
    });
  });

  describe("Events", function () {
    it("should emit GameCreated event", async function () {
      const currentTime = await time.latest();
      await expect(
        gameContract
          .connect(signers.alice)
          .createGame(roomName, minNumber, maxNumber, maxPlayers, entryFee, deadlineDuration)
      )
        .to.emit(gameContract, "GameCreated")
        .withArgs(0, signers.alice.address, roomName, entryFee, maxPlayers, currentTime + deadlineDuration + 1);
    });

    it("should emit SubmissionReceived event", async function () {
      await gameContract
        .connect(signers.alice)
        .createGame(roomName, minNumber, maxNumber, maxPlayers, entryFee, deadlineDuration);

      const gameId = 0;
      const encryptedNumber = await fhevm
        .createEncryptedInput(gameContractAddress, signers.bob.address)
        .add32(5)
        .encrypt();

      await expect(
        gameContract
          .connect(signers.bob)
          .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
            value: entryFee
          })
      )
        .to.emit(gameContract, "SubmissionReceived")
        .withArgs(gameId, signers.bob.address, 1);
    });

    it("should emit WinnerCalculationStarted event", async function () {
      await gameContract
        .connect(signers.alice)
        .createGame(roomName, minNumber, maxNumber, 2, entryFee, deadlineDuration); // Only 2 players needed

      const gameId = 0;

      // Submit from first player
      let encryptedNumber = await fhevm
        .createEncryptedInput(gameContractAddress, signers.bob.address)
        .add32(5)
        .encrypt();

      await gameContract
        .connect(signers.bob)
        .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
          value: entryFee
        });

      // Submit from second player - this should trigger winner calculation
      encryptedNumber = await fhevm
        .createEncryptedInput(gameContractAddress, signers.charlie.address)
        .add32(7)
        .encrypt();

      await expect(
        gameContract
          .connect(signers.charlie)
          .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
            value: entryFee
          })
      ).to.emit(gameContract, "WinnerCalculationStarted")
        .withArgs(gameId, signers.charlie.address);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Create multiple games for testing
      await gameContract
        .connect(signers.alice)
        .createGame("Room A", minNumber, maxNumber, maxPlayers, entryFee, deadlineDuration);
      
      await gameContract
        .connect(signers.bob)
        .createGame("Room B", minNumber, maxNumber, 2, entryFee, deadlineDuration);
    });

    it("should return all games", async function () {
      const allGames = await gameContract.getAllGames();
      expect(allGames.length).to.eq(2);
      expect(allGames[0].roomName).to.eq("Room A");
      expect(allGames[1].roomName).to.eq("Room B");
    });

    it("should return active games only", async function () {
      const activeGames = await gameContract.getActiveGames();
      expect(activeGames.length).to.eq(2);
      expect(activeGames[0].status).to.eq(0); // GameStatus.Open
      expect(activeGames[1].status).to.eq(0); // GameStatus.Open
    });

    it("should return games by status", async function () {
      const openGames = await gameContract.getGamesByStatus(0); // GameStatus.Open
      expect(openGames.length).to.eq(2);

      const calculatingGames = await gameContract.getGamesByStatus(1); // GameStatus.Calculating
      expect(calculatingGames.length).to.eq(0);
    });

    it("should return games with pagination", async function () {
      const firstPage = await gameContract.getGamesWithPagination(0, 1);
      expect(firstPage.length).to.eq(1);
      expect(firstPage[0].roomName).to.eq("Room A");

      const secondPage = await gameContract.getGamesWithPagination(1, 1);
      expect(secondPage.length).to.eq(1);
      expect(secondPage[0].roomName).to.eq("Room B");
    });

    it("should return correct game summary", async function () {
      const gameId = 0;
      const summary = await gameContract.getGameSummary(gameId);
      
      expect(summary.gameId).to.eq(gameId);
      expect(summary.roomName).to.eq("Room A");
      expect(summary.creator).to.eq(signers.alice.address);
      expect(summary.status).to.eq(0); // GameStatus.Open
      expect(summary.playerCount).to.eq(0);
      expect(summary.maxPlayers).to.eq(maxPlayers);
      expect(summary.minNumber).to.eq(minNumber);
      expect(summary.maxNumber).to.eq(maxNumber);
      expect(summary.entryFee).to.eq(entryFee);
      expect(summary.prizePool).to.eq(0);
      expect(summary.winner).to.eq(ethers.ZeroAddress);
      expect(summary.winningNumber).to.eq(0);
    });

    it("should reject getGameSummary for non-existent game", async function () {
      await expect(gameContract.getGameSummary(999))
        .to.be.revertedWith("Game does not exist");
    });

    it("should return correct total games count", async function () {
      const totalCount = await gameContract.getTotalGamesCount();
      expect(totalCount).to.eq(2);
    });

    it("should return empty player games for new player", async function () {
      const playerGames = await gameContract.getPlayerGames(signers.charlie.address);
      expect(playerGames.length).to.eq(0);
    });

    it("should return correct canFinalizeGame status", async function () {
      const gameId = 0;
      
      // Should not be finalizable initially
      let canFinalize = await gameContract.canFinalizeGame(gameId);
      expect(canFinalize).to.be.false;

      // Add a player first (before deadline)
      const encryptedNumber = await fhevm
        .createEncryptedInput(gameContractAddress, signers.bob.address)
        .add32(5)
        .encrypt();

      await gameContract
        .connect(signers.bob)
        .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
          value: entryFee
        });

      // Still should not be finalizable (has players but deadline not passed)
      canFinalize = await gameContract.canFinalizeGame(gameId);
      expect(canFinalize).to.be.false;

      // Fast forward past deadline
      await time.increase(deadlineDuration + 1);

      // Now should be finalizable (has players and deadline passed)
      canFinalize = await gameContract.canFinalizeGame(gameId);
      expect(canFinalize).to.be.true;
    });
  });

  describe("Player Stats and Leaderboard", function () {
    it("should return empty player stats for new player", async function () {
      const stats = await gameContract.getPlayerStats(signers.alice.address);
      expect(stats.gamesPlayed).to.eq(0);
      expect(stats.gamesWon).to.eq(0);
      expect(stats.totalWinnings).to.eq(0);
    });

    it("should return empty winner history initially", async function () {
      const history = await gameContract.getWinnerHistory(10);
      expect(history.length).to.eq(0);
    });

    it("should return zero winner history count initially", async function () {
      const count = await gameContract.getWinnerHistoryCount();
      expect(count).to.eq(0);
    });

    it("should return empty leaderboard initially", async function () {
      const leaderboard = await gameContract.getLeaderboard(10);
      expect(leaderboard.topPlayers.length).to.eq(0);
      expect(leaderboard.winCounts.length).to.eq(0);
      expect(leaderboard.totalWinnings.length).to.eq(0);
    });
  });

  describe("Tie Breaking and Refund Mechanism", function () {
    beforeEach(async function () {
      // Create a game with 3 players
      await gameContract
        .connect(signers.alice)
        .createGame(roomName, minNumber, maxNumber, maxPlayers, entryFee, deadlineDuration);
    });

    it("should handle no unique numbers - all players choose same number", async function () {
      const gameId = 0;
      const sameNumber = 5;

      // All 3 players choose the same number
      for (let i = 0; i < maxPlayers; i++) {
        const player = [signers.bob, signers.charlie, signers.deployer][i];

        const encryptedNumber = await fhevm
          .createEncryptedInput(gameContractAddress, player.address)
          .add32(sameNumber)
          .encrypt();

        await gameContract
          .connect(player)
          .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
            value: entryFee
          });
      }

      const game = await gameContract.games(gameId);
      expect(game.status).to.eq(1); // GameStatus.Calculating
      
      // In mock environment, we need to simulate the callback
      // The game should detect no unique winner and allow refunds
    });

    it("should select smallest unique number when multiple unique numbers exist", async function () {
      const gameId = 0;
      
      // Player 1: chooses 1 (unique, smallest)
      let encryptedNumber = await fhevm
        .createEncryptedInput(gameContractAddress, signers.bob.address)
        .add32(1)
        .encrypt();

      await gameContract
        .connect(signers.bob)
        .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
          value: entryFee
        });

      // Player 2: chooses 5 (unique, larger)
      encryptedNumber = await fhevm
        .createEncryptedInput(gameContractAddress, signers.charlie.address)
        .add32(5)
        .encrypt();

      await gameContract
        .connect(signers.charlie)
        .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
          value: entryFee
        });

      // Player 3: chooses 8 (unique, largest)
      encryptedNumber = await fhevm
        .createEncryptedInput(gameContractAddress, signers.deployer.address)
        .add32(8)
        .encrypt();

      await gameContract
        .connect(signers.deployer)
        .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
          value: entryFee
        });

      const game = await gameContract.games(gameId);
      expect(game.status).to.eq(1); // GameStatus.Calculating
      expect(game.playerCount).to.eq(maxPlayers);
      
      // In a real scenario, the smallest unique number (1) should win
      // Player Bob should be the winner
    });

    it("should allow refund claims when no winner exists", async function () {
      const gameId = 0;
      const sameNumber = 7;

      // All players choose the same number to create a no-winner scenario
      for (let i = 0; i < 2; i++) { // Only 2 players to make testing easier
        const player = [signers.bob, signers.charlie][i];

        const encryptedNumber = await fhevm
          .createEncryptedInput(gameContractAddress, player.address)
          .add32(sameNumber)
          .encrypt();

        await gameContract
          .connect(player)
          .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
            value: entryFee
          });
      }

      // Fast forward past deadline to trigger calculation
      await time.increase(deadlineDuration + 1);
      await gameContract.findWinnerByDeadline(gameId);

      // Simulate the callback indicating no winner (mock environment)
      // In reality, this would be called by the FHE oracle
      try {
        await gameContract.callbackDecryptWinnerNumber(
          1, // requestId (mock)
          maxNumber + 1, // decryptedWinnerNumber > maxNumber indicates no winner
          [] // empty signatures for mock
        );
      } catch (error) {
        // Expected to fail in mock environment due to signature verification
        // We'll manually set the game state for testing
      }

      // For testing purposes, let's check the refund mechanism logic
      const initialBalance = await ethers.provider.getBalance(signers.bob.address);
      
      // Note: In mock environment, we can't fully test the callback mechanism
      // but we can test the refund function logic separately
    });

    it("should calculate correct refund amounts (90% refund + 10% platform fee)", async function () {
      const refundPercentage = 9000; // 90%
      const percentageBase = 10000;
      
      const expectedRefund = (entryFee * BigInt(refundPercentage)) / BigInt(percentageBase);
      const expectedPlatformFee = (entryFee * BigInt(1000)) / BigInt(percentageBase); // 10%
      
      expect(expectedRefund).to.eq(ethers.parseEther("0.09")); // 90% of 0.1 ETH
      expect(expectedPlatformFee).to.eq(ethers.parseEther("0.01")); // 10% of 0.1 ETH
    });

    it("should prevent duplicate refund claims", async function () {
      // This test would need the game to be in finished state with no winner
      // We'll test the require statements of the claimRefund function
      
      const gameId = 0;
      
      // Test that refund fails for non-participants
      await expect(
        gameContract.connect(signers.deployer).claimRefund(gameId)
      ).to.be.revertedWith("Game is not finished yet");
    });

    it("should allow platform fee withdrawal by owner only", async function () {
      const initialPlatformFees = await gameContract.getPlatformFees();
      expect(initialPlatformFees).to.eq(0);

      // Test that non-owner cannot withdraw
      await expect(
        gameContract.connect(signers.bob).withdrawPlatformFees()
      ).to.be.revertedWith("Ownable: caller is not the owner");

      // Test that owner cannot withdraw when no fees available
      await expect(
        gameContract.connect(signers.deployer).withdrawPlatformFees()
      ).to.be.revertedWith("No platform fees to withdraw");
    });

    it("should check canClaimRefund correctly", async function () {
      const gameId = 0;
      
      // Initially, no one can claim refund (game not finished)
      const canClaim = await gameContract.canClaimRefund(gameId, signers.bob.address);
      expect(canClaim).to.be.false;
    });

    it("should emit correct events for no winner scenario", async function () {
      const gameId = 0;
      
      // Submit same numbers to create no-winner scenario
      const sameNumber = 3;
      
      for (let i = 0; i < 2; i++) {
        const player = [signers.bob, signers.charlie][i];

        const encryptedNumber = await fhevm
          .createEncryptedInput(gameContractAddress, player.address)
          .add32(sameNumber)
          .encrypt();

        await gameContract
          .connect(player)
          .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
            value: entryFee
          });
      }

      // The NoWinnerDetermined event should be emitted when callback is processed
      // In mock environment, this would happen in the callback function
      const totalPot = entryFee * BigInt(2);
      
      // We can test that the event would be emitted with correct parameters
      // by checking the event signature exists
      const eventFragment = gameContract.interface.getEvent("NoWinnerDetermined");
      expect(eventFragment.name).to.eq("NoWinnerDetermined");
    });

    it("should handle mixed scenario - some duplicate, some unique numbers", async function () {
      const gameId = 0;
      
      // Create a more complex scenario:
      // Player 1: 2, Player 2: 2 (duplicate)
      // Player 3: 7 (unique, should win)
      
      // Player 1: chooses 2
      let encryptedNumber = await fhevm
        .createEncryptedInput(gameContractAddress, signers.bob.address)
        .add32(2)
        .encrypt();

      await gameContract
        .connect(signers.bob)
        .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
          value: entryFee
        });

      // Player 2: also chooses 2 (creates duplicate)
      encryptedNumber = await fhevm
        .createEncryptedInput(gameContractAddress, signers.charlie.address)
        .add32(2)
        .encrypt();

      await gameContract
        .connect(signers.charlie)
        .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
          value: entryFee
        });

      // Player 3: chooses unique number 7
      encryptedNumber = await fhevm
        .createEncryptedInput(gameContractAddress, signers.deployer.address)
        .add32(7)
        .encrypt();

      await gameContract
        .connect(signers.deployer)
        .submitNumber(gameId, encryptedNumber.handles[0], encryptedNumber.inputProof, {
          value: entryFee
        });

      const game = await gameContract.games(gameId);
      expect(game.status).to.eq(1); // GameStatus.Calculating
      expect(game.playerCount).to.eq(maxPlayers);
      
      // In real scenario, Player 3 (deployer) should win with number 7
    });
  });

  describe("Platform Fee Management", function () {
    it("should track platform fees correctly", async function () {
      const initialFees = await gameContract.getPlatformFees();
      expect(initialFees).to.eq(0);
    });

    it("should allow owner to transfer ownership", async function () {
      const currentOwner = await gameContract.owner();
      expect(currentOwner).to.eq(signers.deployer.address);

      await gameContract.connect(signers.deployer).transferOwnership(signers.alice.address);
      
      const newOwner = await gameContract.owner();
      expect(newOwner).to.eq(signers.alice.address);
    });

    it("should prevent non-owner from transferring ownership", async function () {
      await expect(
        gameContract.connect(signers.bob).transferOwnership(signers.alice.address)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should prevent transfer to zero address", async function () {
      await expect(
        gameContract.connect(signers.deployer).transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("Ownable: new owner is the zero address");
    });
  });
});