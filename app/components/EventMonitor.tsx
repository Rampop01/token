'use client';

import { useEffect, useState } from 'react';
import { fetchContractTransactions, createEventStream } from '@/lib/chainhooks';
import type { ContractEvent } from '@/lib/chainhooks';

export default function EventMonitor() {
  const [events, setEvents] = useState<ContractEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial events
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true);
      const recentEvents = await fetchContractTransactions(20);
      setEvents(recentEvents);
      setLoading(false);
    };
    
    loadEvents();
  }, []);

  // Start/stop event monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    const cleanup = createEventStream((newEvent) => {
      setEvents((prev) => {
        // Avoid duplicates
        if (prev.some(e => e.id === newEvent.id)) return prev;
        return [newEvent, ...prev].slice(0, 50); // Keep last 50 events
      });
    }, 15000); // Poll every 15 seconds

    return cleanup;
  }, [isMonitoring]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ft-mint': return '🪙';
      case 'ft-transfer': return '💸';
      case 'nft-mint': return '🎨';
      case 'nft-transfer': return '🖼️';
      case 'stx-transfer': return '💰';
      case 'contract-call': return '📞';
      default: return '📋';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'ft-mint':
      case 'nft-mint':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'ft-transfer':
      case 'nft-transfer':
      case 'stx-transfer':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'contract-call':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Contract Events Monitor
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Powered by Hiro API • Real-time Blockchain Events
          </p>
        </div>
        <button
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isMonitoring
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isMonitoring ? '⏸️ Pause' : '▶️ Start'} Live Monitor
        </button>
      </div>

      {isMonitoring && (
        <div className="mb-4 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200 flex items-center">
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Monitoring contract events in real-time (polling every 15s)
          </p>
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No events found. Try interacting with the contract!
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getEventIcon(event.type)}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getEventColor(event.type)}`}>
                    {event.type.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>

              <div className="space-y-1 text-sm">
                {event.data.functionName && (
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Function:</span>{' '}
                    <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">{event.data.functionName}</code>
                  </p>
                )}
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">From:</span>{' '}
                  <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs break-all">
                    {event.sender}
                  </code>
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Block:</span> #{event.data.blockHeight}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">TX ID:</span>{' '}
                  <a
                    href={`https://explorer.hiro.so/txid/${event.txId}?chain=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-xs break-all"
                  >
                    {event.txId.slice(0, 10)}...{event.txId.slice(-6)}
                  </a>
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Showing {events.length} recent events • Data from Hiro API
        </p>
      </div>
    </div>
  );
}
