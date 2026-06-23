'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Trophy, ArrowLeft, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Gift, Heart, Gamepad2, Users, Plus, ShieldCheck } from 'lucide-react';
import { saveGameScoreAction, getGameRankingAction, RankingEntry } from '@/lib/actions/secret-game';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Função utilitária nativa para sintetizar sons 8-bit retrô via Web Audio API
const playRetroSound = (type: 'eat' | 'gameover' | 'start' | 'levelup' | 'gainlife' | 'loselife', isMuted: boolean) => {
  if (isMuted || typeof window === 'undefined') return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'levelup') {
      // Som clássico de "Level Up" de fliperama (arpejo rápido e alegre)
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
      const duration = 0.055;
      notes.forEach((freq, index) => {
        const noteOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        noteOsc.connect(noteGain);
        noteGain.connect(ctx.destination);
        noteOsc.type = 'square'; // som quadrado retro característico
        noteOsc.frequency.setValueAtTime(freq, ctx.currentTime + index * duration);
        noteGain.gain.setValueAtTime(0.07, ctx.currentTime + index * duration);
        noteGain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + (index + 0.9) * duration);
        noteOsc.start(ctx.currentTime + index * duration);
        noteOsc.stop(ctx.currentTime + (index + 1) * duration);
      });
      return;
    }

    if (type === 'gainlife') {
      // Som clássico de "1-UP" retrô (duas notas rápidas e agudas ascendentes)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(330, ctx.currentTime); // E4
      osc1.frequency.setValueAtTime(660, ctx.currentTime + 0.08); // E5
      gain1.gain.setValueAtTime(0.08, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.25);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.25);
      return;
    }

    if (type === 'loselife') {
      // Som de perda de vida (dano rápido)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc1.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.15); // A2
      gain1.gain.setValueAtTime(0.12, ctx.currentTime);
      gain1.gain.linearRampToValueAtTime(0.005, ctx.currentTime + 0.15);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.15);
      return;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'eat') {
      // Som clássico de "coin" (pickup) 8-bit
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'gameover') {
      // Som de game over retro dramático: 3 notas descendentes (E3 -> C3 -> G#2) com vibrato
      const notes = [164.81, 130.81, 103.83]; // E3, C3, G#2
      const noteDuration = 0.25; // tempo de cada nota

      notes.forEach((freq, index) => {
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();

        // LFO para vibrato retro
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(12, ctx.currentTime + index * noteDuration);
        lfoGain.gain.setValueAtTime(10, ctx.currentTime + index * noteDuration);

        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, ctx.currentTime + index * noteDuration);
        osc1.frequency.exponentialRampToValueAtTime(freq * 0.85, ctx.currentTime + (index + 0.95) * noteDuration);

        gain1.gain.setValueAtTime(0.12, ctx.currentTime + index * noteDuration);
        gain1.gain.linearRampToValueAtTime(0.005, ctx.currentTime + (index + 0.95) * noteDuration);

        lfo.start(ctx.currentTime + index * noteDuration);
        osc1.start(ctx.currentTime + index * noteDuration);

        lfo.stop(ctx.currentTime + (index + 1) * noteDuration);
        osc1.stop(ctx.currentTime + (index + 1) * noteDuration);
      });
      return;
    } else if (type === 'start') {
      // Arpejo de início rápido e feliz
      osc.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
      osc.frequency.setValueAtTime(329.63, ctx.currentTime + 0.06); // E4
      osc.frequency.setValueAtTime(392.00, ctx.currentTime + 0.12); // G4
      osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.18); // C5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.28);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    }
  } catch (error) {
    console.warn("Web Audio API bloqueada ou não suportada", error);
  }
};

interface SecretGameProps {
  onClose: () => void;
  playClickSound: () => void;
}

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Position {
  x: number;
  y: number;
}

type FoodType =
  | 'normal'
  | 'golden'
  | 'slow'
  | 'star'
  | 'confia'
  | 'bomb'
  | 'portal'
  | 'slug'
  | 'banana'
  | 'singularity'
  | 'ghost'
  | 'paradox'
  | 'shield'
  | 'clone'
  | 'chili'
  | 'invert'
  | 'gluttony'
  | 'quantum';

interface FoodItem {
  id: string;
  x: number;
  y: number;
  color: string;
  type: FoodType;
  spawnTime: number;
  duration?: number;
}

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  color: string;
  alpha: number;
  size: number;
}

// Função utilitária para desenhar estrelas de 5 pontas no canvas
const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) => {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
};

// Mensagens motivacionais da marca Confia
const CONFIA_MESSAGES = [
  "🤝 Confia que o seu negócio vai decolar! +50 PTS",
  "🚀 Com o Confia, a sua gestão decola! +50 PTS",
  "📊 Controle financeiro descomplicado! +50 PTS",
  "💎 O seu ERP de confiança! +50 PTS",
  "🌟 Organização gera resultados! Confia! +50 PTS"
];

const LEVEL_THRESHOLDS = [0, 70, 150, 250, 370, 510, 670, 850, 1050, 1270];
const LEVEL_SPEEDS     = [220, 195, 170, 148, 128, 112, 98,  86,  76,  68];

const getLevelFromScore = (score: number): number => {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (score >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
};

export default function SecretGame({
  onClose,
  playClickSound
}: SecretGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Estados e referências do modo PVP
  const [gameMode, setGameModeState] = useState<'solo' | 'pvp'>('solo');
  const gameModeRef = useRef<'solo' | 'pvp'>('solo');
  const setGameMode = (mode: 'solo' | 'pvp') => {
    gameModeRef.current = mode;
    setGameModeState(mode);
  };

  const [pvpState, setPvpState] = useState<'lobby' | 'creating' | 'joining' | 'playing' | 'waiting'>('lobby');
  const pvpStateRef = useRef<'lobby' | 'creating' | 'joining' | 'playing' | 'waiting'>('lobby');
  const setPvpStateWithRef = (state: 'lobby' | 'creating' | 'joining' | 'playing' | 'waiting') => {
    pvpStateRef.current = state;
    setPvpState(state);
  };

  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [opponentName, setOpponentName] = useState('');
  const opponentNameRef = useRef('');
  const [opponentScore, setOpponentScoreState] = useState(0);
  const opponentScoreRef = useRef(0);
  const setOpponentScore = (score: number) => {
    opponentScoreRef.current = score;
    setOpponentScoreState(score);
  };

  const [isHost, setIsHostState] = useState(false);
  const isHostRef = useRef(false);
  const setIsHost = (val: boolean) => {
    isHostRef.current = val;
    setIsHostState(val);
  };

  const [opponentConnected, setOpponentConnectedState] = useState(false);
  const opponentConnectedRef = useRef(false);
  const setOpponentConnected = (val: boolean) => {
    opponentConnectedRef.current = val;
    setOpponentConnectedState(val);
  };

  const [countdown, setCountdown] = useState<number | null>(null);

  const remoteSnakeRef = useRef<Position[]>([]);
  const remoteSnakeColorRef = useRef<string>('#d946ef');
  const channelRef = useRef<any>(null);

  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const supabase = createClient();

  const initPvpChannel = async (code: string, hostMode: boolean) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    setIsHost(hostMode);
    setRoomCode(code);
    setPvpStateWithRef(hostMode ? 'creating' : 'joining');

    const { data: { user } } = await supabase.auth.getUser();
    const myName = user?.email?.split('@')[0].substring(0, 3).toUpperCase() || 'JOG';

    const channelName = `room-${code.toUpperCase()}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
        presence: { key: myName }
      }
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'opponent_move' }, (payload: any) => {
        remoteSnakeRef.current = payload.payload.snake;
        remoteSnakeColorRef.current = payload.payload.color;
      })
      .on('broadcast', { event: 'food_spawn' }, (payload: any) => {
        if (!isHostRef.current) {
          foodsRef.current = payload.payload.foods;
        }
      })
      .on('broadcast', { event: 'food_eaten' }, (payload: any) => {
        setOpponentScore(payload.payload.score);
        if (isHostRef.current) {
          const eatenId = payload.payload.foodId;
          const idx = foodsRef.current.findIndex(f => f.id === eatenId);
          let wasNormal = false;
          if (idx !== -1) {
            wasNormal = foodsRef.current[idx].type === 'normal';
            foodsRef.current.splice(idx, 1);
          }
          if (wasNormal || foodsRef.current.filter(f => f.type === 'normal').length === 0) {
            foodsRef.current.push(generateNormalFood());
          }
          channel.send({
            type: 'broadcast',
            event: 'food_spawn',
            payload: { foods: foodsRef.current }
          });
        }
      })
      .on('broadcast', { event: 'game_over_broadcast' }, () => {
        handlePvpWin();
      })
      .on('broadcast', { event: 'start_countdown' }, () => {
        triggerCountdown();
      })
      .on('broadcast', { event: 'reset_game' }, () => {
        startPvpGameplay(false);
      })
      .on('broadcast', { event: 'quantum_growth' }, (payload: any) => {
        const segments = payload.payload.segments || 2;
        const currentSnake = [...snakeRef.current];
        const tail = currentSnake[currentSnake.length - 1] || { x: 20, y: 14 };
        for (let i = 0; i < segments; i++) {
          currentSnake.push({ ...tail });
        }
        snakeRef.current = currentSnake;
        toast.warning('🌀 EFEITO QUANTUM! Sua cauda cresceu devido ao oponente!', {
          duration: 2500,
          icon: '🌀',
          style: {
            border: '1px solid rgba(20, 184, 166, 0.3)',
            background: '#070708',
            color: '#2dd4bf'
          }
        });
      });

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = Object.entries(state).map(([key, value]) => ({
        name: key,
        isHost: (value[0] as any)?.isHost
      }));

      const opp = users.find(u => u.isHost !== hostMode);

      if (users.length >= 2 && opp) {
        setOpponentConnected(true);
        setOpponentName(opp.name.substring(0, 3).toUpperCase());
        opponentNameRef.current = opp.name.substring(0, 3).toUpperCase();

        if (hostMode && pvpStateRef.current === 'creating') {
          channel.send({
            type: 'broadcast',
            event: 'start_countdown',
            payload: {}
          });
          triggerCountdown();
        }
      } else if (users.length < 2 && opponentConnectedRef.current) {
        toast.error('Oponente se desconectou da sala!');
        setOpponentConnected(false);
        triggerGameOver();
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          isHost: hostMode,
          onlineAt: new Date().toISOString()
        });
      }
    });
  };

  const triggerCountdown = () => {
    setPvpStateWithRef('playing');
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          setCountdown(null);
          startPvpGameplay(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startPvpGameplay = (shouldSendReset = false) => {
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    setScore(0);
    setOpponentScore(0);
    setLevel(1);
    setLives(0);
    isInvulnerableRef.current = false;
    particlesRef.current = [];
    obstaclesRef.current = [];

    if (isHostRef.current) {
      snakeRef.current = [
        { x: 8, y: 14 },
        { x: 7, y: 14 },
        { x: 6, y: 14 }
      ];
      directionRef.current = 'RIGHT';
    } else {
      snakeRef.current = [
        { x: 31, y: 14 },
        { x: 32, y: 14 },
        { x: 33, y: 14 }
      ];
      directionRef.current = 'LEFT';
    }

    remoteSnakeRef.current = isHostRef.current
      ? [{ x: 31, y: 14 }, { x: 32, y: 14 }, { x: 33, y: 14 }]
      : [{ x: 8, y: 14 }, { x: 7, y: 14 }, { x: 6, y: 14 }];

    if (isHostRef.current) {
      generateFood();
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'food_spawn',
          payload: { foods: foodsRef.current }
        });
      }
    }

    if (shouldSendReset && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'reset_game',
        payload: {}
      });
    }

    if (gameIntervalRef.current) {
      window.clearInterval(gameIntervalRef.current);
    }

    currentSpeedRef.current = 170;
    gameIntervalRef.current = window.setInterval(gameLoop, 170);
  };

  const handlePvpWin = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    playRetroSound('levelup', isMuted);
    toast.success('👑 VITÓRIA! Seu oponente colidiu!');
    if (gameIntervalRef.current) {
      window.clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [snakeColor, setSnakeColor] = useState('#d5ff40');
  const [activeButton, setActiveButton] = useState<Direction | null>(null);
  const [slowTimeLeft, setSlowTimeLeft] = useState(0);
  const [starTimeLeft, setStarTimeLeft] = useState(0);
  const [comboMultiplier, setComboMultiplierState] = useState(1.0);
  const [comboTimer, setComboTimerState] = useState(0);
  const comboMultiplierRef = useRef(1.0);
  const comboTimerRef = useRef(0);

  const setComboMultiplier = (val: number | ((prev: number) => number)) => {
    if (typeof val === 'function') {
      setComboMultiplierState(prev => {
        const nextVal = val(prev);
        comboMultiplierRef.current = nextVal;
        return nextVal;
      });
    } else {
      comboMultiplierRef.current = val;
      setComboMultiplierState(val);
    }
  };

  const setComboTimer = (val: number | ((prev: number) => number)) => {
    if (typeof val === 'function') {
      setComboTimerState(prev => {
        const nextVal = val(prev);
        comboTimerRef.current = nextVal;
        return nextVal;
      });
    } else {
      comboTimerRef.current = val;
      setComboTimerState(val);
    }
  };
  const [slugTimeLeft, setSlugTimeLeft] = useState(0);
  const [bananaTimeLeft, setBananaTimeLeft] = useState(0);
  const [singularityTimeLeft, setSingularityTimeLeft] = useState(0);
  const [ghostTimeLeft, setGhostTimeLeft] = useState(0);
  const [paradoxTimeLeft, setParadoxTimeLeft] = useState(0);
  const [shieldTimeLeft, setShieldTimeLeft] = useState(0);
  const [cloneTimeLeft, setCloneTimeLeft] = useState(0);
  const [chiliTimeLeft, setChiliTimeLeft] = useState(0);
  const [invertTimeLeft, setInvertTimeLeft] = useState(0);
  const [gluttonyTimeLeft, setGluttonyTimeLeft] = useState(0);
  const [quantumTimeLeft, setQuantumTimeLeft] = useState(0);
  const [isPaused, setIsPausedState] = useState(false);
  const isPausedRef = useRef<boolean>(false);
  const setIsPaused = (val: boolean) => {
    isPausedRef.current = val;
    setIsPausedState(val);
  };

  // Controle de pontuação com ref para evitar stale closures
  const [score, setScoreState] = useState(0);
  const scoreRef = useRef(0);
  const setScore = (val: number | ((prev: number) => number)) => {
    if (typeof val === 'function') {
      setScoreState(prev => {
        const nextVal = val(prev);
        scoreRef.current = nextVal;
        return nextVal;
      });
    } else {
      scoreRef.current = val;
      setScoreState(val);
    }
  };

  // Controle de Ranking
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isSavingScore, setIsSavingScore] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  // Remoção de estados relacionados ao tela cheia
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Controle de nível com ref para evitar stale closures
  const [level, setLevelState] = useState(1);
  const levelRef = useRef(1);
  const setLevel = (val: number | ((prev: number) => number)) => {
    if (typeof val === 'function') {
      setLevelState(prev => {
        const nextVal = val(prev);
        levelRef.current = nextVal;
        return nextVal;
      });
    } else {
      levelRef.current = val;
      setLevelState(val);
    }
  };

  const [lives, setLivesState] = useState(0);
  const [justGainedLife, setJustGainedLife] = useState(false);

  // Sincronizar estado e ref de vidas para evitar stale closures no loop do jogo
  const livesRef = useRef(0);
  const setLives = (val: number | ((prev: number) => number)) => {
    if (typeof val === 'function') {
      setLivesState(prev => {
        const nextVal = val(prev);
        livesRef.current = nextVal;
        return nextVal;
      });
    } else {
      livesRef.current = val;
      setLivesState(val);
    }
  };

  const isInvulnerableRef = useRef(false);

  // Lista de cores neon vibrantes para as comidas e cobrinha
  const NEON_CORES = ['#d5ff40', '#ef4444', '#00f0ff', '#d946ef', '#ff6600', '#ffcc00'];

  // Referências de estado do jogo mutáveis para evitar re-declaração de timers
  const snakeRef = useRef<Position[]>([{ x: 10, y: 10 }]);
  const foodsRef = useRef<FoodItem[]>([]);
  const lastSpecialSpawnRef = useRef<number>(0);
  const snakeColorRef = useRef<string>('#d5ff40'); // Cor inicial da cobra é a cor Confia
  const directionRef = useRef<Direction>('RIGHT');
  const gameIntervalRef = useRef<number | null>(null);
  const currentSpeedRef = useRef<number>(200);
  const gameStartTimeRef = useRef<number>(0);
  const gameplayLogRef = useRef<{ t: number; p: number; type: FoodType }[]>([]);
  const totalPauseTimeRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);

  // Upgrades Premium Refs
  const particlesRef = useRef<Particle[]>([]);
  const shakeIntensityRef = useRef<number>(0);
  const isSlowedRef = useRef<boolean>(false);
  const isStarredRef = useRef<boolean>(false);
  const lastGuaranteedStarLevelRef = useRef<number>(0);
  const obstaclesRef = useRef<Position[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const slowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const starTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slugSlowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slugExpireTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSlugSlowedRef = useRef<boolean>(false);
  const bananaSlowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bananaExpireTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBananaSlowedRef = useRef<boolean>(false);
  const bombExpireTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelUpAnimationRef = useRef<{ level: number; startTime: number } | null>(null);

  const isSingularityRef = useRef<boolean>(false);
  const isGhostRef = useRef<boolean>(false);
  const isParadoxRef = useRef<boolean>(false);
  const isShieldRef = useRef<boolean>(false);
  const isCloneRef = useRef<boolean>(false);
  const isChiliRef = useRef<boolean>(false);
  const isInvertRef = useRef<boolean>(false);
  const isGluttonyRef = useRef<boolean>(false);
  const isQuantumRef = useRef<boolean>(false);

  const historyRef = useRef<Position[]>([]);
  const preGluttonySegmentsRef = useRef<Position[] | null>(null);

  const singularityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ghostTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paradoxTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shieldTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cloneTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chiliTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const invertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gluttonyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const quantumTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Helper para obter velocidade calculada síncrona
  const getSpeed = (lvl: number, score: number): number => {
    if (isChiliRef.current)       return 45;
    const effectiveLvl = isSlugSlowedRef.current ? 4 : lvl;
    const idx = Math.min(effectiveLvl - 1, LEVEL_SPEEDS.length - 1);
    const base = LEVEL_SPEEDS[idx];
    const cur  = LEVEL_THRESHOLDS[idx] ?? 0;
    const next = LEVEL_THRESHOLDS[idx + 1] ?? cur + 200;
    const prog = Math.min(1, (score - cur) / (next - cur));
    let speed  = Math.max(55, base - prog * 8);

    if (isSlowedRef.current)      return Math.min(280, speed + 80);
    if (isStarredRef.current)     return speed * 2.2;
    if (isSlugSlowedRef.current)  return Math.min(280, speed + 60);
    if (isBananaSlowedRef.current) return speed * 1.8;
    return speed;
  };

  // Geração de partículas ao comer fruta
  const spawnParticles = (foodX: number, foodY: number, color: string) => {
    const blockSize = 20;
    const originX = foodX * blockSize + blockSize / 2;
    const originY = foodY * blockSize + blockSize / 2;
    const newParticles: Particle[] = [];
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2 + 1.2;
      newParticles.push({
        x: originX,
        y: originY,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        color,
        alpha: 1.0,
        size: Math.random() * 2 + 1.2
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  };

  // Gerador de Obstáculos Dinâmicos e Aleatórios de forma segura (Nível 7+)
  const generateObstacles = (lvl: number) => {
    if (lvl < 7) {
      obstaclesRef.current = [];
      return;
    }

    const list: Position[] = [];
    // Define a quantidade de obstáculos de forma balanceada e amigável (máximo de 6 no total)
    const numObstacles = Math.min(6, 3 + (lvl - 7));

    // Regiões da cobra e comidas atuais para evitar spawns neles
    const snakeSegments = snakeRef.current || [];

    for (let i = 0; i < numObstacles; i++) {
      let attempts = 0;
      let valid = false;
      let x = 0;
      let y = 0;

      while (!valid && attempts < 100) {
        attempts++;
        x = Math.floor(Math.random() * (gridWidth - 2)) + 1; // 1 a gridWidth - 2
        y = Math.floor(Math.random() * (gridHeight - 2)) + 1; // 1 a gridHeight - 2

        // 1. Evitar zonas seguras de spawn (início da cobra solo e PvP)
        const isCenterSafeZone = (x >= 15 && x <= 25 && y >= 10 && y <= 18) || (x <= 10 && y >= 10 && y <= 18) || (x >= 30 && y >= 10 && y <= 18);
        if (isCenterSafeZone) continue;

        // 2. Evitar colisão com a cobra atual
        const hitsSnake = snakeSegments.some(s => s.x === x && s.y === y);
        if (hitsSnake) continue;

        // 3. Evitar colisão com as comidas
        const hitsFood = foodsRef.current.some(f => f.x === x && f.y === y);
        if (hitsFood) continue;

        // 4. Evitar duplicados
        const isDuplicate = list.some(o => o.x === x && o.y === y);
        if (isDuplicate) continue;

        valid = true;
      }

      if (valid) {
        list.push({ x, y });
      }
    }

    obstaclesRef.current = list;
  };

  const startInvulnerabilityAnimation = () => {
    const animate = () => {
      if (!isInvulnerableRef.current) {
        drawGame(); // redesenha normal sem piscar
        return;
      }
      drawGame();
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  const handleCrash = () => {
    if (gameModeRef.current === 'pvp') {
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'game_over_broadcast',
          payload: {}
        });
      }
      triggerGameOver();
      toast.error('💥 Você colidiu e perdeu a partida!');
      return;
    }

    if (livesRef.current > 0) {
      // Perder uma vida
      const nextLives = livesRef.current - 1;
      setLives(nextLives);
      playRetroSound('loselife', isMuted);
      toast.error(`💔 Vida perdida! Você tem ${nextLives} restante(s).`);

      // Resetar cobrinha ao centro do grid
      snakeRef.current = [
        { x: 20, y: 14 },
        { x: 19, y: 14 },
        { x: 18, y: 14 }
      ];
      snakeColorRef.current = '#d5ff40';
      setSnakeColor('#d5ff40');
      directionRef.current = 'RIGHT';

      // Ativar invulnerabilidade temporária
      isInvulnerableRef.current = true;
      startInvulnerabilityAnimation();
      setTimeout(() => {
        isInvulnerableRef.current = false;
      }, 1500);
    } else {
      triggerGameOver();
    }
  };
  const gridWidth = 40;  // Grid mais largo widescreen (40 colunas)
  const gridHeight = 28; // Grid mais alto (28 linhas)

  // Carrega pontuação máxima local e ranking do Supabase ao montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHighScore = localStorage.getItem('confia-snake-high-score');
      if (savedHighScore) {
        setHighScore(parseInt(savedHighScore, 10));
      }
    }
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setIsLoadingRanking(true);
    try {
      const res = await getGameRankingAction();
      if (res.success && res.data) {
        setRanking(res.data);
      }
    } catch (err) {
      console.error('Erro ao carregar classificação:', err);
    } finally {
      setIsLoadingRanking(false);
    }
  };

  // Gerencia o loop de atualização do jogo
  const startGame = () => {
    playClickSound();
    playRetroSound('start', isMuted);

    // Resetar jogo (cobrinha posicionada ao centro do grid 40x28)
    snakeRef.current = [
      { x: 20, y: 14 },
      { x: 19, y: 14 },
      { x: 18, y: 14 }
    ];
    snakeColorRef.current = '#d5ff40';
    setSnakeColor('#d5ff40');
    generateFood();
    directionRef.current = 'RIGHT';
    setScore(0);
    setLevel(1);
    setLives(0);
    isInvulnerableRef.current = false;
    isSlowedRef.current = false;
    isStarredRef.current = false;
    lastGuaranteedStarLevelRef.current = 0;
    particlesRef.current = [];
    generateObstacles(1);
    setIsGameOver(false);
    setIsPaused(false);
    setScoreSaved(false);
    setPlayerName('');
    setIsPlaying(true);
    setIsLeaderboardOpen(false);
    setSlowTimeLeft(0);
    setStarTimeLeft(0);
    setSlugTimeLeft(0);
    setBananaTimeLeft(0);
    setSingularityTimeLeft(0);
    setGhostTimeLeft(0);
    setParadoxTimeLeft(0);
    setShieldTimeLeft(0);
    setCloneTimeLeft(0);
    setChiliTimeLeft(0);
    setInvertTimeLeft(0);
    setGluttonyTimeLeft(0);
    setQuantumTimeLeft(0);
    setComboMultiplier(1.0);
    setComboTimer(0);

    gameStartTimeRef.current = Date.now();
    gameplayLogRef.current = [];
    totalPauseTimeRef.current = 0;
    pauseStartTimeRef.current = 0;
    isSlugSlowedRef.current = false;
    isBananaSlowedRef.current = false;
    isSingularityRef.current = false;
    isGhostRef.current = false;
    isParadoxRef.current = false;
    isShieldRef.current = false;
    isCloneRef.current = false;
    isChiliRef.current = false;
    isInvertRef.current = false;
    isGluttonyRef.current = false;
    isQuantumRef.current = false;
    historyRef.current = [];
    preGluttonySegmentsRef.current = null;

    if (slowTimeoutRef.current) {
      clearTimeout(slowTimeoutRef.current);
      slowTimeoutRef.current = null;
    }
    if (starTimeoutRef.current) {
      clearTimeout(starTimeoutRef.current);
      starTimeoutRef.current = null;
    }
    if (slugSlowTimeoutRef.current) {
      clearTimeout(slugSlowTimeoutRef.current);
      slugSlowTimeoutRef.current = null;
    }
    if (slugExpireTimeoutRef.current) {
      clearTimeout(slugExpireTimeoutRef.current);
      slugExpireTimeoutRef.current = null;
    }
    if (bananaSlowTimeoutRef.current) {
      clearTimeout(bananaSlowTimeoutRef.current);
      bananaSlowTimeoutRef.current = null;
    }
    if (bananaExpireTimeoutRef.current) {
      clearTimeout(bananaExpireTimeoutRef.current);
      bananaExpireTimeoutRef.current = null;
    }
    if (bombExpireTimeoutRef.current) {
      clearTimeout(bombExpireTimeoutRef.current);
      bombExpireTimeoutRef.current = null;
    }
    if (singularityTimeoutRef.current) {
      clearTimeout(singularityTimeoutRef.current);
      singularityTimeoutRef.current = null;
    }
    if (ghostTimeoutRef.current) {
      clearTimeout(ghostTimeoutRef.current);
      ghostTimeoutRef.current = null;
    }
    if (paradoxTimeoutRef.current) {
      clearTimeout(paradoxTimeoutRef.current);
      paradoxTimeoutRef.current = null;
    }
    if (shieldTimeoutRef.current) {
      clearTimeout(shieldTimeoutRef.current);
      shieldTimeoutRef.current = null;
    }
    if (cloneTimeoutRef.current) {
      clearTimeout(cloneTimeoutRef.current);
      cloneTimeoutRef.current = null;
    }
    if (chiliTimeoutRef.current) {
      clearTimeout(chiliTimeoutRef.current);
      chiliTimeoutRef.current = null;
    }
    if (invertTimeoutRef.current) {
      clearTimeout(invertTimeoutRef.current);
      invertTimeoutRef.current = null;
    }
    if (gluttonyTimeoutRef.current) {
      clearTimeout(gluttonyTimeoutRef.current);
      gluttonyTimeoutRef.current = null;
    }
    if (quantumTimeoutRef.current) {
      clearTimeout(quantumTimeoutRef.current);
      quantumTimeoutRef.current = null;
    }

    if (gameIntervalRef.current) {
      window.clearInterval(gameIntervalRef.current);
    }

    const initialSpeed = getSpeed(1, 0);
    currentSpeedRef.current = initialSpeed;
    gameIntervalRef.current = window.setInterval(gameLoop, initialSpeed);
  };

  const pauseGame = () => {
    if (!isPlayingRef.current || isPausedRef.current || isGameOver) return;
    setIsPaused(true);
    pauseStartTimeRef.current = Date.now();
    if (gameIntervalRef.current) {
      window.clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }
  };

  const resumeGame = () => {
    playClickSound();
    setIsPaused(false);
    if (pauseStartTimeRef.current > 0) {
      totalPauseTimeRef.current += (Date.now() - pauseStartTimeRef.current);
      pauseStartTimeRef.current = 0;
    }

    if (gameIntervalRef.current) {
      window.clearInterval(gameIntervalRef.current);
    }
    const currentSpeed = getSpeed(levelRef.current, scoreRef.current);
    currentSpeedRef.current = currentSpeed;
    gameIntervalRef.current = window.setInterval(gameLoop, currentSpeed);
  };

  const generateNormalFood = (): FoodItem => {
    let newFood: Position = { x: 0, y: 0 };
    let isOnSnake = true;
    let isOnObstacle = true;
    let isOnOtherFood = true;

    while (isOnSnake || isOnObstacle || isOnOtherFood) {
      newFood = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight)
      };

      isOnSnake = snakeRef.current.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      isOnObstacle = obstaclesRef.current.some(obs => obs.x === newFood.x && obs.y === newFood.y);
      isOnOtherFood = foodsRef.current.some(f => f.x === newFood.x && f.y === newFood.y);
    }

    const color = NEON_CORES[Math.floor(Math.random() * NEON_CORES.length)];
    return {
      id: Math.random().toString(),
      x: newFood.x,
      y: newFood.y,
      color,
      type: 'normal',
      spawnTime: Date.now()
    };
  };

  const generateSpecialFood = (): FoodItem => {
    let newFood: Position = { x: 0, y: 0 };
    let isOnSnake = true;
    let isOnObstacle = true;
    let isOnOtherFood = true;

    while (isOnSnake || isOnObstacle || isOnOtherFood) {
      newFood = {
        x: Math.floor(Math.random() * gridWidth),
        y: Math.floor(Math.random() * gridHeight)
      };

      isOnSnake = snakeRef.current.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      isOnObstacle = obstaclesRef.current.some(obs => obs.x === newFood.x && obs.y === newFood.y);
      isOnOtherFood = foodsRef.current.some(f => f.x === newFood.x && f.y === newFood.y);
    }

    const currentLvl = levelRef.current;
    let type: FoodType = 'golden';
    let color = '#ffd700';
    let duration = Math.floor(Math.random() * 3000) + 5000; // 5s a 8s

    // Lógica de spawn da Estrelinha (Nível 5+)
    let shouldSpawnStar = false;
    if (currentLvl >= 5) {
      if (currentLvl >= 7 && lastGuaranteedStarLevelRef.current < currentLvl) {
        shouldSpawnStar = true;
        lastGuaranteedStarLevelRef.current = currentLvl;
      } else {
        shouldSpawnStar = Math.random() < 0.15; // 15% de chance
      }
    }

    if (shouldSpawnStar) {
      type = 'star';
      color = '#ffd700'; // Estrela dourada
      duration = 7000;
    } else {
      const specialPool: { type: FoodType; color: string; duration: number }[] = [
        { type: 'golden', color: '#ffd700', duration: 5000 },
        { type: 'slow', color: '#00ffff', duration: 5000 },
        { type: 'confia', color: '#d5ff40', duration: 6000 },
        { type: 'bomb', color: '#a855f7', duration: 6000 },
        { type: 'portal', color: '#3b82f6', duration: 6000 },
        { type: 'slug', color: '#10b981', duration: 4000 },
        { type: 'banana', color: '#facc15', duration: 5000 },
        { type: 'singularity', color: '#a78bfa', duration: 7000 },
        { type: 'ghost', color: '#e4e4e7', duration: 6000 },
        { type: 'paradox', color: '#ec4899', duration: 8000 },
        { type: 'shield', color: '#3b82f6', duration: 7000 },
        { type: 'clone', color: '#06b6d4', duration: 8000 },
        { type: 'chili', color: '#ef4444', duration: 5000 },
        { type: 'invert', color: '#10b981', duration: 6000 },
        { type: 'gluttony', color: '#eab308', duration: 6000 },
        { type: 'quantum', color: '#14b8a6', duration: 8000 }
      ];

      const availablePool = specialPool.filter(item => {
        if (item.type === 'slug' && currentLvl < 4) return false;
        if (item.type === 'bomb' && currentLvl < 4) return false;
        if (item.type === 'portal' && currentLvl < 5) return false;
        if (item.type === 'banana' && currentLvl < 6) return false;
        if (item.type === 'singularity' && currentLvl < 5) return false;
        if (item.type === 'ghost' && currentLvl < 4) return false;
        if (item.type === 'paradox' && currentLvl < 5) return false;
        if (item.type === 'shield' && currentLvl < 4) return false;
        if (item.type === 'clone' && currentLvl < 5) return false;
        if (item.type === 'chili' && currentLvl < 5) return false;
        if (item.type === 'invert' && currentLvl < 3) return false;
        if (item.type === 'gluttony' && currentLvl < 5) return false;
        if (item.type === 'quantum' && currentLvl < 4) return false;
        return true;
      });

      const chosen = availablePool[Math.floor(Math.random() * availablePool.length)] || specialPool[0];
      type = chosen.type;
      color = chosen.color;
      duration = chosen.duration;
    }

    return {
      id: Math.random().toString(),
      x: newFood.x,
      y: newFood.y,
      color,
      type,
      spawnTime: Date.now(),
      duration
    };
  };

  const generateFood = () => {
    if (slugExpireTimeoutRef.current) {
      clearTimeout(slugExpireTimeoutRef.current);
      slugExpireTimeoutRef.current = null;
    }
    if (bananaExpireTimeoutRef.current) {
      clearTimeout(bananaExpireTimeoutRef.current);
      bananaExpireTimeoutRef.current = null;
    }
    if (bombExpireTimeoutRef.current) {
      clearTimeout(bombExpireTimeoutRef.current);
      bombExpireTimeoutRef.current = null;
    }

    foodsRef.current = [generateNormalFood()];
    lastSpecialSpawnRef.current = Date.now();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isPlaying) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPlaying || !touchStartRef.current) return;

    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;

    const minSwipeDistance = 30; // pixels

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (Math.abs(diffX) > minSwipeDistance) {
        if (diffX > 0) {
          handleDirectionChange('RIGHT');
        } else {
          handleDirectionChange('LEFT');
        }
        touchStartRef.current = null;
      }
    } else {
      if (Math.abs(diffY) > minSwipeDistance) {
        if (diffY > 0) {
          handleDirectionChange('DOWN');
        } else {
          handleDirectionChange('UP');
        }
        touchStartRef.current = null;
      }
    }
  };

  const handleDirectionChange = (newDir: Direction) => {
    let actualDir = newDir;
    if (isInvertRef.current) {
      if (newDir === 'UP') actualDir = 'DOWN';
      else if (newDir === 'DOWN') actualDir = 'UP';
      else if (newDir === 'LEFT') actualDir = 'RIGHT';
      else if (newDir === 'RIGHT') actualDir = 'LEFT';
    }
    const currentDir = directionRef.current;
    if (actualDir === 'UP' && currentDir === 'DOWN') return;
    if (actualDir === 'DOWN' && currentDir === 'UP') return;
    if (actualDir === 'LEFT' && currentDir === 'RIGHT') return;
    if (actualDir === 'RIGHT' && currentDir === 'LEFT') return;
    directionRef.current = actualDir;
  };

  const handleButtonPress = (dir: Direction, e?: React.TouchEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    playClickSound();
    handleDirectionChange(dir);
    setActiveButton(dir);
  };

  const handleButtonRelease = (dir: Direction, e?: React.TouchEvent | React.MouseEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    setActiveButton(prev => prev === dir ? null : prev);
  };

  const gameLoop = () => {
    const snake = [...snakeRef.current];
    const head = { ...snake[0] };
    const dir = directionRef.current;
    const isInvulnerable = isInvulnerableRef.current;

    // 1. Filtrar comidas expiradas e tentar spawnar especial temporária (Solo ou Host)
    if (gameModeRef.current !== 'pvp' || isHostRef.current) {
      const now = Date.now();
      let expiredAny = false;
      const activeFoods: FoodItem[] = [];

      foodsRef.current.forEach(f => {
        if (f.duration && f.spawnTime + f.duration < now) {
          expiredAny = true;
          if (f.type === 'slug') {
            toast.info('🐌 A lesma fugiu!', {
              duration: 2500,
              icon: '🐌',
              style: {
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: '#070708',
                color: '#34d399'
              }
            });
          } else if (f.type === 'bomb') {
            toast.info('💣 A bomba foi desarmada e sumiu!', {
              duration: 2500,
              icon: '💣',
              style: {
                border: '1px solid rgba(168, 85, 247, 0.3)',
                background: '#070708',
                color: '#c084fc'
              }
            });
          } else if (f.type === 'banana') {
            toast.info('🍌 A banana estragou e sumiu!', {
              duration: 2500,
              icon: '🍌',
              style: {
                border: '1px solid rgba(234, 179, 8, 0.3)',
                background: '#070708',
                color: '#facc15'
              }
            });
          } else if (f.type === 'singularity') {
            toast.info('🌌 Singularidade entrou em colapso!', {
              duration: 2500,
              icon: '🌌',
              style: {
                border: '1px solid rgba(139, 92, 246, 0.3)',
                background: '#070708',
                color: '#a78bfa'
              }
            });
          } else if (f.type === 'ghost') {
            toast.info('👻 O fantasma desapareceu!', {
              duration: 2500,
              icon: '👻',
              style: {
                border: '1px solid rgba(228, 228, 231, 0.3)',
                background: '#070708',
                color: '#e4e4e7'
              }
            });
          } else if (f.type === 'paradox') {
            toast.info('⏳ Paradoxo temporal resolvido!', {
              duration: 2500,
              icon: '⏳',
              style: {
                border: '1px solid rgba(236, 72, 153, 0.3)',
                background: '#070708',
                color: '#f472b6'
              }
            });
          } else if (f.type === 'shield') {
            toast.info('🛡️ O escudo descarregou e sumiu!', {
              duration: 2500,
              icon: '🛡️',
              style: {
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: '#070708',
                color: '#60a5fa'
              }
            });
          } else if (f.type === 'clone') {
            toast.info('👥 Holograma do clone dissipado!', {
              duration: 2500,
              icon: '👥',
              style: {
                border: '1px solid rgba(6, 182, 212, 0.3)',
                background: '#070708',
                color: '#22d3ee'
              }
            });
          } else if (f.type === 'chili') {
            toast.info('🌶️ A pimenta chili esfriou!', {
              duration: 2500,
              icon: '🌶️',
              style: {
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: '#070708',
                color: '#f87171'
              }
            });
          } else if (f.type === 'invert') {
            toast.info('🔄 Distorção invertida normalizada!', {
              duration: 2500,
              icon: '🔄',
              style: {
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: '#070708',
                color: '#34d399'
              }
            });
          } else if (f.type === 'gluttony') {
            toast.info('🤤 Modo comilão expirou da arena!', {
              duration: 2500,
              icon: '🤤',
              style: {
                border: '1px solid rgba(234, 179, 8, 0.3)',
                background: '#070708',
                color: '#facc15'
              }
            });
          } else if (f.type === 'quantum') {
            toast.info('⚛️ Partículas quânticas se desentrelaçaram!', {
              duration: 2500,
              icon: '⚛️',
              style: {
                border: '1px solid rgba(20, 184, 166, 0.3)',
                background: '#070708',
                color: '#2dd4bf'
              }
            });
          }
        } else {
          activeFoods.push(f);
        }
      });

      if (expiredAny) {
        foodsRef.current = activeFoods;
        if (foodsRef.current.filter(f => f.type === 'normal').length === 0) {
          foodsRef.current.push(generateNormalFood());
        }
        if (gameModeRef.current === 'pvp' && isHostRef.current && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'food_spawn',
            payload: { foods: foodsRef.current }
          });
        }
      }

      // Spawnar especial com 35% de chance a cada 5 segundos de jogo
      if (isPlayingRef.current && !isPausedRef.current) {
        if (now - lastSpecialSpawnRef.current >= 5000) {
          lastSpecialSpawnRef.current = now;
          if (foodsRef.current.length < 4 && Math.random() < 0.35) {
            foodsRef.current.push(generateSpecialFood());
            if (gameModeRef.current === 'pvp' && isHostRef.current && channelRef.current) {
              channelRef.current.send({
                type: 'broadcast',
                event: 'food_spawn',
                payload: { foods: foodsRef.current }
              });
            }
          }
        }
      }
    }

    // Salvar posição atual para histórico do paradoxo ANTES de mover
    if (isParadoxRef.current) {
      historyRef.current.push({ x: head.x, y: head.y });
      if (historyRef.current.length > 50) {
        historyRef.current.shift();
      }
    } else {
      historyRef.current = [];
    }

    // Efeito Singularity: atrai todas as comidas ativas em 1 bloco em direção à cabeça
    if (isSingularityRef.current && foodsRef.current.length > 0) {
      foodsRef.current = foodsRef.current.map(f => {
        const dx = head.x - f.x;
        const dy = head.y - f.y;
        let nextX = f.x;
        let nextY = f.y;
        if (Math.abs(dx) > 0) nextX += Math.sign(dx);
        if (Math.abs(dy) > 0) nextY += Math.sign(dy);

        const hitsObstacle = obstaclesRef.current.some(obs => obs.x === nextX && obs.y === nextY);
        if (!hitsObstacle) {
          return { ...f, x: nextX, y: nextY };
        }
        return f;
      });
    }

    // Movimentar cabeça
    if (dir === 'UP') head.y -= 1;
    else if (dir === 'DOWN') head.y += 1;
    else if (dir === 'LEFT') head.x -= 1;
    else if (dir === 'RIGHT') head.x += 1;

    // Teletransporte nas laterais (borda esquerda e direita infinitas)
    if (head.x < 0) {
      head.x = gridWidth - 1;
    } else if (head.x >= gridWidth) {
      head.x = 0;
    }

    // Colisão com teto e chão (borda superior e inferior) ou wrap-around se invulnerável
    if (head.y < 0 || head.y >= gridHeight) {
      if (isInvulnerable) {
        if (head.y < 0) head.y = gridHeight - 1;
        else if (head.y >= gridHeight) head.y = 0;
      } else {
        shakeIntensityRef.current = 10; // Tremor de colisão
        handleCrash();
        return;
      }
    }

    // Colisão com o próprio corpo
    const selfCollision = snake.some(segment => segment.x === head.x && segment.y === head.y);
    if (selfCollision) {
      if (!isInvulnerable && !isGhostRef.current) {
        shakeIntensityRef.current = 10; // Tremor de colisão
        handleCrash();
        return;
      }
    }

    // Colisão com obstáculos indestrutíveis
    const hitObstacle = obstaclesRef.current.some(obs => obs.x === head.x && obs.y === head.y);
    if (hitObstacle) {
      if (isShieldRef.current || isChiliRef.current || isGluttonyRef.current) {
        // Quebra o obstáculo e remove
        obstaclesRef.current = obstaclesRef.current.filter(obs => !(obs.x === head.x && obs.y === head.y));
        playRetroSound('eat', isMuted);
        shakeIntensityRef.current = 5;
        toast.success('💥 Obstáculo destruído!', { duration: 2500 });
      } else if (!isInvulnerable) {
        shakeIntensityRef.current = 10; // Tremor de colisão
        handleCrash();
        return;
      }
    }

    // Se for PvP, checa colisão com o corpo do oponente
    if (gameModeRef.current === 'pvp') {
      const hitOpponent = remoteSnakeRef.current.some(segment => segment.x === head.x && segment.y === head.y);
      if (hitOpponent) {
        if (isShieldRef.current || isGhostRef.current) {
          // Ignora colisão
        } else if (!isInvulnerable) {
          shakeIntensityRef.current = 10; // Tremor de colisão
          handleCrash();
          return;
        }
      }
    }

    // Adiciona a nova cabeça na frente
    snake.unshift(head);

    // Comer comida
    let eatenFoodIndex = -1;
    for (let i = 0; i < foodsRef.current.length; i++) {
      if (head.x === foodsRef.current[i].x && head.y === foodsRef.current[i].y) {
        eatenFoodIndex = i;
        break;
      }
    }

    // Lógica do Clone coletar comida
    if (eatenFoodIndex === -1 && isCloneRef.current) {
      const cloneHead = {
        x: gridWidth - 1 - head.x,
        y: gridHeight - 1 - head.y
      };
      for (let i = 0; i < foodsRef.current.length; i++) {
        if (cloneHead.x === foodsRef.current[i].x && cloneHead.y === foodsRef.current[i].y) {
          eatenFoodIndex = i;
          spawnParticles(foodsRef.current[i].x, foodsRef.current[i].y, foodsRef.current[i].color);
          break;
        }
      }
    }

    if (eatenFoodIndex !== -1) {
      const eatenFood = foodsRef.current[eatenFoodIndex];
      foodsRef.current.splice(eatenFoodIndex, 1);

      if (eatenFood.type === 'normal') {
        foodsRef.current.push(generateNormalFood());
      }

      // Spawn das fagulhas de partículas neon
      spawnParticles(eatenFood.x, eatenFood.y, eatenFood.color);

      // Lógica de multiplicador do combo chain (timer de 3 segundos)
      let nextMultiplier = 1.0;
      if (comboTimerRef.current > 0) {
        if (comboMultiplierRef.current === 1.0) nextMultiplier = 1.5;
        else if (comboMultiplierRef.current === 1.5) nextMultiplier = 2.0;
        else if (comboMultiplierRef.current === 2.0) nextMultiplier = 3.0;
        else nextMultiplier = 4.0;
      } else {
        nextMultiplier = 1.0;
      }

      setComboMultiplier(nextMultiplier);
      setComboTimer(3000); // 3 segundos para a próxima fruta

      // Calcular pontos adicionais baseados no tipo de comida e combo multiplier
      let basePoints = 10;
      if (eatenFood.type === 'golden') {
        basePoints = 30;
      } else if (eatenFood.type === 'confia') {
        basePoints = 50;
      } else if (eatenFood.type === 'banana') {
        basePoints = 50;
      } else if (eatenFood.type === 'bomb') {
        basePoints = 20;
      } else if (eatenFood.type === 'portal') {
        basePoints = 10;
      } else if (eatenFood.type === 'slug') {
        basePoints = 10;
      } else if (eatenFood.type === 'singularity') {
        basePoints = 20;
      } else if (eatenFood.type === 'ghost') {
        basePoints = 15;
      } else if (eatenFood.type === 'paradox') {
        basePoints = 25;
      } else if (eatenFood.type === 'shield') {
        basePoints = 20;
      } else if (eatenFood.type === 'clone') {
        basePoints = 25;
      } else if (eatenFood.type === 'chili') {
        basePoints = 30;
      } else if (eatenFood.type === 'invert') {
        basePoints = 80;
      } else if (eatenFood.type === 'gluttony') {
        basePoints = 35;
      } else if (eatenFood.type === 'quantum') {
        basePoints = 20;
      }

      const pointsGained = Math.round(basePoints * nextMultiplier);
      const nextScore = scoreRef.current + pointsGained;
      setScore(nextScore);

      if (gameModeRef.current === 'pvp' && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'food_eaten',
          payload: { 
            score: nextScore,
            foodId: eatenFood.id
          }
        });
      }

      if (isQuantumRef.current) {
        if (gameModeRef.current === 'pvp' && channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'quantum_growth',
            payload: { segments: 2 }
          });
        } else {
          const currentSnake = [...snake];
          const tail = currentSnake[currentSnake.length - 1] || { x: 20, y: 14 };
          currentSnake.push({ ...tail });
          currentSnake.push({ ...tail });
          snakeRef.current = currentSnake;
          toast.warning('🌀 Quantum Solo: Sua cauda cresceu em dobro!', { duration: 2500 });
        }
      }

      if (nextScore > highScore) {
        setHighScore(nextScore);
        localStorage.setItem('confia-snake-high-score', nextScore.toString());
      }

      // Tratar efeitos especiais
      if (eatenFood.type === 'portal') {
        let newX = 20;
        let newY = 14;
        let valid = false;
        let attempts = 0;

        while (!valid && attempts < 100) {
          attempts++;
          newX = Math.floor(Math.random() * gridWidth);
          newY = Math.floor(Math.random() * gridHeight);

          const hitsSnake = snake.slice(1).some(s => s.x === newX && s.y === newY);
          const hitsObstacle = obstaclesRef.current.some(o => o.x === newX && o.y === newY);

          if (!hitsSnake && !hitsObstacle) {
            valid = true;
          }
        }

        snake[0] = { x: newX, y: newY };

        toast.info(`🌀 PORTAL! Cabeça teleportada para (${newX}, ${newY})! +10 PTS`, {
          duration: 2500,
          icon: '🌀',
          style: {
            border: '1px solid rgba(59, 130, 246, 0.3)',
            background: '#070708',
            color: '#60a5fa'
          }
        });
        playRetroSound('gainlife', isMuted);
        shakeIntensityRef.current = 8;
      } else if (eatenFood.type === 'bomb') {
        const segmentsToRemove = 3;
        const currentLength = snake.length;
        const targetLength = Math.max(2, currentLength - segmentsToRemove);
        const removedCount = currentLength - targetLength;

        if (removedCount > 0) {
          snake.splice(targetLength);
          toast.warning(`💣 BOMBA! Cobra encurtada em ${removedCount} segmento(s)! +20 PTS`, {
            duration: 2500,
            icon: '💣',
            style: {
              border: '1px solid rgba(168, 85, 247, 0.3)',
              background: '#070708',
              color: '#c084fc'
            }
          });
        } else {
          toast.info(`💣 BOMBA! Você ganhou +20 PTS (tamanho mínimo já atingido).`, {
            duration: 2500,
            icon: '💣',
            style: {
              border: '1px solid rgba(168, 85, 247, 0.3)',
              background: '#070708',
              color: '#c084fc'
            }
          });
        }
        playRetroSound('loselife', isMuted);
        shakeIntensityRef.current = 6;
      } else if (eatenFood.type === 'confia') {
        const msg = CONFIA_MESSAGES[Math.floor(Math.random() * CONFIA_MESSAGES.length)];
        toast.success(msg, {
          duration: 2500,
          icon: '🤝',
          style: {
            border: '1px solid rgba(213, 255, 64, 0.3)',
            background: '#070708',
            color: '#d5ff40'
          }
        });
      } else if (eatenFood.type === 'golden') {
        isInvulnerableRef.current = true;
        startInvulnerabilityAnimation(); // Inicia efeito de piscar
        toast.success(`🌟 FRUTA DOURADA! +30 PTS + INVULNERABILIDADE!`, { duration: 2500 });
        setTimeout(() => {
          isInvulnerableRef.current = false;
        }, 3000);
      } else if (eatenFood.type === 'slow') {
        if (slowTimeoutRef.current) {
          clearTimeout(slowTimeoutRef.current);
        }
        isSlowedRef.current = true;
        setSlowTimeLeft(5000);
        toast.info(`❄️ CÂMERA LENTA ATIVADA POR 5 SEG!`, { duration: 2500 });
        slowTimeoutRef.current = setTimeout(() => {
          isSlowedRef.current = false;
          toast.success(`❄️ Velocidade normal restabelecida.`, { duration: 2500 });
          slowTimeoutRef.current = null;
        }, 5000);
      } else if (eatenFood.type === 'star') {
        if (starTimeoutRef.current) {
          clearTimeout(starTimeoutRef.current);
        }
        isStarredRef.current = true;
        setStarTimeLeft(7000);
        toast.success(`⭐ ESTRELA COLETADA! VELOCIDADE REDUZIDA EM 50% POR 7 SEG!`, { duration: 2500 });
        starTimeoutRef.current = setTimeout(() => {
          isStarredRef.current = false;
          toast.success(`⭐ Efeito da estrela finalizado.`, { duration: 2500 });
          starTimeoutRef.current = null;
        }, 7000);
      } else if (eatenFood.type === 'slug') {
        if (slugSlowTimeoutRef.current) {
          clearTimeout(slugSlowTimeoutRef.current);
        }
        isSlugSlowedRef.current = true;
        setSlugTimeLeft(8000);
        toast.info(`🐌 LESMA COLETADA! VELOCIDADE REDUZIDA PARA O NÍVEL 4 POR 8 SEG!`, {
          duration: 2500,
          icon: '🐌',
          style: {
            border: '1px solid rgba(16, 185, 129, 0.3)',
            background: '#070708',
            color: '#34d399'
          }
        });
        slugSlowTimeoutRef.current = setTimeout(() => {
          isSlugSlowedRef.current = false;
          toast.success(`🐌 Efeito da lesma finalizado.`, { duration: 2500 });
          slugSlowTimeoutRef.current = null;
        }, 8000);
      } else if (eatenFood.type === 'banana') {
        if (bananaSlowTimeoutRef.current) {
          clearTimeout(bananaSlowTimeoutRef.current);
        }

        // Aumentar o tamanho da cobrinha em 40%
        const currentLength = snake.length;
        const segmentsToAdd = Math.max(1, Math.round(currentLength * 0.40));
        const tail = snake[snake.length - 1] || { x: 0, y: 0 };
        for (let i = 0; i < segmentsToAdd; i++) {
          snake.push({ ...tail });
        }

        isBananaSlowedRef.current = true;
        setBananaTimeLeft(6000); // 6s de lentidão
        toast.info(`🍌 BANANA! Tamanho +40% (+${segmentsToAdd} segs) e velocidade de movimento reduzida em 50% por 6s!`, {
          duration: 2500,
          icon: '🍌',
          style: {
            border: '1px solid rgba(234, 179, 8, 0.3)',
            background: '#070708',
            color: '#facc15'
          }
        });
        playRetroSound('loselife', isMuted);
        shakeIntensityRef.current = 6;

        bananaSlowTimeoutRef.current = setTimeout(() => {
          isBananaSlowedRef.current = false;
          toast.success(`🍌 Efeito da banana finalizado.`, { duration: 2500 });
          bananaSlowTimeoutRef.current = null;
        }, 6000);
      } else if (eatenFood.type === 'singularity') {
        if (singularityTimeoutRef.current) clearTimeout(singularityTimeoutRef.current);
        isSingularityRef.current = true;
        setSingularityTimeLeft(7000);
        toast.info('🌌 ÍMÃ DE SINGULARIDADE! Todas as frutas ativas serão atraídas por 7s!', {
          duration: 2500,
          icon: '🌌',
          style: {
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: '#070708',
            color: '#a78bfa'
          }
        });
        singularityTimeoutRef.current = setTimeout(() => {
          isSingularityRef.current = false;
          toast.success('🌌 Efeito da singularidade dissipado.', { duration: 2500 });
          singularityTimeoutRef.current = null;
        }, 7000);
      } else if (eatenFood.type === 'ghost') {
        if (ghostTimeoutRef.current) clearTimeout(ghostTimeoutRef.current);
        isGhostRef.current = true;
        setGhostTimeLeft(6000);
        toast.info('👻 MODO FANTASMA! Atravesse o seu próprio corpo por 6s!', {
          duration: 2500,
          icon: '👻',
          style: {
            border: '1px solid rgba(228, 228, 231, 0.3)',
            background: '#070708',
            color: '#e4e4e7'
          }
        });
        ghostTimeoutRef.current = setTimeout(() => {
          isGhostRef.current = false;
          toast.success('👻 Corpo materializado novamente!', { duration: 2500 });
          ghostTimeoutRef.current = null;
        }, 6000);
      } else if (eatenFood.type === 'paradox') {
        if (paradoxTimeoutRef.current) clearTimeout(paradoxTimeoutRef.current);
        isParadoxRef.current = true;
        setParadoxTimeLeft(8000);
        toast.info('⏳ RETORNO DE PARADOXO! Volte 3 segundos no tempo ao colidir (válido por 8s)!', {
          duration: 2500,
          icon: '⏳',
          style: {
            border: '1px solid rgba(236, 72, 153, 0.3)',
            background: '#070708',
            color: '#f472b6'
          }
        });
        paradoxTimeoutRef.current = setTimeout(() => {
          isParadoxRef.current = false;
          toast.error('⏳ O paradoxo fechou!', { duration: 2500 });
          paradoxTimeoutRef.current = null;
        }, 8000);
      } else if (eatenFood.type === 'shield') {
        if (shieldTimeoutRef.current) clearTimeout(shieldTimeoutRef.current);
        isShieldRef.current = true;
        setShieldTimeLeft(7000);
        toast.success('🛡️ ESCUDO DE PLASMA! Quebre qualquer obstáculo e ignore colisões PvP por 7s!', {
          duration: 2500,
          icon: '🛡️',
          style: {
            border: '1px solid rgba(59, 130, 246, 0.3)',
            background: '#070708',
            color: '#60a5fa'
          }
        });
        shieldTimeoutRef.current = setTimeout(() => {
          isShieldRef.current = false;
          toast.error('🛡️ O escudo descarregou!', { duration: 2500 });
          shieldTimeoutRef.current = null;
        }, 7000);
      } else if (eatenFood.type === 'clone') {
        if (cloneTimeoutRef.current) clearTimeout(cloneTimeoutRef.current);
        isCloneRef.current = true;
        setCloneTimeLeft(8000);
        toast.success('👥 HOLOGRAMA CLONE! Um clone simétrico coletará frutas por 8s!', {
          duration: 2500,
          icon: '👥',
          style: {
            border: '1px solid rgba(6, 182, 212, 0.3)',
            background: '#070708',
            color: '#22d3ee'
          }
        });
        cloneTimeoutRef.current = setTimeout(() => {
          isCloneRef.current = false;
          toast.info('👥 O holograma dissipou.', { duration: 2500 });
          cloneTimeoutRef.current = null;
        }, 8000);
      } else if (eatenFood.type === 'chili') {
        if (chiliTimeoutRef.current) clearTimeout(chiliTimeoutRef.current);
        isChiliRef.current = true;
        setChiliTimeLeft(5000);
        toast.warning('🌶️ CHILI DE FOGO! Super velocidade e destruição de obstáculos por 5s!', {
          duration: 2500,
          icon: '🌶️',
          style: {
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: '#070708',
            color: '#f87171'
          }
        });
        if (gameIntervalRef.current) {
          window.clearInterval(gameIntervalRef.current);
          gameIntervalRef.current = window.setInterval(gameLoop, 45);
        }
        chiliTimeoutRef.current = setTimeout(() => {
          isChiliRef.current = false;
          toast.info('🌶️ O calor chili diminuiu.', { duration: 2500 });
          chiliTimeoutRef.current = null;
          if (gameIntervalRef.current) {
            window.clearInterval(gameIntervalRef.current);
            gameIntervalRef.current = window.setInterval(gameLoop, getSpeed(levelRef.current, scoreRef.current));
          }
        }, 5000);
      } else if (eatenFood.type === 'invert') {
        if (invertTimeoutRef.current) clearTimeout(invertTimeoutRef.current);
        isInvertRef.current = true;
        setInvertTimeLeft(6000);
        toast.error('🔄 CONTROLES INVERTIDOS! A tela girou, mas você ganhou +80 PTS!', {
          duration: 2500,
          icon: '🔄',
          style: {
            border: '1px solid rgba(16, 185, 129, 0.3)',
            background: '#070708',
            color: '#34d399'
          }
        });
        invertTimeoutRef.current = setTimeout(() => {
          isInvertRef.current = false;
          toast.success('🔄 Controles e tela normalizados.', { duration: 2500 });
          invertTimeoutRef.current = null;
        }, 6000);
      } else if (eatenFood.type === 'gluttony') {
        if (gluttonyTimeoutRef.current) clearTimeout(gluttonyTimeoutRef.current);
        isGluttonyRef.current = true;
        setGluttonyTimeLeft(6000);
        const currentSnake = [...snakeRef.current];
        if (!preGluttonySegmentsRef.current) {
          preGluttonySegmentsRef.current = currentSnake.slice(1);
        }
        snakeRef.current = [currentSnake[0]];
        toast.success('🤤 MODO COMILÃO! Cauda encolhida para 1 bloco! Devore obstáculos vermelhos por 6s!', {
          duration: 2500,
          icon: '🤤',
          style: {
            border: '1px solid rgba(234, 179, 8, 0.3)',
            background: '#070708',
            color: '#facc15'
          }
        });
        gluttonyTimeoutRef.current = setTimeout(() => {
          isGluttonyRef.current = false;
          if (preGluttonySegmentsRef.current) {
            const nowSnake = [...snakeRef.current];
            const lastSegment = nowSnake[nowSnake.length - 1] || nowSnake[0];
            const restoredTail = preGluttonySegmentsRef.current.map(() => ({ ...lastSegment }));
            snakeRef.current = [...nowSnake, ...restoredTail];
            preGluttonySegmentsRef.current = null;
          }
          toast.info('🤤 Cauda restaurada.', { duration: 2500 });
          gluttonyTimeoutRef.current = null;
        }, 6000);
      } else if (eatenFood.type === 'quantum') {
        if (quantumTimeoutRef.current) clearTimeout(quantumTimeoutRef.current);
        isQuantumRef.current = true;
        setQuantumTimeLeft(8000);
        toast.success('⚛️ ENTRELAÇAMENTO QUANTUM! As frutas que comer farão a cauda do oponente crescer por 8s!', {
          duration: 2500,
          icon: '⚛️',
          style: {
            border: '1px solid rgba(20, 184, 166, 0.3)',
            background: '#070708',
            color: '#2dd4bf'
          }
        });
        quantumTimeoutRef.current = setTimeout(() => {
          isQuantumRef.current = false;
          toast.info('⚛️ Efeito quântico finalizado.', { duration: 2500 });
          quantumTimeoutRef.current = null;
        }, 8000);
      }

      // Checar se subiu de nível por thresholds crescentes
      const nextLevel = getLevelFromScore(nextScore);
      if (nextLevel > levelRef.current) {
        setLevel(nextLevel);
        levelUpAnimationRef.current = { level: nextLevel, startTime: Date.now() };
        playRetroSound('levelup', isMuted);
        toast.success(`🎉 NÍVEL ${nextLevel}! A velocidade aumentou!`, { duration: 2500 });
        generateObstacles(nextLevel);

        // Ganhar 1 vida extra ao chegar no nível 7
        if (nextLevel === 7) {
          setLives(currentLives => {
            playRetroSound('gainlife', isMuted);
            toast.success(`❤️ VIDA EXTRA! Você chegou ao nível 7!`, { duration: 2500 });
            return currentLives + 1;
          });
        }
      }

      // Ganhar vida a cada 100 pontos
      if (nextScore > 0 && nextScore % 100 === 0) {
        setLives(currentLives => {
          playRetroSound('gainlife', isMuted);
          toast.success(`❤️ +1 VIDA! Você atingiu ${nextScore} pontos!`, { duration: 2500 });
          setJustGainedLife(true);
          setTimeout(() => setJustGainedLife(false), 1500);
          return currentLives + 1;
        });
      }

      playRetroSound('eat', isMuted);

      // Vibração tátil ao comer a fruta
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(40);
      }

      const elapsed = Date.now() - gameStartTimeRef.current - totalPauseTimeRef.current;
      gameplayLogRef.current.push({
        t: elapsed,
        p: pointsGained,
        type: eatenFood.type
      });

      // 🌈 Cobrinha assume a cor da comida comida (no corpo)
      snakeColorRef.current = eatenFood.color;
      setSnakeColor(eatenFood.color);

      if (gameModeRef.current === 'pvp' && isHostRef.current && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'food_spawn',
          payload: { foods: foodsRef.current }
        });
      }
    } else {
      // Remove o rabo se não comeu nada (movimento)
      snake.pop();
    }

    snakeRef.current = snake;

    if (gameModeRef.current === 'pvp' && channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'opponent_move',
        payload: {
          snake: snakeRef.current,
          color: snakeColorRef.current
        }
      });
    }
    drawGame();

    // Sincronização dinâmica da velocidade no loop (evita race conditions nos powerups)
    const currentSpeed = getSpeed(levelRef.current, scoreRef.current);
    if (currentSpeed !== currentSpeedRef.current) {
      currentSpeedRef.current = currentSpeed;
      if (gameIntervalRef.current) {
        window.clearInterval(gameIntervalRef.current);
        gameIntervalRef.current = window.setInterval(gameLoop, currentSpeed);
      }
    }
  };

  const triggerGameOver = () => {
    setIsGameOver(true);
    setIsPlaying(false);
    playRetroSound('gameover', isMuted);
    shakeIntensityRef.current = 15; // Tremor forte de fim de jogo

    if (slugExpireTimeoutRef.current) {
      clearTimeout(slugExpireTimeoutRef.current);
      slugExpireTimeoutRef.current = null;
    }
    if (bananaExpireTimeoutRef.current) {
      clearTimeout(bananaExpireTimeoutRef.current);
      bananaExpireTimeoutRef.current = null;
    }
    if (bombExpireTimeoutRef.current) {
      clearTimeout(bombExpireTimeoutRef.current);
      bombExpireTimeoutRef.current = null;
    }

    // Vibração triste de Game Over
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 150]);
    }

    if (gameIntervalRef.current) {
      window.clearInterval(gameIntervalRef.current);
      gameIntervalRef.current = null;
    }
  };

  // Renderização gráfica em Canvas
  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blockSize = 20; // Blocos quadrados de 20px para widescreen perfeito

    // Se estiver pausado, desenha o canvas escurecido com blur ou apenas para de mover,
    // mas não atualiza a física. Permitimos renderizar para as partículas de fundo.

    // 1. Aplicar Screen Invert (Rotação 180 graus) se invertido
    ctx.save();
    if (isInvertRef.current) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(Math.PI);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // 1.5. Aplicar Screen Shake (Tremor de Tela)
    if (shakeIntensityRef.current > 0) {
      const dx = (Math.random() - 0.5) * shakeIntensityRef.current;
      const dy = (Math.random() - 0.5) * shakeIntensityRef.current;
      ctx.translate(dx, dy);
      shakeIntensityRef.current -= 0.6; // Decaimento suave
    }

    // Limpar canvas com cor escura neon
    ctx.fillStyle = '#070708';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Grid sutil de fundo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 0.5;

    // Linhas verticais
    for (let i = 0; i <= gridWidth; i++) {
      ctx.beginPath();
      ctx.moveTo(i * blockSize, 0);
      ctx.lineTo(i * blockSize, canvas.height);
      ctx.stroke();
    }

    // Linhas horizontais
    for (let i = 0; i <= gridHeight; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * blockSize);
      ctx.lineTo(canvas.width, i * blockSize);
      ctx.stroke();
    }

    // 3. Desenhar comidinhas (Cores Neon Brilhantes das Frutas)
    foodsRef.current.forEach(food => {
      // Desenhar arco de progresso circular se a comida tiver um tempo limite e expiração
      if (food.duration) {
        const elapsed = Date.now() - (food.spawnTime || Date.now());
        const remainingProgress = Math.max(0, 1 - elapsed / food.duration);

        if (remainingProgress > 0) {
          const cx = food.x * blockSize + blockSize / 2;
          const cy = food.y * blockSize + blockSize / 2;
          const radius = blockSize * 0.78;

          ctx.save();
          ctx.shadowBlur = 4;
          ctx.shadowColor = food.color;
          ctx.strokeStyle = food.color;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          // Arco circular que diminui no sentido horário do topo (-Math.PI/2) ate completar o circulo
          ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * remainingProgress));
          ctx.stroke();
          ctx.restore();
        }
      }

      if (food.type === 'golden') {
        const isFlash = Math.floor(Date.now() / 150) % 2 === 0;
        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 18;
        ctx.fillStyle = isFlash ? '#ffffff' : '#ffd700';
        ctx.beginPath();
        ctx.arc(
          food.x * blockSize + blockSize / 2,
          food.y * blockSize + blockSize / 2,
          blockSize / 2.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      } else if (food.type === 'slow') {
        const pulseSize = 1 + Math.sin(Date.now() / 200) * 0.15;
        ctx.save();
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#00ffff';

        ctx.beginPath();
        ctx.arc(
          food.x * blockSize + blockSize / 2,
          food.y * blockSize + blockSize / 2,
          (blockSize / 2.5) * pulseSize,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      } else if (food.type === 'star') {
        const isFlash = Math.floor(Date.now() / 150) % 2 === 0;
        ctx.save();
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 18;
        ctx.fillStyle = isFlash ? '#ffffff' : '#ffd700';

        const cx = food.x * blockSize + blockSize / 2;
        const cy = food.y * blockSize + blockSize / 2;
        drawStar(ctx, cx, cy, 5, blockSize / 1.7, blockSize / 3.8);
        ctx.restore();
      } else if (food.type === 'confia') {
        // Desenhar ícone Confia: Caixa arredondada verde-limão com a letra 'C' preta
        const size = blockSize * 0.95;
        const x = food.x * blockSize + (blockSize - size) / 2;
        const y = food.y * blockSize + (blockSize - size) / 2;
        const r = size * 0.3; // raio de arredondamento

        ctx.save();
        ctx.shadowColor = '#d5ff40';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#d5ff40'; // Fundo verde-limão Confia

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, size, size, r);
        } else {
          ctx.rect(x, y, size, size);
        }
        ctx.fill();

        // Desenhar a letra 'C'
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000000';
        ctx.font = `900 ${size * 0.7}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('C', x + size / 2, y + size / 2 + 0.5);
        ctx.restore();
      } else if (food.type === 'bomb') {
        const cx = food.x * blockSize + blockSize / 2;
        const cy = food.y * blockSize + blockSize / 2;
        const r = blockSize * 0.38;

        ctx.save();
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 12;

        // 1. Corpo principal da bomba (círculo roxo)
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(cx, cy + r * 0.15, r, 0, Math.PI * 2);
        ctx.fill();

        // 2. Bocal da bomba (pequeno quadrado no topo)
        ctx.fillStyle = '#6b21a8';
        ctx.shadowBlur = 0;
        ctx.fillRect(cx - r * 0.3, cy - r * 0.95, r * 0.6, r * 0.3);

        // 3. Pavio (linha curva)
        ctx.strokeStyle = '#e4e4e7';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r * 0.9);
        ctx.quadraticCurveTo(cx + r * 0.6, cy - r * 1.4, cx + r * 0.9, cy - r * 1.1);
        ctx.stroke();

        // 4. Fagulha (pequena fagulha amarela/vermelha piscando)
        const isFlash = Math.floor(Date.now() / 100) % 2 === 0;
        ctx.fillStyle = isFlash ? '#f97316' : '#eab308'; // Laranja / Amarelo
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(cx + r * 0.9, cy - r * 1.1, r * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (food.type === 'portal') {
        const cx = food.x * blockSize + blockSize / 2;
        const cy = food.y * blockSize + blockSize / 2;
        const r = blockSize * 0.42;

        ctx.save();
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 15;

        // Desenhar o anel do portal rotacionado
        const angle = (Date.now() / 150) % (Math.PI * 2);
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 1.6);
        ctx.stroke();

        // Centro escuro do portal
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (food.type === 'slug') {
        const cx = food.x * blockSize + blockSize / 2;
        const cy = food.y * blockSize + blockSize / 2;
        const r = blockSize * 0.4;

        ctx.save();
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;

        // 1. Corpo da lesma (um elipsoide alongado horizontalmente)
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.ellipse(cx, cy + r * 0.3, r * 0.9, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Concha da lesma (círculo maior verde escuro nas costas)
        ctx.fillStyle = '#047857';
        ctx.beginPath();
        ctx.arc(cx - r * 0.25, cy - r * 0.1, r * 0.65, 0, Math.PI * 2);
        ctx.fill();

        // Espiral da concha
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.arc(cx - r * 0.25, cy - r * 0.1, r * 0.35, 0, Math.PI * 1.5);
        ctx.stroke();

        // 3. Antenas (dois pequenos traços apontando para a direita e cima)
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        // Antena 1
        ctx.moveTo(cx + r * 0.5, cy - r * 0.1);
        ctx.lineTo(cx + r * 0.85, cy - r * 0.6);
        // Antena 2
        ctx.moveTo(cx + r * 0.3, cy + r * 0.1);
        ctx.lineTo(cx + r * 0.65, cy - r * 0.5);
        ctx.stroke();

        // Olhinhos/pontos nas pontas das antenas
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(cx + r * 0.85, cy - r * 0.6, 0.8, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.65, cy - r * 0.5, 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (food.type === 'banana') {
        const cx = food.x * blockSize + blockSize / 2;
        const cy = food.y * blockSize + blockSize / 2;
        const r = blockSize * 0.45;

        ctx.save();
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 12;

        // Desenhar uma banana curvada
        ctx.strokeStyle = '#facc15'; // Amarelo
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Arco da banana curvada
        ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.8, 0.1 * Math.PI, 0.7 * Math.PI, false);
        ctx.stroke();

        // Ponta escura da banana
        ctx.fillStyle = '#422006'; // Marrom escuro
        ctx.beginPath();
        ctx.arc(cx + r * 0.4, cy + r * 0.35, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Coroa da banana
        ctx.fillStyle = '#422006';
        ctx.beginPath();
        ctx.arc(cx - r * 0.3, cy - r * 0.7, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      } else if (food.type === 'singularity') {
        const cx = food.x * blockSize + blockSize / 2;
        const cy = food.y * blockSize + blockSize / 2;
        const r = blockSize * 0.42;
        ctx.save();
        ctx.shadowColor = '#a78bfa';
        ctx.shadowBlur = 15;
        const angle = (Date.now() / 100) % (Math.PI * 2);
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.strokeStyle = '#a78bfa';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        for (let j = 0; j < 30; j++) {
          const radius = (r * j) / 30;
          const theta = (j * Math.PI) / 4;
          ctx.lineTo(Math.cos(theta) * radius, Math.sin(theta) * radius);
        }
        ctx.stroke();
        ctx.restore();
      } else if (food.type === 'ghost') {
        const cx = food.x * blockSize + blockSize / 2;
        const cy = food.y * blockSize + blockSize / 2;
        const r = blockSize * 0.38;
        ctx.save();
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.2, r * 0.8, Math.PI, 0, false);
        ctx.lineTo(cx + r * 0.8, cy + r * 0.8);
        ctx.lineTo(cx + r * 0.4, cy + r * 0.5);
        ctx.lineTo(cx, cy + r * 0.8);
        ctx.lineTo(cx - r * 0.4, cy + r * 0.5);
        ctx.lineTo(cx - r * 0.8, cy + r * 0.8);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#00f0ff';
        ctx.beginPath();
        ctx.arc(cx - r * 0.3, cy - r * 0.1, 1.5, 0, Math.PI * 2);
        ctx.arc(cx + r * 0.3, cy - r * 0.1, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (food.type === 'paradox') {
        const cx = food.x * blockSize + blockSize / 2;
        const cy = food.y * blockSize + blockSize / 2;
        const r = blockSize * 0.45;
        const pulse = 1 + Math.sin(Date.now() / 150) * 0.1;
        ctx.save();
        ctx.shadowColor = '#ec4899';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#ec4899';
        ctx.fillStyle = '#ec4899';
        ctx.lineWidth = 1.8;
        ctx.translate(cx, cy);
        ctx.scale(pulse, pulse);
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, -r * 0.7);
        ctx.lineTo(r * 0.5, -r * 0.7);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-r * 0.5, r * 0.7);
        ctx.lineTo(r * 0.5, r * 0.7);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-r * 0.6, -r * 0.7);
        ctx.lineTo(r * 0.6, -r * 0.7);
        ctx.moveTo(-r * 0.6, r * 0.7);
        ctx.lineTo(r * 0.6, r * 0.7);
        ctx.stroke();
        ctx.restore();
      } else if (food.type === 'shield') {
        const cx = food.x * blockSize + blockSize / 2;
        const cy = food.y * blockSize + blockSize / 2;
        const r = blockSize * 0.42;
        ctx.save();
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#1d4ed8';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r, cy - r * 0.4);
        ctx.lineTo(cx + r * 0.7, cy + r * 0.8);
        ctx.lineTo(cx - r * 0.7, cy + r * 0.8);
        ctx.lineTo(cx - r, cy - r * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (food.type === 'clone') {
        const cx = food.x * blockSize + blockSize / 2;
        const cy = food.y * blockSize + blockSize / 2;
        const r = blockSize * 0.35;
        ctx.save();
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 12;
        ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
        ctx.beginPath();
        ctx.arc(cx - r * 0.4, cy + r * 0.2, r * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(34, 211, 238, 0.6)';
        ctx.beginPath();
        ctx.arc(cx + r * 0.4, cy - r * 0.2, r * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (food.type === 'chili') {
        const cx = food.x * blockSize + blockSize / 2;
        const cy = food.y * blockSize + blockSize / 2;
        const r = blockSize * 0.45;
        ctx.save();
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.5, cy - r * 0.5);
        ctx.quadraticCurveTo(cx + r * 0.7, cy + r * 0.7, cx - r * 0.2, cy - r * 0.7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.3, cy - r * 0.6);
        ctx.quadraticCurveTo(cx - r * 0.6, cy - r * 0.8, cx - r * 0.8, cy - r * 0.5);
        ctx.stroke();
        ctx.restore();
      } else if (food.type === 'invert') {
        const cx = food.x * blockSize + blockSize / 2;
        const cy = food.y * blockSize + blockSize / 2;
        const r = blockSize * 0.4;
        ctx.save();
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.moveTo(cx + r, cy);
        ctx.lineTo(cx + r * 1.3, cy - r * 0.3);
        ctx.lineTo(cx + r * 0.7, cy - r * 0.3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (food.type === 'gluttony') {
        const cx = food.x * blockSize + blockSize / 2;
        const cy = food.y * blockSize + blockSize / 2;
        const r = blockSize * 0.42;
        const mouthAngle = 0.2 + Math.abs(Math.sin(Date.now() / 100)) * 0.25;
        ctx.save();
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(cx, cy, r, mouthAngle * Math.PI, (2 - mouthAngle) * Math.PI);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (food.type === 'quantum') {
        const cx = food.x * blockSize + blockSize / 2;
        const cy = food.y * blockSize + blockSize / 2;
        const r = blockSize * 0.42;
        ctx.save();
        ctx.shadowColor = '#14b8a6';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#14b8a6';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.3, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.3, -Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#2dd4bf';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        ctx.shadowColor = food.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = food.color;
        ctx.beginPath();
        ctx.arc(
          food.x * blockSize + blockSize / 2,
          food.y * blockSize + blockSize / 2,
          blockSize / 2.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();
      }
    });

    // 4. Desenhar cobra clone se ativo
    const snake = snakeRef.current;
    if (isCloneRef.current) {
      ctx.save();
      snake.forEach((segment, index) => {
        const isCloneHead = index === 0;
        const cx = (gridWidth - 1 - segment.x) * blockSize + 1;
        const cy = (gridHeight - 1 - segment.y) * blockSize + 1;

        if (isCloneHead) {
          ctx.fillStyle = '#06b6d4';
          ctx.shadowColor = '#06b6d4';
          ctx.shadowBlur = 12;
          ctx.globalAlpha = 0.7;
        } else {
          ctx.fillStyle = '#22d3ee';
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 8;
          ctx.globalAlpha = 0.4;
        }

        ctx.fillRect(cx, cy, blockSize - 2, blockSize - 2);

        // Olhos do clone
        if (isCloneHead) {
          ctx.fillStyle = '#000000';
          ctx.shadowBlur = 0;
          ctx.fillRect(cx + blockSize / 3, cy + blockSize / 3, blockSize / 3, blockSize / 3);
        }
      });
      ctx.restore();
    }

    // 4.1. Desenhar cobra real (Cor Ativa da Cobrinha)
    const activeColor = snakeColorRef.current;
    ctx.shadowBlur = 10;

    const isInvulnerable = isInvulnerableRef.current;
    const isVisible = !isInvulnerable || (Math.floor(Date.now() / 120) % 2 === 0);

    snake.forEach((segment, index) => {
      // Cabeça estilizada ou corpo suave
      const isHead = index === 0;

      // Efeito de fogo chili: chamas saindo do corpo
      if (isChiliRef.current && !isHead) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = Math.random() > 0.5 ? '#f97316' : '#ef4444';
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 8;
        ctx.fillRect(
          segment.x * blockSize + (Math.random() - 0.5) * 8 + 1,
          segment.y * blockSize + (Math.random() - 0.5) * 8 + 1,
          blockSize - 2,
          blockSize - 2
        );
        ctx.restore();
      }

      ctx.save();

      // Transparência fantasma
      let finalAlpha = isVisible ? 1.0 : 0.2;
      if (isGhostRef.current) {
        finalAlpha = isVisible ? 0.4 : 0.1;
      }

      if (isHead) {
        ctx.globalAlpha = finalAlpha;
        ctx.fillStyle = '#d5ff40'; // Cabeça é sempre verde-limão (cor Confia)
        ctx.shadowColor = '#d5ff40';
        ctx.shadowBlur = isChiliRef.current ? 20 : 10;
      } else {
        ctx.globalAlpha = finalAlpha * 0.8;
        ctx.fillStyle = activeColor; // A cauda assume a cor ativa da última comida
        ctx.shadowColor = activeColor;
        ctx.shadowBlur = 10;
      }

      ctx.fillRect(
        segment.x * blockSize + 1,
        segment.y * blockSize + 1,
        blockSize - 2,
        blockSize - 2
      );

      // Detalhes da cabeça (olhos e boca animada)
      if (isHead) {
        ctx.globalAlpha = finalAlpha;
        ctx.fillStyle = '#000000';
        ctx.shadowBlur = 0; // tira o blur para os olhos
        const dir = directionRef.current;
        const eyeSize = blockSize / 6;

        if (dir === 'RIGHT' || dir === 'LEFT') {
          ctx.fillRect(segment.x * blockSize + blockSize / 2, segment.y * blockSize + blockSize / 4, eyeSize, eyeSize);
          ctx.fillRect(segment.x * blockSize + blockSize / 2, segment.y * blockSize + (blockSize * 3) / 4 - eyeSize, eyeSize, eyeSize);
        } else {
          ctx.fillRect(segment.x * blockSize + blockSize / 4, segment.y * blockSize + blockSize / 2, eyeSize, eyeSize);
          ctx.fillRect(segment.x * blockSize + (blockSize * 3) / 4 - eyeSize, segment.y * blockSize + blockSize / 2, eyeSize, eyeSize);
        }

        // Se gluttony ativo, desenha boca de Pacman na cabeça!
        if (isGluttonyRef.current) {
          ctx.fillStyle = '#ff0055';
          const mouthOpen = Math.floor(Date.now() / 120) % 2 === 0;
          if (mouthOpen) {
            const hx = segment.x * blockSize;
            const hy = segment.y * blockSize;
            if (dir === 'RIGHT') {
              ctx.beginPath();
              ctx.moveTo(hx + blockSize, hy + blockSize / 2);
              ctx.lineTo(hx + blockSize * 0.6, hy + blockSize * 0.2);
              ctx.lineTo(hx + blockSize * 0.6, hy + blockSize * 0.8);
              ctx.closePath();
              ctx.fill();
            } else if (dir === 'LEFT') {
              ctx.beginPath();
              ctx.moveTo(hx, hy + blockSize / 2);
              ctx.lineTo(hx + blockSize * 0.4, hy + blockSize * 0.2);
              ctx.lineTo(hx + blockSize * 0.4, hy + blockSize * 0.8);
              ctx.closePath();
              ctx.fill();
            } else if (dir === 'UP') {
              ctx.beginPath();
              ctx.moveTo(hx + blockSize / 2, hy);
              ctx.lineTo(hx + blockSize * 0.2, hy + blockSize * 0.4);
              ctx.lineTo(hx + blockSize * 0.8, hy + blockSize * 0.4);
              ctx.closePath();
              ctx.fill();
            } else if (dir === 'DOWN') {
              ctx.beginPath();
              ctx.moveTo(hx + blockSize / 2, hy + blockSize);
              ctx.lineTo(hx + blockSize * 0.2, hy + blockSize * 0.6);
              ctx.lineTo(hx + blockSize * 0.8, hy + blockSize * 0.6);
              ctx.closePath();
              ctx.fill();
            }
          }
        }
      }

      ctx.restore();

      // Desenhar Escudo de Plasma ao redor da cabeça
      if (isHead && isShieldRef.current) {
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = '#3b82f6';
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 14;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(
          segment.x * blockSize + blockSize / 2,
          segment.y * blockSize + blockSize / 2,
          blockSize * 1.1,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();
      }
    });

    // 4.5. Desenhar cobra do oponente se for modo PvP
    if (gameModeRef.current === 'pvp' && remoteSnakeRef.current.length > 0) {
      const oppColor = remoteSnakeColorRef.current;
      remoteSnakeRef.current.forEach((segment, index) => {
        const isOppHead = index === 0;
        ctx.save();
        if (isOppHead) {
          ctx.fillStyle = '#ff007f'; // Cabeça do oponente em rosa neon brilhante
          ctx.shadowColor = '#ff007f';
          ctx.shadowBlur = 10;
        } else {
          ctx.fillStyle = oppColor;
          ctx.shadowColor = oppColor;
          ctx.shadowBlur = 10;
          ctx.globalAlpha = 0.8;
        }

        ctx.fillRect(
          segment.x * blockSize + 1,
          segment.y * blockSize + 1,
          blockSize - 2,
          blockSize - 2
        );
        ctx.restore();
      });
    }

    // 5. Desenhar Obstáculos (Se houver)
    const obstacles = obstaclesRef.current;
    if (obstacles.length > 0) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ef4444';
      ctx.fillStyle = '#1e1e24';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;

      obstacles.forEach(obs => {
        ctx.fillRect(obs.x * blockSize + 1, obs.y * blockSize + 1, blockSize - 2, blockSize - 2);
        ctx.strokeRect(obs.x * blockSize + 1, obs.y * blockSize + 1, blockSize - 2, blockSize - 2);
      });
    }

    // 6. Desenhar e Atualizar Partículas Neon
    const particles = particlesRef.current;
    particlesRef.current = particles
      .map(p => {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        return {
          ...p,
          x: p.x + p.dx,
          y: p.y + p.dy,
          alpha: p.alpha - 0.045
        };
      })
      .filter(p => p.alpha > 0);

    // Resetar opacidade global
    ctx.globalAlpha = 1.0;

    // Resetar shadow blur
    ctx.shadowBlur = 0;

    // Restaurar contexto do Screen Shake
    ctx.restore();

    // 7. Desenhar Animação de Level Up (Texto grande neon centralizado)
    const lvlAnim = levelUpAnimationRef.current;
    if (lvlAnim) {
      const duration = 1500; // Animação dura exatamente 1.5 segundos
      const elapsed = Date.now() - lvlAnim.startTime;
      const progress = Math.max(0, 1 - elapsed / duration);

      if (progress > 0) {
        ctx.save();

        const alpha = progress;
        const scale = 1 + (1 - alpha) * 0.4; // aumenta levemente de tamanho enquanto esmaece

        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;

        ctx.font = '900 20px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Sombra neon roxa
        ctx.shadowColor = '#d946ef';
        ctx.shadowBlur = 15;

        // Texto com borda neon
        ctx.strokeStyle = '#d946ef';
        ctx.lineWidth = 3.5;
        ctx.strokeText(`NÍVEL ${lvlAnim.level}!`, 0, -8);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(`NÍVEL ${lvlAnim.level}!`, 0, -8);

        // Subtexto menor ciano
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 8;
        ctx.font = '900 8px "Courier New", monospace';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeText('VELOCIDADE AUMENTOU', 0, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('VELOCIDADE AUMENTOU', 0, 12);

        ctx.restore();
      } else {
        levelUpAnimationRef.current = null;
      }
    }
  };

  // Atualizar visual e gerenciar loop de animação contínua (60 FPS para partículas e tremor)
  useEffect(() => {
    isPlayingRef.current = isPlaying;

    if (isPlaying && !isPaused) {
      const renderLoop = () => {
        drawGame();
        if (isPlayingRef.current && !isPausedRef.current) {
          animationFrameIdRef.current = requestAnimationFrame(renderLoop);
        }
      };
      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    } else {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      drawGame();
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isPlaying, isGameOver, isPaused]);

  // Captura de teclas do teclado físico (útil para testes em desenvolvimento no PC)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;

      if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (isPaused) {
          resumeGame();
        } else {
          pauseGame();
        }
        return;
      }

      if (isPaused) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleDirectionChange('UP');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleDirectionChange('DOWN');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleDirectionChange('LEFT');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleDirectionChange('RIGHT');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlaying, isPaused]);

  // Limpar o touchStartRef globalmente ao finalizar qualquer toque para evitar glitch de swipe antigo
  useEffect(() => {
    const handleGlobalTouchEnd = () => {
      touchStartRef.current = null;
    };

    window.addEventListener('touchend', handleGlobalTouchEnd);
    window.addEventListener('touchcancel', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, []);

  // Gerenciamento da barra de progresso regressiva de powerups e combo timer
  useEffect(() => {
    if (isPaused) return;
    if (
      slowTimeLeft <= 0 &&
      starTimeLeft <= 0 &&
      comboTimer <= 0 &&
      slugTimeLeft <= 0 &&
      bananaTimeLeft <= 0 &&
      singularityTimeLeft <= 0 &&
      ghostTimeLeft <= 0 &&
      paradoxTimeLeft <= 0 &&
      shieldTimeLeft <= 0 &&
      cloneTimeLeft <= 0 &&
      chiliTimeLeft <= 0 &&
      invertTimeLeft <= 0 &&
      gluttonyTimeLeft <= 0 &&
      quantumTimeLeft <= 0
    )
      return;

    const timer = setInterval(() => {
      if (slowTimeLeft > 0) setSlowTimeLeft(prev => Math.max(0, prev - 100));
      if (starTimeLeft > 0) setStarTimeLeft(prev => Math.max(0, prev - 100));
      if (slugTimeLeft > 0) setSlugTimeLeft(prev => Math.max(0, prev - 100));
      if (bananaTimeLeft > 0) setBananaTimeLeft(prev => Math.max(0, prev - 100));
      if (singularityTimeLeft > 0) setSingularityTimeLeft(prev => Math.max(0, prev - 100));
      if (ghostTimeLeft > 0) setGhostTimeLeft(prev => Math.max(0, prev - 100));
      if (paradoxTimeLeft > 0) setParadoxTimeLeft(prev => Math.max(0, prev - 100));
      if (shieldTimeLeft > 0) setShieldTimeLeft(prev => Math.max(0, prev - 100));
      if (cloneTimeLeft > 0) setCloneTimeLeft(prev => Math.max(0, prev - 100));
      if (chiliTimeLeft > 0) setChiliTimeLeft(prev => Math.max(0, prev - 100));
      if (invertTimeLeft > 0) setInvertTimeLeft(prev => Math.max(0, prev - 100));
      if (gluttonyTimeLeft > 0) setGluttonyTimeLeft(prev => Math.max(0, prev - 100));
      if (quantumTimeLeft > 0) setQuantumTimeLeft(prev => Math.max(0, prev - 100));
      if (comboTimer > 0) {
        setComboTimer(prev => {
          const nextVal = Math.max(0, prev - 100);
          if (nextVal === 0) {
            setComboMultiplier(1.0); // Quebra o combo
          }
          return nextVal;
        });
      }
    }, 100);

    return () => clearInterval(timer);
  }, [
    slowTimeLeft,
    starTimeLeft,
    comboTimer,
    slugTimeLeft,
    bananaTimeLeft,
    singularityTimeLeft,
    ghostTimeLeft,
    paradoxTimeLeft,
    shieldTimeLeft,
    cloneTimeLeft,
    chiliTimeLeft,
    invertTimeLeft,
    gluttonyTimeLeft,
    quantumTimeLeft,
    isPaused
  ]);

  // Captura de aba escondida ou minimizada para pausar o jogo automaticamente
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isPlayingRef.current && !isPausedRef.current) {
        pauseGame();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Limpa o loop do jogo e timeouts ao desmontar
  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) {
        window.clearInterval(gameIntervalRef.current);
      }
      if (slowTimeoutRef.current) clearTimeout(slowTimeoutRef.current);
      if (starTimeoutRef.current) clearTimeout(starTimeoutRef.current);
      if (slugSlowTimeoutRef.current) clearTimeout(slugSlowTimeoutRef.current);
      if (slugExpireTimeoutRef.current) clearTimeout(slugExpireTimeoutRef.current);
      if (bananaSlowTimeoutRef.current) clearTimeout(bananaSlowTimeoutRef.current);
      if (bananaExpireTimeoutRef.current) clearTimeout(bananaExpireTimeoutRef.current);
      if (bombExpireTimeoutRef.current) clearTimeout(bombExpireTimeoutRef.current);
      if (singularityTimeoutRef.current) clearTimeout(singularityTimeoutRef.current);
      if (ghostTimeoutRef.current) clearTimeout(ghostTimeoutRef.current);
      if (paradoxTimeoutRef.current) clearTimeout(paradoxTimeoutRef.current);
      if (shieldTimeoutRef.current) clearTimeout(shieldTimeoutRef.current);
      if (cloneTimeoutRef.current) clearTimeout(cloneTimeoutRef.current);
      if (chiliTimeoutRef.current) clearTimeout(chiliTimeoutRef.current);
      if (invertTimeoutRef.current) clearTimeout(invertTimeoutRef.current);
      if (gluttonyTimeoutRef.current) clearTimeout(gluttonyTimeoutRef.current);
      if (quantumTimeoutRef.current) clearTimeout(quantumTimeoutRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Salvar a pontuação no banco de dados (Supabase)
  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.length !== 3 || isSavingScore) return;

    setIsSavingScore(true);
    playClickSound();

    try {
      const res = await saveGameScoreAction(playerName.toUpperCase(), score, gameplayLogRef.current);
      if (res.success) {
        setScoreSaved(true);
        loadLeaderboard(); // Recarrega o ranking com a nova pontuação
        toast.success('Pontuação gravada com sucesso no ranking global!');
      } else {
        // Exibir erro específico
        if (res.error) {
          toast.error(`Não foi possível salvar no ranking online: ${res.error}`);
        }
        
        // Fallback caso o banco não esteja configurado ou o jogador não esteja logado
        const mockEntry = {
          id: Math.random().toString(),
          playerName: playerName.toUpperCase(),
          score: score,
          createdAt: new Date().toISOString()
        };
        setRanking(prev => {
          const updated = [...prev, mockEntry as any].sort((a, b) => b.score - a.score).slice(0, 10);
          return updated;
        });
        setScoreSaved(true);
        toast.info('Pontuação gravada no ranking local (Modo Visitante)!');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro de conexão: ${err.message || 'Erro inesperado'}`);
      
      // Fallback em caso de erro de conexão
      const mockEntry = {
        id: Math.random().toString(),
        playerName: playerName.toUpperCase(),
        score: score,
        createdAt: new Date().toISOString()
      };
      setRanking(prev => {
        const updated = [...prev, mockEntry as any].sort((a, b) => b.score - a.score).slice(0, 10);
        return updated;
      });
      setScoreSaved(true);
      toast.info('Pontuação gravada no ranking local offline!');
    } finally {
      setIsSavingScore(false);
    }
  };

  const checkIsTop10 = (scr: number) => {
    if (scr < 50) return false;
    if (ranking.length < 10) return true;
    const lowestTopScore = ranking[ranking.length - 1]?.score || 0;
    return scr >= lowestTopScore;
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 md:px-4 py-2 animate-in fade-in zoom-in-95 duration-300 pb-12 select-none">
      
      {/* Cabeçalho Unificado Retro-Cyberpunk */}
      <div className="flex items-center justify-between w-full pb-3 border-b border-white/5 mb-6">
        <div className="flex items-center gap-2">
          <Gamepad2 className="text-[#d5ff40] animate-pulse" size={18} />
          <span className="font-mono text-xs font-black uppercase tracking-widest text-white">Confia Snake</span>
        </div>
        <button
          onClick={() => {
            playClickSound();
            onClose();
          }}
          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-white/5 shadow-md active:scale-95"
        >
          <ArrowLeft size={10} /> Voltar para o Início
        </button>
      </div>

      {/* Grid Responsivo Principal */}
      <div className="flex flex-col md:flex-row md:gap-6 justify-center items-start">
        
        {/* COLUNA ESQUERDA (Desktop Only - Painel de Controle e Status) */}
        <div className="hidden md:flex flex-col gap-4 w-[240px] shrink-0">
          
          {/* Card de Status do Jogo */}
          <div className="glass-card p-5 space-y-4 border-white/5 bg-[#0a0a0c]/60 relative overflow-hidden rounded-2xl shadow-lg">
            <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-[#d5ff40]/5 blur-2xl pointer-events-none" />
            
            {gameMode === 'solo' ? (
              <>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Pontos</span>
                  <div className="flex items-baseline gap-1">
                    <h2 className="text-3xl font-black text-white tracking-tight leading-none">{score}</h2>
                    <span className="text-[10px] font-black text-zinc-600">PTS</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Nível</span>
                    <p className="text-sm font-black text-purple-400">{level}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Recorde</span>
                    <p className="text-sm font-black text-zinc-300">{highScore}</p>
                  </div>
                </div>

                {/* Vidas */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Vidas</span>
                  <div className={cn("flex items-center gap-1", justGainedLife && "animate-bounce")}>
                    <Heart
                      className={cn(
                        "transition-all duration-300 text-red-500 fill-red-500",
                        lives === 0 && "text-zinc-600 fill-transparent",
                        justGainedLife && "animate-pulse text-red-400 fill-red-400"
                      )}
                      size={14}
                    />
                    <span className="font-mono text-xs font-black text-red-500">
                      {lives > 0 ? `x${lives}` : 'Sem Vidas'}
                    </span>
                  </div>
                </div>

                {/* Medalhas */}
                <div className="pt-3 border-t border-white/5 space-y-2">
                  <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider block">Desafios</span>
                  <div className="flex gap-2">
                    <div 
                      className={cn(
                        "flex-1 p-2 rounded-xl border flex flex-col items-center justify-center transition-all duration-300",
                        score >= 500 || highScore >= 500 
                          ? "bg-amber-600/10 border-amber-500/20 text-amber-500 shadow-[0_0_8px_rgba(217,119,6,0.15)]" 
                          : "bg-white/2 border-white/5 opacity-30 grayscale"
                      )}
                      title="Bronze (500 pts)"
                    >
                      <span className="text-sm">Bronze</span>
                      <span className="text-[8px] font-black mt-1">500</span>
                    </div>
                    <div 
                      className={cn(
                        "flex-1 p-2 rounded-xl border flex flex-col items-center justify-center transition-all duration-300",
                        score >= 700 || highScore >= 700 
                          ? "bg-zinc-300/10 border-zinc-300/20 text-zinc-300 shadow-[0_0_8px_rgba(255,255,255,0.15)]" 
                          : "bg-white/2 border-white/5 opacity-30 grayscale"
                      )}
                      title="Prata (700 pts)"
                    >
                      <span className="text-sm">Prata</span>
                      <span className="text-[8px] font-black mt-1">700</span>
                    </div>
                    <div 
                      className={cn(
                        "flex-1 p-2 rounded-xl border flex flex-col items-center justify-center transition-all duration-300",
                        score >= 1000 || highScore >= 1000 
                          ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.25)] animate-pulse" 
                          : "bg-white/2 border-white/5 opacity-30 grayscale"
                      )}
                      title="Ouro (1000 pts)"
                    >
                      <span className="text-sm">Ouro</span>
                      <span className="text-[8px] font-black mt-1">1000</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // Status PvP
              <>
                <div className="space-y-3">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Você</span>
                    <div className="flex items-baseline gap-1">
                      <h2 className="text-2xl font-black text-[#d5ff40] tracking-tight leading-none">{score}</h2>
                      <span className="text-[9px] font-black text-zinc-600">PTS</span>
                    </div>
                  </div>

                  <div className="space-y-0.5 border-t border-white/5 pt-2">
                    <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Oponente ({opponentName || 'OPONENTE'})</span>
                    <div className="flex items-baseline gap-1">
                      <h2 className="text-2xl font-black text-[#ff007f] tracking-tight leading-none">{opponentScore}</h2>
                      <span className="text-[9px] font-black text-zinc-600">PTS</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-white/5 space-y-1.5 text-[10px] font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Arena:</span>
                    <span className="text-white font-black">{roomCode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Status:</span>
                    {opponentConnected ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck size={10} /> Conectado
                      </span>
                    ) : (
                      <span className="text-purple-400 animate-pulse font-bold">Aguardando...</span>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Card de Controles e Pausa */}
          <div className="glass-card p-5 space-y-4 border-white/5 bg-[#0a0a0c]/60 rounded-2xl shadow-lg">
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">Teclado</span>
            
            <div className="space-y-2 text-[10px] text-zinc-400 font-mono">
              <div className="flex items-center justify-between">
                <span>Mover:</span>
                <span className="text-white bg-white/10 px-2 py-0.5 rounded border border-white/10">WASD / Setas</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pausa:</span>
                <span className="text-white bg-white/10 px-2 py-0.5 rounded border border-white/10">Espaço / P</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/5 flex gap-2">
              {isPlaying && !isGameOver && (
                <button
                  onClick={isPaused ? resumeGame : pauseGame}
                  className={cn(
                    "flex-1 py-2 rounded-xl font-black uppercase text-[9px] tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5 border",
                    isPaused 
                      ? "bg-cyan-500 border-cyan-400 text-black shadow-[0_0_12px_rgba(6,182,212,0.25)]" 
                      : "bg-white/5 border-white/10 text-zinc-300 hover:text-white"
                  )}
                >
                  {isPaused ? (
                    <>
                      <Play size={10} fill="currentColor" /> Retomar
                    </>
                  ) : (
                    <>
                      <span className="font-black text-[9px] leading-none">||</span> Pausar
                    </>
                  )}
                </button>
              )}

              {!isPlaying && !isGameOver && (
                <button
                  onClick={startGame}
                  className="w-full py-2 bg-[#d5ff40] text-black font-black uppercase text-[9px] tracking-wider rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(213,255,64,0.25)] flex items-center justify-center gap-1"
                >
                  <Play size={10} fill="currentColor" /> Jogar
                </button>
              )}
            </div>

            <button
              onClick={() => {
                playClickSound();
                document.getElementById('leaderboard-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 hover:text-white font-black uppercase text-[9px] tracking-wider rounded-xl transition-all active:scale-95 shadow-md flex items-center justify-center gap-1.5"
              type="button"
            >
              <Trophy size={10} className="text-yellow-500 animate-pulse" /> Ranking Global (Top 100)
            </button>
          </div>
        </div>

        {/* COLUNA CENTRAL (Canvas do Jogo + D-Pad no Mobile) */}
        <div className="flex flex-col items-center">
          
          {/* Cabeçalho Unificado Mobile (Oculto no Desktop) */}
          <div className="flex items-center justify-between w-full pb-2 px-3 max-w-[338px] md:hidden select-none">
            {gameMode === 'solo' ? (
              <div className="flex items-center gap-1.5 font-mono text-[9px] font-black uppercase tracking-wider">
                <span className="text-zinc-500">Lvl</span>
                <span className="text-purple-400">{level}</span>
                <span className="text-zinc-700">•</span>
                <span className="text-[#d5ff40]">{score} PTS</span>
                {comboMultiplier > 1.0 && (
                  <span className="text-orange-400 animate-pulse bg-orange-500/10 border border-orange-500/20 px-1 rounded text-[8px]">
                    x{comboMultiplier}
                  </span>
                )}
                <span className="text-zinc-700">•</span>
                <span className="text-zinc-500">Max</span>
                <span className="text-zinc-300">{highScore}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 font-mono text-[10px] font-black uppercase tracking-wider">
                <span className="text-[#d5ff40]">VC: {score}</span>
                <span className="text-zinc-700">VS</span>
                <span className="text-[#ff007f]">{opponentName || 'OPP'}: {opponentScore}</span>
                <span className="text-zinc-700">•</span>
                <span className="text-purple-400 text-[8px] bg-purple-950/20 px-1 rounded border border-purple-500/15">{roomCode}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              {gameMode === 'solo' && (
                <div className="flex items-center gap-1 select-none">
                  <span className={cn("text-[11px] transition-all", (score >= 500 || highScore >= 500) ? "opacity-100" : "opacity-20 grayscale")}>🥉</span>
                  <span className={cn("text-[11px] transition-all", (score >= 700 || highScore >= 700) ? "opacity-100" : "opacity-20 grayscale")}>🥈</span>
                  <span className={cn("text-[11px] transition-all", (score >= 1000 || highScore >= 1000) ? "opacity-100" : "opacity-20 grayscale")}>🥇</span>
                </div>
              )}
              
              <button
                onClick={() => {
                  playClickSound();
                  setIsMuted(prev => !prev);
                }}
                className="p-1 rounded bg-white/5 text-zinc-400 hover:text-white"
              >
                {isMuted ? <VolumeX size={10} /> : <Volume2 size={10} className="text-[#d5ff40]" />}
              </button>
            </div>
          </div>

          {/* Vidas Flutuantes (Mobile Only) */}
          <div className="relative w-full max-w-[338px] md:hidden">
            <div className={cn(
              "absolute flex items-center gap-1 z-10 select-none -bottom-[20px] left-2",
              justGainedLife && "animate-bounce"
            )}>
              <Heart
                className={cn(
                  "transition-all duration-300 text-red-500 fill-red-500",
                  lives === 0 && "text-zinc-600 fill-transparent",
                  justGainedLife && "animate-pulse text-red-400 fill-red-400"
                )}
                size={12}
              />
              <span className="font-mono text-[9px] font-black text-red-500">
                {lives > 0 ? `x${lives}` : 'Sem Vidas'}
              </span>
            </div>
          </div>

          {/* Canvas do Jogo com Moldura Cyberpunk Glow */}
          <div 
            className="relative border overflow-hidden bg-[#070708] rounded-2xl transition-all duration-500 shadow-xl border-white/5"
            style={{
              borderColor: `${snakeColor}30`,
              boxShadow: `0 0 35px ${snakeColor}0c`
            }}
          >
            <canvas
              ref={canvasRef}
              width={800}
              height={560}
              className="block w-full max-w-[338px] md:max-w-none md:w-[800px] md:h-[560px] h-auto touch-none"
              style={{ imageRendering: 'pixelated' }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => { touchStartRef.current = null; }}
            />

            {/* Mute Flutuante (Desktop Only) */}
            <div className="absolute top-3 right-3 z-10 hidden md:block">
              <button
                onClick={() => {
                  playClickSound();
                  setIsMuted(prev => !prev);
                }}
                className="p-2 rounded-xl bg-black/60 border border-white/10 text-zinc-400 hover:text-white transition-all backdrop-blur-md hover:bg-black/80"
                title={isMuted ? "Ativar som" : "Desativar som"}
              >
                {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} className="text-[#d5ff40]" />}
              </button>
            </div>

            {/* Overlay de Pausa */}
            {isPlaying && isPaused && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-4 px-4 text-center z-10 animate-in fade-in duration-200">
                <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 animate-pulse shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                  <span className="font-mono text-lg font-black tracking-tighter">||</span>
                </div>
                <div>
                  <h4 className="font-black text-sm text-white uppercase tracking-tight">Jogo Pausado</h4>
                  <p className="text-[9.5px] text-zinc-400 mt-1 leading-relaxed">
                    Pressione Espaço ou use o botão abaixo para retomar a partida.
                  </p>
                </div>
                <button
                  onClick={resumeGame}
                  className="px-6 py-2.5 bg-cyan-500 text-black font-black uppercase text-[10px] tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-1.5"
                >
                  <Play size={12} fill="currentColor" /> Retomar Partida
                </button>
              </div>
            )}

            {/* Contagem Regressiva PvP */}
            {countdown !== null && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30 animate-in fade-in duration-200">
                <div className="text-8xl font-black font-mono text-[#d5ff40] drop-shadow-[0_0_30px_rgba(213,255,64,0.7)] animate-pulse">
                  {countdown}
                </div>
                <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest mt-6">
                  PREPARE-SE!
                </span>
              </div>
            )}

            {/* Overlay de Início */}
            {!isPlaying && !isGameOver && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-4 px-4 text-center z-10 overflow-y-auto no-scrollbar">
                {gameMode === 'solo' ? (
                  <>
                    <div className="w-12 h-12 rounded-full bg-[#d5ff40]/10 border border-[#d5ff40]/30 flex items-center justify-center text-[#d5ff40] animate-bounce">
                      <Trophy size={22} className="neon-glow" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-white uppercase tracking-tight">Desafio Secreto</h4>
                      <p className="text-[9.5px] text-zinc-400 mt-1 leading-relaxed max-w-[240px]">
                        Desvie dos obstáculos e colete as frutas especiais para bater recordes interlojas!
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 w-full max-w-[200px]">
                      <button
                        onClick={startGame}
                        className="w-full py-2.5 bg-[#d5ff40] text-black font-black uppercase text-[10px] tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(213,255,64,0.3)] flex items-center justify-center gap-1.5"
                      >
                        <Play size={12} fill="currentColor" /> Iniciar Partida
                      </button>
                      <button
                        onClick={() => {
                          playClickSound();
                          setGameMode('pvp');
                          setPvpStateWithRef('lobby');
                        }}
                        className="w-full py-2.5 bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-wider rounded-xl hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Users size={12} /> Arena PVP Online
                      </button>
                    </div>
                  </>
                ) : (
                  // Lógica do Lobby PvP
                  <div className="w-full max-w-[260px] space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    {pvpState === 'lobby' && (
                      <>
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 animate-pulse mx-auto">
                          <Users size={22} />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-white uppercase tracking-tight">Arena PVP Online</h4>
                          <p className="text-[9px] text-zinc-400 mt-1 leading-relaxed">
                            Desafie outro jogador em tempo real! Quem colidir no corpo do outro ou na borda perde.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                          <button
                            onClick={() => {
                              playClickSound();
                              const code = generateRoomCode();
                              initPvpChannel(code, true);
                            }}
                            className="w-full py-2.5 bg-purple-600 border border-purple-500 text-white font-black uppercase text-[10px] tracking-wider rounded-xl hover:bg-purple-500 active:scale-95 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center justify-center gap-1.5"
                          >
                            <Plus size={12} /> Criar Nova Arena
                          </button>
                          <button
                            onClick={() => {
                              playClickSound();
                              setPvpStateWithRef('joining');
                              setInputCode('');
                            }}
                            className="w-full py-2.5 bg-white/5 border border-white/10 text-zinc-300 font-black uppercase text-[10px] tracking-wider rounded-xl hover:bg-white/10 active:scale-95 transition-all"
                          >
                            Entrar em Arena
                          </button>
                          <button
                            onClick={() => {
                              playClickSound();
                              setGameMode('solo');
                            }}
                            className="w-full py-2 text-zinc-500 hover:text-zinc-400 font-mono text-[9px] uppercase tracking-widest transition-colors mt-1"
                          >
                            Voltar para Modo Solo
                          </button>
                        </div>
                      </>
                    )}

                    {pvpState === 'creating' && (
                      <>
                        <div className="space-y-1">
                          <span className="text-[8px] font-black uppercase text-purple-400 tracking-widest">Código da Arena</span>
                          <h2 className="text-3xl font-mono font-black text-white bg-purple-950/20 border border-purple-500/20 py-2 rounded-xl tracking-widest text-center shadow-[0_0_15px_rgba(168,85,247,0.1)] uppercase selection:bg-purple-500/30">
                            {roomCode}
                          </h2>
                          <p className="text-[8.5px] text-zinc-500 leading-normal pt-1">
                            Compartilhe o código acima com o adversário. O jogo iniciará assim que ele entrar.
                          </p>
                        </div>
                        <div className="pt-2 flex flex-col items-center gap-3">
                          <div className="flex items-center gap-2 text-[9px] font-mono font-black uppercase tracking-wider text-purple-400 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                            Aguardando oponente...
                          </div>
                          <button
                            onClick={() => {
                              playClickSound();
                              if (channelRef.current) {
                                supabase.removeChannel(channelRef.current);
                                channelRef.current = null;
                              }
                              setPvpStateWithRef('lobby');
                            }}
                            className="px-4 py-1.5 bg-white/5 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all"
                          >
                            Cancelar
                          </button>
                        </div>
                      </>
                    )}

                    {pvpState === 'joining' && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (inputCode.trim().length === 6) {
                            playClickSound();
                            initPvpChannel(inputCode.trim().toUpperCase(), false);
                          }
                        }}
                        className="space-y-4 text-center"
                      >
                        <div>
                          <h4 className="font-black text-sm text-white uppercase tracking-tight">Digitar Código</h4>
                          <p className="text-[9px] text-zinc-400 mt-1">Insira o código de 6 caracteres fornecido pelo host.</p>
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="ABC123"
                          value={inputCode}
                          onChange={(e) => setInputCode(e.target.value.toUpperCase().slice(0, 6))}
                          className="w-full px-4 py-2.5 text-center text-base font-black font-mono tracking-widest uppercase bg-white/5 border border-white/10 rounded-xl focus:border-purple-500 focus:outline-none text-white focus:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              playClickSound();
                              setPvpStateWithRef('lobby');
                            }}
                            className="flex-1 py-2 bg-white/5 border border-white/10 text-zinc-400 font-black uppercase text-[9px] tracking-wider rounded-xl active:scale-95 transition-all"
                          >
                            Voltar
                          </button>
                          <button
                            type="submit"
                            disabled={inputCode.trim().length !== 6}
                            className="flex-1 py-2 bg-purple-600 border border-purple-500 text-white font-black uppercase text-[9px] tracking-wider rounded-xl disabled:opacity-40 active:scale-95 transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                          >
                            Conectar
                          </button>
                        </div>
                      </form>
                    )}

                    {pvpState === 'waiting' && (
                      <div className="space-y-4">
                        <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mx-auto animate-spin">
                          <Users size={18} />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-white uppercase tracking-tight">Conectando...</h4>
                          <p className="text-[9px] text-zinc-500 mt-1 leading-normal">
                            Estabelecendo conexão segura com a arena {roomCode}...
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            playClickSound();
                            if (channelRef.current) {
                              supabase.removeChannel(channelRef.current);
                              channelRef.current = null;
                            }
                            setPvpStateWithRef('lobby');
                          }}
                          className="px-4 py-2 bg-white/5 border border-white/10 text-zinc-400 rounded-xl text-[9px] font-black uppercase tracking-wider"
                        >
                          Cancelar Conexão
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Overlay de Game Over */}
            {isGameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-4 px-4 text-center overflow-y-auto no-scrollbar">
                {gameMode === 'solo' ? (
                  <>
                    <div>
                      <span className="text-[8.5px] font-black uppercase tracking-widest text-red-500">Fim de Jogo</span>
                      <h4 className="font-black text-base text-white uppercase tracking-tight mt-0.5">Pontuação: {score}</h4>
                    </div>

                    {checkIsTop10(score) && !scoreSaved ? (
                      <form onSubmit={handleSaveScore} className="flex flex-col gap-2 w-full max-w-[200px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <span className="text-[8px] font-black uppercase text-zinc-500 tracking-wider">Entrou no Top 10! Iniciais:</span>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            required
                            maxLength={3}
                            placeholder="AAA"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value.slice(0, 3).toUpperCase())}
                            className="flex-1 px-3 py-2 text-center text-xs font-black font-mono tracking-widest uppercase bg-white/5 border border-white/10 rounded-xl focus:border-[#d5ff40] focus:outline-none text-white"
                          />
                          <button
                            type="submit"
                            disabled={isSavingScore || playerName.length !== 3}
                            className="px-4 py-2 bg-[#d5ff40] text-black text-[9px] font-black uppercase tracking-wider rounded-xl disabled:opacity-50 disabled:scale-100 active:scale-95 transition-all shadow-[0_0_10px_rgba(213,255,64,0.2)]"
                          >
                            {isSavingScore ? '...' : 'Gravar'}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 select-none">
                        {scoreSaved ? (
                          <span className="text-[9px] font-black uppercase text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 rounded-full animate-pulse">
                            Recorde Gravado!
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wide max-w-[220px] leading-relaxed">
                            {score < 50
                              ? 'Pontuação mínima para o ranking é 50 pts.'
                              : `Faça mais de ${ranking[ranking.length - 1]?.score || 0} pts para entrar no Top 10!`}
                          </span>
                        )}
                      </div>
                    )}

                    <button
                      onClick={startGame}
                      className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white font-black uppercase text-[9px] tracking-wider rounded-xl active:scale-95 transition-all flex items-center gap-1.5 border border-white/10"
                    >
                      <RotateCcw size={10} /> Jogar Novamente
                    </button>
                  </>
                ) : (
                  // Overlay de Fim de Jogo no PVP
                  <>
                    <div>
                      {score > opponentScore ? (
                        <>
                          <span className="text-[9px] font-black uppercase tracking-widest text-[#d5ff40] border border-[#d5ff40]/20 bg-[#d5ff40]/10 px-3 py-1 rounded-full animate-bounce inline-block">
                            🏆 VITÓRIA!
                          </span>
                          <h4 className="font-black text-sm text-zinc-400 uppercase tracking-tight mt-3">Você venceu a partida!</h4>
                        </>
                      ) : score < opponentScore ? (
                        <>
                          <span className="text-[9px] font-black uppercase tracking-widest text-red-500 border border-red-500/20 bg-red-500/10 px-3 py-1 rounded-full animate-pulse inline-block">
                            💥 DERROTA
                          </span>
                          <h4 className="font-black text-sm text-zinc-400 uppercase tracking-tight mt-3">Você colidiu ou pontuou menos!</h4>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500 border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 rounded-full inline-block">
                            🤝 EMPATE
                          </span>
                          <h4 className="font-black text-sm text-zinc-400 uppercase tracking-tight mt-3">Partida empatada!</h4>
                        </>
                      )}
                    </div>

                    <div className="bg-white/2 border border-white/5 rounded-xl p-3 w-full max-w-[220px] font-mono text-[10px] space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Sua Pontuação:</span>
                        <span className="text-[#d5ff40] font-black">{score} pts</span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-1.5">
                        <span className="text-zinc-500">Oponente ({opponentName || 'OPP'}):</span>
                        <span className="text-[#ff007f] font-black">{opponentScore} pts</span>
                      </div>
                    </div>

                    {isHost ? (
                      <button
                        onClick={() => startPvpGameplay(true)}
                        className="px-6 py-2.5 bg-purple-600 border border-purple-500 text-white font-black uppercase text-[10px] tracking-wider rounded-xl active:scale-95 transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] flex items-center gap-1.5"
                      >
                        <RotateCcw size={10} /> Reiniciar Partida (Host)
                      </button>
                    ) : (
                      <div className="text-[9px] font-mono font-black text-purple-400 animate-pulse bg-purple-500/10 border border-purple-500/20 px-3 py-2 rounded-xl">
                        Aguardando o Host reiniciar a partida...
                      </div>
                    )}

                    <button
                      onClick={() => {
                        playClickSound();
                        if (channelRef.current) {
                          supabase.removeChannel(channelRef.current);
                          channelRef.current = null;
                        }
                        setGameMode('solo');
                        setIsGameOver(false);
                      }}
                      className="px-4 py-1.5 bg-white/5 border border-white/10 text-zinc-500 hover:text-zinc-400 text-[9px] font-black uppercase rounded-xl active:scale-95 transition-all mt-2"
                    >
                      Sair da Arena
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Overlay do Ranking Global no Mobile (Oculto no Desktop) */}
            {isLeaderboardOpen && (
              <div className="absolute inset-0 bg-black/95 flex flex-col p-4 text-left animate-in fade-in duration-200 z-20 md:hidden">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-yellow-500 flex items-center gap-1.5">
                    <Trophy size={12} className="text-yellow-500 animate-pulse" /> Classificação Global (Top 100)
                  </h4>
                  <button
                    onClick={() => {
                      playClickSound();
                      setIsLeaderboardOpen(false);
                    }}
                    className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white font-black text-xs transition-colors"
                    type="button"
                  >
                    ✕
                  </button>
                </div>

                {isLoadingRanking ? (
                  <div className="space-y-1.5 flex-1">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="h-7 bg-white/5 border border-white/5 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : ranking.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 text-center py-6 flex-1 flex items-center justify-center">Sem recordes. Seja o primeiro!</p>
                ) : (
                  <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {ranking.slice(0, 100).map((entry, index) => {
                      const colors = [
                        'text-yellow-500 border-yellow-500/20 bg-yellow-500/5',
                        'text-zinc-300 border-zinc-500/20 bg-zinc-500/5',
                        'text-amber-600 border-amber-600/20 bg-amber-600/5'
                      ];
                      const isPodium = index < 3;
                      return (
                        <div
                          key={entry.id}
                          className={cn(
                            "flex items-center justify-between text-xs p-2 px-2.5 rounded-lg border",
                            isPodium ? colors[index] : 'border-white/5 bg-white/2'
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono font-black w-3">{index + 1}</span>
                            <span className="font-mono font-black uppercase text-white bg-white/10 px-1.5 rounded">{entry.playerName}</span>
                          </div>
                          <span className="font-mono font-black">{entry.score} pts</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Overlay de Recompensas no Mobile (Oculto no Desktop) */}
            {isRewardsOpen && (
              <div className="absolute inset-0 bg-black/95 flex flex-col p-4 text-left animate-in fade-in duration-200 z-20 md:hidden">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Gift size={12} className="text-primary animate-pulse" /> Recompensas do Desafio
                  </h4>
                  <button
                    onClick={() => {
                      playClickSound();
                      setIsRewardsOpen(false);
                    }}
                    className="w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white font-black text-xs transition-colors"
                    type="button"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent text-xs">
                  <p className="text-zinc-400 text-[10px] mb-2 leading-relaxed">
                    Atinja as marcas de pontuação para destravar benefícios automáticos:
                  </p>

                  <div className="flex items-center justify-between p-2 rounded-lg border border-amber-700/30 bg-amber-900/10">
                    <div className="flex items-center gap-2">
                      <span>🥉</span>
                      <div>
                        <span className="font-mono font-black text-amber-600 block text-[10px]">500 pts</span>
                        <p className="text-zinc-400 text-[9px]">Medalha Bronze no Perfil</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg border border-zinc-400/20 bg-zinc-400/5">
                    <div className="flex items-center gap-2">
                      <span>🥈</span>
                      <div>
                        <span className="font-mono font-black text-zinc-300 block text-[10px]">700 pts</span>
                        <p className="text-zinc-400 text-[9px]">Medalha Prata no Perfil</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg border border-yellow-500/25 bg-yellow-500/5">
                    <div className="flex items-center gap-2">
                      <span>🥇</span>
                      <div>
                        <span className="font-mono font-black text-yellow-400 block text-[10px]">1000 pts</span>
                        <p className="text-zinc-300 text-[9px] font-bold">Medalha Ouro de Mestre</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BARRAS DE POWERUPS E COMBO (Alinhado com a largura do Canvas: 338px no mobile, 800px no desktop) */}
          <div className="w-full space-y-2 px-1 max-w-[338px] md:max-w-none md:w-[800px] mt-3 select-none">
            {/* Combo Timer */}
            {comboTimer > 0 && comboMultiplier > 1.0 && (
              <div className="flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-[8.5px] font-black uppercase text-orange-400 leading-none">
                  <span className="flex items-center gap-1">⚡ COMBO MULTIPLIER X{comboMultiplier}</span>
                  <span>{(comboTimer / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-100 ease-linear shadow-[0_0_6px_#f97316]" 
                    style={{ width: `${(comboTimer / 3000) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Slow Time Left */}
            {slowTimeLeft > 0 && (
              <div className="flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-[8.5px] font-black uppercase text-cyan-400 leading-none">
                  <span className="flex items-center gap-1">❄️ CÂMERA LENTA</span>
                  <span>{(slowTimeLeft / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-cyan-500 transition-all duration-100 ease-linear shadow-[0_0_6px_#06b6d4]" 
                    style={{ width: `${(slowTimeLeft / 5000) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Star Time Left */}
            {starTimeLeft > 0 && (
              <div className="flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-[8.5px] font-black uppercase text-yellow-400 leading-none">
                  <span className="flex items-center gap-1">⭐ VELOCIDADE REDUZIDA</span>
                  <span>{(starTimeLeft / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-yellow-400 transition-all duration-100 ease-linear shadow-[0_0_6px_#eab308]" 
                    style={{ width: `${(starTimeLeft / 7000) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Slug Time Left */}
            {slugTimeLeft > 0 && (
              <div className="flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-[8.5px] font-black uppercase text-emerald-400 leading-none">
                  <span className="flex items-center gap-1">🐌 LENTIDÃO DA LESMA (Lvl 4)</span>
                  <span>{(slugTimeLeft / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-100 ease-linear shadow-[0_0_6px_#10b981]" 
                    style={{ width: `${(slugTimeLeft / 8000) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Banana Time Left */}
            {bananaTimeLeft > 0 && (
              <div className="flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-[8.5px] font-black uppercase text-yellow-500 leading-none">
                  <span className="flex items-center gap-1">🍌 LENTIDÃO DA BANANA</span>
                  <span>{(bananaTimeLeft / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-yellow-500 transition-all duration-100 ease-linear shadow-[0_0_6px_#eab308]" 
                    style={{ width: `${(bananaTimeLeft / 6000) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Singularity Time Left */}
            {singularityTimeLeft > 0 && (
              <div className="flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-[8.5px] font-black uppercase text-purple-400 leading-none">
                  <span className="flex items-center gap-1">🌌 ÍMÃ DE SINGULARIDADE</span>
                  <span>{(singularityTimeLeft / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-100 ease-linear shadow-[0_0_6px_#a855f7]" 
                    style={{ width: `${(singularityTimeLeft / 7000) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Ghost Time Left */}
            {ghostTimeLeft > 0 && (
              <div className="flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-[8.5px] font-black uppercase text-zinc-300 leading-none">
                  <span className="flex items-center gap-1">👻 MODO FANTASMA</span>
                  <span>{(ghostTimeLeft / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-zinc-300 transition-all duration-100 ease-linear shadow-[0_0_6px_#e4e4e7]" 
                    style={{ width: `${(ghostTimeLeft / 6000) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Paradox Time Left */}
            {paradoxTimeLeft > 0 && (
              <div className="flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-[8.5px] font-black uppercase text-pink-400 leading-none">
                  <span className="flex items-center gap-1">⏳ RETORNO DE PARADOXO</span>
                  <span>{(paradoxTimeLeft / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-pink-500 transition-all duration-100 ease-linear shadow-[0_0_6px_#ec4899]" 
                    style={{ width: `${(paradoxTimeLeft / 8000) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Shield Time Left */}
            {shieldTimeLeft > 0 && (
              <div className="flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-[8.5px] font-black uppercase text-blue-400 leading-none">
                  <span className="flex items-center gap-1">🛡️ ESCUDO DE PLASMA</span>
                  <span>{(shieldTimeLeft / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-100 ease-linear shadow-[0_0_6px_#3b82f6]" 
                    style={{ width: `${(shieldTimeLeft / 7000) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Clone Time Left */}
            {cloneTimeLeft > 0 && (
              <div className="flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-[8.5px] font-black uppercase text-cyan-400 leading-none">
                  <span className="flex items-center gap-1">👥 CLONE HOLOGRÁFICO</span>
                  <span>{(cloneTimeLeft / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-cyan-400 transition-all duration-100 ease-linear shadow-[0_0_6px_#06b6d4]" 
                    style={{ width: `${(cloneTimeLeft / 8000) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Chili Time Left */}
            {chiliTimeLeft > 0 && (
              <div className="flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-[8.5px] font-black uppercase text-red-500 leading-none">
                  <span className="flex items-center gap-1">🌶️ VELOCIDADE CHILI DE FOGO</span>
                  <span>{(chiliTimeLeft / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-red-600 transition-all duration-100 ease-linear shadow-[0_0_6px_#ef4444]" 
                    style={{ width: `${(chiliTimeLeft / 5000) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Invert Time Left */}
            {invertTimeLeft > 0 && (
              <div className="flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-[8.5px] font-black uppercase text-emerald-400 leading-none">
                  <span className="flex items-center gap-1">🔄 CONTROLES INVERTIDOS (+80 PTS!)</span>
                  <span>{(invertTimeLeft / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-100 ease-linear shadow-[0_0_6px_#10b981]" 
                    style={{ width: `${(invertTimeLeft / 6000) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Gluttony Time Left */}
            {gluttonyTimeLeft > 0 && (
              <div className="flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-[8.5px] font-black uppercase text-yellow-500 leading-none">
                  <span className="flex items-center gap-1">🤤 MODO COMILÃO</span>
                  <span>{(gluttonyTimeLeft / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-yellow-400 transition-all duration-100 ease-linear shadow-[0_0_6px_#eab308]" 
                    style={{ width: `${(gluttonyTimeLeft / 6000) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Quantum Time Left */}
            {quantumTimeLeft > 0 && (
              <div className="flex flex-col gap-0.5 animate-in slide-in-from-top-1 duration-200">
                <div className="flex justify-between text-[8.5px] font-black uppercase text-teal-400 leading-none">
                  <span className="flex items-center gap-1">⚛️ ENTRELAÇAMENTO QUANTUM</span>
                  <span>{(quantumTimeLeft / 1000).toFixed(1)}s</span>
                </div>
                <div className="h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-teal-500 transition-all duration-100 ease-linear shadow-[0_0_6px_#14b8a6]" 
                    style={{ width: `${(quantumTimeLeft / 8000) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ranking e Recompensas lado a lado abaixo do Canvas (Desktop Only - a partir de md) */}
          <div className="hidden md:grid grid-cols-2 gap-4 w-[800px] mt-5">
            {/* Card de Ranking */}
            <div id="leaderboard-section" className="glass-card p-4 flex flex-col border-white/5 bg-[#0a0a0c]/60 rounded-2xl shadow-lg h-[240px] overflow-hidden">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-yellow-500 flex items-center gap-1.5 border-b border-white/5 pb-2 mb-2">
                <Trophy size={11} className="text-yellow-500 animate-pulse" /> Classificação Global (Top 100)
              </h4>

              {isLoadingRanking ? (
                <div className="space-y-1.5 flex-1 justify-center flex flex-col">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-7 bg-white/5 border border-white/5 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : ranking.length === 0 ? (
                <p className="text-[9px] text-zinc-500 text-center py-6 flex-1 flex items-center justify-center">Sem recordes salvos.</p>
              ) : (
                <div className="space-y-1 overflow-y-auto flex-1 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {ranking.slice(0, 100).map((entry, index) => {
                    const colors = [
                      'text-yellow-500 border-yellow-500/20 bg-yellow-500/5',
                      'text-zinc-300 border-zinc-500/20 bg-zinc-500/5',
                      'text-amber-600 border-amber-600/20 bg-amber-600/5'
                    ];
                    const isPodium = index < 3;
                    return (
                      <div
                        key={entry.id}
                        className={cn(
                          "flex items-center justify-between text-[10px] p-1.5 px-2 rounded-lg border",
                          isPodium ? colors[index] : 'border-white/5 bg-white/2'
                        )}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-mono font-black w-3 text-center">{index + 1}</span>
                          <span className="font-mono font-black uppercase text-white bg-white/10 px-1 rounded text-[9px]">{entry.playerName}</span>
                        </div>
                        <span className="font-mono font-black">{entry.score} pts</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Card de Recompensas */}
            <div className="glass-card p-4 border-white/5 bg-[#0a0a0c]/60 rounded-2xl shadow-lg h-[240px]">
              <h4 className="text-[9px] font-black uppercase tracking-widest text-[#d5ff40] flex items-center gap-1.5 border-b border-white/5 pb-2 mb-2">
                <Gift size={11} className="text-[#d5ff40]" /> Benefícios do Desafio
              </h4>
              
              <div className="space-y-2 text-[10px] pt-1">
                <div className="flex items-center gap-2 p-1.5 rounded-xl border border-amber-700/20 bg-amber-950/10">
                  <span className="text-base">🥉</span>
                  <div>
                    <span className="font-mono font-black text-amber-600 block leading-none">500 pts</span>
                    <span className="text-zinc-400 text-[8.5px]">Medalha Bronze no Perfil</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-1.5 rounded-xl border border-zinc-400/15 bg-zinc-500/5">
                  <span className="text-base">🥈</span>
                  <div>
                    <span className="font-mono font-black text-zinc-300 block leading-none">700 pts</span>
                    <span className="text-zinc-400 text-[8.5px]">Medalha Prata no Perfil</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-1.5 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
                  <span className="text-base">🥇</span>
                  <div>
                    <span className="font-mono font-black text-yellow-400 block leading-none">1000 pts</span>
                    <span className="text-zinc-300 text-[8.5px] font-bold">Medalha Ouro de Mestre</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* D-Pad Virtual e Botões do Mobile (Mobile Only - Oculto no Desktop) */}
          <div className="flex md:hidden items-center justify-center w-full max-w-[338px] select-none mt-4">
            <div className="grid grid-cols-3 gap-1.5 w-fit justify-items-center select-none touch-manipulation">
              {/* Linha 1 */}
              {!isPlaying ? (
                <button
                  onClick={() => {
                    playClickSound();
                    setIsLeaderboardOpen(true);
                  }}
                  className="w-[68px] h-[58px] bg-zinc-900 border border-zinc-800 rounded-2xl active:bg-zinc-800 active:border-[#d5ff40]/40 flex flex-col items-center justify-center text-yellow-500 hover:text-yellow-400 transition-colors shadow-md active:scale-95 cursor-pointer"
                  type="button"
                >
                  <Trophy size={16} className="mb-0.5 text-yellow-500" />
                  <span className="text-[9px] font-black uppercase tracking-wider">Ranking</span>
                </button>
              ) : (
                <div className="w-[68px] h-[58px]" />
              )}

              <button
                onMouseDown={(e) => handleButtonPress('UP', e)}
                onMouseUp={(e) => handleButtonRelease('UP', e)}
                onMouseLeave={(e) => handleButtonRelease('UP', e)}
                onTouchStart={(e) => handleButtonPress('UP', e)}
                onTouchEnd={(e) => handleButtonRelease('UP', e)}
                onTouchCancel={(e) => handleButtonRelease('UP', e)}
                style={
                  activeButton === 'UP'
                    ? {
                      borderColor: snakeColor,
                      boxShadow: `0 0 12px ${snakeColor}`,
                      color: snakeColor,
                      transform: 'scale(0.95)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)'
                    }
                    : {}
                }
                className="w-[68px] h-[58px] bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 transition-all shadow-md select-none touch-manipulation"
                aria-label="Cima"
              >
                <ChevronUp size={30} className="transition-transform" />
              </button>

              {!isPlaying ? (
                <button
                  onClick={() => {
                    playClickSound();
                    setIsRewardsOpen(true);
                  }}
                  className="w-[68px] h-[58px] bg-zinc-900 border border-zinc-800 rounded-2xl active:bg-zinc-800 active:border-[#d5ff40]/40 flex flex-col items-center justify-center text-[#d5ff40] hover:text-[#d5ff40]/95 transition-colors shadow-md active:scale-95 cursor-pointer"
                  type="button"
                >
                  <Gift size={16} className="mb-0.5 text-[#d5ff40] animate-pulse" />
                  <span className="text-[7.5px] font-black uppercase tracking-tighter leading-none text-center">Prêmios</span>
                </button>
              ) : (
                <div className="w-[68px] h-[58px]" />
              )}

              {/* Linha 2 */}
              <button
                onMouseDown={(e) => handleButtonPress('LEFT', e)}
                onMouseUp={(e) => handleButtonRelease('LEFT', e)}
                onMouseLeave={(e) => handleButtonRelease('LEFT', e)}
                onTouchStart={(e) => handleButtonPress('LEFT', e)}
                onTouchEnd={(e) => handleButtonRelease('LEFT', e)}
                onTouchCancel={(e) => handleButtonRelease('LEFT', e)}
                style={
                  activeButton === 'LEFT'
                    ? {
                      borderColor: snakeColor,
                      boxShadow: `0 0 12px ${snakeColor}`,
                      color: snakeColor,
                      transform: 'scale(0.95)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)'
                    }
                    : {}
                }
                className="w-[68px] h-[58px] bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 transition-all shadow-md select-none touch-manipulation"
                aria-label="Esquerda"
              >
                <ChevronLeft size={30} className="transition-transform" />
              </button>

              {/* Pivô Central Físico */}
              <div className="w-[68px] h-[58px] bg-zinc-950/40 border border-zinc-900/30 rounded-2xl flex items-center justify-center text-zinc-600 font-bold text-xs pointer-events-none select-none">
                •
              </div>

              <button
                onMouseDown={(e) => handleButtonPress('RIGHT', e)}
                onMouseUp={(e) => handleButtonRelease('RIGHT', e)}
                onMouseLeave={(e) => handleButtonRelease('RIGHT', e)}
                onTouchStart={(e) => handleButtonPress('RIGHT', e)}
                onTouchEnd={(e) => handleButtonRelease('RIGHT', e)}
                onTouchCancel={(e) => handleButtonRelease('RIGHT', e)}
                style={
                  activeButton === 'RIGHT'
                    ? {
                      borderColor: snakeColor,
                      boxShadow: `0 0 12px ${snakeColor}`,
                      color: snakeColor,
                      transform: 'scale(0.95)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)'
                    }
                    : {}
                }
                className="w-[68px] h-[58px] bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 transition-all shadow-md select-none touch-manipulation"
                aria-label="Direita"
              >
                <ChevronRight size={30} className="transition-transform" />
              </button>

              {/* Linha 3 */}
              <div className="w-[68px] h-[58px]" />

              <button
                onMouseDown={(e) => handleButtonPress('DOWN', e)}
                onMouseUp={(e) => handleButtonRelease('DOWN', e)}
                onMouseLeave={(e) => handleButtonRelease('DOWN', e)}
                onTouchStart={(e) => handleButtonPress('DOWN', e)}
                onTouchEnd={(e) => handleButtonRelease('DOWN', e)}
                onTouchCancel={(e) => handleButtonRelease('DOWN', e)}
                style={
                  activeButton === 'DOWN'
                    ? {
                      borderColor: snakeColor,
                      boxShadow: `0 0 12px ${snakeColor}`,
                      color: snakeColor,
                      transform: 'scale(0.95)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)'
                    }
                    : {}
                }
                className="w-[68px] h-[58px] bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-400 transition-all shadow-md select-none touch-manipulation"
                aria-label="Baixo"
              >
                <ChevronDown size={30} className="transition-transform" />
              </button>

              <div className="w-[68px] h-[58px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
