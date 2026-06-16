'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ensureAuthenticated } from '@/lib/supabase/utils';
import { revalidatePath } from 'next/cache';

/**
 * Garante que o usuário logado é o administrador da plataforma.
 */
async function ensureAdmin() {
  const { user } = await ensureAuthenticated();

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? null;
  if (superAdminEmail && user.email && user.email.toLowerCase() === superAdminEmail.toLowerCase()) {
    return { user };
  }

  const supabase = createClient();
  const { data: profile } = await supabase
    .from('global_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
    throw new Error('Acesso negado: Somente administradores podem realizar esta ação.');
  }
  return { user };
}

export interface AdminRankingEntry {
  id: string;
  playerName: string;
  score: number;
  createdAt: string;
  userId: string;
}

export interface AdminSecretGameStats {
  totalMatches: number;
  highestScore: number;
  highestPlayer: string;
  activePlayersCount: number;
}

/**
 * Retorna as estatísticas consolidadas do jogo independente para o admin.
 */
export async function getAdminSecretGameStatsAction(): Promise<{ success: boolean; data?: AdminSecretGameStats; error?: string }> {
  try {
    await ensureAdmin();
    const supabase = createAdminClient();

    // 1. Total de partidas jogadas
    const { count: totalMatches, error: countError } = await supabase
      .from('secret_game_ranking')
      .select('id', { count: 'exact', head: true });

    if (countError) throw countError;

    // 2. Maior pontuação global
    const { data: highestRecord, error: highestError } = await supabase
      .from('secret_game_ranking')
      .select('player_name, score')
      .order('score', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (highestError) throw highestError;

    // 3. Total de jogadores únicos que jogaram
    const { count: activePlayersCount, error: playersCountError } = await supabase
      .from('secret_game_ranking')
      .select('user_id', { count: 'exact', head: true });

    if (playersCountError) throw playersCountError;

    const stats: AdminSecretGameStats = {
      totalMatches: totalMatches || 0,
      highestScore: highestRecord?.score || 0,
      highestPlayer: highestRecord?.player_name || 'N/A',
      activePlayersCount: activePlayersCount || 0
    };

    return { success: true, data: stats };
  } catch (err: any) {
    console.error('[STATS_ERROR]', err);
    return { success: false, error: err.message || 'Erro ao carregar estatísticas.' };
  }
}

/**
 * Retorna o ranking completo (todas as pontuações) para governança do administrador.
 */
export async function getAdminSecretGameRankingAction(): Promise<{ success: boolean; data?: AdminRankingEntry[]; error?: string }> {
  try {
    await ensureAdmin();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('secret_game_ranking')
      .select('id, player_name, score, created_at, user_id')
      .order('score', { ascending: false });

    if (error) throw error;

    const formattedData: AdminRankingEntry[] = (data || []).map((row: any) => ({
      id: row.id,
      playerName: row.player_name,
      score: row.score,
      createdAt: row.created_at,
      userId: row.user_id || ''
    }));

    return { success: true, data: formattedData };
  } catch (err: any) {
    console.error('[RANKING_ERROR]', err);
    return { success: false, error: err.message || 'Erro ao carregar ranking global.' };
  }
}

/**
 * Reseta o ranking inteiro (remove todas as pontuações).
 */
export async function resetSecretGameRankingAction(): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAdmin();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('secret_game_ranking')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta tudo de forma garantida

    if (error) throw error;

    revalidatePath('/admin/snake');
    return { success: true };
  } catch (err: any) {
    console.error('[RESET_ERROR]', err);
    return { success: false, error: err.message || 'Erro ao resetar ranking.' };
  }
}

/**
 * Exclui um registro individual de pontuação (para moderar trapaças).
 */
export async function deleteSecretGameScoreAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureAdmin();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('secret_game_ranking')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/snake');
    return { success: true };
  } catch (err: any) {
    console.error('[DELETE_SCORE_ERROR]', err);
    return { success: false, error: err.message || 'Erro ao excluir pontuação.' };
  }
}
