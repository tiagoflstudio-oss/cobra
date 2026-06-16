'use client';

import React, { useState, useEffect } from 'react';
import {
  getAdminSecretGameStatsAction,
  getAdminSecretGameRankingAction,
  resetSecretGameRankingAction,
  deleteSecretGameScoreAction,
  AdminRankingEntry,
  AdminSecretGameStats
} from '@/lib/actions/admin-secret-game';
import {
  Trophy,
  Search,
  Trash2,
  RotateCcw,
  Gamepad2,
  Award,
  Clock,
  Sparkles,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminSnakePage() {
  const [stats, setStats] = useState<AdminSecretGameStats | null>(null);
  const [ranking, setRanking] = useState<AdminRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'gold'>('all');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [statsRes, rankingRes] = await Promise.all([
        getAdminSecretGameStatsAction(),
        getAdminSecretGameRankingAction()
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      } else {
        toast.error(statsRes.error || 'Erro ao carregar estatísticas.');
      }

      if (rankingRes.success && rankingRes.data) {
        setRanking(rankingRes.data);
      } else {
        toast.error(rankingRes.error || 'Erro ao carregar ranking.');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Ocorreu um erro ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  }

  // Ações de moderação
  async function handleDeleteScore(id: string) {
    if (!confirm('Deseja realmente excluir permanentemente este registro de pontuação?')) return;
    
    setActionLoading(`delete-${id}`);
    try {
      const res = await deleteSecretGameScoreAction(id);
      if (res.success) {
        toast.success('Pontuação excluída com sucesso!');
        await loadData();
      } else {
        toast.error(res.error || 'Falha ao excluir pontuação.');
      }
    } catch (err: any) {
      toast.error('Erro ao processar exclusão.');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResetRanking() {
    if (resetConfirmation !== 'RESETAR') {
      toast.error('Confirmação inválida. Digite exatamente RESETAR.');
      return;
    }

    setActionLoading('reset-all');
    try {
      const res = await resetSecretGameRankingAction();
      if (res.success) {
        toast.success('Todo o ranking de jogadores foi resetado com sucesso!');
        setShowResetModal(false);
        setResetConfirmation('');
        await loadData();
      } else {
        toast.error(res.error || 'Falha ao resetar o ranking.');
      }
    } catch (err: any) {
      toast.error('Erro ao processar reset global.');
    } finally {
      setActionLoading(null);
    }
  }

  // Filtragem local dos recordes
  const filteredRanking = ranking.filter(entry => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      entry.playerName.toLowerCase().includes(query) ||
      entry.userId.toLowerCase().includes(query);

    if (filterType === 'gold') {
      return matchesSearch && entry.score >= 1000;
    }

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto px-6 py-8">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-white">
            <Gamepad2 className="text-primary animate-pulse" size={32} />
            Moderação do Confia Snake
          </h1>
          <p className="text-muted-foreground text-sm">Monitore o ranking global de jogadores e gerencie recordes salvos de forma independente.</p>
        </div>

        <button
          onClick={() => setShowResetModal(true)}
          className="px-5 py-3 bg-red-600/10 border border-red-500/20 text-red-400 font-black uppercase text-[11px] tracking-wider rounded-2xl hover:bg-red-600/20 hover:text-red-300 transition-all flex items-center gap-2 shadow-md active:scale-95 shrink-0"
        >
          <RotateCcw size={14} /> Resetar Ranking Global
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6 space-y-3 relative overflow-hidden group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-[0_0_10px_rgba(213,255,64,0.15)]">
            <Gamepad2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Partidas Jogadas</p>
            <h2 className="text-2xl font-black mt-1 text-white">{stats?.totalMatches || 0}</h2>
            <p className="text-[10px] text-zinc-600 mt-0.5">Pontuações totais gravadas</p>
          </div>
        </div>

        <div className="glass-card p-6 space-y-3 relative overflow-hidden group">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.15)]">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Recorde Máximo</p>
            <h2 className="text-2xl font-black mt-1 text-yellow-500">
              {stats?.highestScore ? `${stats.highestScore} pts` : '0 pts'}
            </h2>
            <p className="text-[10px] text-zinc-600 mt-0.5 truncate">
              Por <span className="font-bold text-white font-mono">{stats?.highestPlayer}</span>
            </p>
          </div>
        </div>

        <div className="glass-card p-6 space-y-3 relative overflow-hidden group">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Jogadores Ativos</p>
            <h2 className="text-2xl font-black mt-1 text-emerald-400">{stats?.activePlayersCount || 0}</h2>
            <p className="text-[10px] text-zinc-600 mt-0.5">Usuários únicos com pontuação</p>
          </div>
        </div>

        <div className="glass-card p-6 space-y-3 relative overflow-hidden group">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Regra de Ouro</p>
            <h2 className="text-sm font-black mt-2 text-white">1000+ Pontos</h2>
            <p className="text-[10px] text-zinc-600 mt-1">Concede insígnia de Mestre na plataforma</p>
          </div>
        </div>
      </div>

      {/* Tabela de Rankings & Filtros */}
      <div className="glass-card p-6 space-y-6">
        
        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Buscar por jogador (iniciais ou ID)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 outline-none focus:border-primary/50 transition-all text-xs text-white"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterType('all')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                filterType === 'all' ? "bg-primary text-black" : "text-zinc-500 hover:text-white"
              )}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterType('gold')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1",
                filterType === 'gold' ? "bg-primary text-black" : "text-zinc-500 hover:text-white"
              )}
            >
              <Sparkles size={10} /> Mestre (1000+ pts)
            </button>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-zinc-300">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Jogador</th>
                <th className="py-3 px-4 text-center">Pontos</th>
                <th className="py-3 px-4 text-center">Data do Recorde</th>
                <th className="py-3 px-4">Jogador ID</th>
                <th className="py-3 px-4 text-right">Ações de Moderação</th>
              </tr>
            </thead>
            <tbody>
              {filteredRanking.map((entry, index) => {
                const isFirst = index === 0 && filterType === 'all' && searchTerm === '';
                const isSecond = index === 1 && filterType === 'all' && searchTerm === '';
                const isThird = index === 2 && filterType === 'all' && searchTerm === '';

                const podiumBadge = isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `#${index + 1}`;

                return (
                  <tr
                    key={entry.id}
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-3 px-4 text-center font-mono font-black">
                      <span className={cn(
                        "text-xs",
                        (isFirst || isSecond || isThird) ? "text-lg" : "text-zinc-600"
                      )}>
                        {podiumBadge}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-black uppercase text-white bg-white/10 px-2 py-0.5 rounded text-[11px] border border-white/5">
                        {entry.playerName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-sm text-primary">
                      {entry.score}
                    </td>
                    <td className="py-3 px-4 text-center text-zinc-500 font-mono">
                      <div className="flex items-center justify-center gap-1">
                        <Clock size={12} className="text-zinc-600" />
                        {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-500 select-all max-w-[150px] truncate" title={entry.userId}>
                      {entry.userId}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Botão de Excluir Recorde */}
                        <button
                          onClick={() => handleDeleteScore(entry.id)}
                          disabled={actionLoading === `delete-${entry.id}`}
                          className="p-2 rounded-xl border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-600/20 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center"
                          title="Excluir esta pontuação"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRanking.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    Nenhuma pontuação encontrada no ranking.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Reset Global de Segurança */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full p-6 space-y-6 animate-in zoom-in-95 duration-200 border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <div className="flex items-center gap-3 text-red-500">
              <RotateCcw size={24} className="animate-spin duration-1000" />
              <h3 className="text-lg font-black uppercase tracking-tight">Perigo: Resetar Todo o Ranking!</h3>
            </div>
            
            <p className="text-zinc-400 text-xs leading-relaxed">
              Esta ação apagará **TODOS** os recordes registrados de todas as contas de jogadores no Confia Snake de forma irreversível. 
              O histórico do ranking estará totalmente zerado.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">
                Digite <span className="text-red-400 font-bold">RESETAR</span> para confirmar:
              </label>
              <input
                type="text"
                value={resetConfirmation}
                onChange={(e) => setResetConfirmation(e.target.value)}
                placeholder="Digite RESETAR..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-red-500/50 transition-all font-mono tracking-widest text-center"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirmation('');
                }}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetRanking}
                disabled={actionLoading === 'reset-all' || resetConfirmation !== 'RESETAR'}
                className="flex-1 py-3 bg-red-600 text-white font-black uppercase text-[10px] tracking-wider rounded-xl hover:bg-red-500 transition-all disabled:opacity-50 disabled:scale-100 active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              >
                {actionLoading === 'reset-all' ? 'Processando...' : 'Zerar Tudo'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
