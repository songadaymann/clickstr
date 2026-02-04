/**
 * Network configuration for Ethereum chains
 */

import type { NetworkConfig, AppConfig } from '@/types/index.ts';

/** Available network identifiers */
export type NetworkId = 'sepolia' | 'mainnet';

/** Network-specific configurations */
export const NETWORKS: Record<NetworkId, NetworkConfig> = {
  sepolia: {
    chainId: 11155111,
    chainName: 'Sepolia',
    rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || '',
    contractAddress: '0xf724ede44Bbb2Ccf46cec530c21B14885D441e02', // Clickstr (v6 - mainnet dry run Feb 3-4)
    tokenAddress: '0x78A607EDE7C7b134F51E725e4bA73D7b269580fc', // MockClickToken (v6 - 1B supply)
    nftContractAddress: '0x37c4C8817a6F87e6a0984b5e8fd73c9F07f8f849', // ClickstrNFT (v6 - same as mainnet)
    turnstileSiteKey: '0x4AAAAAACV0UOMmCeG_g2Jr',
  },
  mainnet: {
    chainId: 1,
    chainName: 'Ethereum',
    rpcUrl: import.meta.env.VITE_ETH_MAINNET_RPC_URL || '',
    contractAddress: '0xf724ede44Bbb2Ccf46cec530c21B14885D441e02', // Clickstr Season 1 (Feb 4-7, 2026)
    tokenAddress: '0x7ddbd0c4a0383a0f9611b715809f92c90e1d991d', // $CLICK token via TokenWorks
    nftContractAddress: '0x37c4C8817a6F87e6a0984b5e8fd73c9F07f8f849', // ClickstrNFT
    turnstileSiteKey: '0x4AAAAAACV0UOMmCeG_g2Jr',
  },
} as const;

/** Current active network - change this for deployment */
export const CURRENT_NETWORK: NetworkId = 'mainnet';

/** Build the full application configuration */
export function buildConfig(networkId: NetworkId = CURRENT_NETWORK): AppConfig {
  const network = NETWORKS[networkId];

  return {
    ...network,
    minBatchSize: 50,
    maxBatchSize: 500,
    walletConnectProjectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '',
    apiUrl: 'https://mann.cool/api/clickstr',
    subgraphUrl: networkId === 'mainnet'
      ? 'https://api.goldsky.com/api/public/project_cmit79ozucckp01w991mfehjs/subgraphs/clickstr-mainnet/1.0.0/gn'
      : 'https://api.goldsky.com/api/public/project_cmit79ozucckp01w991mfehjs/subgraphs/clickstr-sepolia/1.0.4/gn',
  };
}

/** The active configuration */
export const CONFIG: AppConfig = buildConfig(CURRENT_NETWORK);

/** Check if an NFT contract address is configured */
export function hasNftContract(): boolean {
  return CONFIG.nftContractAddress !== '0x...';
}

/** Check if we're on mainnet */
export function isMainnet(): boolean {
  return CURRENT_NETWORK === 'mainnet';
}

/** Get chain ID as hex string for wallet operations */
export function getChainIdHex(): string {
  return '0x' + CONFIG.chainId.toString(16);
}
