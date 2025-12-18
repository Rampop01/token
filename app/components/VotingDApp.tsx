'use client';

import { useState, useEffect } from 'react';
import { useVoting } from '../context/VotingContext';
import { useWallet } from '../context/WalletContext';

interface Poll {
  pollId: number;
  creator: string;
  title: string;
  description: string;
  yesVotes: number;
  noVotes: number;
  endBlock: number;
  isActive: boolean;
}

export default function VotingDApp() {
  const { isConnected, address } = useWallet();
  const { createPoll, vote, endPoll, loading, error, success, clearMessages } = useVoting();
  
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollCount, setPollCount] = useState(0);
  const [loadingPolls, setLoadingPolls] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState('1');

  const extractValue = (str: string, key: string, type: string): string => {
    if (type === 'string') {
      const match = str.match(new RegExp(`${key}: "([^"]*)"`, 'i'));
      return match ? match[1] : '';
    }
    if (type === 'uint') {
      const match = str.match(new RegExp(`${key}: u(\\d+)`, 'i'));
      return match ? match[1] : '0';
    }
    if (type === 'bool') {
      const match = str.match(new RegExp(`${key}: (true|false)`, 'i'));
      return match ? match[1] : 'false';
    }
    if (type === 'principal') {
      const match = str.match(new RegExp(`${key}: ([A-Z0-9]+)`, 'i'));
      return match ? match[1] : '';
    }
    return '';
  };

  const fetchPolls = async () => {
    if (!isConnected) return;
    
    setLoadingPolls(true);
    try {
      const countRes = await fetch('/api/voting/poll-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: address }),
      });
      const countData = await countRes.json();
      const count = countData.okay ? parseInt(countData.result.replace(/\D/g, '')) : 0;
      setPollCount(count);

      if (count === 0) {
        setPolls([]);
        setLoadingPolls(false);
        return;
      }

      const pollData: Poll[] = [];
      for (let i = 0; i < count; i++) {
        try {
          const pollRes = await fetch('/api/voting/poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender: address, pollId: i }),
          });
          const data = await pollRes.json();
          
          if (data.okay && data.result && !data.result.includes('none')) {
            const result = data.result;
            pollData.push({
              pollId: i,
              creator: extractValue(result, 'creator', 'principal'),
              title: extractValue(result, 'title', 'string'),
              description: extractValue(result, 'description', 'string'),
              yesVotes: parseInt(extractValue(result, 'yes-votes', 'uint')),
              noVotes: parseInt(extractValue(result, 'no-votes', 'uint')),
              endBlock: parseInt(extractValue(result, 'end-block', 'uint')),
              isActive: extractValue(result, 'is-active', 'bool') === 'true',
            });
          }
        } catch (err) {
          console.error(`Error fetching poll ${i}:`, err);
        }
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      setPolls(pollData.reverse());
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoadingPolls(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchPolls();
    }
  }, [isConnected]);

  const handleCreate = async () => {
    if (!title || !description) {
      alert('Please fill in all fields');
      return;
    }
    
    const blocks = Math.floor(parseFloat(days) * 144);
    await createPoll(title, description, blocks);
    setTitle('');
    setDescription('');
    setTimeout(() => fetchPolls(), 5000);
  };

  const handleVote = async (pollId: number, voteYes: boolean) => {
    await vote(pollId, voteYes);
    setTimeout(() => fetchPolls(), 5000);
  };

  const handleEnd = async (pollId: number) => {
    if (confirm('End this poll?')) {
      await endPoll(pollId);
      setTimeout(() => fetchPolls(), 5000);
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">🗳️ Voting DApp</h2>
        <p className="text-gray-600 dark:text-gray-400">Connect your wallet to use the voting app</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 text-red-800 dark:text-red-100 px-4 py-3 rounded relative">
          <button onClick={clearMessages} className="absolute top-2 right-2">✕</button>
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 text-green-800 dark:text-green-100 px-4 py-3 rounded relative">
          <button onClick={clearMessages} className="absolute top-2 right-2">✕</button>
          <p className="font-medium">Success! ✓</p>
          <p className="text-sm break-all">{success}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">➕ Create Poll</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={256}
              className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1024}
              rows={3}
              className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Days</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min="0.01"
              step="0.1"
              className="w-full px-4 py-2 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-semibold">🗳️ Polls ({pollCount})</h2>
          <button onClick={() => fetchPolls()} disabled={loadingPolls} className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
            {loadingPolls ? '⏳' : '🔄'}
          </button>
        </div>

        {loadingPolls ? (
          <div className="text-center py-8">Loading...</div>
        ) : polls.length === 0 ? (
          <div className="text-center py-8">No polls yet</div>
        ) : (
          <div className="space-y-4">
            {polls.map((poll) => {
              const total = poll.yesVotes + poll.noVotes;
              const yesPercent = total > 0 ? Math.round((poll.yesVotes / total) * 100) : 0;
              
              return (
                <div key={poll.pollId} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">{poll.title}</h3>
                      <p className="text-sm text-gray-600">{poll.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs h-fit ${poll.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                      {poll.isActive ? 'Active' : 'Ended'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>👍 Yes</span>
                      <span>{poll.yesVotes} ({yesPercent}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: `${yesPercent}%` }} />
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>👎 No</span>
                      <span>{poll.noVotes} ({100 - yesPercent}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: `${100 - yesPercent}%` }} />
                    </div>
                  </div>

                  {poll.isActive && (
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => handleVote(poll.pollId, true)} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded">
                        👍 Yes
                      </button>
                      <button onClick={() => handleVote(poll.pollId, false)} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded">
                        👎 No
                      </button>
                      {poll.creator === address && (
                        <button onClick={() => handleEnd(poll.pollId)} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded">
                          End
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
