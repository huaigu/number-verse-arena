import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("WinnerCalculatorTest - Isolated Logic Testing", function () {
  // Fixture to deploy the lightweight test contract
  async function deployTestContractFixture() {
    const [deployer, alice, bob, charlie, david] = await ethers.getSigners();

    const WinnerCalculatorTest = await ethers.getContractFactory("WinnerCalculatorTest");
    const calculator = await WinnerCalculatorTest.deploy();

    return {
      calculator,
      deployer,
      alice,
      bob,
      charlie,
      david
    };
  }

  describe("Basic Winner Calculation", function () {
    it("should find winner when one player has unique minimum number", async function () {
      const { calculator, alice, bob, charlie } = await loadFixture(deployTestContractFixture);

      // Test scenario: [3, 1, 5] - unique minimum is 1 (bob's submission)
      const decryptedNumbers = [3, 1, 5];
      const playerAddresses = [alice.address, bob.address, charlie.address];

      const result = await calculator.calculateUniqueMinWinner(decryptedNumbers, playerAddresses);
      
      expect(result.winnerAddress).to.equal(bob.address);
      expect(result.winningNumber).to.equal(1);
    });

    it("should return no winner when all numbers are duplicated", async function () {
      const { calculator, alice, bob, charlie } = await loadFixture(deployTestContractFixture);

      // Test scenario: [5, 5, 5] - all same number, no unique winner
      const decryptedNumbers = [5, 5, 5];
      const playerAddresses = [alice.address, bob.address, charlie.address];

      const result = await calculator.calculateUniqueMinWinner(decryptedNumbers, playerAddresses);
      
      expect(result.winnerAddress).to.equal(ethers.ZeroAddress);
      expect(result.winningNumber).to.equal(0);
    });

    it("should return no winner when no unique numbers exist", async function () {
      const { calculator, alice, bob, charlie, david } = await loadFixture(deployTestContractFixture);

      // Test scenario: [1, 1, 2, 2] - no unique numbers
      const decryptedNumbers = [1, 1, 2, 2];
      const playerAddresses = [alice.address, bob.address, charlie.address, david.address];

      const result = await calculator.calculateUniqueMinWinner(decryptedNumbers, playerAddresses);
      
      expect(result.winnerAddress).to.equal(ethers.ZeroAddress);
      expect(result.winningNumber).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("should handle single player scenario", async function () {
      const { calculator, alice } = await loadFixture(deployTestContractFixture);

      // Test scenario: [7] - single player should win with their number
      const decryptedNumbers = [7];
      const playerAddresses = [alice.address];

      const result = await calculator.calculateUniqueMinWinner(decryptedNumbers, playerAddresses);
      
      expect(result.winnerAddress).to.equal(alice.address);
      expect(result.winningNumber).to.equal(7);
    });

    it("should handle all unique numbers scenario", async function () {
      const { calculator, alice, bob, charlie, david } = await loadFixture(deployTestContractFixture);

      // Test scenario: [3, 1, 5, 2] - all unique, minimum is 1 (bob)
      const decryptedNumbers = [3, 1, 5, 2];
      const playerAddresses = [alice.address, bob.address, charlie.address, david.address];

      const result = await calculator.calculateUniqueMinWinner(decryptedNumbers, playerAddresses);
      
      expect(result.winnerAddress).to.equal(bob.address);
      expect(result.winningNumber).to.equal(1);
    });

    it("should handle mixed scenario with some duplicates", async function () {
      const { calculator, alice, bob, charlie, david } = await loadFixture(deployTestContractFixture);

      // Test scenario: [5, 3, 5, 2] - unique numbers are [3, 2], minimum unique is 2 (david)
      const decryptedNumbers = [5, 3, 5, 2];
      const playerAddresses = [alice.address, bob.address, charlie.address, david.address];

      const result = await calculator.calculateUniqueMinWinner(decryptedNumbers, playerAddresses);
      
      expect(result.winnerAddress).to.equal(david.address);
      expect(result.winningNumber).to.equal(2);
    });

    it("should revert with empty arrays", async function () {
      const { calculator } = await loadFixture(deployTestContractFixture);

      const decryptedNumbers: number[] = [];
      const playerAddresses: string[] = [];

      await expect(
        calculator.calculateUniqueMinWinner(decryptedNumbers, playerAddresses)
      ).to.be.revertedWith("Empty decrypted numbers array");
    });

    it("should revert with mismatched array lengths", async function () {
      const { calculator, alice, bob } = await loadFixture(deployTestContractFixture);

      const decryptedNumbers = [1, 2, 3];
      const playerAddresses = [alice.address, bob.address]; // One less address

      await expect(
        calculator.calculateUniqueMinWinner(decryptedNumbers, playerAddresses)
      ).to.be.revertedWith("Arrays length mismatch");
    });
  });

  describe("Complex Scenarios", function () {
    it("should handle repeated minimum values correctly", async function () {
      const { calculator, alice, bob, charlie, david } = await loadFixture(deployTestContractFixture);

      // Test scenario: [1, 1, 2, 3] - minimum value 1 is repeated, so unique minimum is 2
      const decryptedNumbers = [1, 1, 2, 3];
      const playerAddresses = [alice.address, bob.address, charlie.address, david.address];

      const result = await calculator.calculateUniqueMinWinner(decryptedNumbers, playerAddresses);
      
      expect(result.winnerAddress).to.equal(charlie.address);
      expect(result.winningNumber).to.equal(2);
    });

    it("should find correct winner when unique minimum appears later in array", async function () {
      const { calculator } = await loadFixture(deployTestContractFixture);

      const signers = await ethers.getSigners();
      const addresses = signers.slice(0, 5).map(s => s.address);

      // Test scenario: [10, 3, 7, 3, 5] - unique numbers are [10, 7, 5], minimum unique is 5
      const decryptedNumbers = [10, 3, 7, 3, 5];

      const result = await calculator.calculateUniqueMinWinner(decryptedNumbers, addresses);
      
      expect(result.winnerAddress).to.equal(addresses[4]); // Last player with number 5
      expect(result.winningNumber).to.equal(5);
    });

    it("should handle zero values correctly", async function () {
      const { calculator, alice, bob, charlie } = await loadFixture(deployTestContractFixture);

      // Test scenario: [0, 1, 0] - unique minimum is 1
      const decryptedNumbers = [0, 1, 0];
      const playerAddresses = [alice.address, bob.address, charlie.address];

      const result = await calculator.calculateUniqueMinWinner(decryptedNumbers, playerAddresses);
      
      expect(result.winnerAddress).to.equal(bob.address);
      expect(result.winningNumber).to.equal(1);
    });

    it("should handle maximum uint32 values", async function () {
      const { calculator, alice, bob, charlie } = await loadFixture(deployTestContractFixture);

      // Test with maximum uint32 values: max, max-1, max
      const maxUint32 = 4294967295;
      const decryptedNumbers = [maxUint32, maxUint32 - 1, maxUint32];
      const playerAddresses = [alice.address, bob.address, charlie.address];

      const result = await calculator.calculateUniqueMinWinner(decryptedNumbers, playerAddresses);
      
      expect(result.winnerAddress).to.equal(bob.address);
      expect(result.winningNumber).to.equal(maxUint32 - 1);
    });
  });

  describe("Debug Helper Functions", function () {
    it("should correctly count number occurrences", async function () {
      const { calculator } = await loadFixture(deployTestContractFixture);

      // Test scenario: [1, 2, 1, 3, 2, 1] - should show 1:3, 2:2, 3:1
      const decryptedNumbers = [1, 2, 1, 3, 2, 1];

      const result = await calculator.getNumberCounts(decryptedNumbers);
      
      // Check that we got the right counts
      expect(result.numbers.length).to.equal(3);
      expect(result.counts.length).to.equal(3);

      // Find the index for each number and verify counts
      for (let i = 0; i < result.numbers.length; i++) {
        const number = result.numbers[i];
        const count = result.counts[i];
        
        if (number === 1n) {
          expect(count).to.equal(3);
        } else if (number === 2n) {
          expect(count).to.equal(2);
        } else if (number === 3n) {
          expect(count).to.equal(1);
        }
      }
    });

    it("should handle all same numbers in count function", async function () {
      const { calculator } = await loadFixture(deployTestContractFixture);

      const decryptedNumbers = [5, 5, 5, 5];

      const result = await calculator.getNumberCounts(decryptedNumbers);
      
      expect(result.numbers.length).to.equal(1);
      expect(result.numbers[0]).to.equal(5);
      expect(result.counts[0]).to.equal(4);
    });
  });

  describe("Comprehensive Integration Test", function () {
    it("should work correctly with a realistic game scenario", async function () {
      const { calculator } = await loadFixture(deployTestContractFixture);

      // Simulate a 6-player game where players submit: [3, 1, 7, 1, 5, 3]
      // Expected: unique numbers are [7, 5], minimum unique is 5 (player at index 4)
      const decryptedNumbers = [3, 1, 7, 1, 5, 3];
      
      const signers = await ethers.getSigners();
      const playerAddresses = signers.slice(0, 6).map(s => s.address);

      const result = await calculator.calculateUniqueMinWinner(decryptedNumbers, playerAddresses);
      
      expect(result.winnerAddress).to.equal(playerAddresses[4]);
      expect(result.winningNumber).to.equal(5);

      console.log(`🎯 Winner: ${result.winnerAddress} with number ${result.winningNumber}`);
    });

    it("should handle tie scenario (no unique numbers)", async function () {
      const { calculator } = await loadFixture(deployTestContractFixture);

      // Simulate scenario where all numbers are duplicated: [2, 4, 2, 4]
      const decryptedNumbers = [2, 4, 2, 4];
      
      const signers = await ethers.getSigners();
      const playerAddresses = signers.slice(0, 4).map(s => s.address);

      const result = await calculator.calculateUniqueMinWinner(decryptedNumbers, playerAddresses);
      
      expect(result.winnerAddress).to.equal(ethers.ZeroAddress);
      expect(result.winningNumber).to.equal(0);

      console.log(`🤝 No winner - all numbers are duplicated`);
    });
  });
});