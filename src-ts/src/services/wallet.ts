/**
 * Wallet connection service
 */

import { ethers } from 'ethers';
import { CONFIG, getChainIdHex } from '@/config/index.ts';
import { gameState } from '@/state/index.ts';
import type { WalletType } from '@/types/index.ts';

/** Provider and signer instances */
let provider: ethers.providers.Web3Provider | null = null;
let signer: ethers.Signer | null = null;
let walletConnectProvider: any = null; // WalletConnect provider

/** WalletConnect wallet IDs for specific wallets */
const WALLET_IDS: Record<string, string> = {
  rainbow: '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369',
  rabby: '7674bb4e353bf52886768a3ddc2a4562ce2f4191c80831291218ebd90f5f5e26',
  coinbase: 'ef333840daf915aafdc4a004525502d6d49d77bd9c65e0642dbaefb3c2893bef',
  metamask: 'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
  ledger: '19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927',
  zerion: 'ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18',
};

/**
 * Get the current provider
 */
export function getProvider(): ethers.providers.Web3Provider | null {
  return provider;
}

/**
 * Get the current signer
 */
export function getSigner(): ethers.Signer | null {
  return signer;
}

/**
 * Connect with MetaMask (browser extension)
 */
export async function connectWithMetaMask(): Promise<boolean> {
  const ethereum = (window as any).ethereum;

  if (typeof ethereum === 'undefined') {
    alert('Please install MetaMask');
    return false;
  }

  try {
    gameState.setConnecting();

    provider = new ethers.providers.Web3Provider(ethereum);
    await provider.send('eth_requestAccounts', []);

    const network = await provider.getNetwork();
    if (network.chainId !== CONFIG.chainId) {
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: getChainIdHex() }],
        });
        // Refresh provider after chain switch
        provider = new ethers.providers.Web3Provider(ethereum);
      } catch {
        gameState.setWrongNetwork();
        return false;
      }
    }

    await finalizeConnection();

    // Set up event listeners
    ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        window.location.reload();
      }
    });

    ethereum.on('chainChanged', () => {
      window.location.reload();
    });

    return true;
  } catch (error) {
    console.error('MetaMask error:', error);
    gameState.setDisconnected();
    return false;
  }
}

/**
 * Connect with WalletConnect
 * @param preferredWalletId Optional wallet ID to show specific wallet
 */
export async function connectWithWalletConnect(preferredWalletId?: string): Promise<boolean> {
  try {
    gameState.setConnecting();

    // WalletConnect v2 UMD exports under different names depending on version
    const wcModule = (window as any)['@walletconnect/ethereum-provider'];
    const WCProvider =
      (wcModule && wcModule.EthereumProvider) ||
      (window as any).EthereumProvider ||
      (typeof (window as any).EthereumProvider !== 'undefined'
        ? (window as any).EthereumProvider
        : null);

    if (!WCProvider) {
      console.error('WalletConnect not available');
      alert('WalletConnect failed to load. Please try MetaMask instead.');
      gameState.setDisconnected();
      return false;
    }

    // Build modal options - newer WC versions use different structure
    const qrModalOptions: Record<string, unknown> = preferredWalletId
      ? {
          featuredWalletIds: [preferredWalletId],
          enableExplorer: false,
        }
      : {
          featuredWalletIds: [
            WALLET_IDS.rainbow,
            WALLET_IDS.metamask,
            WALLET_IDS.ledger,
            WALLET_IDS.zerion,
            WALLET_IDS.rabby,
            WALLET_IDS.coinbase,
          ],
          enableExplorer: true,
        };

    walletConnectProvider = await WCProvider.init({
      projectId: CONFIG.walletConnectProjectId,
      // v2.17+ uses optionalChains instead of chains for better compatibility
      optionalChains: [CONFIG.chainId],
      showQrModal: true,
      metadata: {
        name: 'Clickstr',
        description: 'Proof-of-work clicker game',
        url: location.origin,
        icons: [`${location.origin}/favicon.png`],
      },
      rpcMap: { [CONFIG.chainId]: CONFIG.rpcUrl },
      qrModalOptions,
    });

    await walletConnectProvider.enable();
    provider = new ethers.providers.Web3Provider(walletConnectProvider);
    await finalizeConnection();

    // Set up event listeners
    walletConnectProvider.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        window.location.reload();
      }
    });

    walletConnectProvider.on('chainChanged', () => {
      window.location.reload();
    });

    walletConnectProvider.on('disconnect', () => {
      disconnect();
    });

    return true;
  } catch (error) {
    console.error('WalletConnect error:', error);
    alert('WalletConnect connection failed: ' + ((error as Error).message || 'Unknown error'));
    walletConnectProvider = null;
    gameState.setDisconnected();
    return false;
  }
}

/**
 * Connect with a specific wallet type
 */
export async function connect(walletType: WalletType): Promise<boolean> {
  switch (walletType) {
    case 'metamask':
      return connectWithMetaMask();
    case 'rainbow':
      return connectWithWalletConnect(WALLET_IDS.rainbow);
    case 'rabby':
      return connectWithWalletConnect(WALLET_IDS.rabby);
    case 'coinbase':
      return connectWithWalletConnect(WALLET_IDS.coinbase);
    case 'walletconnect':
      return connectWithWalletConnect();
    default:
      console.error('Unknown wallet type:', walletType);
      return false;
  }
}

/**
 * Finalize the connection after provider is set up
 */
async function finalizeConnection(): Promise<void> {
  if (!provider) throw new Error('No provider');

  signer = provider.getSigner();
  const address = await signer.getAddress();

  gameState.setConnected(address);
}

/**
 * Disconnect the wallet
 */
export async function disconnect(): Promise<void> {
  if (walletConnectProvider) {
    try {
      await walletConnectProvider.disconnect();
    } catch {
      // Ignore disconnect errors
    }
    walletConnectProvider = null;
  }

  provider = null;
  signer = null;

  gameState.setDisconnected();
}

/**
 * Check if MetaMask is available
 */
export function hasMetaMask(): boolean {
  return typeof (window as any).ethereum !== 'undefined';
}
