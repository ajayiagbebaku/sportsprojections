import React from 'react';
import { useEffect, useState } from 'react';
import { getResults } from '../services/supabase';

interface Results {
  spread: {
    win: number;
    loss: number;
    push: number;
  };
  total: {
    win: number;
    loss: number;
    push: number;
  };
  date: string;
}

interface ResultsDisplayProps {
  selectedDate: string;
}

export function ResultsDisplay({ selectedDate }: ResultsDisplayProps) {
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResults() {
      try {
        const data = await getResults(selectedDate);
        setResults(data);
      } catch (error) {
        console.error('Error loading results:', error);
      } finally {
        setLoading(false);
      }
    }

    loadResults();
  }, [selectedDate]);

  if (loading) return <div>Loading results...</div>;
  if (!results) return null;

  const calculateWinPercentage = (wins: number, total: number) => {
    if (total === 0) return 0;
    return ((wins / total) * 100).toFixed(1);
  };

  const spreadTotal = results.spread.win + results.spread.loss;
  const totalTotal = results.total.win + results.total.loss;

  if (spreadTotal === 0 && totalTotal === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <h2 className="text-2xl font-bold mb-4">Results for {results.date}</h2>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Spread Bets</h3>
          <div className="space-y-2">
            <p>Wins: {results.spread.win}</p>
            <p>Losses: {results.spread.loss}</p>
            <p>Pushes: {results.spread.push}</p>
            <p className="font-bold">
              Win Rate: {calculateWinPercentage(results.spread.win, spreadTotal)}%
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Total Bets</h3>
          <div className="space-y-2">
            <p>Wins: {results.total.win}</p>
            <p>Losses: {results.total.loss}</p>
            <p>Pushes: {results.total.push}</p>
            <p className="font-bold">
              Win Rate: {calculateWinPercentage(results.total.win, totalTotal)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}