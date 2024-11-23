import React from 'react';
import { Trophy, TrendingUp, DollarSign } from 'lucide-react';
import type { GamePrediction } from '../types';

interface GameCardProps {
  prediction: GamePrediction;
}

export function GameCard({ prediction }: GameCardProps) {
  const isHomeFavored = prediction.suggestedBet.includes(prediction.homeTeam);
  const spreadDisplay = prediction.fanduelSpreadHome > 0 
    ? `+${prediction.fanduelSpreadHome}` 
    : prediction.fanduelSpreadHome;

  const formatMoneyline = (ml: number) => (ml > 0 ? `+${ml}` : ml);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white">
        <div className="flex items-center justify-between">
          <Trophy className="w-6 h-6" />
          <span className="text-sm font-medium">Game ID: {prediction.gameId}</span>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{prediction.awayTeam}</p>
            <p className="text-3xl font-bold text-blue-600">{prediction.awayScore}</p>
            <p className="text-sm text-gray-500 mt-1">ML: {formatMoneyline(prediction.awayTeamMoneyline)}</p>
          </div>
          <div className="flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-400">@</span>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-gray-800">{prediction.homeTeam}</p>
            <p className="text-3xl font-bold text-blue-600">{prediction.homeScore}</p>
            <p className="text-sm text-gray-500 mt-1">ML: {formatMoneyline(prediction.homeTeamMoneyline)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Predicted Total</span>
            <span className="font-semibold">{prediction.totalScore}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">FanDuel Spread (Home)</span>
            <span className="font-semibold">{spreadDisplay}</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">FanDuel Total</span>
            <span className="font-semibold">{prediction.fanduelTotal}</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className={`p-4 rounded-lg ${isHomeFavored ? 'bg-green-50' : 'bg-blue-50'}`}>
            <div className="flex items-center gap-2">
              <DollarSign className={`w-5 h-5 ${isHomeFavored ? 'text-green-600' : 'text-blue-600'}`} />
              <span className={`font-medium ${isHomeFavored ? 'text-green-800' : 'text-blue-800'}`}>
                {prediction.suggestedBet}
              </span>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${prediction.overUnder === 'Over' ? 'bg-purple-50' : 'bg-orange-50'}`}>
            <span className={`font-medium ${prediction.overUnder === 'Over' ? 'text-purple-800' : 'text-orange-800'}`}>
              Suggested {prediction.overUnder}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}