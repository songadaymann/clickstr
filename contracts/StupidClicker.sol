// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface for checking NFT claims
interface IStupidClickerNFT {
    function claimed(address user, uint256 tier) external view returns (bool);
}

/**
 * @title StupidClicker
 * @notice The stupidest deflationary game on Ethereum.
 *         Click the button. Get tokens. Burn tokens.
 *         Every click splits 50/50 - half to you, half disappears forever.
 *
 * @dev Uses proof-of-work clicking with Bitcoin-style difficulty adjustment.
 *      Configurable season length via constructor (epochs and duration).
 */
contract StupidClicker is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @notice Burn address
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

    // ============ Season Configuration (Immutable) ============

    /// @notice Duration of each epoch (set in constructor)
    uint256 public immutable EPOCH_DURATION;

    /// @notice Total number of epochs in this season (set in constructor)
    uint256 public immutable TOTAL_EPOCHS;

    /// @notice Target clicks per epoch (scaled based on epoch duration)
    uint256 public immutable TARGET_CLICKS_PER_EPOCH;
    
    /// @notice Daily emission rate (2% of remaining pool in basis points)
    uint256 public constant DAILY_EMISSION_RATE = 200; // 2%
    
    /// @notice Winner bonus rate (10% of daily emission in basis points)
    uint256 public constant WINNER_BONUS_RATE = 1000; // 10%
    
    /// @notice Finalizer reward rate (1% of daily emission in basis points)  
    uint256 public constant FINALIZER_REWARD_RATE = 100; // 1%
    
    /// @notice Basis points denominator
    uint256 public constant BASIS_POINTS = 10000;
    
    /// @notice Base target clicks per 24 hours (used to calculate per-epoch target)
    uint256 public constant BASE_TARGET_CLICKS_PER_DAY = 1_000_000;

    /// @notice Default initial difficulty for first season
    uint256 public constant DEFAULT_INITIAL_DIFFICULTY = type(uint256).max / 1000;
    
    /// @notice Maximum difficulty adjustment per epoch (4x up or down)
    uint256 public constant MAX_ADJUSTMENT_FACTOR = 4;
    
    /// @notice Minimum batch size to submit
    uint256 public constant MIN_BATCH_SIZE = 50;
    
    /// @notice Maximum batch size per transaction (gas limit protection)
    uint256 public constant MAX_BATCH_SIZE = 500;

    /// @notice Maximum epochs to auto-finalize in one transaction (gas bomb protection)
    uint256 public constant MAX_AUTO_FINALIZE = 5;

    /// @notice Precision for scaled math operations
    uint256 public constant PRECISION = 1e18;

    // ============ State Variables ============
    
    /// @notice The $CLICK token
    IERC20 public immutable clickToken;

    /// @notice The achievement NFT contract (optional, can be address(0) for first season)
    IStupidClickerNFT public immutable achievementNFT;

    // ============ NFT Bonus System ============

    /// @notice Bonus percentage per NFT tier (in basis points, e.g., 500 = 5%)
    mapping(uint256 => uint256) public tierBonus;

    /// @notice List of tiers that grant bonuses (for iteration)
    uint256[] public bonusTiers;
    
    /// @notice Game start timestamp
    uint256 public gameStartTime;
    
    /// @notice Game end timestamp
    uint256 public gameEndTime;
    
    /// @notice Current epoch number (1-indexed)
    uint256 public currentEpoch;
    
    /// @notice Remaining tokens in click pool
    uint256 public poolRemaining;
    
    /// @notice Current difficulty target (lower = harder)
    uint256 public difficultyTarget;
    
    /// @notice Whether the game has started
    bool public gameStarted;
    
    /// @notice Whether the game has ended
    bool public gameEnded;

    // ============ Epoch Tracking ============
    
    /// @notice Clicks per user per epoch
    mapping(uint256 => mapping(address => uint256)) public clicksPerEpoch;
    
    /// @notice Total clicks per epoch
    mapping(uint256 => uint256) public totalClicksPerEpoch;
    
    /// @notice Whether epoch has been finalized
    mapping(uint256 => bool) public epochFinalized;
    
    /// @notice Winner of each epoch
    mapping(uint256 => address) public epochWinner;
    
    /// @notice Winner's click count for each epoch
    mapping(uint256 => uint256) public epochWinnerClicks;
    
    /// @notice Tokens distributed per epoch
    mapping(uint256 => uint256) public epochDistributed;
    
    /// @notice Tokens burned per epoch
    mapping(uint256 => uint256) public epochBurned;
    
    /// @notice Used nonces to prevent replay
    mapping(bytes32 => bool) public usedProofs;
    
    /// @notice All participants in an epoch (for winner tracking)
    mapping(uint256 => address[]) public epochParticipants;
    
    /// @notice Whether address has participated in epoch
    mapping(uint256 => mapping(address => bool)) public hasParticipated;
    
    /// @notice Epoch emission allowance tracking (prevents over-emission)
    mapping(uint256 => uint256) public epochEmissionBudget;
    
    /// @notice Epoch emission already used
    mapping(uint256 => uint256) public epochEmissionUsed;

    // ============ User Stats ============
    
    /// @notice Total clicks by user across all epochs
    mapping(address => uint256) public totalUserClicks;
    
    /// @notice Total tokens earned by user
    mapping(address => uint256) public totalUserEarned;
    
    /// @notice Total tokens burned by user's clicks
    mapping(address => uint256) public totalUserBurned;
    
    /// @notice Epochs won by user
    mapping(address => uint256) public epochsWon;

    // ============ Events ============
    
    event GameStarted(uint256 startTime, uint256 endTime, uint256 initialPool);
    event Clicked(
        address indexed user, 
        uint256 indexed epoch, 
        uint256 validClicks, 
        uint256 earned, 
        uint256 burned
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
    event DifficultyAdjusted(uint256 indexed epoch, uint256 oldTarget, uint256 newTarget);
    event GameEnded(uint256 totalDistributed, uint256 totalBurned);
    event BonusApplied(address indexed user, uint256 baseReward, uint256 bonusAmount, uint256 totalBonus);

    // ============ Errors ============
    
    error GameNotStarted();
    error GameAlreadyStarted();
    error GameHasEnded();
    error EpochNotOver();
    error EpochAlreadyFinalized();
    error BatchTooSmall();
    error BatchTooLarge();
    error NoValidProofs();
    error InvalidProof();
    error InsufficientPool();
    error InvalidEpoch();

    // ============ Constructor ============

    /**
     * @notice Deploy a new Stupid Clicker season
     * @param _clickToken Address of the $CLICK token
     * @param _totalEpochs Number of epochs in this season (e.g., 3 for 3-day season)
     * @param _epochDuration Duration of each epoch in seconds (e.g., 86400 for 24 hours)
     * @param _initialDifficulty Starting difficulty target (use DEFAULT_INITIAL_DIFFICULTY for first season,
     *                           or carry over from previous season's final difficultyTarget)
     * @param _achievementNFT Address of the achievement NFT contract (use address(0) for first season)
     */
    constructor(
        address _clickToken,
        uint256 _totalEpochs,
        uint256 _epochDuration,
        uint256 _initialDifficulty,
        address _achievementNFT
    ) Ownable(msg.sender) {
        require(_totalEpochs > 0, "Epochs must be > 0");
        require(_epochDuration >= 1 hours, "Epoch too short (min 1 hour)");
        require(_epochDuration <= 7 days, "Epoch too long (max 7 days)");
        require(_initialDifficulty >= 1000, "Difficulty too low");

        clickToken = IERC20(_clickToken);
        TOTAL_EPOCHS = _totalEpochs;
        EPOCH_DURATION = _epochDuration;

        // Scale target clicks based on epoch duration
        // 1M clicks per 24 hours = ~41,666 per hour
        TARGET_CLICKS_PER_EPOCH = (BASE_TARGET_CLICKS_PER_DAY * _epochDuration) / 86400;

        // Set initial difficulty (carry over from previous season or use default)
        difficultyTarget = _initialDifficulty;

        // Set achievement NFT contract (can be address(0) for first season)
        achievementNFT = IStupidClickerNFT(_achievementNFT);
    }

    // ============ Admin Functions ============

    /**
     * @notice Set bonus percentages for NFT tiers (call before startGame)
     * @param tiers Array of NFT tier numbers that grant bonuses
     * @param bonuses Array of bonus amounts in basis points (e.g., 500 = 5%)
     * @dev Can only be called before game starts. Clears any previous bonuses.
     *
     * Recommended tier bonuses (personal milestones only, no globals):
     *   Tier 4  (1K clicks):   200 bps (2%)
     *   Tier 6  (10K clicks):  300 bps (3%)
     *   Tier 8  (50K clicks):  500 bps (5%)
     *   Tier 9  (100K clicks): 700 bps (7%)
     *   Tier 11 (500K clicks): 1000 bps (10%)
     *   Max possible: 27%
     */
    function setTierBonuses(uint256[] calldata tiers, uint256[] calldata bonuses) external onlyOwner {
        require(!gameStarted, "Game already started");
        require(tiers.length == bonuses.length, "Array length mismatch");
        require(tiers.length <= 20, "Too many bonus tiers");

        // Clear existing bonuses
        for (uint256 i = 0; i < bonusTiers.length; i++) {
            tierBonus[bonusTiers[i]] = 0;
        }
        delete bonusTiers;

        // Set new bonuses
        for (uint256 i = 0; i < tiers.length; i++) {
            require(bonuses[i] <= 2000, "Bonus too high (max 20%)"); // Cap at 20% per tier
            tierBonus[tiers[i]] = bonuses[i];
            bonusTiers.push(tiers[i]);
        }
    }

    /**
     * @notice Start the game. Must have tokens deposited first.
     * @param _poolAmount Amount of tokens in the click pool
     */
    function startGame(uint256 _poolAmount) external onlyOwner {
        if (gameStarted) revert GameAlreadyStarted();
        
        // Transfer tokens from owner to contract
        clickToken.safeTransferFrom(msg.sender, address(this), _poolAmount);
        
        poolRemaining = _poolAmount;
        gameStartTime = block.timestamp;
        gameEndTime = block.timestamp + (TOTAL_EPOCHS * EPOCH_DURATION);
        currentEpoch = 1;
        gameStarted = true;
        
        emit GameStarted(gameStartTime, gameEndTime, _poolAmount);
    }

    // ============ Core Game Functions ============
    
    /**
     * @notice Submit a batch of valid click proofs
     * @param nonces Array of nonces that produce valid hashes
     */
    function submitClicks(uint256[] calldata nonces) external nonReentrant {
        if (!gameStarted) revert GameNotStarted();
        if (block.timestamp >= gameEndTime) revert GameHasEnded();
        if (nonces.length < MIN_BATCH_SIZE) revert BatchTooSmall();
        if (nonces.length > MAX_BATCH_SIZE) revert BatchTooLarge();
        
        // Check if we need to advance epoch
        _checkAndAdvanceEpoch();
        
        uint256 validCount = 0;
        
        for (uint256 i = 0; i < nonces.length; i++) {
            bytes32 proofHash = keccak256(abi.encodePacked(
                msg.sender,
                nonces[i],
                currentEpoch,
                block.chainid
            ));
            
            // Check if proof is valid and unused
            if (uint256(proofHash) < difficultyTarget && !usedProofs[proofHash]) {
                usedProofs[proofHash] = true;
                validCount++;
            }
        }
        
        if (validCount == 0) revert NoValidProofs();

        // Initialize epoch budget if not set (first submission of the epoch)
        // Budget is 2% of pool at the START of the epoch, not current pool
        if (epochEmissionBudget[currentEpoch] == 0) {
            epochEmissionBudget[currentEpoch] = (poolRemaining * DAILY_EMISSION_RATE) / BASIS_POINTS;
        }

        uint256 remainingBudget = epochEmissionBudget[currentEpoch] - epochEmissionUsed[currentEpoch];
        uint256 grossReward;

        if (remainingBudget == 0) {
            // SOFT OVERFLOW: Budget exhausted, but allow reduced-rate rewards from pool
            // This prevents harsh cutoffs and improves UX
            // Rate: 10% of normal (1/10th), directly from remaining pool
            grossReward = (poolRemaining * validCount) / (TARGET_CLICKS_PER_EPOCH * 10);
        } else {
            // Normal reward calculation from epoch budget
            grossReward = (epochEmissionBudget[currentEpoch] * validCount) / TARGET_CLICKS_PER_EPOCH;

            // Cap at remaining epoch budget
            if (grossReward > remainingBudget) {
                grossReward = remainingBudget;
            }
        }

        // Cap at 10% of remaining pool per transaction (safety)
        uint256 maxReward = poolRemaining / 10;
        if (grossReward > maxReward) {
            grossReward = maxReward;
        }

        if (grossReward == 0 || poolRemaining < grossReward) revert InsufficientPool();

        // Track epoch emission usage
        epochEmissionUsed[currentEpoch] += grossReward;

        // 50/50 split: half to player, half burned
        uint256 basePlayerReward = grossReward / 2;
        uint256 burnAmount = grossReward - basePlayerReward;

        // Apply NFT bonus to player reward (bonus comes from pool, not from burn)
        uint256 bonusBps = calculateBonus(msg.sender);
        uint256 bonusAmount = 0;
        if (bonusBps > 0) {
            bonusAmount = (basePlayerReward * bonusBps) / BASIS_POINTS;
            // Cap bonus at available pool (after grossReward deduction)
            uint256 availableForBonus = poolRemaining - grossReward;
            if (bonusAmount > availableForBonus) {
                bonusAmount = availableForBonus;
            }
        }
        uint256 playerReward = basePlayerReward + bonusAmount;

        // Update pool (grossReward for normal distribution + bonus from pool)
        poolRemaining -= (grossReward + bonusAmount);

        // Emit bonus event if applicable
        if (bonusAmount > 0) {
            emit BonusApplied(msg.sender, basePlayerReward, bonusAmount, bonusBps);
        }
        
        // Track clicks for this epoch (for winner determination)
        clicksPerEpoch[currentEpoch][msg.sender] += validCount;
        totalClicksPerEpoch[currentEpoch] += validCount;
        
        // Track participation
        if (!hasParticipated[currentEpoch][msg.sender]) {
            hasParticipated[currentEpoch][msg.sender] = true;
            epochParticipants[currentEpoch].push(msg.sender);
        }
        
        // Update user stats
        totalUserClicks[msg.sender] += validCount;
        totalUserEarned[msg.sender] += playerReward;
        totalUserBurned[msg.sender] += burnAmount;
        
        // Update epoch stats (playerReward includes bonus)
        epochDistributed[currentEpoch] += playerReward;
        epochBurned[currentEpoch] += burnAmount;
        
        // Update winner tracking
        if (clicksPerEpoch[currentEpoch][msg.sender] > epochWinnerClicks[currentEpoch]) {
            epochWinner[currentEpoch] = msg.sender;
            epochWinnerClicks[currentEpoch] = clicksPerEpoch[currentEpoch][msg.sender];
        }
        
        // Transfer rewards
        clickToken.safeTransfer(msg.sender, playerReward);
        clickToken.safeTransfer(BURN_ADDRESS, burnAmount);
        
        emit Clicked(msg.sender, currentEpoch, validCount, playerReward, burnAmount);
    }
    
    /**
     * @notice Finalize an epoch and distribute winner bonus
     * @param epoch The epoch to finalize
     */
    function finalizeEpoch(uint256 epoch) external nonReentrant {
        if (!gameStarted) revert GameNotStarted();
        if (epoch < 1 || epoch > TOTAL_EPOCHS) revert InvalidEpoch();
        if (epochFinalized[epoch]) revert EpochAlreadyFinalized();

        uint256 epochEndTime = gameStartTime + (epoch * EPOCH_DURATION);
        if (block.timestamp < epochEndTime) revert EpochNotOver();

        // Explicit finalize calls get the finalizer reward
        _finalizeEpochInternal(epoch, msg.sender, true);
    }

    /**
     * @notice Finalize multiple epochs in one transaction (for catching up after dormancy)
     * @param epochs Array of epoch numbers to finalize
     * @dev Capped at MAX_AUTO_FINALIZE epochs per call for gas safety
     */
    function finalizeMultipleEpochs(uint256[] calldata epochs) external nonReentrant {
        if (!gameStarted) revert GameNotStarted();

        uint256 count = epochs.length;
        if (count > MAX_AUTO_FINALIZE) {
            count = MAX_AUTO_FINALIZE;
        }

        for (uint256 i = 0; i < count; i++) {
            uint256 epoch = epochs[i];
            if (epoch < 1 || epoch > TOTAL_EPOCHS) continue;
            if (epochFinalized[epoch]) continue;

            uint256 epochEndTime = gameStartTime + (epoch * EPOCH_DURATION);
            if (block.timestamp < epochEndTime) continue;

            // Pay finalizer reward for explicit batch finalization
            _finalizeEpochInternal(epoch, msg.sender, true);
        }
    }
    
    /**
     * @notice Emergency end game and distribute remaining pool on final day
     * @dev Can only be called after game end time
     */
    function endGame() external nonReentrant {
        if (block.timestamp < gameEndTime) revert EpochNotOver();
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

        // Auto-finalize elapsed epochs so difficulty and pool stay in sync.
        // Capped at MAX_AUTO_FINALIZE to prevent gas bomb DoS
        uint256 finalized = 0;
        while (currentEpoch < targetEpoch && finalized < MAX_AUTO_FINALIZE) {
            if (!epochFinalized[currentEpoch]) {
                // Don't pay finalizer reward on auto-finalize (MEV protection)
                _finalizeEpochInternal(currentEpoch, address(0), false);
                finalized++;
            }
            currentEpoch++;
        }
    }
    
    function _adjustDifficulty(uint256 epoch, uint256 lastEpochClicks) internal {
        uint256 oldTarget = difficultyTarget;
        uint256 maxTarget = type(uint256).max / 2;

        if (lastEpochClicks == 0) {
            // DEATH SPIRAL FIX: Zero clicks means way too hard.
            // Apply maximum ease (4x) to help the game recover.
            // Check for overflow before multiplying
            if (difficultyTarget > maxTarget / MAX_ADJUSTMENT_FACTOR) {
                difficultyTarget = maxTarget;
            } else {
                difficultyTarget = difficultyTarget * MAX_ADJUSTMENT_FACTOR;
            }
        } else if (lastEpochClicks > TARGET_CLICKS_PER_EPOCH) {
            // Too many clicks - make harder (lower target)
            // Use scaled math to preserve precision
            uint256 scaledRatio = (lastEpochClicks * PRECISION) / TARGET_CLICKS_PER_EPOCH;
            if (scaledRatio > MAX_ADJUSTMENT_FACTOR * PRECISION) {
                scaledRatio = MAX_ADJUSTMENT_FACTOR * PRECISION;
            }
            difficultyTarget = (difficultyTarget * PRECISION) / scaledRatio;
        } else if (lastEpochClicks < TARGET_CLICKS_PER_EPOCH) {
            // Too few clicks - make easier (higher target)
            // Use scaled math to preserve precision
            uint256 scaledRatio = (TARGET_CLICKS_PER_EPOCH * PRECISION) / lastEpochClicks;
            if (scaledRatio > MAX_ADJUSTMENT_FACTOR * PRECISION) {
                scaledRatio = MAX_ADJUSTMENT_FACTOR * PRECISION;
            }
            // Check for overflow before multiplying: if a * b > max, then a > max / b
            if (difficultyTarget > type(uint256).max / scaledRatio) {
                difficultyTarget = maxTarget;
            } else {
                difficultyTarget = (difficultyTarget * scaledRatio) / PRECISION;
            }
        }

        // Ensure target doesn't overflow or underflow to unusable values
        if (difficultyTarget > maxTarget) {
            difficultyTarget = maxTarget;
        }
        if (difficultyTarget < 1000) {
            difficultyTarget = 1000;
        }

        emit DifficultyAdjusted(epoch, oldTarget, difficultyTarget);
    }

    function _finalizeEpochInternal(uint256 epoch, address finalizer, bool payFinalizer) internal {
        epochFinalized[epoch] = true;

        address winner = epochWinner[epoch];
        uint256 totalClicks = totalClicksPerEpoch[epoch];

        uint256 epochBudget = epochEmissionBudget[epoch];
        if (epochBudget == 0) {
            epochBudget = (poolRemaining * DAILY_EMISSION_RATE) / BASIS_POINTS;
            epochEmissionBudget[epoch] = epochBudget;
        }

        if (epochBudget > epochEmissionUsed[epoch]) {
            uint256 unusedEmission = epochBudget - epochEmissionUsed[epoch];
            if (unusedEmission > poolRemaining) {
                unusedEmission = poolRemaining;
            }
            if (unusedEmission > 0) {
                poolRemaining -= unusedEmission;
                epochBurned[epoch] += unusedEmission;
                clickToken.safeTransfer(BURN_ADDRESS, unusedEmission);
            }
        }

        // Calculate winner bonus (10% of what was distributed, from remaining pool)
        uint256 winnerBonus = 0;
        if (winner != address(0) && poolRemaining > 0) {
            winnerBonus = (epochDistributed[epoch] * WINNER_BONUS_RATE) / BASIS_POINTS;
            if (winnerBonus > poolRemaining) {
                winnerBonus = poolRemaining;
            }

            // Winner bonus also gets 50/50 split
            uint256 winnerReceives = winnerBonus / 2;
            uint256 winnerBurns = winnerBonus - winnerReceives;

            poolRemaining -= winnerBonus;

            if (winnerReceives > 0) {
                clickToken.safeTransfer(winner, winnerReceives);
                totalUserEarned[winner] += winnerReceives;
            }
            if (winnerBurns > 0) {
                clickToken.safeTransfer(BURN_ADDRESS, winnerBurns);
                totalUserBurned[winner] += winnerBurns;
            }

            epochsWon[winner]++;
            epochDistributed[epoch] += winnerReceives;
            epochBurned[epoch] += winnerBurns;
        }

        // MEV PROTECTION: Only pay finalizer reward for explicit finalize calls
        // Auto-finalize during submitClicks does NOT get the reward
        uint256 finalizerReward = 0;
        if (payFinalizer && finalizer != address(0)) {
            finalizerReward = (epochDistributed[epoch] * FINALIZER_REWARD_RATE) / BASIS_POINTS;
            if (finalizerReward > poolRemaining) {
                finalizerReward = poolRemaining;
            }
            if (finalizerReward > 0) {
                poolRemaining -= finalizerReward;
                clickToken.safeTransfer(finalizer, finalizerReward);
            }
        }

        // Adjust difficulty for next epoch
        _adjustDifficulty(epoch, totalClicks);

        emit EpochFinalized(
            epoch,
            winner,
            epochWinnerClicks[epoch],
            totalClicks,
            epochDistributed[epoch],
            epochBurned[epoch],
            finalizer,
            finalizerReward
        );

        // Check if this was the final epoch
        if (epoch >= TOTAL_EPOCHS) {
            _endGame();
        }
    }
    
    /**
     * @notice Calculate bonus multiplier for a user based on their NFT holdings
     * @param user Address to check
     * @return bonusBps Total bonus in basis points (0 = no bonus, 500 = 5% bonus)
     */
    function calculateBonus(address user) public view returns (uint256 bonusBps) {
        // If no NFT contract set, no bonuses
        if (address(achievementNFT) == address(0)) {
            return 0;
        }

        // Sum up bonuses for all tiers the user has claimed
        for (uint256 i = 0; i < bonusTiers.length; i++) {
            uint256 tier = bonusTiers[i];
            if (tierBonus[tier] > 0) {
                // Use try/catch in case NFT contract call fails
                try achievementNFT.claimed(user, tier) returns (bool hasClaimed) {
                    if (hasClaimed) {
                        bonusBps += tierBonus[tier];
                    }
                } catch {
                    // NFT contract call failed, skip this tier
                }
            }
        }

        // Cap total bonus at 50% (5000 bps)
        if (bonusBps > 5000) {
            bonusBps = 5000;
        }
    }

    function _endGame() internal {
        gameEnded = true;
        
        uint256 remaining = poolRemaining;
        uint256 totalDistributed = 0;
        uint256 totalBurned = 0;
        
        // Calculate totals
        for (uint256 i = 1; i <= TOTAL_EPOCHS; i++) {
            totalDistributed += epochDistributed[i];
            totalBurned += epochBurned[i];
        }
        
        // If there's remaining pool, burn it all (game over)
        if (remaining > 0) {
            clickToken.safeTransfer(BURN_ADDRESS, remaining);
            totalBurned += remaining;
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
     * @notice Get user stats for current epoch
     */
    function getUserEpochStats(address user) external view returns (
        uint256 clicks,
        uint256 rank,
        bool isLeader
    ) {
        clicks = clicksPerEpoch[currentEpoch][user];
        isLeader = epochWinner[currentEpoch] == user && clicks > 0;
        rank = 0;
    }

    /**
     * @notice Get user stats for a specific epoch, including approximate rank
     * @dev Rank calculation is bounded to first 1000 participants for gas safety.
     *      For epochs with >1000 participants, rank may be approximate.
     */
    function getUserEpochStatsWithRank(uint256 epoch, address user) external view returns (
        uint256 clicks,
        uint256 rank,
        bool isLeader
    ) {
        if (epoch < 1 || epoch > TOTAL_EPOCHS) revert InvalidEpoch();
        clicks = clicksPerEpoch[epoch][user];
        isLeader = epochWinner[epoch] == user && clicks > 0;

        rank = 1;
        address[] memory participants = epochParticipants[epoch];
        // BOUNDED ITERATION: Cap at 1000 to prevent gas exhaustion
        uint256 maxCheck = participants.length > 1000 ? 1000 : participants.length;
        for (uint256 i = 0; i < maxCheck; i++) {
            if (clicksPerEpoch[epoch][participants[i]] > clicks) {
                rank++;
            }
        }
    }
    
    /**
     * @notice Get user lifetime stats
     */
    function getUserLifetimeStats(address user) external view returns (
        uint256 totalClicks,
        uint256 totalEarned,
        uint256 totalBurned,
        uint256 epochsWon_
    ) {
        totalClicks = totalUserClicks[user];
        totalEarned = totalUserEarned[user];
        totalBurned = totalUserBurned[user];
        epochsWon_ = epochsWon[user];
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
        uint256 difficulty_,
        bool started_,
        bool ended_
    ) {
        poolRemaining_ = poolRemaining;
        currentEpoch_ = currentEpoch;
        totalEpochs_ = TOTAL_EPOCHS;
        gameStartTime_ = gameStartTime;
        gameEndTime_ = gameEndTime;
        difficulty_ = difficultyTarget;
        started_ = gameStarted;
        ended_ = gameEnded;
    }
    
    /**
     * @notice Check if a proof would be valid (for frontend mining)
     */
    function isValidProof(address user, uint256 nonce, uint256 epoch) external view returns (bool) {
        bytes32 proofHash = keccak256(abi.encodePacked(
            user,
            nonce,
            epoch,
            block.chainid
        ));
        return uint256(proofHash) < difficultyTarget && !usedProofs[proofHash];
    }
    
    /**
     * @notice Get the current difficulty target
     */
    function getDifficultyTarget() external view returns (uint256) {
        return difficultyTarget;
    }
    
    /**
     * @notice Get number of participants in an epoch
     */
    function getEpochParticipantCount(uint256 epoch) external view returns (uint256) {
        return epochParticipants[epoch].length;
    }
    
    /**
     * @notice Estimate gas-adjusted time per valid hash
     * @dev Rough estimate for UI display
     */
    function estimatedTimePerClick() external view returns (uint256 milliseconds) {
        // Very rough estimate based on difficulty
        // Assumes ~1M hashes per second on average hardware
        uint256 hashesNeeded = type(uint256).max / difficultyTarget;
        milliseconds = hashesNeeded / 1000; // 1M hashes/sec = 1K hashes/ms
        if (milliseconds == 0) milliseconds = 1;
    }

    /**
     * @notice Get all configured bonus tiers and their bonuses
     * @return tiers Array of tier numbers
     * @return bonuses Array of bonus amounts in basis points
     */
    function getBonusTiers() external view returns (uint256[] memory tiers, uint256[] memory bonuses) {
        tiers = bonusTiers;
        bonuses = new uint256[](bonusTiers.length);
        for (uint256 i = 0; i < bonusTiers.length; i++) {
            bonuses[i] = tierBonus[bonusTiers[i]];
        }
    }

    /**
     * @notice Get detailed bonus info for a user
     * @param user Address to check
     * @return totalBonusBps Total bonus in basis points
     * @return qualifyingTiers Array of tier numbers the user qualifies for
     */
    function getUserBonusInfo(address user) external view returns (
        uint256 totalBonusBps,
        uint256[] memory qualifyingTiers
    ) {
        if (address(achievementNFT) == address(0)) {
            return (0, new uint256[](0));
        }

        // First pass: count qualifying tiers
        uint256 count = 0;
        for (uint256 i = 0; i < bonusTiers.length; i++) {
            try achievementNFT.claimed(user, bonusTiers[i]) returns (bool hasClaimed) {
                if (hasClaimed && tierBonus[bonusTiers[i]] > 0) {
                    count++;
                }
            } catch {}
        }

        // Second pass: build array
        qualifyingTiers = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < bonusTiers.length; i++) {
            try achievementNFT.claimed(user, bonusTiers[i]) returns (bool hasClaimed) {
                if (hasClaimed && tierBonus[bonusTiers[i]] > 0) {
                    qualifyingTiers[idx++] = bonusTiers[i];
                    totalBonusBps += tierBonus[bonusTiers[i]];
                }
            } catch {}
        }

        // Cap at 50%
        if (totalBonusBps > 5000) {
            totalBonusBps = 5000;
        }
    }
}
