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
    contractAddress: '0xA16d45e4D186B9678020720BD1e743872a6e9bA0', // Clickstr (v5 - 24hr test Feb 2-3)
    tokenAddress: '0x3706Dcde2dBA966F225E14d3F6c22eaF7A5724c4', // MockClickToken (v5)
    nftContractAddress: '0x39B41525ba423FcAbE23564ecCCdEa66e7D59551', // ClickstrNFT (v5 - IPFS metadata)
    turnstileSiteKey: '0x4AAAAAACV0UOMmCeG_g2Jr',
  },
  mainnet: {
    chainId: 1,
    chainName: 'Ethereum',
    rpcUrl: import.meta.env.VITE_ETH_MAINNET_RPC_URL || '',
    contractAddress: '0x...', // TODO: Deploy and add mainnet Clickstr address
    tokenAddress: '0x...', // TODO: Deploy $CLICK via TokenWorks and add address
    nftContractAddress: '0x...', // TODO: Deploy and add mainnet NFT address
    turnstileSiteKey: '0x4AAAAAACV0UOMmCeG_g2Jr',
  },
} as const;

/** Current active network - change this for deployment */
export const CURRENT_NETWORK: NetworkId = 'sepolia';

/** Build the full application configuration */
export function buildConfig(networkId: NetworkId = CURRENT_NETWORK): AppConfig {
  const network = NETWORKS[networkId];

  return {
    ...network,
    minBatchSize: 50,
    maxBatchSize: 500,
    walletConnectProjectId: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '',
    apiUrl: 'https://mann.cool/api/clickstr',
    subgraphUrl: 'https://api.goldsky.com/api/public/project_cmit79ozucckp01w991mfehjs/subgraphs/clickstr-sepolia/1.0.3/gn',
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
