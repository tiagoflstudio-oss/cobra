-- ==========================================
-- SCRIPT DE CONFIGURAÇÃO DO SUPABASE (SQL EDITOR)
-- ✅ IDEMPOTENTE: pode ser executado múltiplas vezes sem erro.
-- Execute este script no SQL Editor do seu projeto Supabase.
-- ==========================================

-- ============================================================
-- 1. TABELA: global_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.global_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security
ALTER TABLE public.global_profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (se existirem) antes de recriar
DROP POLICY IF EXISTS "Qualquer um pode ler perfis" ON public.global_profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.global_profiles;

-- Recriar políticas
CREATE POLICY "Qualquer um pode ler perfis"
    ON public.global_profiles FOR SELECT
    USING (true);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
    ON public.global_profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================================
-- 2. FUNÇÃO + TRIGGER: criar perfil automaticamente ao registrar
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.global_profiles (id, role)
    VALUES (new.id, 'user')
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover o trigger se já existir antes de recriar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. TABELA: secret_game_ranking (placar da cobrinha)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.secret_game_ranking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    player_name VARCHAR(3) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security
ALTER TABLE public.secret_game_ranking ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (se existirem) antes de recriar
DROP POLICY IF EXISTS "Qualquer um pode ver o ranking" ON public.secret_game_ranking;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir seus próprios records" ON public.secret_game_ranking;

-- Recriar políticas
CREATE POLICY "Qualquer um pode ver o ranking"
    ON public.secret_game_ranking FOR SELECT
    USING (true);

CREATE POLICY "Usuários autenticados podem inserir seus próprios records"
    ON public.secret_game_ranking FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 4. REALTIME: habilitar canal de tempo real no ranking
-- ============================================================
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.secret_game_ranking;
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Tabela ja esta na publicacao, tudo certo.
END;
$$;

-- ============================================================
-- VERIFICACAO FINAL (opcional - rode para confirmar que tudo foi criado)
-- ============================================================
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public';