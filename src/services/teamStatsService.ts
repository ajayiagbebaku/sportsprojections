import { supabase } from './supabase';
import type { TeamStats } from '../types';

export async function getTeamStats(teamCodes: string[]): Promise<TeamStats[]> {
  const { data: stats, error } = await supabase
    .from('team_stats')
    .select('*')
    .in('team_code', teamCodes);

  if (error) {
    console.error('Error fetching team stats:', error);
    throw error;
  }

  if (!stats?.length) {
    throw new Error('No team stats found');
  }

  return stats;
}