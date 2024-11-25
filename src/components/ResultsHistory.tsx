import React, { useEffect, useState } from 'react';
import { format, subDays } from 'date-fns';
import { supabase } from '../services/supabase';

interface DailyResults {
  date: string;
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

interface OverallResults {
  spread: {
    wins: number;
    losses: number;
    pushes: number;
    winRate: string;
  };
  total: {
    wins: number;
    losses: number;
    pushes: number;
    winRate: string;
  };
}

export function ResultsHistory() {
  const [dailyResults, setDailyResults] = useState<DailyResults[]>([]);
  const [overall, setOverall] = useState<OverallResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true);
        const today = new Date();
        const dates = Array.from({ length: 7 }, (_, i) => 
          format(subDays(today, i), 'yyyy-MM-dd')
        );

        const { data, error } = await supabase
          .from('predictions')
          .select('game_date, spread_result, total_result')
          .in('game_date', dates)
          .not('spread_result', 'is', null);

        if (error) throw error;

        // Process daily results
        const dailyStats = dates.map(date => {
          const dayGames = data.filter(game => game.game_date === date);
          return {
            date,
            spread: {
              wins: dayGames.filter(g => g.spread_result === 'win').length,
              losses: dayGames.filter(g => g.spread_result === 'loss').length,
              pushes: dayGames.filter(g => g.spread_result === 'push').length
            },
            total: {
              wins: dayGames.filter(g => g.total_result === 'win').length,
              losses: dayGames.filter(g => g.total_result === 'loss').length,
              pushes: dayGames.filter(g => g.total_result === 'push').length
            }
          };
        });

        // Calculate overall results
        const overallStats = {
          spread: {
            wins: data.filter(g => g.spread_result === 'win').length,
            losses: data.filter(g => g.spread_result === 'loss').length,
            pushes: data.filter(g => g.spread_result === 'push').length,
            winRate: '0%'
          },
          total: {
            wins: data.filter(g => g.total_result === 'win').length,
            losses: data.filter(g => g.total_result === 'loss').length,
            pushes: data.filter(g => g.total_result === 'push').length,
            winRate: '0%'
          }
        };

        // Calculate win rates
        overallStats.spread.winRate = calculateWinRate(
          overallStats.spread.wins,
          overallStats.spread.losses
        );
        overallStats.total.winRate = calculateWinRate(
          overallStats.total.wins,
          overallStats.total.losses
        );

        setDailyResults(dailyStats);
        setOverall(overallStats);
      } catch (error) {
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, []);

  const calculateWinRate = (wins: number, losses: number) => {
    if (wins + losses === 0) return '0%';
    return `${((wins / (wins + losses)) * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Prediction Results</h1>
        
        {/* Overall Stats */}
        {overall && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Overall Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Spread Results */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Spread Bets</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Win Rate</p>
                    <p className="text-2xl font-bold text-blue-600">{overall.spread.winRate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Record</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {overall.spread.wins}-{overall.spread.losses}
                      {overall.spread.pushes > 0 && `-${overall.spread.pushes}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Results */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Total Bets</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Win Rate</p>
                    <p className="text-2xl font-bold text-green-600">{overall.total.winRate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Record</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {overall.total.wins}-{overall.total.losses}
                      {overall.total.pushes > 0 && `-${overall.total.pushes}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Daily Results */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Daily Results</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spread Record</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spread Win Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Record</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Win Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dailyResults.map((day) => {
                  const spreadWinRate = calculateWinRate(day.spread.wins, day.spread.losses);
                  const totalWinRate = calculateWinRate(day.total.wins, day.total.losses);
                  const formattedDate = format(new Date(day.date), 'MMM d, yyyy');

                  return (
                    <tr key={day.date}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formattedDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {day.spread.wins}-{day.spread.losses}
                        {day.spread.pushes > 0 && `-${day.spread.pushes}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {spreadWinRate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {day.total.wins}-{day.total.losses}
                        {day.total.pushes > 0 && `-${day.total.pushes}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {totalWinRate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}