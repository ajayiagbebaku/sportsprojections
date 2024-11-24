import React from 'react';
import { Trophy, Clock, Check, X, Minus } from 'lucide-react';
import type { GamePrediction } from '../types';

interface GameCardProps {
  prediction: GamePrediction;
}

export function GameCard({ prediction }: GameCardProps) {
  const spreadDisplay = prediction.fanduelSpreadHome > 0 
    ? `+${prediction.fanduelSpreadHome}` 
    : prediction.fanduelSpreadHome;

  const formatMoneyline = (ml: number) => (ml > 0 ? `+${ml}` : ml);
  const isGameCompleted = prediction.gameStatus === 'Completed' || prediction.actualHomeScore !== undefined;

  const getResultIcon = (result?: 'win' | 'loss' | 'push') => {
    if (!result) return null;
    switch (result) {
      case 'win':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'loss':
        return <X className="w-5 h-5 text-red-600" />;
      case 'push':
        return <Minus className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getResultClass = (result?: 'win' | 'loss' | 'push') => {
    if (!result) return 'bg-gray-50';
    switch (result) {
      case 'win':
        return 'bg-green-50 border-green-200';
      case 'loss':
        return 'bg-red-50 border-red-200';
      case 'push':
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 text-white">
        <div className="flex items-center justify-between">
          <Trophy className="w-6 h-6" />
          {prediction.gameStatus && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">{prediction.gameStatus}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="p-6">
        {/* Teams and Scores */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Away Team */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{prediction.awayTeam}</h3>
            <div className="space-y-2">
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-sm text-blue-600 font-medium">Predicted</p>
                <p className="text-2xl font-bold text-blue-700">{prediction.awayScore}</p>
              </div>
              {isGameCompleted && prediction.actualAwayScore !== undefined && (
                <div className="p-2 bg-green-50 rounded">
                  <p className="text-sm text-green-600 font-medium">Actual</p>
                  <p className="text-2xl font-bold text-green-700">{prediction.actualAwayScore}</p>
                </div>
              )}
              <p className="text-sm text-gray-500">ML: {formatMoneyline(prediction.awayTeamMoneyline)}</p>
            </div>
          </div>

          {/* VS */}
          <div className="flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-400">@</span>
          </div>

          {/* Home Team */}
          <div className="text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">{prediction.homeTeam}</h3>
            <div className="space-y-2">
              <div className="p-2 bg-blue-50 rounded">
                <p className="text-sm text-blue-600 font-medium">Predicted</p>
                <p className="text-2xl font-bold text-blue-700">{prediction.homeScore}</p>
              </div>
              {isGameCompleted && prediction.actualHomeScore !== undefined && (
                <div className="p-2 bg-green-50 rounded">
                  <p className="text-sm text-green-600 font-medium">Actual</p>
                  <p className="text-2xl font-bold text-green-700">{prediction.actualHomeScore}</p>
                </div>
              )}
              <p className="text-sm text-gray-500">ML: {formatMoneyline(prediction.homeTeamMoneyline)}</p>
            </div>
          </div>
        </div>

        {/* Game Details */}
        <div className="space-y-3">
          {/* Predicted Total */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <span className="text-blue-700">Predicted Total</span>
            <span className="font-bold text-blue-800">{prediction.totalScore}</span>
          </div>
          
          {/* Actual Total */}
          {isGameCompleted && prediction.actualHomeScore !== undefined && prediction.actualAwayScore !== undefined && (
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-green-700">Actual Total</span>
              <span className="font-bold text-green-800">
                {prediction.actualHomeScore + prediction.actualAwayScore}
              </span>
            </div>
          )}
          
          {/* Spread */}
          <div className={`flex items-center justify-between p-3 rounded-lg border ${getResultClass(prediction.spreadResult)}`}>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">FanDuel Spread (Home)</span>
              {getResultIcon(prediction.spreadResult)}
            </div>
            <span className="font-bold text-gray-800">{spreadDisplay}</span>
          </div>
          
          {/* Over/Under */}
          <div className={`flex items-center justify-between p-3 rounded-lg border ${getResultClass(prediction.totalResult)}`}>
            <div className="flex items-center gap-2">
              <span className="text-gray-700">FanDuel Total</span>
              {getResultIcon(prediction.totalResult)}
            </div>
            <span className="font-bold text-gray-800">{prediction.fanduelTotal}</span>
          </div>
        </div>

        {/* Betting Suggestions */}
        <div className="mt-6 space-y-3">
          <div className="p-3 rounded-lg bg-purple-50">
            <p className="text-purple-800 font-medium">
              Suggested: {prediction.suggestedBet}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-indigo-50">
            <p className="text-indigo-800 font-medium">
              Total: Suggested {prediction.overUnder}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}