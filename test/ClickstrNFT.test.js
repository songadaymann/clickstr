const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ClickstrNFT", function () {
  let nft;
  let owner;
  let signer;
  let user1;
  let user2;

  const BASE_URI = "https://api.stupidclicker.com/nft/";

  // Milestone tiers
  const TIER_FIRST_TIMER = 1;
  const TIER_GETTING_STARTED = 2;
  const TIER_DEDICATED = 4;
  const TIER_CLICK_GOD = 12;

  // Global milestones (1/1)
  const TIER_FIRST_CLICK = 201;
  const TIER_MILLIONTH = 206;

  // Hidden achievements (personal, editions - 500+)
  const TIER_NICE = 501;

  beforeEach(async function () {
    [owner, signer, user1, user2] = await ethers.getSigners();

    const ClickstrNFT = await ethers.getContractFactory("ClickstrNFT");
    nft = await ClickstrNFT.deploy(signer.address, BASE_URI);
  });

  // ============ Helper Functions ============

  /**
   * Create a valid signature for a claim
   */
  async function createSignature(user, tier) {
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint256", "address"],
      [user.address, tier, await nft.getAddress()]
    );
    return signer.signMessage(ethers.getBytes(messageHash));
  }

  // ============ Deployment Tests ============

  describe("Deployment", function () {
    it("should set the signer address", async function () {
      expect(await nft.signer()).to.equal(signer.address);
    });

    it("should set the base URI", async function () {
      expect(await nft.baseURI()).to.equal(BASE_URI);
    });

    it("should set deployer as owner", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("should revert if signer is zero address", async function () {
      const ClickstrNFT = await ethers.getContractFactory("ClickstrNFT");
      await expect(
        ClickstrNFT.deploy(ethers.ZeroAddress, BASE_URI)
      ).to.be.revertedWithCustomError(nft, "ZeroAddress");
    });

    it("should support ERC1155 interface", async function () {
      // ERC1155 interface ID
      expect(await nft.supportsInterface("0xd9b67a26")).to.be.true;
    });
  });

  // ============ Claiming Tests ============

  describe("Claiming", function () {
    it("should allow claiming with valid signature", async function () {
      const signature = await createSignature(user1, TIER_FIRST_TIMER);

      await expect(nft.connect(user1).claim(TIER_FIRST_TIMER, signature))
        .to.emit(nft, "MilestoneClaimed")
        .withArgs(user1.address, TIER_FIRST_TIMER, false);

      // In ERC1155, check balance of specific token ID
      expect(await nft.balanceOf(user1.address, TIER_FIRST_TIMER)).to.equal(1);
    });

    it("should mint correct token ID (tier = token ID)", async function () {
      const sig1 = await createSignature(user1, TIER_FIRST_TIMER);
      const sig2 = await createSignature(user1, TIER_DEDICATED);

      await nft.connect(user1).claim(TIER_FIRST_TIMER, sig1);
      await nft.connect(user1).claim(TIER_DEDICATED, sig2);

      // Token ID = tier number
      expect(await nft.balanceOf(user1.address, TIER_FIRST_TIMER)).to.equal(1);
      expect(await nft.balanceOf(user1.address, TIER_DEDICATED)).to.equal(1);
      expect(await nft.balanceOf(user1.address, TIER_GETTING_STARTED)).to.equal(0);
    });

    it("should track claimed tiers per user", async function () {
      const signature = await createSignature(user1, TIER_DEDICATED);
      await nft.connect(user1).claim(TIER_DEDICATED, signature);

      expect(await nft.claimed(user1.address, TIER_DEDICATED)).to.be.true;
      expect(await nft.claimed(user1.address, TIER_FIRST_TIMER)).to.be.false;
      expect(await nft.claimed(user2.address, TIER_DEDICATED)).to.be.false;
    });

    it("should revert if already claimed same tier", async function () {
      const signature = await createSignature(user1, TIER_FIRST_TIMER);
      await nft.connect(user1).claim(TIER_FIRST_TIMER, signature);

      // Try to claim again
      const signature2 = await createSignature(user1, TIER_FIRST_TIMER);
      await expect(
        nft.connect(user1).claim(TIER_FIRST_TIMER, signature2)
      ).to.be.revertedWithCustomError(nft, "AlreadyClaimed");
    });

    it("should revert with invalid signature", async function () {
      // Sign with wrong signer
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "address"],
        [user1.address, TIER_FIRST_TIMER, await nft.getAddress()]
      );
      const badSignature = await user2.signMessage(ethers.getBytes(messageHash));

      await expect(
        nft.connect(user1).claim(TIER_FIRST_TIMER, badSignature)
      ).to.be.revertedWithCustomError(nft, "InvalidSignature");
    });

    it("should revert if signature is for different user", async function () {
      // Create signature for user1
      const signature = await createSignature(user1, TIER_FIRST_TIMER);

      // Try to use it as user2
      await expect(
        nft.connect(user2).claim(TIER_FIRST_TIMER, signature)
      ).to.be.revertedWithCustomError(nft, "InvalidSignature");
    });

    it("should revert if signature is for different tier", async function () {
      const signature = await createSignature(user1, TIER_FIRST_TIMER);

      // Try to claim different tier
      await expect(
        nft.connect(user1).claim(TIER_DEDICATED, signature)
      ).to.be.revertedWithCustomError(nft, "InvalidSignature");
    });

    it("should revert for tier 0", async function () {
      const signature = await createSignature(user1, 0);

      await expect(
        nft.connect(user1).claim(0, signature)
      ).to.be.revertedWithCustomError(nft, "InvalidTier");
    });

    it("should allow same tier to be claimed by different users (editions)", async function () {
      const sig1 = await createSignature(user1, TIER_DEDICATED);
      const sig2 = await createSignature(user2, TIER_DEDICATED);

      await nft.connect(user1).claim(TIER_DEDICATED, sig1);
      await nft.connect(user2).claim(TIER_DEDICATED, sig2);

      expect(await nft.balanceOf(user1.address, TIER_DEDICATED)).to.equal(1);
      expect(await nft.balanceOf(user2.address, TIER_DEDICATED)).to.equal(1);
    });
  });

  // ============ Batch Claiming Tests ============

  describe("Batch Claiming", function () {
    it("should allow batch claiming multiple tiers", async function () {
      const tiers = [TIER_FIRST_TIMER, TIER_DEDICATED, TIER_CLICK_GOD];
      const signatures = await Promise.all(
        tiers.map(tier => createSignature(user1, tier))
      );

      await nft.connect(user1).claimBatch(tiers, signatures);

      expect(await nft.balanceOf(user1.address, TIER_FIRST_TIMER)).to.equal(1);
      expect(await nft.balanceOf(user1.address, TIER_DEDICATED)).to.equal(1);
      expect(await nft.balanceOf(user1.address, TIER_CLICK_GOD)).to.equal(1);
    });

    it("should emit MilestoneClaimed for each tier in batch", async function () {
      const tiers = [TIER_FIRST_TIMER, TIER_DEDICATED];
      const signatures = await Promise.all(
        tiers.map(tier => createSignature(user1, tier))
      );

      await expect(nft.connect(user1).claimBatch(tiers, signatures))
        .to.emit(nft, "MilestoneClaimed")
        .withArgs(user1.address, TIER_FIRST_TIMER, false);
    });

    it("should revert batch if any tier already claimed", async function () {
      // Claim one first
      const sig1 = await createSignature(user1, TIER_FIRST_TIMER);
      await nft.connect(user1).claim(TIER_FIRST_TIMER, sig1);

      // Try to batch claim including already claimed
      const tiers = [TIER_FIRST_TIMER, TIER_DEDICATED];
      const signatures = await Promise.all(
        tiers.map(tier => createSignature(user1, tier))
      );

      await expect(
        nft.connect(user1).claimBatch(tiers, signatures)
      ).to.be.revertedWithCustomError(nft, "AlreadyClaimed");
    });

    it("should revert if array lengths mismatch", async function () {
      const tiers = [TIER_FIRST_TIMER, TIER_DEDICATED];
      const signatures = [await createSignature(user1, TIER_FIRST_TIMER)]; // Only one sig

      await expect(
        nft.connect(user1).claimBatch(tiers, signatures)
      ).to.be.revertedWith("Array length mismatch");
    });

    it("should revert if too many claims in batch", async function () {
      const tiers = Array.from({ length: 21 }, (_, i) => i + 1);
      const signatures = await Promise.all(
        tiers.map(tier => createSignature(user1, tier))
      );

      await expect(
        nft.connect(user1).claimBatch(tiers, signatures)
      ).to.be.revertedWith("Too many claims");
    });
  });

  // ============ Global Milestone Tests ============

  describe("Global Milestones (1/1)", function () {
    it("should allow first user to claim global milestone", async function () {
      const signature = await createSignature(user1, TIER_FIRST_CLICK);

      await expect(nft.connect(user1).claim(TIER_FIRST_CLICK, signature))
        .to.emit(nft, "MilestoneClaimed")
        .withArgs(user1.address, TIER_FIRST_CLICK, true); // isGlobal = true

      expect(await nft.globalMilestoneClaimed(TIER_FIRST_CLICK)).to.be.true;
      expect(await nft.globalMilestoneOwner(TIER_FIRST_CLICK)).to.equal(user1.address);
    });

    it("should prevent second user from claiming same global milestone", async function () {
      // User1 claims first
      const sig1 = await createSignature(user1, TIER_FIRST_CLICK);
      await nft.connect(user1).claim(TIER_FIRST_CLICK, sig1);

      // User2 tries to claim same global milestone
      const sig2 = await createSignature(user2, TIER_FIRST_CLICK);
      await expect(
        nft.connect(user2).claim(TIER_FIRST_CLICK, sig2)
      ).to.be.revertedWithCustomError(nft, "GlobalMilestoneAlreadyClaimed");
    });

    it("should allow different global milestones to be claimed", async function () {
      const sig1 = await createSignature(user1, TIER_FIRST_CLICK);
      const sig2 = await createSignature(user2, TIER_MILLIONTH);

      await nft.connect(user1).claim(TIER_FIRST_CLICK, sig1);
      await nft.connect(user2).claim(TIER_MILLIONTH, sig2);

      expect(await nft.globalMilestoneClaimed(TIER_FIRST_CLICK)).to.be.true;
      expect(await nft.globalMilestoneClaimed(TIER_MILLIONTH)).to.be.true;
      expect(await nft.globalMilestoneOwner(TIER_FIRST_CLICK)).to.equal(user1.address);
      expect(await nft.globalMilestoneOwner(TIER_MILLIONTH)).to.equal(user2.address);
    });

    it("should not mark personal milestones as global", async function () {
      const signature = await createSignature(user1, TIER_FIRST_TIMER);
      await nft.connect(user1).claim(TIER_FIRST_TIMER, signature);

      // Personal milestone (tier 1) should not be in global mapping
      expect(await nft.globalMilestoneClaimed(TIER_FIRST_TIMER)).to.be.false;

      // User2 can also claim tier 1
      const sig2 = await createSignature(user2, TIER_FIRST_TIMER);
      await nft.connect(user2).claim(TIER_FIRST_TIMER, sig2);
    });

    it("should return correct totalSupply for global milestones", async function () {
      expect(await nft.totalSupply(TIER_FIRST_CLICK)).to.equal(0);

      const sig = await createSignature(user1, TIER_FIRST_CLICK);
      await nft.connect(user1).claim(TIER_FIRST_CLICK, sig);

      expect(await nft.totalSupply(TIER_FIRST_CLICK)).to.equal(1);
    });

    it("should correctly identify global milestones", async function () {
      expect(await nft.isGlobalMilestone(TIER_FIRST_TIMER)).to.be.false;
      expect(await nft.isGlobalMilestone(TIER_FIRST_CLICK)).to.be.true;
      expect(await nft.isGlobalMilestone(199)).to.be.false;
      expect(await nft.isGlobalMilestone(200)).to.be.true;
      expect(await nft.isGlobalMilestone(499)).to.be.true;
      expect(await nft.isGlobalMilestone(500)).to.be.false;
    });
  });

  // ============ View Functions ============

  describe("View Functions", function () {
    it("canClaim should return true for unclaimed tier", async function () {
      expect(await nft.canClaim(user1.address, TIER_FIRST_TIMER)).to.be.true;
    });

    it("canClaim should return false for claimed tier", async function () {
      const signature = await createSignature(user1, TIER_FIRST_TIMER);
      await nft.connect(user1).claim(TIER_FIRST_TIMER, signature);

      expect(await nft.canClaim(user1.address, TIER_FIRST_TIMER)).to.be.false;
    });

    it("canClaim should return false for tier 0", async function () {
      expect(await nft.canClaim(user1.address, 0)).to.be.false;
    });

    it("canClaim should return false for taken global milestone", async function () {
      const signature = await createSignature(user1, TIER_FIRST_CLICK);
      await nft.connect(user1).claim(TIER_FIRST_CLICK, signature);

      // User2 cannot claim the same global
      expect(await nft.canClaim(user2.address, TIER_FIRST_CLICK)).to.be.false;
    });

    it("getClaimedTiers should return empty array for new user", async function () {
      const tiers = await nft.getClaimedTiers(user1.address, 20);
      expect(tiers.length).to.equal(0);
    });

    it("getClaimedTiers should return claimed tiers", async function () {
      const sig1 = await createSignature(user1, TIER_FIRST_TIMER);
      const sig2 = await createSignature(user1, TIER_DEDICATED);
      const sig3 = await createSignature(user1, TIER_CLICK_GOD);

      await nft.connect(user1).claim(TIER_FIRST_TIMER, sig1);
      await nft.connect(user1).claim(TIER_DEDICATED, sig2);
      await nft.connect(user1).claim(TIER_CLICK_GOD, sig3);

      const tiers = await nft.getClaimedTiers(user1.address, 20);
      expect(tiers.length).to.equal(3);
      expect(tiers).to.include(BigInt(TIER_FIRST_TIMER));
      expect(tiers).to.include(BigInt(TIER_DEDICATED));
      expect(tiers).to.include(BigInt(TIER_CLICK_GOD));
    });
  });

  // ============ Token URI Tests ============

  describe("Token URI", function () {
    it("should return correct URI for token", async function () {
      const uri = await nft.uri(TIER_DEDICATED);
      expect(uri).to.equal(BASE_URI + TIER_DEDICATED.toString());
    });

    it("should return URI even for unminted tokens (ERC1155 standard)", async function () {
      // Unlike ERC721, ERC1155 uri() doesn't check if token exists
      const uri = await nft.uri(999);
      expect(uri).to.equal(BASE_URI + "999");
    });
  });

  // ============ Admin Functions ============

  describe("Admin Functions", function () {
    it("should allow owner to update signer", async function () {
      await expect(nft.setSigner(user1.address))
        .to.emit(nft, "SignerUpdated")
        .withArgs(signer.address, user1.address);

      expect(await nft.signer()).to.equal(user1.address);
    });

    it("should revert setSigner for zero address", async function () {
      await expect(
        nft.setSigner(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(nft, "ZeroAddress");
    });

    it("should revert setSigner from non-owner", async function () {
      await expect(
        nft.connect(user1).setSigner(user2.address)
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });

    it("should allow owner to update base URI", async function () {
      const newURI = "https://new.api.com/nft/";

      await expect(nft.setBaseURI(newURI))
        .to.emit(nft, "BaseURIUpdated")
        .withArgs(newURI);

      expect(await nft.baseURI()).to.equal(newURI);
    });

    it("should allow owner to update contract URI", async function () {
      const newContractURI = "https://new.api.com/contract.json";

      await expect(nft.setContractURI(newContractURI))
        .to.emit(nft, "ContractURIUpdated")
        .withArgs(newContractURI);

      expect(await nft.contractURI()).to.equal(newContractURI);
    });

    it("should revert setBaseURI from non-owner", async function () {
      await expect(
        nft.connect(user1).setBaseURI("https://bad.com/")
      ).to.be.revertedWithCustomError(nft, "OwnableUnauthorizedAccount");
    });

    it("should use new signer for subsequent claims", async function () {
      // Update signer to user2
      await nft.setSigner(user2.address);

      // Old signer's signature should fail
      const oldSig = await createSignature(user1, TIER_FIRST_TIMER);
      await expect(
        nft.connect(user1).claim(TIER_FIRST_TIMER, oldSig)
      ).to.be.revertedWithCustomError(nft, "InvalidSignature");

      // New signer's signature should work
      const messageHash = ethers.solidityPackedKeccak256(
        ["address", "uint256", "address"],
        [user1.address, TIER_FIRST_TIMER, await nft.getAddress()]
      );
      const newSig = await user2.signMessage(ethers.getBytes(messageHash));
      await nft.connect(user1).claim(TIER_FIRST_TIMER, newSig);

      expect(await nft.balanceOf(user1.address, TIER_FIRST_TIMER)).to.equal(1);
    });
  });

  // ============ Transfer Tests ============

  describe("Transfers", function () {
    it("should allow NFT transfers", async function () {
      const signature = await createSignature(user1, TIER_FIRST_TIMER);
      await nft.connect(user1).claim(TIER_FIRST_TIMER, signature);

      // ERC1155 transfer
      await nft.connect(user1).safeTransferFrom(
        user1.address,
        user2.address,
        TIER_FIRST_TIMER,
        1,
        "0x"
      );

      expect(await nft.balanceOf(user1.address, TIER_FIRST_TIMER)).to.equal(0);
      expect(await nft.balanceOf(user2.address, TIER_FIRST_TIMER)).to.equal(1);
    });

    it("claimed status should remain after transfer", async function () {
      const signature = await createSignature(user1, TIER_FIRST_TIMER);
      await nft.connect(user1).claim(TIER_FIRST_TIMER, signature);

      await nft.connect(user1).safeTransferFrom(
        user1.address,
        user2.address,
        TIER_FIRST_TIMER,
        1,
        "0x"
      );

      // User1 still can't claim again even though they don't own the NFT
      expect(await nft.claimed(user1.address, TIER_FIRST_TIMER)).to.be.true;
    });

    it("should allow batch transfers", async function () {
      const tiers = [TIER_FIRST_TIMER, TIER_DEDICATED];
      const signatures = await Promise.all(
        tiers.map(tier => createSignature(user1, tier))
      );
      await nft.connect(user1).claimBatch(tiers, signatures);

      // Batch transfer
      await nft.connect(user1).safeBatchTransferFrom(
        user1.address,
        user2.address,
        tiers,
        [1, 1],
        "0x"
      );

      expect(await nft.balanceOf(user1.address, TIER_FIRST_TIMER)).to.equal(0);
      expect(await nft.balanceOf(user1.address, TIER_DEDICATED)).to.equal(0);
      expect(await nft.balanceOf(user2.address, TIER_FIRST_TIMER)).to.equal(1);
      expect(await nft.balanceOf(user2.address, TIER_DEDICATED)).to.equal(1);
    });
  });
});
