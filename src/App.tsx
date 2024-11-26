import React, { useState, useEffect } from 'react';
import { format, startOfToday } from 'date-fns';
import { Calendar, RefreshCw } from 'lucide-react';
import { GameCard } from './components/GameCard';
import { ResultsHistory } from './components/ResultsHistory';
import { fetchNBAOdds } from './services/api';
import type { GamePrediction } from './types';

function App() {
  const [predictions, setPredictions] = useState<GamePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));
  const [showResults, setShowResults] = useState(false);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNBAOdds(selectedDate);
      setPredictions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error loading predictions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, [selectedDate]);

  if (showResults) {
    return (
      <div>
        <header className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">SportsProjections.com</h1>
              <button
                onClick={() => setShowResults(false)}
                className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors duration-200"
              >
                View Predictions
              </button>
            </div>
          </div>
        </header>
        <ResultsHistory />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">SportsProjections.com</h1>
              <div className="flex items-center mt-2 space-x-4">
                <div className="flex items-center text-blue-200">
                  <Calendar className="w-5 h-5 mr-2" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent border border-blue-400 rounded px-2 py-1 text-white"
                    max={format(startOfToday(), 'yyyy-MM-dd')}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowResults(true)}
                className="bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors duration-200"
              >
                View Results
              </button>
              <button 
                onClick={loadPredictions}
                disabled={loading}
                className="flex items-center gap-2 bg-blue-700 hover:bg-blue-600 px-4 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Loading...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading predictions...</p>
          </div>
        ) : (
          <>
            {predictions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {predictions.map((prediction) => (
                  <GameCard key={prediction.gameId} prediction={prediction} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No games found for selected date.</p>
                <p className="text-gray-400 mt-2">Try selecting a different date.</p>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-gray-500 text-sm">
            SportsProjections.com • {format(new Date(), 'yyyy')} • Powered by Agbebaku Enterprises
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;