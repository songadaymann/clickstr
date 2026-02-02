import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useChainId, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { formatEther, parseEther } from 'viem';

// Contract ABI (minimal for what we need)
const CLICKSTR_ABI = [
  {
    name: 'submitClicks',
    type: 'function',
    inputs: [{ name: 'nonces', type: 'uint256[]' }],
    outputs: [],
    stateMutability: 'nonpayable'
  },
  {
    name: 'getCurrentEpochInfo',
    type: 'function',
    inputs: [],
    outputs: [
      { name: 'epoch', type: 'uint256' },
      { name: 'epochStartTime_', type: 'uint256' },
      { name: 'epochEndTime_', type: 'uint256' },
      { name: 'totalClicks', type: 'uint256' },
      { name: 'currentLeader', type: 'address' },
      { name: 'leaderClicks', type: 'uint256' },
      { name: 'distributed', type: 'uint256' },
      { name: 'burned', type: 'uint256' }
    ],
    stateMutability: 'view'
  },
  {
    name: 'getUserEpochStats',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'clicks', type: 'uint256' },
      { name: 'rank', type: 'uint256' },
      { name: 'isLeader', type: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    name: 'getGameStats',
    type: 'function',
    inputs: [],
    outputs: [
      { name: 'poolRemaining_', type: 'uint256' },
      { name: 'currentEpoch_', type: 'uint256' },
      { name: 'totalEpochs_', type: 'uint256' },
      { name: 'gameStartTime_', type: 'uint256' },
      { name: 'gameEndTime_', type: 'uint256' },
      { name: 'difficulty_', type: 'uint256' },
      { name: 'started_', type: 'bool' },
      { name: 'ended_', type: 'bool' }
    ],
    stateMutability: 'view'
  },
  {
    name: 'getUserLifetimeStats',
    type: 'function',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'totalClicks', type: 'uint256' },
      { name: 'totalEarned', type: 'uint256' },
      { name: 'totalBurned', type: 'uint256' },
      { name: 'epochsWon_', type: 'uint256' }
    ],
    stateMutability: 'view'
  }
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const EXPECTED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 1; // Default to mainnet

export default function Clickstr() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const workerRef = useRef(null);
  const lastEpochRef = useRef(null);
  
  const isWrongChain = chainId !== EXPECTED_CHAIN_ID;
  
  // Mining state
  const [isMining, setIsMining] = useState(false);
  const [validClicks, setValidClicks] = useState(0);
  const [hashRate, setHashRate] = useState(0);
  const [pendingNonces, setPendingNonces] = useState([]);
  
  // UI state
  const [buttonScale, setButtonScale] = useState(1);
  const [totalClicks, setTotalClicks] = useState(0);
  
  // Contract reads
  const { data: gameStats, refetch: refetchGameStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLICKSTR_ABI,
    functionName: 'getGameStats',
  });
  
  const { data: epochInfo, refetch: refetchEpochInfo } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLICKSTR_ABI,
    functionName: 'getCurrentEpochInfo',
  });
  
  const { data: userStats, refetch: refetchUserStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CLICKSTR_ABI,
    functionName: 'getUserLifetimeStats',
    args: [address],
    enabled: !!address,
  });
  
  // Contract write
  const { writeContract, data: txHash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('./miner.worker.js', import.meta.url));
    
    workerRef.current.onmessage = (event) => {
      const { type, ...data } = event.data;
      
      switch (type) {
        case 'VALID_PROOF':
          setValidClicks(data.totalValid);
          setHashRate(data.hashRate);
          setPendingNonces(prev => [...prev, data.nonce]);
          // Animate button
          setButtonScale(1.1);
          setTimeout(() => setButtonScale(1), 100);
          break;
          
        case 'STATS':
          setHashRate(data.hashRate);
          break;
          
        case 'STOPPED':
          setPendingNonces(data.validNonces);
          break;
      }
    };
    
    return () => {
      workerRef.current?.terminate();
    };
  }, []);
  
  // Start mining
  const startMining = useCallback(() => {
    if (!address || !gameStats || isWrongChain) return;
    
    workerRef.current?.postMessage({
      type: 'START',
      payload: {
        address,
        epoch: Number(gameStats.currentEpoch_),
        chainId: chainId, // Use actual connected chain
        difficultyTarget: gameStats.difficulty_.toString()
      }
    });
    
    setIsMining(true);
    setValidClicks(0);
    setPendingNonces([]);
  }, [address, gameStats, chainId, isWrongChain]);
  
  // Stop mining
  const stopMining = useCallback(() => {
    workerRef.current?.postMessage({ type: 'STOP' });
    setIsMining(false);
  }, []);
  
  // Submit clicks to blockchain
  const submitClicks = useCallback(async () => {
    if (pendingNonces.length < 50) {
      alert('Need at least 50 valid clicks to submit!');
      return;
    }
    
    stopMining();
    
    const noncesToSubmit = pendingNonces.slice(0, 500); // Max 500 per tx
    
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CLICKSTR_ABI,
      functionName: 'submitClicks',
      args: [noncesToSubmit.map(n => BigInt(n))]
    });
  }, [pendingNonces, stopMining, writeContract]);
  
  // Refetch data after successful tx
  useEffect(() => {
    if (isSuccess) {
      refetchGameStats();
      refetchEpochInfo();
      refetchUserStats();
      setPendingNonces([]);
      setValidClicks(0);
    }
  }, [isSuccess, refetchGameStats, refetchEpochInfo, refetchUserStats]);
  
  // Periodic data refresh
  useEffect(() => {
    const interval = setInterval(() => {
      refetchEpochInfo();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchEpochInfo]);

  useEffect(() => {
    if (!epochInfo || !workerRef.current) return;

    const nextEpoch = Number(epochInfo.epoch);
    if (lastEpochRef.current === null) {
      lastEpochRef.current = nextEpoch;
      return;
    }

    if (nextEpoch !== lastEpochRef.current) {
      lastEpochRef.current = nextEpoch;
      setPendingNonces([]);
      setValidClicks(0);
      workerRef.current.postMessage({
        type: 'UPDATE_EPOCH',
        payload: { epoch: nextEpoch }
      });
    }
  }, [epochInfo]);

  useEffect(() => {
    if (!gameStats || !workerRef.current) return;

    workerRef.current.postMessage({
      type: 'UPDATE_DIFFICULTY',
      payload: { difficultyTarget: gameStats.difficulty_.toString() }
    });
  }, [gameStats]);

  if (!isConnected) {
    return (
      <div className="clickstr not-connected">
        <h1>STUPID CLICKER</h1>
        <p>Connect your wallet to play</p>
      </div>
    );
  }
  
  if (isWrongChain) {
    return (
      <div className="clickstr not-connected">
        <h1>STUPID CLICKER</h1>
        <p style={{ color: '#ff6b6b' }}>
          Wrong network! Please switch to {EXPECTED_CHAIN_ID === 1 ? 'Ethereum Mainnet' : `Chain ID ${EXPECTED_CHAIN_ID}`}
        </p>
      </div>
    );
  }

  const isGameActive = gameStats?.started_ && !gameStats?.ended_;
  const canSubmit = pendingNonces.length >= 50;
  
  return (
    <div className="clickstr">
      <style>{`
        .clickstr {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
          color: #fff;
          font-family: 'Space Mono', monospace;
          padding: 2rem;
        }
        
        .title {
          font-size: 3rem;
          font-weight: 900;
          letter-spacing: -2px;
          margin-bottom: 0.5rem;
          background: linear-gradient(90deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient 3s ease infinite;
          background-size: 300% 300%;
        }
        
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .subtitle {
          color: #888;
          margin-bottom: 3rem;
          font-size: 1rem;
        }
        
        .the-button {
          width: 300px;
          height: 300px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(145deg, #ff6b6b, #ee5a5a);
          box-shadow: 
            0 20px 60px rgba(255, 107, 107, 0.4),
            inset 0 -10px 30px rgba(0, 0, 0, 0.2),
            inset 0 10px 30px rgba(255, 255, 255, 0.1);
          cursor: pointer;
          font-size: 1.5rem;
          font-weight: bold;
          color: white;
          text-transform: uppercase;
          letter-spacing: 2px;
          transition: transform 0.1s ease, box-shadow 0.1s ease;
          position: relative;
          overflow: hidden;
        }
        
        .the-button:hover {
          transform: scale(1.02);
          box-shadow: 
            0 25px 70px rgba(255, 107, 107, 0.5),
            inset 0 -10px 30px rgba(0, 0, 0, 0.2),
            inset 0 10px 30px rgba(255, 255, 255, 0.1);
        }
        
        .the-button:active {
          transform: scale(0.98);
        }
        
        .the-button.mining {
          animation: pulse 1s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% { box-shadow: 0 20px 60px rgba(255, 107, 107, 0.4); }
          50% { box-shadow: 0 20px 80px rgba(255, 107, 107, 0.7); }
        }
        
        .the-button.disabled {
          background: linear-gradient(145deg, #555, #444);
          cursor: not-allowed;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-top: 3rem;
          width: 100%;
          max-width: 800px;
        }
        
        .stat-box {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }
        
        .stat-label {
          color: #888;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 0.5rem;
        }
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #fff;
        }
        
        .stat-value.highlight {
          color: #feca57;
        }
        
        .stat-value.burn {
          color: #ff6b6b;
        }
        
        .submit-button {
          margin-top: 2rem;
          padding: 1rem 3rem;
          font-size: 1.2rem;
          font-weight: bold;
          border: none;
          border-radius: 50px;
          background: linear-gradient(90deg, #48dbfb, #0abde3);
          color: #000;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(72, 219, 251, 0.4);
        }
        
        .submit-button:disabled {
          background: #444;
          color: #888;
          cursor: not-allowed;
        }
        
        .pending-tx {
          margin-top: 1rem;
          color: #feca57;
          animation: blink 1s ease-in-out infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .epoch-timer {
          font-size: 2rem;
          font-weight: bold;
          color: #48dbfb;
          margin-bottom: 1rem;
        }
        
        .leader-badge {
          display: inline-block;
          background: linear-gradient(90deg, #feca57, #f39c12);
          color: #000;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: bold;
          margin-left: 0.5rem;
        }
      `}</style>
      
      <h1 className="title">STUPID CLICKER</h1>
      <p className="subtitle">Click the button. Get tokens. Burn tokens.</p>
      
      {epochInfo && (
        <EpochTimer endTime={Number(epochInfo.epochEndTime_)} />
      )}
      
      <button
        className={`the-button ${isMining ? 'mining' : ''} ${!isGameActive ? 'disabled' : ''}`}
        style={{ transform: `scale(${buttonScale})` }}
        onClick={isMining ? stopMining : startMining}
        disabled={!isGameActive}
      >
        {!isGameActive ? 'Game Not Active' : isMining ? 'STOP' : 'CLICK ME'}
      </button>
      
      <div className="stats-grid">
        <div className="stat-box">
          <div className="stat-label">Your Clicks (Pending)</div>
          <div className="stat-value highlight">{pendingNonces.length}</div>
        </div>
        
        <div className="stat-box">
          <div className="stat-label">Hash Rate</div>
          <div className="stat-value">{hashRate.toLocaleString()} H/s</div>
        </div>
        
        <div className="stat-box">
          <div className="stat-label">Pool Remaining</div>
          <div className="stat-value">
            {gameStats ? formatTokens(gameStats.poolRemaining_) : '...'}
          </div>
        </div>
        
        <div className="stat-box">
          <div className="stat-label">Your Total Earned</div>
          <div className="stat-value highlight">
            {userStats ? formatTokens(userStats.totalEarned) : '0'}
          </div>
        </div>
        
        <div className="stat-box">
          <div className="stat-label">Your Total Burned</div>
          <div className="stat-value burn">
            {userStats ? formatTokens(userStats.totalBurned) : '0'}
          </div>
        </div>
        
        <div className="stat-box">
          <div className="stat-label">Epoch Leader</div>
          <div className="stat-value" style={{ fontSize: '0.9rem' }}>
            {epochInfo?.currentLeader?.slice(0, 6)}...{epochInfo?.currentLeader?.slice(-4)}
            {epochInfo?.currentLeader === address && (
              <span className="leader-badge">YOU!</span>
            )}
          </div>
        </div>
      </div>
      
      <button
        className="submit-button"
        onClick={submitClicks}
        disabled={!canSubmit || isPending || isConfirming}
      >
        {isPending || isConfirming 
          ? 'Submitting...' 
          : `Submit ${pendingNonces.length} Clicks`}
      </button>
      
      {(isPending || isConfirming) && (
        <p className="pending-tx">Transaction pending...</p>
      )}
      
      {isSuccess && (
        <p style={{ color: '#2ecc71', marginTop: '1rem' }}>
          ✓ Clicks submitted! Check your rewards.
        </p>
      )}
    </div>
  );
}

function EpochTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState('');
  
  useEffect(() => {
    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = endTime - now;
      
      if (diff <= 0) {
        setTimeLeft('Epoch ended!');
        return;
      }
      
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };
    
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);
  
  return <div className="epoch-timer">⏱ {timeLeft}</div>;
}

function formatTokens(value) {
  if (!value) return '0';
  const num = Number(value) / 1e18;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}
