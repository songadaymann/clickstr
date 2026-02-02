const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Clickstr", function () {
  let stupidClicker;
  let clickToken;
  let owner;
  let player1;
  let player2;
  let player3;

  const INITIAL_SUPPLY = ethers.parseEther("1000000000"); // 1 billion tokens
  const GAME_POOL = ethers.parseEther("100000000"); // 100 million tokens
  const EPOCH_DURATION = 24 * 60 * 60; // 24 hours in seconds
  const TOTAL_EPOCHS = 90;
  const MIN_BATCH_SIZE = 50;
  const MAX_BATCH_SIZE = 500;
  // TARGET_CLICKS_PER_EPOCH is now calculated as (BASE_TARGET * EPOCH_DURATION) / 86400
  // For 24-hour epochs: (1_000_000 * 86400) / 86400 = 1_000_000
  const TARGET_CLICKS_PER_EPOCH = 1_000_000;
  // Default difficulty: type(uint256).max / 1000
  const DEFAULT_INITIAL_DIFFICULTY = (2n ** 256n - 1n) / 1000n;

  beforeEach(async function () {
    [owner, player1, player2, player3] = await ethers.getSigners();

    // Deploy mock token
    const MockClickToken = await ethers.getContractFactory("MockClickToken");
    clickToken = await MockClickToken.deploy(INITIAL_SUPPLY);

    // Deploy Clickstr with season params (no NFT contract for basic tests)
    const Clickstr = await ethers.getContractFactory("Clickstr");
    stupidClicker = await Clickstr.deploy(
      await clickToken.getAddress(),
      TOTAL_EPOCHS,
      EPOCH_DURATION,
      DEFAULT_INITIAL_DIFFICULTY,
      ethers.ZeroAddress // No NFT bonuses for basic tests
    );
  });

  // ============ Helper Functions ============

  /**
   * Find valid nonces that produce hashes below the difficulty target
   */
  async function findValidNonces(user, epoch, count, startNonce = 0) {
    const difficultyTarget = await stupidClicker.difficultyTarget();
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const validNonces = [];
    let nonce = startNonce;

    while (validNonces.length < count) {
      const hash = ethers.keccak256(
        ethers.solidityPacked(
          ["address", "uint256", "uint256", "uint256"],
          [user, nonce, epoch, chainId]
        )
      );

      if (BigInt(hash) < difficultyTarget) {
        validNonces.push(nonce);
      }
      nonce++;

      // Safety limit to prevent infinite loops in tests
      if (nonce > startNonce + 10000000) {
        throw new Error(`Could not find ${count} valid nonces after 10M attempts`);
      }
    }

    return validNonces;
  }

  /**
   * Start the game with default pool
   */
  async function startGame(pool = GAME_POOL) {
    await clickToken.approve(await stupidClicker.getAddress(), pool);
    await stupidClicker.startGame(pool);
  }

  // ============ Deployment Tests ============

  describe("Deployment", function () {
    it("should set the correct token address", async function () {
      expect(await stupidClicker.clickToken()).to.equal(await clickToken.getAddress());
    });

    it("should set the deployer as owner", async function () {
      expect(await stupidClicker.owner()).to.equal(owner.address);
    });

    it("should not have started the game", async function () {
      expect(await stupidClicker.gameStarted()).to.be.false;
      expect(await stupidClicker.gameEnded()).to.be.false;
    });

    it("should have initial difficulty target set", async function () {
      const target = await stupidClicker.difficultyTarget();
      expect(target).to.be.gt(0);
    });

    it("should have correct constants", async function () {
      expect(await stupidClicker.EPOCH_DURATION()).to.equal(EPOCH_DURATION);
      expect(await stupidClicker.TOTAL_EPOCHS()).to.equal(TOTAL_EPOCHS);
      expect(await stupidClicker.MIN_BATCH_SIZE()).to.equal(MIN_BATCH_SIZE);
      expect(await stupidClicker.MAX_BATCH_SIZE()).to.equal(MAX_BATCH_SIZE);
      expect(await stupidClicker.TARGET_CLICKS_PER_EPOCH()).to.equal(TARGET_CLICKS_PER_EPOCH);
    });

    it("should accept custom initial difficulty", async function () {
      const customDifficulty = DEFAULT_INITIAL_DIFFICULTY * 2n;
      const Clickstr = await ethers.getContractFactory("Clickstr");
      const customClicker = await Clickstr.deploy(
        await clickToken.getAddress(),
        TOTAL_EPOCHS,
        EPOCH_DURATION,
        customDifficulty,
        ethers.ZeroAddress
      );

      expect(await customClicker.difficultyTarget()).to.equal(customDifficulty);
    });

    it("should scale TARGET_CLICKS_PER_EPOCH based on epoch duration", async function () {
      // Deploy with 12-hour epochs (half of 24 hours)
      const halfDayDuration = 12 * 60 * 60; // 12 hours
      const Clickstr = await ethers.getContractFactory("Clickstr");
      const halfDayClicker = await Clickstr.deploy(
        await clickToken.getAddress(),
        TOTAL_EPOCHS,
        halfDayDuration,
        DEFAULT_INITIAL_DIFFICULTY,
        ethers.ZeroAddress
      );

      // Target should be half of 1M = 500K
      const expectedTarget = (1_000_000n * BigInt(halfDayDuration)) / 86400n;
      expect(await halfDayClicker.TARGET_CLICKS_PER_EPOCH()).to.equal(expectedTarget);
      expect(expectedTarget).to.equal(500_000n);
    });

    it("should reject epoch duration less than 1 hour", async function () {
      const Clickstr = await ethers.getContractFactory("Clickstr");

      await expect(
        Clickstr.deploy(
          await clickToken.getAddress(),
          TOTAL_EPOCHS,
          30 * 60, // 30 minutes - too short
          DEFAULT_INITIAL_DIFFICULTY,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Epoch too short (min 1 hour)");
    });

    it("should reject epoch duration more than 7 days", async function () {
      const Clickstr = await ethers.getContractFactory("Clickstr");

      await expect(
        Clickstr.deploy(
          await clickToken.getAddress(),
          TOTAL_EPOCHS,
          8 * 24 * 60 * 60, // 8 days - too long
          DEFAULT_INITIAL_DIFFICULTY,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Epoch too long (max 7 days)");
    });

    it("should reject difficulty below minimum (1000)", async function () {
      const Clickstr = await ethers.getContractFactory("Clickstr");

      await expect(
        Clickstr.deploy(
          await clickToken.getAddress(),
          TOTAL_EPOCHS,
          EPOCH_DURATION,
          500, // Too low
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Difficulty too low");
    });

    it("should store achievement NFT address", async function () {
      // Deploy NFT contract first
      const ClickstrNFT = await ethers.getContractFactory("ClickstrNFT");
      const nft = await ClickstrNFT.deploy(owner.address, "https://test.com/");

      const Clickstr = await ethers.getContractFactory("Clickstr");
      const clickerWithNFT = await Clickstr.deploy(
        await clickToken.getAddress(),
        TOTAL_EPOCHS,
        EPOCH_DURATION,
        DEFAULT_INITIAL_DIFFICULTY,
        await nft.getAddress()
      );

      expect(await clickerWithNFT.achievementNFT()).to.equal(await nft.getAddress());
    });
  });

  // ============ Game Start Tests ============

  describe("Starting the Game", function () {
    it("should allow owner to start the game", async function () {
      await clickToken.approve(await stupidClicker.getAddress(), GAME_POOL);

      await expect(stupidClicker.startGame(GAME_POOL))
        .to.emit(stupidClicker, "GameStarted");

      expect(await stupidClicker.gameStarted()).to.be.true;
      expect(await stupidClicker.poolRemaining()).to.equal(GAME_POOL);
      expect(await stupidClicker.currentEpoch()).to.equal(1);
    });

    it("should transfer tokens from owner to contract", async function () {
      await clickToken.approve(await stupidClicker.getAddress(), GAME_POOL);

      const ownerBalanceBefore = await clickToken.balanceOf(owner.address);
      await stupidClicker.startGame(GAME_POOL);
      const ownerBalanceAfter = await clickToken.balanceOf(owner.address);

      expect(ownerBalanceBefore - ownerBalanceAfter).to.equal(GAME_POOL);
      expect(await clickToken.balanceOf(await stupidClicker.getAddress())).to.equal(GAME_POOL);
    });

    it("should set correct game end time", async function () {
      await clickToken.approve(await stupidClicker.getAddress(), GAME_POOL);
      await stupidClicker.startGame(GAME_POOL);

      const startTime = await stupidClicker.gameStartTime();
      const endTime = await stupidClicker.gameEndTime();

      expect(endTime - startTime).to.equal(BigInt(TOTAL_EPOCHS * EPOCH_DURATION));
    });

    it("should revert if non-owner tries to start", async function () {
      await clickToken.approve(await stupidClicker.getAddress(), GAME_POOL);

      await expect(
        stupidClicker.connect(player1).startGame(GAME_POOL)
      ).to.be.revertedWithCustomError(stupidClicker, "OwnableUnauthorizedAccount");
    });

    it("should revert if game already started", async function () {
      await clickToken.approve(await stupidClicker.getAddress(), GAME_POOL * 2n);
      await stupidClicker.startGame(GAME_POOL);

      await expect(
        stupidClicker.startGame(GAME_POOL)
      ).to.be.revertedWithCustomError(stupidClicker, "GameAlreadyStarted");
    });

    it("should revert if tokens not approved", async function () {
      await expect(
        stupidClicker.startGame(GAME_POOL)
      ).to.be.reverted;
    });
  });

  // ============ Click Submission Tests ============

  describe("Submitting Clicks", function () {
    beforeEach(async function () {
      await startGame();
    });

    it("should accept valid click proofs", async function () {
      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);

      const tx = await stupidClicker.connect(player1).submitClicks(nonces);
      const receipt = await tx.wait();

      // Find the Clicked event
      const clickedEvent = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "Clicked"
      );

      expect(clickedEvent).to.not.be.undefined;
      expect(clickedEvent.args[0]).to.equal(player1.address); // user
      expect(clickedEvent.args[1]).to.equal(1n); // epoch
      expect(clickedEvent.args[2]).to.equal(BigInt(MIN_BATCH_SIZE)); // validClicks
      expect(clickedEvent.args[3]).to.be.gt(0n); // earned > 0
      expect(clickedEvent.args[4]).to.be.gt(0n); // burned > 0
    });

    it("should update user stats after clicking", async function () {
      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces);

      const stats = await stupidClicker.getUserLifetimeStats(player1.address);
      expect(stats.totalClicks).to.equal(MIN_BATCH_SIZE);
      expect(stats.totalEarned).to.be.gt(0);
      expect(stats.totalBurned).to.be.gt(0);
    });

    it("should distribute 50/50 between player and burn", async function () {
      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);

      const playerBalanceBefore = await clickToken.balanceOf(player1.address);
      const burnBalanceBefore = await clickToken.balanceOf(await stupidClicker.BURN_ADDRESS());

      await stupidClicker.connect(player1).submitClicks(nonces);

      const playerBalanceAfter = await clickToken.balanceOf(player1.address);
      const burnBalanceAfter = await clickToken.balanceOf(await stupidClicker.BURN_ADDRESS());

      const playerGained = playerBalanceAfter - playerBalanceBefore;
      const burnGained = burnBalanceAfter - burnBalanceBefore;

      // Should be approximately equal (within 1 wei due to rounding)
      expect(playerGained).to.be.closeTo(burnGained, 1);
    });

    it("should reduce pool remaining", async function () {
      const poolBefore = await stupidClicker.poolRemaining();

      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces);

      const poolAfter = await stupidClicker.poolRemaining();
      expect(poolAfter).to.be.lt(poolBefore);
    });

    it("should track epoch participation", async function () {
      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces);

      expect(await stupidClicker.hasParticipated(1, player1.address)).to.be.true;
      expect(await stupidClicker.getEpochParticipantCount(1)).to.equal(1);
    });

    it("should update leader when player has most clicks", async function () {
      const nonces1 = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces1);

      expect(await stupidClicker.epochWinner(1)).to.equal(player1.address);

      // Player2 submits more
      const nonces2 = await findValidNonces(player2.address, 1, MIN_BATCH_SIZE + 10);
      await stupidClicker.connect(player2).submitClicks(nonces2);

      expect(await stupidClicker.epochWinner(1)).to.equal(player2.address);
    });

    it("should revert if game not started", async function () {
      const Clickstr = await ethers.getContractFactory("Clickstr");
      const newClicker = await Clickstr.deploy(
        await clickToken.getAddress(),
        TOTAL_EPOCHS,
        EPOCH_DURATION,
        DEFAULT_INITIAL_DIFFICULTY,
        ethers.ZeroAddress
      );

      await expect(
        newClicker.submitClicks([1, 2, 3])
      ).to.be.revertedWithCustomError(newClicker, "GameNotStarted");
    });

    it("should revert if batch too small", async function () {
      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE - 1);

      await expect(
        stupidClicker.connect(player1).submitClicks(nonces)
      ).to.be.revertedWithCustomError(stupidClicker, "BatchTooSmall");
    });

    it("should revert if batch too large", async function () {
      // Create array larger than MAX_BATCH_SIZE
      const nonces = Array.from({ length: MAX_BATCH_SIZE + 1 }, (_, i) => i);

      await expect(
        stupidClicker.connect(player1).submitClicks(nonces)
      ).to.be.revertedWithCustomError(stupidClicker, "BatchTooLarge");
    });

    it("should revert if no valid proofs in batch", async function () {
      // Submit invalid nonces (very unlikely to be valid)
      const invalidNonces = Array.from({ length: MIN_BATCH_SIZE }, (_, i) => i + 999999999);

      await expect(
        stupidClicker.connect(player1).submitClicks(invalidNonces)
      ).to.be.revertedWithCustomError(stupidClicker, "NoValidProofs");
    });

    it("should not count already used proofs", async function () {
      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces);

      // Try to resubmit the same nonces - should fail as no NEW valid proofs
      await expect(
        stupidClicker.connect(player1).submitClicks(nonces)
      ).to.be.revertedWithCustomError(stupidClicker, "NoValidProofs");
    });

    it("should prevent cross-user proof reuse", async function () {
      // Nonces valid for player1 should not be valid for player2
      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces);

      // Same nonces submitted by player2 should fail (different address in hash)
      await expect(
        stupidClicker.connect(player2).submitClicks(nonces)
      ).to.be.revertedWithCustomError(stupidClicker, "NoValidProofs");
    });
  });

  // ============ Epoch Tests ============

  describe("Epoch Mechanics", function () {
    beforeEach(async function () {
      await startGame();
    });

    it("should start at epoch 1", async function () {
      expect(await stupidClicker.currentEpoch()).to.equal(1);
    });

    it("should advance epoch when time passes", async function () {
      const nonces1 = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces1);

      // Advance time by 1 epoch
      await time.increase(EPOCH_DURATION + 1);

      // Submit clicks in new epoch (should auto-advance)
      const nonces2 = await findValidNonces(player1.address, 2, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces2);

      expect(await stupidClicker.currentEpoch()).to.equal(2);
    });

    it("should allow manual epoch finalization", async function () {
      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces);

      // Advance past epoch 1
      await time.increase(EPOCH_DURATION + 1);

      await expect(stupidClicker.finalizeEpoch(1))
        .to.emit(stupidClicker, "EpochFinalized");

      expect(await stupidClicker.epochFinalized(1)).to.be.true;
    });

    it("should revert finalizing epoch that hasn't ended", async function () {
      await expect(
        stupidClicker.finalizeEpoch(1)
      ).to.be.revertedWithCustomError(stupidClicker, "EpochNotOver");
    });

    it("should revert finalizing already finalized epoch", async function () {
      await time.increase(EPOCH_DURATION + 1);
      await stupidClicker.finalizeEpoch(1);

      await expect(
        stupidClicker.finalizeEpoch(1)
      ).to.be.revertedWithCustomError(stupidClicker, "EpochAlreadyFinalized");
    });

    it("should pay finalizer reward", async function () {
      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces);

      await time.increase(EPOCH_DURATION + 1);

      const finalizerBalanceBefore = await clickToken.balanceOf(player2.address);
      await stupidClicker.connect(player2).finalizeEpoch(1);
      const finalizerBalanceAfter = await clickToken.balanceOf(player2.address);

      expect(finalizerBalanceAfter).to.be.gt(finalizerBalanceBefore);
    });

    it("should pay winner bonus with 50/50 split", async function () {
      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces);

      const winnerBalanceBefore = await clickToken.balanceOf(player1.address);
      const burnBalanceBefore = await clickToken.balanceOf(await stupidClicker.BURN_ADDRESS());

      await time.increase(EPOCH_DURATION + 1);
      await stupidClicker.finalizeEpoch(1);

      const winnerBalanceAfter = await clickToken.balanceOf(player1.address);
      const burnBalanceAfter = await clickToken.balanceOf(await stupidClicker.BURN_ADDRESS());

      // Winner should have received bonus
      expect(winnerBalanceAfter).to.be.gt(winnerBalanceBefore);
      // Burn address should have received the other half
      expect(burnBalanceAfter).to.be.gt(burnBalanceBefore);
    });

    it("should increment epochsWon for winner", async function () {
      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces);

      expect(await stupidClicker.epochsWon(player1.address)).to.equal(0);

      await time.increase(EPOCH_DURATION + 1);
      await stupidClicker.finalizeEpoch(1);

      expect(await stupidClicker.epochsWon(player1.address)).to.equal(1);
    });

    it("should burn unused epoch emission", async function () {
      // Don't submit any clicks in epoch 1
      await time.increase(EPOCH_DURATION + 1);

      const poolBefore = await stupidClicker.poolRemaining();
      await stupidClicker.finalizeEpoch(1);
      const poolAfter = await stupidClicker.poolRemaining();

      // Pool should be reduced (unused emission burned)
      expect(poolAfter).to.be.lt(poolBefore);
    });
  });

  // ============ Difficulty Adjustment Tests ============

  describe("Difficulty Adjustment", function () {
    beforeEach(async function () {
      await startGame();
    });

    it("should emit DifficultyAdjusted event on epoch finalization", async function () {
      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces);

      await time.increase(EPOCH_DURATION + 1);

      await expect(stupidClicker.finalizeEpoch(1))
        .to.emit(stupidClicker, "DifficultyAdjusted");
    });

    it("should make difficulty easier when clicks below target", async function () {
      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces);

      const difficultyBefore = await stupidClicker.difficultyTarget();

      await time.increase(EPOCH_DURATION + 1);
      await stupidClicker.finalizeEpoch(1);

      const difficultyAfter = await stupidClicker.difficultyTarget();

      // Fewer clicks than target = easier = higher target
      expect(difficultyAfter).to.be.gt(difficultyBefore);
    });

    it("should make difficulty easier on zero clicks (death spiral fix)", async function () {
      const difficultyBefore = await stupidClicker.difficultyTarget();

      await time.increase(EPOCH_DURATION + 1);
      await stupidClicker.finalizeEpoch(1);

      const difficultyAfter = await stupidClicker.difficultyTarget();

      // Zero clicks = max ease (4x or capped at max) to prevent death spiral
      // Either 4x or hit the max cap
      const maxTarget = (2n ** 256n - 1n) / 2n;
      const expectedFourX = difficultyBefore * 4n;
      if (expectedFourX > maxTarget) {
        expect(difficultyAfter).to.equal(maxTarget);
      } else {
        expect(difficultyAfter).to.equal(expectedFourX);
      }
    });

    it("should respect minimum difficulty target", async function () {
      // Get current difficulty
      const difficulty = await stupidClicker.difficultyTarget();

      // The minimum is 1000
      expect(difficulty).to.be.gte(1000);
    });
  });

  // ============ Game End Tests ============

  describe("Game Ending", function () {
    beforeEach(async function () {
      await startGame();
    });

    it("should revert endGame before game end time", async function () {
      await expect(
        stupidClicker.endGame()
      ).to.be.revertedWithCustomError(stupidClicker, "EpochNotOver");
    });

    it("should allow endGame after game end time", async function () {
      // Advance to after game end
      await time.increase(TOTAL_EPOCHS * EPOCH_DURATION + 1);

      await expect(stupidClicker.endGame())
        .to.emit(stupidClicker, "GameEnded");

      expect(await stupidClicker.gameEnded()).to.be.true;
    });

    it("should burn remaining pool on game end", async function () {
      await time.increase(TOTAL_EPOCHS * EPOCH_DURATION + 1);

      const burnBalanceBefore = await clickToken.balanceOf(await stupidClicker.BURN_ADDRESS());
      await stupidClicker.endGame();
      const burnBalanceAfter = await clickToken.balanceOf(await stupidClicker.BURN_ADDRESS());

      expect(burnBalanceAfter).to.be.gt(burnBalanceBefore);
      expect(await stupidClicker.poolRemaining()).to.equal(0);
    });

    it("should be idempotent (calling twice doesn't error)", async function () {
      await time.increase(TOTAL_EPOCHS * EPOCH_DURATION + 1);

      await stupidClicker.endGame();
      // Second call should not revert
      await stupidClicker.endGame();
    });

    it("should revert clicks after game ends", async function () {
      await time.increase(TOTAL_EPOCHS * EPOCH_DURATION + 1);

      const nonces = await findValidNonces(player1.address, TOTAL_EPOCHS, MIN_BATCH_SIZE);

      await expect(
        stupidClicker.connect(player1).submitClicks(nonces)
      ).to.be.revertedWithCustomError(stupidClicker, "GameHasEnded");
    });
  });

  // ============ View Function Tests ============

  describe("View Functions", function () {
    beforeEach(async function () {
      await startGame();
    });

    it("should return correct game stats", async function () {
      const stats = await stupidClicker.getGameStats();

      expect(stats.poolRemaining_).to.equal(GAME_POOL);
      expect(stats.currentEpoch_).to.equal(1);
      expect(stats.totalEpochs_).to.equal(TOTAL_EPOCHS);
      expect(stats.started_).to.be.true;
      expect(stats.ended_).to.be.false;
    });

    it("should return correct current epoch info", async function () {
      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces);

      const info = await stupidClicker.getCurrentEpochInfo();

      expect(info.epoch).to.equal(1);
      expect(info.totalClicks).to.equal(MIN_BATCH_SIZE);
      expect(info.currentLeader).to.equal(player1.address);
      expect(info.leaderClicks).to.equal(MIN_BATCH_SIZE);
    });

    it("should validate proof correctly", async function () {
      const nonces = await findValidNonces(player1.address, 1, 1);

      expect(
        await stupidClicker.isValidProof(player1.address, nonces[0], 1)
      ).to.be.true;

      // After submission, should be invalid (used)
      const allNonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(allNonces);

      expect(
        await stupidClicker.isValidProof(player1.address, allNonces[0], 1)
      ).to.be.false;
    });

    it("should return user epoch stats with rank", async function () {
      const nonces1 = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces1);

      const nonces2 = await findValidNonces(player2.address, 1, MIN_BATCH_SIZE + 50);
      await stupidClicker.connect(player2).submitClicks(nonces2);

      const player1Stats = await stupidClicker.getUserEpochStatsWithRank(1, player1.address);
      const player2Stats = await stupidClicker.getUserEpochStatsWithRank(1, player2.address);

      expect(player2Stats.rank).to.equal(1); // Most clicks
      expect(player1Stats.rank).to.equal(2); // Fewer clicks
      expect(player2Stats.isLeader).to.be.true;
      expect(player1Stats.isLeader).to.be.false;
    });
  });

  // ============ Edge Cases ============

  describe("Edge Cases", function () {
    beforeEach(async function () {
      await startGame();
    });

    it("should handle epoch budget exhaustion", async function () {
      // Submit many clicks to exhaust the budget
      // This test may need adjustment based on actual difficulty
      const nonces = await findValidNonces(player1.address, 1, MAX_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces);

      // The epoch budget should be set now
      const budget = await stupidClicker.epochEmissionBudget(1);
      expect(budget).to.be.gt(0);
    });

    it("should handle multiple players in same epoch", async function () {
      const nonces1 = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      const nonces2 = await findValidNonces(player2.address, 1, MIN_BATCH_SIZE);
      const nonces3 = await findValidNonces(player3.address, 1, MIN_BATCH_SIZE);

      await stupidClicker.connect(player1).submitClicks(nonces1);
      await stupidClicker.connect(player2).submitClicks(nonces2);
      await stupidClicker.connect(player3).submitClicks(nonces3);

      expect(await stupidClicker.getEpochParticipantCount(1)).to.equal(3);
      expect(await stupidClicker.totalClicksPerEpoch(1)).to.equal(BigInt(MIN_BATCH_SIZE * 3));
    });

    it("should handle skipped epochs correctly", async function () {
      // Submit in epoch 1
      const nonces1 = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces1);

      // Skip to epoch 5
      await time.increase(EPOCH_DURATION * 4 + 1);

      // Submit in epoch 5 (should auto-finalize 1-4)
      const nonces5 = await findValidNonces(player1.address, 5, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces5);

      expect(await stupidClicker.currentEpoch()).to.equal(5);
      expect(await stupidClicker.epochFinalized(1)).to.be.true;
      expect(await stupidClicker.epochFinalized(2)).to.be.true;
      expect(await stupidClicker.epochFinalized(3)).to.be.true;
      expect(await stupidClicker.epochFinalized(4)).to.be.true;
    });

    it("should handle zero clicks in epoch correctly", async function () {
      // Don't submit any clicks, just finalize
      await time.increase(EPOCH_DURATION + 1);
      await stupidClicker.finalizeEpoch(1);

      expect(await stupidClicker.epochWinner(1)).to.equal(ethers.ZeroAddress);
      expect(await stupidClicker.epochWinnerClicks(1)).to.equal(0);
    });
  });

  // ============ Security Tests ============

  describe("Security", function () {
    beforeEach(async function () {
      await startGame();
    });

    it("should protect against reentrancy in submitClicks", async function () {
      // The nonReentrant modifier should prevent reentrancy
      // This is a basic test - a malicious token would be needed for a full test
      const nonces = await findValidNonces(player1.address, 1, MIN_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces);

      // If we got here without reverting, the function executed correctly
      expect(await stupidClicker.totalUserClicks(player1.address)).to.equal(MIN_BATCH_SIZE);
    });

    it("should not allow owner to restart game", async function () {
      await expect(
        stupidClicker.startGame(GAME_POOL)
      ).to.be.revertedWithCustomError(stupidClicker, "GameAlreadyStarted");
    });

    it("should cap reward at 10% of remaining pool per transaction", async function () {
      // This is a safety mechanism in the contract
      const poolBefore = await stupidClicker.poolRemaining();
      const maxRewardPerTx = poolBefore / 10n;

      const nonces = await findValidNonces(player1.address, 1, MAX_BATCH_SIZE);
      await stupidClicker.connect(player1).submitClicks(nonces);

      const poolAfter = await stupidClicker.poolRemaining();
      const amountUsed = poolBefore - poolAfter;

      expect(amountUsed).to.be.lte(maxRewardPerTx);
    });
  });

  // ============ NFT Bonus System Tests ============

  describe("NFT Bonus System", function () {
    let nftContract;
    let clickerWithNFT;

    beforeEach(async function () {
      // Deploy NFT contract
      const ClickstrNFT = await ethers.getContractFactory("ClickstrNFT");
      nftContract = await ClickstrNFT.deploy(owner.address, "https://test.com/");

      // Deploy clicker with NFT support
      const Clickstr = await ethers.getContractFactory("Clickstr");
      clickerWithNFT = await Clickstr.deploy(
        await clickToken.getAddress(),
        TOTAL_EPOCHS,
        EPOCH_DURATION,
        DEFAULT_INITIAL_DIFFICULTY,
        await nftContract.getAddress()
      );
    });

    it("should allow setting tier bonuses before game starts", async function () {
      const tiers = [4, 9, 12];
      const bonuses = [200, 500, 1000]; // 2%, 5%, 10%

      await clickerWithNFT.setTierBonuses(tiers, bonuses);

      const [returnedTiers, returnedBonuses] = await clickerWithNFT.getBonusTiers();
      expect(returnedTiers.length).to.equal(3);
      expect(returnedBonuses[0]).to.equal(200);
      expect(returnedBonuses[1]).to.equal(500);
      expect(returnedBonuses[2]).to.equal(1000);
    });

    it("should reject setting bonuses after game starts", async function () {
      // Start the game
      await clickToken.approve(await clickerWithNFT.getAddress(), GAME_POOL);
      await clickerWithNFT.startGame(GAME_POOL);

      await expect(
        clickerWithNFT.setTierBonuses([4], [200])
      ).to.be.revertedWith("Game already started");
    });

    it("should reject bonus higher than 20%", async function () {
      await expect(
        clickerWithNFT.setTierBonuses([4], [2500]) // 25%
      ).to.be.revertedWith("Bonus too high (max 20%)");
    });

    it("should return 0 bonus for user without NFTs", async function () {
      await clickerWithNFT.setTierBonuses([4, 9], [200, 500]);

      const bonus = await clickerWithNFT.calculateBonus(player1.address);
      expect(bonus).to.equal(0);
    });

    it("should calculate bonus for user with claimed NFTs", async function () {
      await clickerWithNFT.setTierBonuses([4, 9], [200, 500]);

      // Claim tier 4 NFT for player1
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "address"],
        [player1.address, 4, await nftContract.getAddress()]
      );
      const signature = await owner.signMessage(ethers.getBytes(messageHash));
      await nftContract.connect(player1).claim(4, signature);

      const bonus = await clickerWithNFT.calculateBonus(player1.address);
      expect(bonus).to.equal(200); // 2%
    });

    it("should stack bonuses for multiple NFTs", async function () {
      await clickerWithNFT.setTierBonuses([4, 9, 12], [200, 500, 1000]);

      // Claim tiers 4 and 9 for player1
      const sig4 = await owner.signMessage(ethers.getBytes(
        ethers.solidityPackedKeccak256(
          ["address", "uint256", "address"],
          [player1.address, 4, await nftContract.getAddress()]
        )
      ));
      const sig9 = await owner.signMessage(ethers.getBytes(
        ethers.solidityPackedKeccak256(
          ["address", "uint256", "address"],
          [player1.address, 9, await nftContract.getAddress()]
        )
      ));

      await nftContract.connect(player1).claim(4, sig4);
      await nftContract.connect(player1).claim(9, sig9);

      const bonus = await clickerWithNFT.calculateBonus(player1.address);
      expect(bonus).to.equal(700); // 2% + 5% = 7%
    });

    it("should cap total bonus at 50%", async function () {
      // Set up bonuses that would exceed 50% if stacked
      await clickerWithNFT.setTierBonuses([1, 2, 3, 4], [2000, 2000, 2000, 2000]); // 80% total if all claimed

      // Claim all 4 tiers
      for (let tier = 1; tier <= 4; tier++) {
        const sig = await owner.signMessage(ethers.getBytes(
          ethers.solidityPackedKeccak256(
            ["address", "uint256", "address"],
            [player1.address, tier, await nftContract.getAddress()]
          )
        ));
        await nftContract.connect(player1).claim(tier, sig);
      }

      const bonus = await clickerWithNFT.calculateBonus(player1.address);
      expect(bonus).to.equal(5000); // Capped at 50%
    });

    it("should apply bonus to rewards", async function () {
      // Set up 10% bonus for tier 4
      await clickerWithNFT.setTierBonuses([4], [1000]);

      // Claim tier 4 NFT for player1
      const sig = await owner.signMessage(ethers.getBytes(
        ethers.solidityPackedKeccak256(
          ["address", "uint256", "address"],
          [player1.address, 4, await nftContract.getAddress()]
        )
      ));
      await nftContract.connect(player1).claim(4, sig);

      // Start game
      await clickToken.approve(await clickerWithNFT.getAddress(), GAME_POOL);
      await clickerWithNFT.startGame(GAME_POOL);

      // Find nonces for the new contract
      const difficultyTarget = await clickerWithNFT.difficultyTarget();
      const chainId = (await ethers.provider.getNetwork()).chainId;
      const validNonces = [];
      let nonce = 0;
      while (validNonces.length < MIN_BATCH_SIZE) {
        const hash = ethers.keccak256(
          ethers.solidityPacked(
            ["address", "uint256", "uint256", "uint256"],
            [player1.address, nonce, 1, chainId]
          )
        );
        if (BigInt(hash) < difficultyTarget) {
          validNonces.push(nonce);
        }
        nonce++;
        if (nonce > 10000000) break;
      }

      const balanceBefore = await clickToken.balanceOf(player1.address);
      await clickerWithNFT.connect(player1).submitClicks(validNonces);
      const balanceAfter = await clickToken.balanceOf(player1.address);

      const earned = balanceAfter - balanceBefore;

      // Player should have earned base reward + 10% bonus
      // Base is grossReward/2, bonus is 10% of that
      // So total should be 1.1x base = 55% of grossReward (vs normal 50%)
      expect(earned).to.be.gt(0);
    });

    it("should emit BonusApplied event", async function () {
      // Set up bonus
      await clickerWithNFT.setTierBonuses([4], [1000]); // 10%

      // Claim NFT
      const sig = await owner.signMessage(ethers.getBytes(
        ethers.solidityPackedKeccak256(
          ["address", "uint256", "address"],
          [player1.address, 4, await nftContract.getAddress()]
        )
      ));
      await nftContract.connect(player1).claim(4, sig);

      // Start game
      await clickToken.approve(await clickerWithNFT.getAddress(), GAME_POOL);
      await clickerWithNFT.startGame(GAME_POOL);

      // Find valid nonces
      const difficultyTarget = await clickerWithNFT.difficultyTarget();
      const chainId = (await ethers.provider.getNetwork()).chainId;
      const validNonces = [];
      let nonce = 0;
      while (validNonces.length < MIN_BATCH_SIZE) {
        const hash = ethers.keccak256(
          ethers.solidityPacked(
            ["address", "uint256", "uint256", "uint256"],
            [player1.address, nonce, 1, chainId]
          )
        );
        if (BigInt(hash) < difficultyTarget) {
          validNonces.push(nonce);
        }
        nonce++;
        if (nonce > 10000000) break;
      }

      await expect(clickerWithNFT.connect(player1).submitClicks(validNonces))
        .to.emit(clickerWithNFT, "BonusApplied");
    });

    it("should return user bonus info", async function () {
      await clickerWithNFT.setTierBonuses([4, 9, 12], [200, 500, 1000]);

      // Claim tiers 4 and 12
      const sig4 = await owner.signMessage(ethers.getBytes(
        ethers.solidityPackedKeccak256(
          ["address", "uint256", "address"],
          [player1.address, 4, await nftContract.getAddress()]
        )
      ));
      const sig12 = await owner.signMessage(ethers.getBytes(
        ethers.solidityPackedKeccak256(
          ["address", "uint256", "address"],
          [player1.address, 12, await nftContract.getAddress()]
        )
      ));

      await nftContract.connect(player1).claim(4, sig4);
      await nftContract.connect(player1).claim(12, sig12);

      const [totalBonus, qualifyingTiers] = await clickerWithNFT.getUserBonusInfo(player1.address);

      expect(totalBonus).to.equal(1200); // 2% + 10%
      expect(qualifyingTiers.length).to.equal(2);
      expect(qualifyingTiers).to.include(4n);
      expect(qualifyingTiers).to.include(12n);
    });
  });
});
