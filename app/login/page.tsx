'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Gamepad2, ArrowLeft, LogIn, UserPlus, Sparkles, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const emailTrim = email.trim();
    if (!emailTrim || !password) {
      toast.error('Preencha todos os campos.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Cadastro
        const { data, error } = await supabase.auth.signUp({
          email: emailTrim,
          password: password,
          options: {
            // Em projetos de desenvolvimento local, podemos desativar a confirmação de email no Supabase
            // para que o login seja imediato, mas fornecemos o feedback correto de qualquer forma.
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (error) throw error;

        // Se a sessão já foi criada imediatamente após o cadastro (configuração padrão em alguns projetos Supabase)
        if (data?.session) {
          toast.success('Cadastro realizado com sucesso! Redirecionando...');
          router.push('/play');
          router.refresh();
        } else {
          toast.success('Cadastro solicitado! Se necessário, verifique sua caixa de e-mail para confirmação.', {
            duration: 5000
          });
          setIsSignUp(false);
        }
      } else {
        // Login
        const { error } = await supabase.auth.signInWithPassword({
          email: emailTrim,
          password: password
        });

        if (error) throw error;

        toast.success('Login efetuado com sucesso!');
        router.push('/play');
        router.refresh();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Ocorreu um erro ao processar a solicitação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070708] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Luzes neon desfocadas decorativas */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[90px] pointer-events-none" />

      {/* Botão de Voltar */}
      <Link
        href="/"
        className="absolute top-6 left-6 px-4 py-2 border border-white/5 bg-white/[0.02] hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
      >
        <ArrowLeft size={14} /> Voltar para a Início
      </Link>

      <div className="w-full max-w-md space-y-6 z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-[0_0_20px_rgba(213,255,64,0.2)]">
            <Gamepad2 size={24} />
          </div>
          <h2 className="text-2xl font-display font-black uppercase text-white tracking-wider">
            Confia<span className="text-primary">Snake</span>
          </h2>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1">
            <Sparkles size={12} className="text-primary animate-pulse" />
            {isSignUp ? 'Criar uma conta de jogador' : 'Acesse seu painel arcade'}
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="glass-card p-6 md:p-8 space-y-6 border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Input E-mail */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <Mail size={10} /> Endereço de E-mail
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jogador@exemplo.com"
                className="w-full bg-white/5 border border-white/10 focus:border-primary/50 text-white rounded-xl py-3 px-4 text-xs outline-none transition-all placeholder:text-zinc-600 font-medium"
              />
            </div>

            {/* Input Senha */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                <Lock size={10} /> Senha Secreta
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 focus:border-primary/50 text-white rounded-xl py-3 px-4 text-xs outline-none transition-all placeholder:text-zinc-600 font-mono"
              />
            </div>

            {/* Botão de Submissão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(213,255,64,0.25)] hover:shadow-[0_0_20px_rgba(213,255,64,0.35)] disabled:opacity-50 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : isSignUp ? (
                <>
                  <UserPlus size={14} /> Registrar Jogador
                </>
              ) : (
                <>
                  <LogIn size={14} /> Entrar na Arena
                </>
              )}
            </button>
          </form>

          {/* Alternar entre Login / Cadastro */}
          <div className="border-t border-white/5 pt-4 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] text-zinc-400 hover:text-primary font-bold uppercase tracking-wider transition-all"
            >
              {isSignUp
                ? 'Já possui uma conta? Entrar na Arena'
                : 'Não possui conta? Registre-se Gratuitamente'}
            </button>
          </div>

        </div>

        {/* Rodapé Decorativo */}
        <p className="text-center text-[9px] text-zinc-600 font-bold uppercase tracking-widest">
          Sua pontuação e recordes serão salvos no banco Confia Snake
        </p>

      </div>
    </div>
  );
}
