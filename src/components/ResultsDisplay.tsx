import React from 'react';
import { useEffect, useState } from 'react';
import { getResults } from '../services/supabase';

interface Results {
  spread: {
    wins: number;
    losses: number;
    pushes: number;
  };
  total: {
    wins: number;
    losses: number;
    pushes: number;
  };
}

export function ResultsDisplay() {
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        const data = await getResults();
        setResults(data);
      } catch (error) {
        console.error('Error loading results:', error);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, []);

  if (loading) return <div>Loading results...</div>;
  if (!results) return null;

  const calculateWinPercentage = (wins: number, total: number) => {
    if (total === 0) return 0;
    return ((wins / total) * 100).toFixed(1);
  };

  const spreadTotal = results.spread.wins + results.spread.losses;
  const totalTotal = results.total.wins + results.total.losses;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Betting Results</h2>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Spread Bets</h3>
          <div className="space-y-2">
            <p>Wins: {results.spread.wins}</p>
            <p>Losses: {results.spread.losses}</p>
            <p>Pushes: {results.spread.pushes}</p>
            <p className="font-bold">
              Win Rate: {calculateWinPercentage(results.spread.wins, spreadTotal)}%
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Total Bets</h3>
          <div className="space-y-2">
            <p>Wins: {results.total.wins}</p>
            <p>Losses: {results.total.losses}</p>
            <p>Pushes: {results.total.pushes}</p>
            <p className="font-bold">
              Win Rate: {calculateWinPercentage(results.total.wins, totalTotal)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}