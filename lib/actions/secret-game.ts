'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureAuthenticated } from '@/lib/supabase/utils';

export interface RankingEntry {
  id: string;
  playerName: string;
  score: number;
  createdAt: string;
  userId?: string;
}

const LEVEL_THRESHOLDS = [0, 70, 150, 250, 370, 510, 670, 850, 1050, 1270];

function getLevelFromScore(score: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (score >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

/**
 * Salva a pontuação obtida pelo jogador no Jogo Independente (Confia Snake)
 * vinculando o recorde ao jogador autenticado.
 * 
 * @param playerName Iniciais do jogador (ex: "TIA")
 * @param score Pontuação obtida
 * @param gameplayLog Histórico de jogabilidade para validação anti-cheat
 */
export async function saveGameScoreAction(
  playerName: string,
  score: number,
  gameplayLog?: { t: number; p: number; type: string }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Garantir que o jogador está autenticado
    const { user } = await ensureAuthenticated();

    const name = (playerName || '').trim().toUpperCase();
    if (name.length !== 3) {
      throw new Error('O nome do jogador deve conter exatamente 3 letras.');
    }

    if (score < 0) {
      throw new Error('A pontuação não pode ser negativa.');
    }

    // 2. Validação server-side da progressão do jogo (segurança contra hacks de score)
    if (score > 0) {
      if (!gameplayLog || !Array.isArray(gameplayLog) || gameplayLog.length === 0) {
        throw new Error('Dados de jogabilidade ausentes.');
      }

      let calculatedScore = 0;
      let currentCombo = 1.0;
      let lastTime = 0;
      let snakeLength = 3; // Tamanho inicial da cobrinha

      const basePointsMap: Record<string, number> = {
        normal: 10,
        golden: 30,
        confia: 50,
        banana: 50,
        bomb: 20,
        portal: 10,
        slug: 10,
        slow: 10,
        star: 10,
        singularity: 20,
        ghost: 15,
        paradox: 25,
        shield: 20,
        clone: 25,
        chili: 30,
        invert: 80,
        gluttony: 35,
        quantum: 20
      };

      const minLevelMap: Record<string, number> = {
        normal: 1,
        golden: 1,
        slow: 1,
        confia: 1,
        invert: 3,
        bomb: 4,
        slug: 4,
        ghost: 4,
        shield: 4,
        quantum: 4,
        portal: 5,
        star: 5,
        singularity: 5,
        paradox: 5,
        clone: 5,
        chili: 5,
        gluttony: 5,
        banana: 6
      };

      for (let i = 0; i < gameplayLog.length; i++) {
        const event = gameplayLog[i];

        // Validar tipo de comida
        const basePoints = basePointsMap[event.type];
        if (basePoints === undefined) {
          throw new Error('Tipo de comida inválido detectado no log.');
        }

        // Calcular nível
        const currentLevel = getLevelFromScore(calculatedScore);

        // Validar nível mínimo do spawn da fruta
        const minLevel = minLevelMap[event.type];
        if (currentLevel < minLevel) {
          throw new Error(`Fruta do tipo ${event.type} não pode aparecer no nível ${currentLevel}.`);
        }

        // Determinar o multiplicador esperado com base no intervalo de tempo
        if (i > 0) {
          const diff = event.t - lastTime;
          if (diff <= 4000) {
            if (currentCombo === 1.0) currentCombo = 1.5;
            else if (currentCombo === 1.5) currentCombo = 2.0;
            else if (currentCombo === 2.0) currentCombo = 3.0;
            else currentCombo = 4.0;
          } else {
            currentCombo = 1.0;
          }
        } else {
          currentCombo = 1.0;
        }

        // Validar se os pontos ganhos batem com o esperado
        const expectedPoints = Math.round(basePoints * currentCombo);
        if (event.p !== expectedPoints) {
          if (event.p > expectedPoints) {
            throw new Error('Inconsistência no multiplicador de combo detectada.');
          }
          const validMultipliers = [1.0, 1.5, 2.0, 3.0, 4.0];
          const actualMult = validMultipliers.find(mult => Math.round(basePoints * mult) === event.p);
          if (actualMult === undefined) {
            throw new Error('Pontuação inconsistente com multiplicadores válidos.');
          }
          currentCombo = actualMult;
        }

        // Tamanho da cobra
        const currentLength = snakeLength + 1;
        if (event.type === 'bomb') {
          snakeLength = Math.max(2, currentLength - 3);
        } else if (event.type === 'banana') {
          const segmentsToAdd = Math.max(1, Math.round(currentLength * 0.40));
          snakeLength = currentLength + segmentsToAdd;
        } else {
          snakeLength = currentLength;
        }

        calculatedScore += event.p;
        lastTime = event.t;
      }

      if (calculatedScore !== score) {
        throw new Error('Inconsistência de pontuação detectada.');
      }

      const totalEvents = gameplayLog.length;
      const lastEventTime = gameplayLog[totalEvents - 1].t;

      const averageTimePerFruit = lastEventTime / totalEvents;
      if (averageTimePerFruit < 180) {
        throw new Error('Jogabilidade inválida detectada.');
      }

      for (let i = 1; i < totalEvents; i++) {
        const diff = gameplayLog[i].t - gameplayLog[i - 1].t;
        if (diff < 80) {
          throw new Error('Jogabilidade inconsistente detectada.');
        }
      }
    }

    // 3. Salvar no banco
    const supabase = createClient();

    const { error } = await supabase
      .from('secret_game_ranking')
      .insert({
        user_id: user.id,
        player_name: name,
        score: score
      });

    if (error) {
      console.error('Erro ao salvar recorde no banco:', error);
      throw new Error('Não foi possível registrar o seu recorde no momento.');
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro inesperado.' };
  }
}

/**
 * Retorna as top 10 pontuações globais do Jogo Independente (Confia Snake) registradas na plataforma.
 */
export async function getGameRankingAction(): Promise<{ success: boolean; data?: RankingEntry[]; error?: string }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('secret_game_ranking')
      .select('id, player_name, score, created_at, user_id')
      .order('score', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Erro ao ler ranking do banco:', error);
      throw new Error('Não foi possível recuperar o ranking global.');
    }

    const formattedData: RankingEntry[] = (data || []).map((row: any) => ({
      id: row.id,
      playerName: row.player_name,
      score: row.score,
      createdAt: row.created_at,
      userId: row.user_id
    }));

    return { success: true, data: formattedData };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro inesperado.' };
  }
}
