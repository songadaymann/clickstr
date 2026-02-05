// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title IClickRegistry
 * @notice Interface for the permanent click registry
 */
interface IClickRegistry {
    function recordClicks(address user, uint256 season, uint256 clicks) external;
    function totalClicks(address user) external view returns (uint256);
}

/**
 * @title IClickstrTreasury
 * @notice Interface for the token treasury
 */
interface IClickstrTreasury {
    function disburse(address recipient, uint256 userAmount, uint256 burnAmount) external;
    function burn(uint256 amount) external;
    function getBalance() external view returns (uint256);
}

/**
 * @title ClickstrGameV2
 * @notice V2 per-season game contract with off-chain proof validation.
 * @dev Key differences from V1:
 *      - Proof validation is done OFF-CHAIN by the server
 *      - Users claim rewards with a server-signed attestation
 *      - No on-chain nonce tracking (massive gas savings)
 *      - Clicks are recorded to the permanent ClickRegistry
 *      - Tokens come from ClickstrTreasury (not held directly)
 *
 *      User Flow:
 *      1. User clicks in browser, passes Turnstile verification
 *      2. WebWorker mines PoW proofs
 *      3. Frontend POSTs proofs to server (NOT blockchain)
 *      4. Server validates and tracks clicks in Redis
 *      5. User calls claimReward() with server signature
 *      6. Contract verifies sig, records to registry, requests disbursement
 *
 *      Gas Comparison:
 *      - V1 submitClicks(500 nonces): ~10M gas (~$50-100)
 *      - V2 claimReward(): ~150k gas (~$0.75-1.50)
 */
contract ClickstrGameV2 is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ Constants ============

    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;

    /// @notice Winner bonus rate (10% of epoch distribution)
    uint256 public constant WINNER_BONUS_RATE = 1000; // 10%

    /// @notice Finalizer reward rate (0.1% of epoch distribution, 50/50 split)
    uint256 public constant FINALIZER_REWARD_RATE = 10; // 0.1%

    /// @notice Maximum clicks per claim (safety limit)
    uint256 public constant MAX_CLICKS_PER_CLAIM = 100_000_000; // 100M

    /// @notice Grace period after game end for claiming rewards
    uint256 public constant CLAIM_GRACE_PERIOD = 72 hours;

    /// @notice Daily emission rate (2% of remaining pool)
    uint256 public constant DAILY_EMISSION_RATE = 200; // 2%

    // ============ Immutable Configuration ============

    /// @notice The permanent click registry
    IClickRegistry public immutable registry;

    /// @notice The token treasury
    IClickstrTreasury public immutable treasury;

    /// @notice Season number for this game instance
    uint256 public immutable SEASON_NUMBER;

    /// @notice Total epochs in this season
    uint256 public immutable TOTAL_EPOCHS;

    /// @notice Duration of each epoch in seconds
    uint256 public immutable EPOCH_DURATION;

    // ============ State Variables ============

    /// @notice Address authorized to sign claim attestations
    address public attestationSigner;

    /// @notice Game start timestamp
    uint256 public gameStartTime;

    /// @notice Game end timestamp
    uint256 public gameEndTime;

    /// @notice Current epoch number (1-indexed)
    uint256 public currentEpoch;

    /// @notice Remaining tokens allocated to this season
    uint256 public poolRemaining;

    /// @notice Whether the game has started
    bool public gameStarted;

    /// @notice Whether the game has ended
    bool public gameEnded;

    // ============ Claim Tracking ============

    /// @notice Whether user has claimed for a specific epoch
    mapping(address => mapping(uint256 => bool)) public claimed;

    /// @notice Total clicks claimed per user per epoch
    mapping(address => mapping(uint256 => uint256)) public userEpochClicks;

    // ============ Epoch Statistics ============

    /// @notice Total clicks claimed in each epoch
    mapping(uint256 => uint256) public totalClicksPerEpoch;

    /// @notice Tokens distributed in each epoch
    mapping(uint256 => uint256) public epochDistributed;

    /// @notice Tokens burned in each epoch
    mapping(uint256 => uint256) public epochBurned;

    /// @notice Whether epoch has been finalized
    mapping(uint256 => bool) public epochFinalized;

    /// @notice Winner of each epoch (most clicks at finalization)
    mapping(uint256 => address) public epochWinner;

    /// @notice Winner's click count for each epoch
    mapping(uint256 => uint256) public epochWinnerClicks;

    /// @notice Epoch emission budget (set when first claim happens)
    mapping(uint256 => uint256) public epochEmissionBudget;

    /// @notice Epoch emission already used
    mapping(uint256 => uint256) public epochEmissionUsed;

    // ============ User Lifetime Stats (this season) ============

    /// @notice Total clicks by user this season
    mapping(address => uint256) public totalUserClicks;

    /// @notice Total tokens earned by user this season
    mapping(address => uint256) public totalUserEarned;

    /// @notice Epochs won by user this season
    mapping(address => uint256) public epochsWon;

    // ============ Events ============

    event GameStarted(
        uint256 startTime,
        uint256 endTime,
        uint256 seasonPool
    );

    event RewardClaimed(
        address indexed user,
        uint256 indexed epoch,
        uint256 clicks,
        uint256 userAmount,
        uint256 burnAmount
    );

    event EpochFinalized(
        uint256 indexed epoch,
        address indexed winner,
        uint256 winnerClicks,
        uint256 totalClicks,
        uint256 distributed,
        uint256 burned,
        address finalizer,
        uint256 finalizerReward
    );

    event GameEnded(
        uint256 totalDistributed,
        uint256 totalBurned
    );

    event AttestationSignerUpdated(
        address indexed oldSigner,
        address indexed newSigner
    );

    // ============ Errors ============

    error GameNotStarted();
    error GameAlreadyStarted();
    error GameHasEnded();
    error InvalidEpoch();
    error EpochNotStarted();
    error EpochNotOver();
    error EpochAlreadyFinalized();
    error AlreadyClaimed();
    error NoClicks();
    error ClickCountTooHigh();
    error InvalidSignature();
    error ZeroAddress();
    error InsufficientPool();
    error GracePeriodNotOver();

    // ============ Constructor ============

    /**
     * @notice Deploy a new V2 game contract for a season
     * @param _registry Address of the permanent ClickRegistry
     * @param _treasury Address of the ClickstrTreasury
     * @param _seasonNumber Season number for this game
     * @param _totalEpochs Number of epochs in this season
     * @param _epochDuration Duration of each epoch in seconds
     * @param _attestationSigner Address that signs claim attestations
     */
    constructor(
        address _registry,
        address _treasury,
        uint256 _seasonNumber,
        uint256 _totalEpochs,
        uint256 _epochDuration,
        address _attestationSigner
    ) Ownable(msg.sender) {
        if (_registry == address(0)) revert ZeroAddress();
        if (_treasury == address(0)) revert ZeroAddress();
        if (_attestationSigner == address(0)) revert ZeroAddress();
        require(_totalEpochs > 0, "Epochs must be > 0");
        require(_epochDuration >= 1 hours, "Epoch too short");
        require(_seasonNumber > 0, "Season must be > 0");

        registry = IClickRegistry(_registry);
        treasury = IClickstrTreasury(_treasury);
        SEASON_NUMBER = _seasonNumber;
        TOTAL_EPOCHS = _totalEpochs;
        EPOCH_DURATION = _epochDuration;
        attestationSigner = _attestationSigner;
    }

    // ============ Admin Functions ============

    /**
     * @notice Start the game
     * @param _seasonPool Amount of tokens allocated to this season
     * @dev Treasury must have authorized this contract as a disburser
     */
    function startGame(uint256 _seasonPool) external onlyOwner {
        if (gameStarted) revert GameAlreadyStarted();
        require(_seasonPool > 0, "Pool must be > 0");

        // Verify treasury has enough balance
        uint256 treasuryBalance = treasury.getBalance();
        require(treasuryBalance >= _seasonPool, "Insufficient treasury balance");

        poolRemaining = _seasonPool;
        gameStartTime = block.timestamp;
        gameEndTime = block.timestamp + (TOTAL_EPOCHS * EPOCH_DURATION);
        currentEpoch = 1;
        gameStarted = true;

        emit GameStarted(gameStartTime, gameEndTime, _seasonPool);
    }

    /**
     * @notice Update the attestation signer
     * @param _newSigner New signer address
     */
    function setAttestationSigner(address _newSigner) external onlyOwner {
        if (_newSigner == address(0)) revert ZeroAddress();
        address oldSigner = attestationSigner;
        attestationSigner = _newSigner;
        emit AttestationSignerUpdated(oldSigner, _newSigner);
    }

    // ============ Core Game Functions ============

    /**
     * @notice Claim rewards for an epoch with server attestation
     * @param epoch Epoch to claim for
     * @param clickCount Number of clicks attested by server
     * @param signature Server signature over claim data
     */
    function claimReward(
        uint256 epoch,
        uint256 clickCount,
        bytes calldata signature
    ) external nonReentrant {
        if (!gameStarted) revert GameNotStarted();
        if (gameEnded) revert GameHasEnded();
        if (epoch < 1 || epoch > TOTAL_EPOCHS) revert InvalidEpoch();

        // Check and advance epoch if needed
        _checkAndAdvanceEpoch();

        if (epoch > currentEpoch) revert EpochNotStarted();
        if (epochFinalized[epoch]) revert EpochAlreadyFinalized();
        if (claimed[msg.sender][epoch]) revert AlreadyClaimed();
        if (clickCount == 0) revert NoClicks();
        if (clickCount > MAX_CLICKS_PER_CLAIM) revert ClickCountTooHigh();

        // Verify server attestation
        bytes32 message = keccak256(abi.encodePacked(
            msg.sender,
            epoch,
            clickCount,
            SEASON_NUMBER,
            address(this),
            block.chainid
        ));
        bytes32 ethSignedMessage = message.toEthSignedMessageHash();

        if (ethSignedMessage.recover(signature) != attestationSigner) {
            revert InvalidSignature();
        }

        // Mark claimed
        claimed[msg.sender][epoch] = true;
        userEpochClicks[msg.sender][epoch] = clickCount;

        // Update epoch stats
        totalClicksPerEpoch[epoch] += clickCount;

        // Update winner tracking
        if (clickCount > epochWinnerClicks[epoch]) {
            epochWinner[epoch] = msg.sender;
            epochWinnerClicks[epoch] = clickCount;
        }

        // Record clicks to permanent registry
        registry.recordClicks(msg.sender, SEASON_NUMBER, clickCount);

        // Calculate reward
        uint256 reward = _calculateReward(epoch, clickCount);
        if (reward == 0) revert InsufficientPool();

        // 50/50 split
        uint256 userAmount = reward / 2;
        uint256 burnAmount = reward - userAmount;

        // Update tracking
        poolRemaining -= reward;
        epochEmissionUsed[epoch] += reward;
        epochDistributed[epoch] += userAmount;
        epochBurned[epoch] += burnAmount;
        totalUserClicks[msg.sender] += clickCount;
        totalUserEarned[msg.sender] += userAmount;

        // Request disbursement from treasury
        treasury.disburse(msg.sender, userAmount, burnAmount);

        emit RewardClaimed(msg.sender, epoch, clickCount, userAmount, burnAmount);
    }

    /**
     * @notice Claim rewards for multiple epochs in one transaction
     * @param epochs Array of epochs to claim
     * @param clickCounts Array of click counts per epoch
     * @param signatures Array of signatures per epoch
     */
    function claimMultipleEpochs(
        uint256[] calldata epochs,
        uint256[] calldata clickCounts,
        bytes[] calldata signatures
    ) external nonReentrant {
        require(epochs.length == clickCounts.length, "Array length mismatch");
        require(epochs.length == signatures.length, "Array length mismatch");
        require(epochs.length <= 20, "Too many epochs");

        if (!gameStarted) revert GameNotStarted();
        if (gameEnded) revert GameHasEnded();

        _checkAndAdvanceEpoch();

        uint256 totalUserAmount = 0;
        uint256 totalBurnAmount = 0;
        uint256 totalClicks = 0;

        for (uint256 i = 0; i < epochs.length; i++) {
            uint256 epoch = epochs[i];
            uint256 clickCount = clickCounts[i];

            if (epoch < 1 || epoch > TOTAL_EPOCHS) continue;
            if (epoch > currentEpoch) continue;
            if (epochFinalized[epoch]) continue;
            if (claimed[msg.sender][epoch]) continue;
            if (clickCount == 0) continue;
            if (clickCount > MAX_CLICKS_PER_CLAIM) continue;

            // Verify signature
            bytes32 message = keccak256(abi.encodePacked(
                msg.sender,
                epoch,
                clickCount,
                SEASON_NUMBER,
                address(this),
                block.chainid
            ));
            bytes32 ethSignedMessage = message.toEthSignedMessageHash();

            if (ethSignedMessage.recover(signatures[i]) != attestationSigner) {
                continue; // Skip invalid signatures
            }

            // Mark claimed
            claimed[msg.sender][epoch] = true;
            userEpochClicks[msg.sender][epoch] = clickCount;

            // Update epoch stats
            totalClicksPerEpoch[epoch] += clickCount;

            // Update winner tracking
            if (clickCount > epochWinnerClicks[epoch]) {
                epochWinner[epoch] = msg.sender;
                epochWinnerClicks[epoch] = clickCount;
            }

            // Calculate reward
            uint256 reward = _calculateReward(epoch, clickCount);
            if (reward == 0) continue;

            uint256 userAmount = reward / 2;
            uint256 burnAmount = reward - userAmount;

            // Update tracking
            poolRemaining -= reward;
            epochEmissionUsed[epoch] += reward;
            epochDistributed[epoch] += userAmount;
            epochBurned[epoch] += burnAmount;

            totalUserAmount += userAmount;
            totalBurnAmount += burnAmount;
            totalClicks += clickCount;

            emit RewardClaimed(msg.sender, epoch, clickCount, userAmount, burnAmount);
        }

        if (totalClicks > 0) {
            // Record all clicks to registry
            registry.recordClicks(msg.sender, SEASON_NUMBER, totalClicks);

            // Update user stats
            totalUserClicks[msg.sender] += totalClicks;
            totalUserEarned[msg.sender] += totalUserAmount;

            // Single disbursement for all epochs
            if (totalUserAmount > 0 || totalBurnAmount > 0) {
                treasury.disburse(msg.sender, totalUserAmount, totalBurnAmount);
            }
        }
    }

    /**
     * @notice Finalize an epoch and distribute winner bonus
     * @param epoch Epoch to finalize
     */
    function finalizeEpoch(uint256 epoch) external nonReentrant {
        if (!gameStarted) revert GameNotStarted();
        if (epoch < 1 || epoch > TOTAL_EPOCHS) revert InvalidEpoch();
        if (epochFinalized[epoch]) revert EpochAlreadyFinalized();

        uint256 epochEndTime_ = gameStartTime + (epoch * EPOCH_DURATION);
        if (block.timestamp < epochEndTime_) revert EpochNotOver();

        _finalizeEpochInternal(epoch, msg.sender, true);
    }

    /**
     * @notice End the game after all epochs complete and grace period expires
     * @dev Users have 72 hours after gameEndTime to claim their rewards
     */
    function endGame() external nonReentrant {
        if (block.timestamp < gameEndTime + CLAIM_GRACE_PERIOD) revert GracePeriodNotOver();
        if (gameEnded) return;
        _endGame();
    }

    // ============ Internal Functions ============

    function _checkAndAdvanceEpoch() internal {
        uint256 epochsSinceStart = (block.timestamp - gameStartTime) / EPOCH_DURATION;
        uint256 targetEpoch = epochsSinceStart + 1;

        if (targetEpoch > TOTAL_EPOCHS) {
            targetEpoch = TOTAL_EPOCHS;
        }

        // Auto-finalize elapsed epochs (capped for gas safety)
        uint256 finalized = 0;
        while (currentEpoch < targetEpoch && finalized < 5) {
            if (!epochFinalized[currentEpoch]) {
                _finalizeEpochInternal(currentEpoch, address(0), false);
                finalized++;
            }
            currentEpoch++;
        }
    }

    function _calculateReward(
        uint256 epoch,
        uint256 clickCount
    ) internal returns (uint256) {
        // Initialize epoch budget if not set
        if (epochEmissionBudget[epoch] == 0) {
            epochEmissionBudget[epoch] = (poolRemaining * DAILY_EMISSION_RATE) / BASIS_POINTS;
        }

        uint256 budget = epochEmissionBudget[epoch];
        uint256 used = epochEmissionUsed[epoch];
        uint256 remaining = budget > used ? budget - used : 0;

        if (remaining == 0) {
            // Soft overflow: 10% of normal rate from pool
            return (poolRemaining * clickCount) / (1_000_000 * 10);
        }

        // Normal calculation: proportional to clicks vs target (1M/day)
        uint256 targetClicks = (1_000_000 * EPOCH_DURATION) / 86400;
        uint256 reward = (budget * clickCount) / targetClicks;

        // Cap at remaining budget
        if (reward > remaining) {
            reward = remaining;
        }

        // Cap at 10% of pool per claim (safety)
        uint256 maxReward = poolRemaining / 10;
        if (reward > maxReward) {
            reward = maxReward;
        }

        return reward;
    }

    function _finalizeEpochInternal(
        uint256 epoch,
        address finalizer,
        bool payFinalizer
    ) internal {
        epochFinalized[epoch] = true;

        // Burn unused emission
        uint256 budget = epochEmissionBudget[epoch];
        if (budget == 0) {
            budget = (poolRemaining * DAILY_EMISSION_RATE) / BASIS_POINTS;
            epochEmissionBudget[epoch] = budget;
        }

        uint256 used = epochEmissionUsed[epoch];
        if (budget > used) {
            uint256 unused = budget - used;
            if (unused > poolRemaining) {
                unused = poolRemaining;
            }
            if (unused > 0) {
                poolRemaining -= unused;
                epochBurned[epoch] += unused;
                treasury.burn(unused);
            }
        }

        // Winner bonus (10% of distributed, 50/50 split)
        address winner = epochWinner[epoch];
        uint256 winnerBonus = 0;
        if (winner != address(0) && epochDistributed[epoch] > 0 && poolRemaining > 0) {
            winnerBonus = (epochDistributed[epoch] * WINNER_BONUS_RATE) / BASIS_POINTS;
            if (winnerBonus > poolRemaining) {
                winnerBonus = poolRemaining;
            }

            uint256 winnerReceives = winnerBonus / 2;
            uint256 winnerBurns = winnerBonus - winnerReceives;

            poolRemaining -= winnerBonus;
            epochDistributed[epoch] += winnerReceives;
            epochBurned[epoch] += winnerBurns;
            totalUserEarned[winner] += winnerReceives;
            epochsWon[winner]++;

            if (winnerBonus > 0) {
                treasury.disburse(winner, winnerReceives, winnerBurns);
            }
        }

        // Finalizer reward (0.1% of distributed, 50/50 split)
        uint256 finalizerReward = 0;
        if (payFinalizer && finalizer != address(0) && poolRemaining > 0) {
            finalizerReward = (epochDistributed[epoch] * FINALIZER_REWARD_RATE) / BASIS_POINTS;
            if (finalizerReward > poolRemaining) {
                finalizerReward = poolRemaining;
            }
            if (finalizerReward > 0) {
                uint256 finalizerReceives = finalizerReward / 2;
                uint256 finalizerBurns = finalizerReward - finalizerReceives;

                poolRemaining -= finalizerReward;
                epochDistributed[epoch] += finalizerReceives;
                epochBurned[epoch] += finalizerBurns;

                treasury.disburse(finalizer, finalizerReceives, finalizerBurns);
            }
        }

        emit EpochFinalized(
            epoch,
            winner,
            epochWinnerClicks[epoch],
            totalClicksPerEpoch[epoch],
            epochDistributed[epoch],
            epochBurned[epoch],
            finalizer,
            finalizerReward
        );

        if (epoch >= TOTAL_EPOCHS) {
            // Respect claim grace period before ending the game
            if (block.timestamp >= gameEndTime + CLAIM_GRACE_PERIOD) {
                _endGame();
            }
        }
    }

    function _endGame() internal {
        gameEnded = true;

        uint256 totalDistributed = 0;
        uint256 totalBurned = 0;

        for (uint256 i = 1; i <= TOTAL_EPOCHS; i++) {
            totalDistributed += epochDistributed[i];
            totalBurned += epochBurned[i];
        }

        // Burn remaining pool
        if (poolRemaining > 0) {
            treasury.burn(poolRemaining);
            totalBurned += poolRemaining;
            poolRemaining = 0;
        }

        emit GameEnded(totalDistributed, totalBurned);
    }

    // ============ View Functions ============

    /**
     * @notice Get current epoch info
     */
    function getCurrentEpochInfo() external view returns (
        uint256 epoch,
        uint256 epochStartTime_,
        uint256 epochEndTime_,
        uint256 totalClicks,
        address currentLeader,
        uint256 leaderClicks,
        uint256 distributed,
        uint256 burned
    ) {
        if (!gameStarted) {
            return (0, 0, 0, 0, address(0), 0, 0, 0);
        }
        epoch = currentEpoch;
        epochStartTime_ = gameStartTime + ((currentEpoch - 1) * EPOCH_DURATION);
        epochEndTime_ = epochStartTime_ + EPOCH_DURATION;
        totalClicks = totalClicksPerEpoch[currentEpoch];
        currentLeader = epochWinner[currentEpoch];
        leaderClicks = epochWinnerClicks[currentEpoch];
        distributed = epochDistributed[currentEpoch];
        burned = epochBurned[currentEpoch];
    }

    /**
     * @notice Get game stats
     */
    function getGameStats() external view returns (
        uint256 poolRemaining_,
        uint256 currentEpoch_,
        uint256 totalEpochs_,
        uint256 gameStartTime_,
        uint256 gameEndTime_,
        uint256 seasonNumber_,
        bool started_,
        bool ended_
    ) {
        poolRemaining_ = poolRemaining;
        currentEpoch_ = currentEpoch;
        totalEpochs_ = TOTAL_EPOCHS;
        gameStartTime_ = gameStartTime;
        gameEndTime_ = gameEndTime;
        seasonNumber_ = SEASON_NUMBER;
        started_ = gameStarted;
        ended_ = gameEnded;
    }

    /**
     * @notice Get user stats for this season
     */
    function getUserStats(address user) external view returns (
        uint256 totalClicks_,
        uint256 totalEarned_,
        uint256 epochsWon_
    ) {
        totalClicks_ = totalUserClicks[user];
        totalEarned_ = totalUserEarned[user];
        epochsWon_ = epochsWon[user];
    }

    /**
     * @notice Check if user has claimed for an epoch
     */
    function hasClaimed(address user, uint256 epoch) external view returns (bool) {
        return claimed[user][epoch];
    }

    /**
     * @notice Get user's claimed clicks for an epoch
     */
    function getUserEpochClicks(address user, uint256 epoch) external view returns (uint256) {
        return userEpochClicks[user][epoch];
    }

    /**
     * @notice Get epoch end timestamp
     */
    function getEpochEndTime(uint256 epoch) external view returns (uint256) {
        if (!gameStarted || epoch < 1 || epoch > TOTAL_EPOCHS) {
            return 0;
        }
        return gameStartTime + (epoch * EPOCH_DURATION);
    }
}
