/**
 * Stupid Clicker - Browser Mining WebWorker
 *
 * This worker runs in the background and mines valid proof-of-work hashes.
 * It communicates with the main thread to report valid nonces.
 *
 * Uses js-sha3 keccak256 to match Solidity's abi.encodePacked behavior.
 */

import { keccak256 } from 'js-sha3';

function keccak256Bytes(data) {
  return new Uint8Array(keccak256.arrayBuffer(data));
}

function bytesToHex(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

// ============ Mining Logic ============

let mining = false;
let userAddress = null;
let currentEpoch = null;
let chainId = null;
let difficultyTarget = null;
let validNonces = [];
let hashCount = 0;
let startTime = null;
let nonceCounter = 0n; // Use sequential nonces for determinism

/**
 * Pack data the same way Solidity's abi.encodePacked does
 * address (20 bytes) + nonce (32 bytes) + epoch (32 bytes) + chainId (32 bytes)
 * 
 * IMPORTANT: Solidity uses big-endian for uint256 values
 * Big-endian means most significant byte first (at lower index)
 */
function packData(address, nonce, epoch, chainId) {
  const packed = new Uint8Array(20 + 32 + 32 + 32);
  
  // Address: 20 bytes (remove 0x prefix)
  const addrHex = address.toLowerCase().replace('0x', '');
  for (let i = 0; i < 20; i++) {
    packed[i] = parseInt(addrHex.substr(i * 2, 2), 16);
  }
  
  // Nonce: 32 bytes, big-endian
  // Extract LSB first, place at END of 32-byte region (index 51, then 50, etc.)
  let n = BigInt(nonce);
  for (let i = 31; i >= 0; i--) {
    packed[20 + i] = Number(n & 0xffn);  // LSB goes to position 51, then 50, etc.
    n = n >> 8n;
  }
  
  // Epoch: 32 bytes, big-endian
  let e = BigInt(epoch);
  for (let i = 31; i >= 0; i--) {
    packed[52 + i] = Number(e & 0xffn);  // LSB goes to position 83, then 82, etc.
    e = e >> 8n;
  }
  
  // ChainId: 32 bytes, big-endian
  let c = BigInt(chainId);
  for (let i = 31; i >= 0; i--) {
    packed[84 + i] = Number(c & 0xffn);  // LSB goes to position 115, then 114, etc.
    c = c >> 8n;
  }
  
  return packed;
}

function bytesToBigInt(bytes) {
  let result = 0n;
  for (let i = 0; i < bytes.length; i++) {
    result = (result << 8n) | BigInt(bytes[i]);
  }
  return result;
}

/**
 * Main mining loop
 */
function mine() {
  if (!mining || !userAddress || !currentEpoch || !difficultyTarget) {
    return;
  }
  
  const batchSize = 1000; // Check this many nonces per iteration
  const targetBigInt = BigInt(difficultyTarget);
  
  for (let i = 0; i < batchSize && mining; i++) {
    // Use sequential nonces for deterministic behavior
    const nonce = nonceCounter++;
    hashCount++;
    
    try {
      const packed = packData(userAddress, nonce, currentEpoch, chainId);
      const hash = keccak256Bytes(packed);
      const hashValue = bytesToBigInt(hash);
      
      if (hashValue < targetBigInt) {
        // Found a valid proof!
        validNonces.push(nonce.toString());
        
        postMessage({
          type: 'VALID_PROOF',
          nonce: nonce.toString(),
          totalValid: validNonces.length,
          hashRate: calculateHashRate()
        });
      }
    } catch (error) {
      postMessage({
        type: 'ERROR',
        message: error.message
      });
    }
  }
  
  // Report stats periodically
  if (hashCount % 10000 === 0) {
    postMessage({
      type: 'STATS',
      hashCount: hashCount,
      hashRate: calculateHashRate(),
      validCount: validNonces.length
    });
  }
  
  // Continue mining
  if (mining) {
    setTimeout(mine, 0);
  }
}

function calculateHashRate() {
  if (!startTime) return 0;
  const elapsed = (Date.now() - startTime) / 1000;
  return Math.floor(hashCount / elapsed);
}

/**
 * Handle messages from main thread
 */
self.onmessage = function(event) {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'START':
      {
        const testHash = bytesToHex(keccak256Bytes(new Uint8Array()));
        if (testHash !== 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470') {
          postMessage({
            type: 'ERROR',
            message: 'keccak256 self-check failed'
          });
          return;
        }
      }
      userAddress = payload.address;
      currentEpoch = payload.epoch;
      chainId = payload.chainId;
      difficultyTarget = payload.difficultyTarget;
      validNonces = [];
      hashCount = 0;
      nonceCounter = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)); // Random start
      startTime = Date.now();
      mining = true;
      
      postMessage({ type: 'STARTED' });
      mine();
      break;
      
    case 'STOP':
      mining = false;
      postMessage({ 
        type: 'STOPPED',
        validNonces: validNonces,
        hashCount: hashCount,
        hashRate: calculateHashRate()
      });
      break;
      
    case 'GET_NONCES':
      // Return current valid nonces for batch submission
      const noncesToSubmit = [...validNonces];
      validNonces = []; // Clear after getting
      postMessage({
        type: 'NONCES',
        nonces: noncesToSubmit
      });
      break;
      
    case 'UPDATE_DIFFICULTY':
      difficultyTarget = payload.difficultyTarget;
      postMessage({ type: 'DIFFICULTY_UPDATED' });
      break;
      
    case 'UPDATE_EPOCH':
      currentEpoch = payload.epoch;
      validNonces = []; // Clear nonces for new epoch
      nonceCounter = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)); // New random start
      postMessage({ type: 'EPOCH_UPDATED' });
      break;
      
    default:
      postMessage({ type: 'UNKNOWN_COMMAND' });
  }
};
