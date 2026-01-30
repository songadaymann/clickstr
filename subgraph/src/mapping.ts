import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  GameStarted,
  Clicked,
  EpochFinalized,
} from "../generated/StupidClicker/StupidClicker";
import { User, ClickSubmission, Epoch, GlobalStats } from "../generated/schema";

// Helper to get or create global stats
function getOrCreateGlobalStats(): GlobalStats {
  let stats = GlobalStats.load("global");
  if (stats == null) {
    stats = new GlobalStats("global");
    stats.totalClicks = BigInt.fromI32(0);
    stats.totalDistributed = BigInt.fromI32(0);
    stats.totalBurned = BigInt.fromI32(0);
    stats.uniqueUsers = BigInt.fromI32(0);
    stats.currentEpoch = BigInt.fromI32(0);
  }
  return stats;
}

// Helper to get or create user
function getOrCreateUser(address: Bytes): User {
  let user = User.load(address.toHexString());
  if (user == null) {
    user = new User(address.toHexString());
    user.totalClicks = BigInt.fromI32(0);
    user.totalReward = BigInt.fromI32(0);
    user.epochsParticipated = BigInt.fromI32(0);
    user.epochsWon = BigInt.fromI32(0);
    user.lastActiveEpoch = BigInt.fromI32(0);
    user.lastActiveTimestamp = BigInt.fromI32(0);

    // Increment unique users in global stats
    let stats = getOrCreateGlobalStats();
    stats.uniqueUsers = stats.uniqueUsers.plus(BigInt.fromI32(1));
    stats.save();
  }
  return user;
}

// Helper to get or create epoch
function getOrCreateEpoch(epochNumber: BigInt): Epoch {
  let epoch = Epoch.load(epochNumber.toString());
  if (epoch == null) {
    epoch = new Epoch(epochNumber.toString());
    epoch.epochNumber = epochNumber;
    epoch.totalClicks = BigInt.fromI32(0);
    epoch.totalDistributed = BigInt.fromI32(0);
    epoch.totalBurned = BigInt.fromI32(0);
    epoch.participantCount = BigInt.fromI32(0);
    epoch.winner = null;
    epoch.winnerClicks = null;
    epoch.finalized = false;
    epoch.finalizedAt = null;
    epoch.finalizedBy = null;
  }
  return epoch;
}

export function handleGameStarted(event: GameStarted): void {
  let stats = getOrCreateGlobalStats();
  stats.currentEpoch = BigInt.fromI32(1);
  stats.save();

  // Create epoch 1
  let epoch = getOrCreateEpoch(BigInt.fromI32(1));
  epoch.save();
}

export function handleClicked(event: Clicked): void {
  let user = getOrCreateUser(event.params.user);
  let epoch = getOrCreateEpoch(event.params.epoch);
  let stats = getOrCreateGlobalStats();

  // Create click submission record
  let submissionId =
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let submission = new ClickSubmission(submissionId);
  submission.user = user.id;
  submission.epoch = event.params.epoch;
  submission.validClicks = event.params.validClicks;
  submission.reward = event.params.earned;
  submission.timestamp = event.block.timestamp;
  submission.transactionHash = event.transaction.hash;
  submission.save();

  // Track if this is user's first click in this epoch
  let isNewParticipant = user.lastActiveEpoch.lt(event.params.epoch);

  // Update user stats
  user.totalClicks = user.totalClicks.plus(event.params.validClicks);
  user.totalReward = user.totalReward.plus(event.params.earned);
  user.lastActiveEpoch = event.params.epoch;
  user.lastActiveTimestamp = event.block.timestamp;
  if (isNewParticipant) {
    user.epochsParticipated = user.epochsParticipated.plus(BigInt.fromI32(1));
  }
  user.save();

  // Update epoch stats
  epoch.totalClicks = epoch.totalClicks.plus(event.params.validClicks);
  epoch.totalDistributed = epoch.totalDistributed.plus(event.params.earned);
  epoch.totalBurned = epoch.totalBurned.plus(event.params.burned);
  if (isNewParticipant) {
    epoch.participantCount = epoch.participantCount.plus(BigInt.fromI32(1));
  }
  epoch.save();

  // Update global stats
  stats.totalClicks = stats.totalClicks.plus(event.params.validClicks);
  stats.totalDistributed = stats.totalDistributed.plus(event.params.earned);
  stats.totalBurned = stats.totalBurned.plus(event.params.burned);
  stats.currentEpoch = event.params.epoch;
  stats.save();
}

export function handleEpochFinalized(event: EpochFinalized): void {
  let epoch = getOrCreateEpoch(event.params.epoch);

  epoch.winner = event.params.winner;
  epoch.winnerClicks = event.params.winnerClicks;
  epoch.finalized = true;
  epoch.finalizedAt = event.block.timestamp;
  epoch.finalizedBy = event.params.finalizer;
  epoch.save();

  // Update winner's epochsWon count
  if (event.params.winner.toHexString() != "0x0000000000000000000000000000000000000000") {
    let winner = getOrCreateUser(event.params.winner);
    winner.epochsWon = winner.epochsWon.plus(BigInt.fromI32(1));
    winner.save();
  }
}
