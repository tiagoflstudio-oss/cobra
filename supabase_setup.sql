-- ==========================================
-- SCRIPT DE CONFIGURAÇÃO DO SUPABASE (SQL EDITOR)
-- Execute este script no SQL Editor do seu projeto Supabase
-- para criar as tabelas, políticas de RLS e habilitar o Realtime.
-- ==========================================
-- 1. Criar tabela global_profiles se não existir
CREATE TABLE IF NOT EXISTS public.global_profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Habilitar Row Level Security (RLS) para global_profiles
ALTER TABLE public.global_profiles ENABLE ROW LEVEL SECURITY;
-- Políticas de acesso para global_profiles
CREATE POLICY "Qualquer um pode ler perfis" ON public.global_profiles FOR
SELECT USING (true);
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON public.global_profiles FOR
UPDATE USING (auth.uid() = id);
-- Trigger automático para criar perfil ao registrar um novo usuário (opcional, mas extremamente útil)
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$ BEGIN
INSERT INTO public.global_profiles (id, role)
VALUES (new.id, 'user');
RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- 2. Criar tabela secret_game_ranking para armazenar o placar da cobrinha
CREATE TABLE IF NOT EXISTS public.secret_game_ranking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    player_name VARCHAR(3) NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Habilitar Row Level Security (RLS) para secret_game_ranking
ALTER TABLE public.secret_game_ranking ENABLE ROW LEVEL SECURITY;
-- Políticas de acesso para secret_game_ranking
CREATE POLICY "Qualquer um pode ver o ranking" ON public.secret_game_ranking FOR
SELECT USING (true);
CREATE POLICY "Usuários autenticados podem inserir seus próprios records" ON public.secret_game_ranking FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- 3. Habilitar publicação Realtime
-- Habilita o canal realtime nas tabelas públicas para que mudanças de dados possam ser escutadas
ALTER PUBLICATION supabase_realtime
ADD TABLE public.secret_game_ranking;