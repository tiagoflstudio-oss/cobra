import { createClient } from './server';

/**
 * Garante que o jogador está autenticado de forma independente via Supabase Auth.
 * Caso não esteja autenticado, dispara um erro.
 */
export async function ensureAuthenticated() {
  const supabase = createClient();
  
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Acesso negado: Jogador não autenticado.');
  }

  return { user };
}
