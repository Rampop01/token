'use client';

import { useEffect, useState, useRef } from 'react';
import { connectWebSocketClient } from '@stacks/blockchain-api-client';

interface StacksEvent {
  event: string;
  txId: string;
  pollId?: number;
  data?: any;
}

interface UseStacksWebSocketProps {
  contractAddress: string;
  contractName: string;
  onEvent?: (event: StacksEvent) => void;
  autoConnect?: boolean;
}

export function useStacksWebSocket({
  contractAddress,
  contractName,
  onEvent,
  autoConnect = true
}: UseStacksWebSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<any>(null);
  const subscriptionRef = useRef<any>(null);
  const isConnectingRef = useRef(false);

  useEffect(() => {
    if (!autoConnect) return;

    let mounted = true;

    const connect = async () => {
      // Prevent multiple simultaneous connections
      if (isConnectingRef.current || clientRef.current) {
        console.log('Connection already in progress or established');
        return;
      }

      isConnectingRef.current = true;

      try {
        console.log('Connecting to Stacks WebSocket...');
        
        // Connect to Stacks testnet WebSocket
        const client = await connectWebSocketClient('wss://api.testnet.hiro.so/');
        
        if (!mounted) {
          console.log('Component unmounted, aborting connection');
          return;
        }

        clientRef.current = client;
        
        console.log('WebSocket connected, subscribing to address transactions...');
        setIsConnected(true);
        setError(null);

        // Subscribe to transactions for the contract address
        const contractId = `${contractAddress}.${contractName}`;
        const subscription = await client.subscribeAddressTransactions(contractId, (addressTx: any) => {
          if (!mounted) return;
          
          console.log('Transaction event received:', addressTx);
          
          const tx = addressTx.tx || addressTx;
          const stacksEvent: StacksEvent = {
            event: tx.tx_type || 'transaction',
            txId: tx.tx_id || '',
            data: addressTx
          };
          
          onEvent?.(stacksEvent);
        });

        if (!mounted) {
          await subscription.unsubscribe();
          return;
        }

        subscriptionRef.current = subscription;
        console.log('Successfully subscribed to contract transactions');
        
      } catch (err) {
        console.error('Failed to connect WebSocket:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to connect');
          setIsConnected(false);
        }
      } finally {
        isConnectingRef.current = false;
      }
    };

    connect();

    // Cleanup function
    return () => {
      mounted = false;
      console.log('Cleaning up WebSocket connection...');
      
      const cleanup = async () => {
        try {
          if (subscriptionRef.current) {
            await subscriptionRef.current.unsubscribe();
            subscriptionRef.current = null;
          }
          
          clientRef.current = null;
          isConnectingRef.current = false;
          setIsConnected(false);
        } catch (err) {
          console.error('Error during cleanup:', err);
        }
      };

      cleanup();
    };
  }, [autoConnect, contractAddress, contractName, onEvent]);

  return {
    isConnected,
    error
  };
}
