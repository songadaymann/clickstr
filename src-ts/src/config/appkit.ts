/**
 * Reown AppKit configuration for wallet connections
 */

import { createAppKit } from '@reown/appkit';
import { Ethers5Adapter } from '@reown/appkit-adapter-ethers5';
import { sepolia, mainnet } from '@reown/appkit/networks';
import type { AppKitNetwork } from '@reown/appkit/networks';
import { CONFIG, CURRENT_NETWORK } from './network.ts';

// Select network based on current config
const networks: [AppKitNetwork, ...AppKitNetwork[]] =
  CURRENT_NETWORK === 'mainnet' ? [mainnet, sepolia] : [sepolia, mainnet];

// Metadata for the wallet modal
const metadata = {
  name: 'Clickstr',
  description: 'Proof-of-work clicker game on Ethereum',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://clickstr.fun',
  icons: ['/favicon.png'],
};

// Create the AppKit instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const appKit = createAppKit({
  adapters: [new Ethers5Adapter()] as any,
  networks,
  metadata,
  projectId: CONFIG.walletConnectProjectId,
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00ffff',
    '--w3m-color-mix': '#0a0a1a',
    '--w3m-color-mix-strength': 40,
    '--w3m-border-radius-master': '2px',
    '--w3m-font-family': '"Press Start 2P", monospace',
  },
});

// Re-export for convenience
export { appKit as modal };
