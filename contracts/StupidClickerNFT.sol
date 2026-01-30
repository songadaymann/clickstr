// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title StupidClickerNFT
 * @notice Achievement NFTs for Stupid Clicker milestones (ERC1155)
 * @dev Uses signature-based claiming - server signs, user submits, contract verifies
 *      Token ID = Tier number. Editions (many can own) and 1/1s (only one ever) coexist.
 *      Each milestone unlocks a unique cursor hand in the game UI.
 *
 * Tier Ranges:
 *   1-99:    Personal click milestones (editions) - metal/gem cursor progression
 *   100-199: Streak & epoch achievements (editions) - fire/time cursors
 *   200-499: Global 1/1 milestones (only one person can ever claim each)
 *   500+:    Hidden personal achievements (editions) - themed cursors
 *
 * Personal milestones (1-12, editions):
 *   1  = First Timer (1 click)         - White cursor
 *   2  = Getting Started (100 clicks)  - Gray cursor
 *   3  = Warming Up (500 clicks)       - Brown/leather cursor
 *   4  = Dedicated (1,000 clicks)      - Bronze cursor
 *   5  = Serious Clicker (5,000)       - Silver cursor
 *   6  = Obsessed (10,000 clicks)      - Gold cursor
 *   7  = No Sleep (25,000 clicks)      - Rose Gold cursor
 *   8  = Touch Grass (50,000 clicks)   - Platinum cursor
 *   9  = Legend (100,000 clicks)       - Diamond/Crystal cursor
 *   10 = Ascended (250,000 clicks)     - Holographic cursor
 *   11 = Transcendent (500,000)        - Prismatic animated cursor
 *   12 = Click God (1,000,000 clicks)  - Golden aura + sparkle trail
 *
 * Streak/Epoch tiers (101-105, editions):
 *   101 = Week Warrior (7-day streak)      - Orange flame cursor
 *   102 = Month Master (30-day streak)     - Blue flame cursor
 *   103 = Perfect Attendance (90-day)      - White/plasma flame cursor
 *   104 = Day One OG (Epoch 1)             - Vintage sepia cursor
 *   105 = The Final Day (Final epoch)      - Sunset gradient cursor
 *
 * Global 1/1 milestones (200-229, only one person can ever own):
 *   Powers of 10 (200-209): #1, #10, #100, #1000... #1B
 *   Hidden globals (220-229): #42, #69, #420, #666, #777, #1337, #42069, #69420, #8008135, #8675309
 *   (No cursor reward - NFT only)
 *
 * Hidden personal achievements (500+, editions):
 *   500-511: Meme numbers (69, 420, 666, 777, 1337, etc.) - themed cursors
 *   520-532: Repeated digits (111, 7777, 8888, 9999, etc.) - color family progressions
 *   540-545: Palindromes (101, 1001, 12321, etc.) - mirror/glass cursors
 *   560-566: Math numbers (137, 314, 1618, 2718, etc.) - blueprint/academic cursors
 *   580-588: Powers of 2 (256, 512, 1024, 2048, etc.) - PCB/digital cursors
 *   600-609: Cultural refs (404, 911, 1984, 2001, 3000, etc.) - thematic cursors
 */
contract StupidClickerNFT is ERC1155, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    using Strings for uint256;

    // ============ State ============

    /// @notice Address authorized to sign claim messages
    address public signer;

    /// @notice Tracks which tiers each address has claimed
    mapping(address => mapping(uint256 => bool)) public claimed;

    /// @notice Tracks which global milestone tiers have been claimed (1/1s)
    mapping(uint256 => bool) public globalMilestoneClaimed;

    /// @notice Who claimed each global milestone
    mapping(uint256 => address) public globalMilestoneOwner;

    /// @notice Base URI for token metadata
    string public baseURI;

    /// @notice Contract-level metadata URI
    string public contractURI;

    // ============ Events ============

    event MilestoneClaimed(
        address indexed user,
        uint256 indexed tier,
        bool isGlobal
    );
    event SignerUpdated(address indexed oldSigner, address indexed newSigner);
    event BaseURIUpdated(string newBaseURI);
    event ContractURIUpdated(string newContractURI);

    // ============ Errors ============

    error InvalidSignature();
    error AlreadyClaimed();
    error GlobalMilestoneAlreadyClaimed();
    error InvalidTier();
    error ZeroAddress();

    // ============ Constructor ============

    /**
     * @notice Deploy the NFT contract
     * @param _signer Address that signs claim messages (server wallet)
     * @param _baseURI Base URI for token metadata (e.g., "https://api.stupidclicker.com/nft/")
     */
    constructor(
        address _signer,
        string memory _baseURI
    ) ERC1155(_baseURI) Ownable(msg.sender) {
        if (_signer == address(0)) revert ZeroAddress();
        signer = _signer;
        baseURI = _baseURI;
    }

    // ============ Claiming ============

    /**
     * @notice Claim an achievement NFT with a server signature
     * @param tier The milestone tier to claim (also the token ID)
     * @param signature Server signature authorizing this claim
     * @dev Signature must be over keccak256(abi.encodePacked(msg.sender, tier, address(this)))
     */
    function claim(uint256 tier, bytes calldata signature) external {
        if (tier == 0) revert InvalidTier();

        // Check if already claimed by this user
        if (claimed[msg.sender][tier]) revert AlreadyClaimed();

        // For global milestones (200-499), check if anyone has claimed
        bool isGlobal = tier >= 200 && tier < 500;
        if (isGlobal) {
            if (globalMilestoneClaimed[tier]) revert GlobalMilestoneAlreadyClaimed();
        }

        // Verify signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(msg.sender, tier, address(this))
        );
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();

        if (ethSignedHash.recover(signature) != signer) revert InvalidSignature();

        // Mark as claimed
        claimed[msg.sender][tier] = true;

        // For global milestones, mark globally claimed and record owner
        if (isGlobal) {
            globalMilestoneClaimed[tier] = true;
            globalMilestoneOwner[tier] = msg.sender;
        }

        // Mint NFT - in ERC1155, tier IS the token ID, quantity is 1
        _mint(msg.sender, tier, 1, "");

        emit MilestoneClaimed(msg.sender, tier, isGlobal);
    }

    /**
     * @notice Claim multiple achievement NFTs in one transaction
     * @param tiers Array of milestone tiers to claim
     * @param signatures Array of server signatures for each tier
     */
    function claimBatch(uint256[] calldata tiers, bytes[] calldata signatures) external {
        require(tiers.length == signatures.length, "Array length mismatch");
        require(tiers.length <= 20, "Too many claims");

        uint256[] memory amounts = new uint256[](tiers.length);

        for (uint256 i = 0; i < tiers.length; i++) {
            uint256 tier = tiers[i];
            if (tier == 0) revert InvalidTier();
            if (claimed[msg.sender][tier]) revert AlreadyClaimed();

            bool isGlobal = tier >= 200 && tier < 500;
            if (isGlobal && globalMilestoneClaimed[tier]) revert GlobalMilestoneAlreadyClaimed();

            // Verify signature
            bytes32 messageHash = keccak256(
                abi.encodePacked(msg.sender, tier, address(this))
            );
            bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
            if (ethSignedHash.recover(signatures[i]) != signer) revert InvalidSignature();

            // Mark as claimed
            claimed[msg.sender][tier] = true;
            amounts[i] = 1;

            if (isGlobal) {
                globalMilestoneClaimed[tier] = true;
                globalMilestoneOwner[tier] = msg.sender;
            }

            emit MilestoneClaimed(msg.sender, tier, isGlobal);
        }

        // Batch mint all NFTs
        _mintBatch(msg.sender, tiers, amounts, "");
    }

    /**
     * @notice Check if a user can claim a specific tier
     * @param user Address to check
     * @param tier Milestone tier
     * @return canClaim_ Whether the user can claim (not already claimed, global not taken)
     */
    function canClaim(address user, uint256 tier) external view returns (bool canClaim_) {
        if (tier == 0) return false;
        if (claimed[user][tier]) return false;
        if (tier >= 200 && tier < 500 && globalMilestoneClaimed[tier]) return false;
        return true;
    }

    /**
     * @notice Get all tiers claimed by a user
     * @param user Address to check
     * @param maxTier Maximum tier to check (gas optimization)
     * @return tiers Array of claimed tier numbers
     */
    function getClaimedTiers(
        address user,
        uint256 maxTier
    ) external view returns (uint256[] memory tiers) {
        // First pass: count claimed tiers
        uint256 count = 0;
        for (uint256 i = 1; i <= maxTier; i++) {
            if (claimed[user][i]) count++;
        }

        // Second pass: populate array
        tiers = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= maxTier; i++) {
            if (claimed[user][i]) {
                tiers[index++] = i;
            }
        }
    }

    // ============ Admin ============

    /**
     * @notice Update the signer address
     * @param _newSigner New signer address
     */
    function setSigner(address _newSigner) external onlyOwner {
        if (_newSigner == address(0)) revert ZeroAddress();
        address oldSigner = signer;
        signer = _newSigner;
        emit SignerUpdated(oldSigner, _newSigner);
    }

    /**
     * @notice Update the base URI for token metadata
     * @param _newBaseURI New base URI
     */
    function setBaseURI(string calldata _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
        emit BaseURIUpdated(_newBaseURI);
    }

    /**
     * @notice Update the contract-level metadata URI
     * @param _newContractURI New contract URI
     */
    function setContractURI(string calldata _newContractURI) external onlyOwner {
        contractURI = _newContractURI;
        emit ContractURIUpdated(_newContractURI);
    }

    // ============ Metadata ============

    /**
     * @notice Get the URI for a given token ID (tier)
     * @param tokenId Token ID (same as tier number)
     * @return URI string
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    /**
     * @notice Get total supply of a specific tier
     * @dev For 1/1s this is 0 or 1, for editions it could be many
     * @param tier The tier to check
     * @return supply Total minted for this tier
     */
    function totalSupply(uint256 tier) external view returns (uint256 supply) {
        // For global milestones, supply is 0 or 1
        if (tier >= 200 && tier < 500) {
            return globalMilestoneClaimed[tier] ? 1 : 0;
        }
        // For editions, we don't track total supply on-chain
        // (would need additional mapping if needed)
        // Return 0 as placeholder - real supply tracked off-chain or via events
        return 0;
    }

    /**
     * @notice Check if a tier is a 1/1 global milestone
     * @param tier The tier to check
     * @return isGlobal True if tier is in global range (200-499)
     */
    function isGlobalMilestone(uint256 tier) external pure returns (bool) {
        return tier >= 200 && tier < 500;
    }
}
