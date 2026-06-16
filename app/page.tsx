import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getGameRankingAction } from '@/lib/actions/secret-game';
import { Trophy, Play, LogIn, LogOut, ShieldAlert, Sparkles, Gamepad2, Heart, Award } from 'lucide-react';

export const revalidate = 0; // Garantir dados em tempo real sempre que carregar a LP

export default async function LandingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Verificar se é Admin
  let isAdmin = false;
  if (user) {
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL ?? null;
    if (superAdminEmail && user.email && user.email.toLowerCase() === superAdminEmail.toLowerCase()) {
      isAdmin = true;
    } else {
      const { data: profile } = await supabase
        .from('global_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (profile?.role === 'super_admin' || profile?.role === 'admin') {
        isAdmin = true;
      }
    }
  }

  // Carregar ranking global
  const rankingRes = await getGameRankingAction();
  const ranking = rankingRes.success && rankingRes.data ? rankingRes.data : [];

  return (
    <div className="min-h-screen bg-[#070708] flex flex-col relative overflow-hidden">
      
      {/* Luzes de fundo neon desfocadas (ambientes retro) */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Header / Navegação */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center text-primary shadow-[0_0_15px_rgba(213,255,64,0.15)] animate-pulse">
            <Gamepad2 size={22} />
          </div>
          <span className="font-display font-black text-xl uppercase tracking-wider text-white">
            Confia<span className="text-primary">Snake</span>
          </span>
        </div>

        <nav className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin/snake"
              className="px-4 py-2 border border-red-500/20 bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
            >
              <ShieldAlert size={14} /> Moderação
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-400 font-medium hidden sm:inline">
                Olá, <span className="text-white font-semibold font-mono">{user.email?.split('@')[0]}</span>
              </span>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
                >
                  <LogOut size={14} /> Sair
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-primary text-black hover:bg-primary/95 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(213,255,64,0.3)] hover:shadow-[0_0_20px_rgba(213,255,64,0.4)] flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <LogIn size={14} /> Entrar / Registrar
            </Link>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 md:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center z-10">
        
        {/* Seção Hero - Lado Esquerdo (6 cols) */}
        <section className="lg:col-span-6 space-y-8 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest animate-bounce">
            <Sparkles size={12} /> Jogo Independente
          </div>

          <h1 className="text-5xl sm:text-7xl font-display font-black tracking-tight text-white uppercase leading-none">
            O Retorno da <br />
            <span className="text-primary drop-shadow-[0_0_20px_rgba(213,255,64,0.3)]">Cobrinha</span> Neon.
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-xl leading-relaxed mx-auto lg:mx-0">
            Mergulhe em uma experiência eletrizante no formato arcade retro-futurista. 
            Devore frutas especiais neon, crie combos insanos multiplicando seus pontos, 
            desvie das bombas e conquiste sua vaga no topo da glória eterna!
          </p>

          {/* Cartão de Regras Rápidas */}
          <div className="glass-card p-5 border border-white/5 bg-white/[0.01] rounded-2xl grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Combos</span>
              <p className="text-sm font-black text-white">Até 4.0x</p>
            </div>
            <div className="space-y-1 border-x border-white/5">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Frutas</span>
              <p className="text-sm font-black text-primary">9 Tipos</p>
            </div>
            <div className="space-y-1">
              <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Prêmios</span>
              <p className="text-sm font-black text-purple-400">1000+ pts</p>
            </div>
          </div>

          {/* CTA Principal */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link
              href="/play"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-black font-black uppercase text-sm tracking-wider rounded-2xl shadow-[0_0_25px_rgba(213,255,64,0.4)] hover:shadow-[0_0_35px_rgba(213,255,64,0.55)] hover:bg-primary/95 transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95 group"
            >
              <Play size={16} className="fill-black group-hover:translate-x-0.5 transition-transform" />
              Jogar Agora
            </Link>
            {!user && (
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider sm:w-48 leading-tight">
                * Faça login para salvar sua pontuação no ranking oficial!
              </span>
            )}
          </div>
        </section>

        {/* Seção Ranking - Lado Direito (6 cols) */}
        <section className="lg:col-span-6 z-10 w-full">
          <div className="glass-card p-6 md:p-8 space-y-6 relative overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.4)]">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-white">
                <Trophy className="text-primary" size={20} />
                Ranking Global
              </h2>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Confia Snake</span>
            </div>

            {/* Lista do Ranking */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 no-scrollbar">
              {ranking.map((player, index) => {
                const isFirst = index === 0;
                const isSecond = index === 1;
                const isThird = index === 2;

                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Badge do pódio */}
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-black border ${
                        isFirst
                          ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.15)]"
                          : isSecond
                          ? "bg-zinc-300/10 border-zinc-300/30 text-zinc-300"
                          : isThird
                          ? "bg-amber-700/10 border-amber-700/30 text-amber-500"
                          : "bg-white/5 border-white/5 text-zinc-500"
                      }`}>
                        {index + 1}
                      </span>

                      <div>
                        <span className="font-mono font-black text-sm uppercase text-white bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          {player.playerName}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono ml-2">
                          {new Date(player.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 font-mono font-black text-sm">
                      <span className="text-primary">{player.score}</span>
                      <span className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider">PTS</span>
                    </div>
                  </div>
                );
              })}

              {ranking.length === 0 && (
                <div className="py-12 text-center text-zinc-500 text-xs font-medium space-y-2">
                  <Gamepad2 size={32} className="mx-auto text-zinc-700 animate-bounce" />
                  <p>Nenhum recorde registrado ainda.</p>
                  <p className="text-[10px] text-zinc-600 uppercase font-black">Seja o primeiro a jogar e garanta o topo!</p>
                </div>
              )}
            </div>

            {/* Dica decorativa na LP */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex items-start gap-2.5">
              <Award size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-400 leading-normal">
                Bata o recorde global! Jogadores com pontuações acima de <strong className="text-white">1000 pontos</strong> entram para a classe Ouro e recebem uma insígnia de mestre no painel!
              </p>
            </div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 bg-black/40 py-5 text-center z-10 text-[10px] text-zinc-500 font-medium tracking-wide">
        <p className="flex items-center justify-center gap-1.5">
          Confia Snake © {new Date().getFullYear()} • Feito com <Heart size={10} className="text-red-500 fill-red-500" /> para diversão retro.
        </p>
      </footer>
    </div>
  );
}
