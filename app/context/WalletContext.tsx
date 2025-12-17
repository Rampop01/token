'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { openSTXTransfer, openContractCall, showConnect } from '@stacks/connect';
import { STACKS_TESTNET } from '@stacks/network';
import { principalCV, uintCV, bufferCV } from '@stacks/transactions';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  connectWallet: () => void;
  disconnectWallet: () => void;
  callSetValue: (key: string, value: string) => Promise<void>;
  callGetValue: (key: string) => Promise<void>;
  callTestEventTypes: () => Promise<void>;
  callTestEmitEvent: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const CONTRACT_ADDRESS = 'ST33Y8RCP74098JCSPW5QHHCD6QN4H3XS9E4PVW1G';
const CONTRACT_NAME = 'hello-world';
const NETWORK = STACKS_TESTNET;

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(() => {
    showConnect({
      appDetails: {
        name: 'Stacks DApp',
        icon: window.location.origin + '/next.svg',
      },
      redirectTo: '/',
      onFinish: () => {
        // Get the user's address from localStorage (set by Stacks Connect)
        const userData = localStorage.getItem('blockstack');
        if (userData) {
          try {
            const userObj = JSON.parse(userData);
            const userAddress = userObj?.profile?.stxAddress?.testnet;
            if (userAddress) {
              setAddress(userAddress);
              setIsConnected(true);
              setError(null);
            }
          } catch (err) {
            console.error('Error parsing user data:', err);
          }
        }
      },
      onCancel: () => {
        setError('Wallet connection cancelled');
      },
    });
  }, []);

  const disconnectWallet = useCallback(() => {
    setAddress(null);
    setIsConnected(false);
    localStorage.removeItem('blockstack');
  }, []);

  const callSetValue = useCallback(async (key: string, value: string) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert string to buffer (max 32 bytes)
      const keyBuffer = bufferCV(Buffer.from(key.padEnd(32, '\0')));
      const valueBuffer = bufferCV(Buffer.from(value.padEnd(32, '\0')));

      await openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'set-value',
        functionArgs: [keyBuffer, valueBuffer],
        network: NETWORK,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to call set-value';
      setError(errorMessage);
      console.error('Contract call error:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  const callGetValue = useCallback(async (key: string) => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const keyBuffer = bufferCV(Buffer.from(key.padEnd(32, '\0')));

      await openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'get-value',
        functionArgs: [keyBuffer],
        network: NETWORK,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to call get-value';
      setError(errorMessage);
      console.error('Contract call error:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  const callTestEventTypes = useCallback(async () => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'test-event-types',
        functionArgs: [],
        network: NETWORK,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to call test-event-types';
      setError(errorMessage);
      console.error('Contract call error:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  const callTestEmitEvent = useCallback(async () => {
    if (!isConnected || !address) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'test-emit-event',
        functionArgs: [],
        network: NETWORK,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to call test-emit-event';
      setError(errorMessage);
      console.error('Contract call error:', err);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address]);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected,
        connectWallet,
        disconnectWallet,
        callSetValue,
        callGetValue,
        callTestEventTypes,
        callTestEmitEvent,
        loading,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
