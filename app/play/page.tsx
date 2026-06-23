'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import SecretGame from '@/components/layout/secret-game';
import { Gamepad2 } from 'lucide-react';

export default function PlayPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    // Verifica a sessão brevemente para inicializar o cliente Supabase
    // O jogo pode ser jogado sem login, mas o score só será salvo no ranking global se autenticado
    supabase.auth.getUser().finally(() => setIsChecking(false));
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#070708] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary shadow-[0_0_20px_rgba(213,255,64,0.2)] animate-pulse">
          <Gamepad2 size={24} />
        </div>
        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
          Preparando arena de jogo...
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#070708] text-white overflow-hidden relative">
      <SecretGame
        onClose={() => { window.location.href = '/'; }}
        playClickSound={() => {
          // Sons 8-bit já são sintetizados internamente pelo SecretGame via Web Audio API
        }}
      />
    </main>
  );
}
