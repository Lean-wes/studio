"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, ArrowRight, Rocket, Gem, Gift, Lock, PartyPopper, Play, X, Tv, Star, Medal, RotateCw } from "lucide-react";

import SpaceBackground from "@/components/game/space-background";
import { rewards as rewardData, type Reward } from "@/lib/rewards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";

type GameState = "start" | "playing" | "reward" | "video" | "gameOver" | "ad";

type Player = {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityY: number;
  velocityX: number;
};

type Platform = {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "normal" | "moving" | "breakable";
  color: string;
  velocityX: number;
  broken: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

const ROCKET_EMOJI = '🚀';
const FIRE_EMOJI = '🔥';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>("start");
  const [score, setScore] = useState(0);
  const [gems, setGems] = useState(0);
  const [level, setLevel] = useState(1);
  const [player, setPlayer] = useState<Player>({ x: 0, y: 0, width: 40, height: 40, velocityY: 0, velocityX: 0 });
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [currentReward, setCurrentReward] = useState<Reward | null>(null);
  const [nextRewardIndex, setNextRewardIndex] = useState(0);

  const keys = useRef<{ [key: string]: boolean }>({});
  const animationFrameId = useRef<number>();
  const lastTime = useRef<number>(0);
  const gameDimensions = useRef({ width: 0, height: 0 });
  
  const platformConfig = { width: 80, height: 15, gap: 120 };

  const initializeGame = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    gameDimensions.current = { width, height };

    if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
    }

    const initialPlayer: Player = {
      x: width / 2,
      y: height - 150,
      width: 40,
      height: 40,
      velocityY: 0,
      velocityX: 0,
    };
    setPlayer(initialPlayer);

    const initialPlatforms: Platform[] = [];
    initialPlatforms.push({
      x: width / 2 - platformConfig.width / 2,
      y: height - 100,
      width: platformConfig.width,
      height: platformConfig.height,
      type: 'normal',
      color: '#96ceb4',
      velocityX: 0,
      broken: false,
    });

    for (let i = 1; i < 15; i++) {
        const y = height - 100 - (i * platformConfig.gap);
        initialPlatforms.push(generatePlatform(y, width));
    }
    setPlatforms(initialPlatforms);
    setScore(0);
    setLevel(1);
    setNextRewardIndex(0);
    setCurrentReward(null);

  }, [platformConfig.width, platformConfig.height, platformConfig.gap]);

  const generatePlatform = (y: number, width: number): Platform => {
    const type: Platform['type'] = Math.random() > 0.8 ? (Math.random() > 0.5 ? 'moving' : 'breakable') : 'normal';
    return {
      x: Math.random() * (width - platformConfig.width),
      y,
      width: platformConfig.width,
      height: platformConfig.height,
      type,
      color: type === 'normal' ? '#96ceb4' : type === 'moving' ? '#ffd700' : '#ff6b6b',
      velocityX: type === 'moving' ? (Math.random() > 0.5 ? 2 : -2) : 0,
      broken: false,
    };
  }

  useEffect(() => {
    setGems(parseInt(localStorage.getItem('astroLeapGems') || '0'));
    initializeGame();

    const handleResize = () => initializeGame();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, [initializeGame]);

  const startGame = () => {
    initializeGame();
    setGameState("playing");
  };
  
  const restartGame = () => {
    startGame();
  }

  const continueGame = () => {
    setGameState("playing");
  };

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = 'rgba(15, 12, 41, 0.3)';
    ctx.fillRect(0, 0, gameDimensions.current.width, gameDimensions.current.height);

    platforms.forEach(p => {
        if (p.broken) return;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(p.x, p.y, p.width, 3);
    });

    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });

    ctx.save();
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ROCKET_EMOJI, player.x, player.y);
    if (player.velocityY < -1) {
        ctx.font = '20px sans-serif';
        ctx.fillText(FIRE_EMOJI, player.x, player.y + 30);
    }
    ctx.restore();

  }, [player, platforms, particles]);

  const createParticles = (x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 5; i++) {
        newParticles.push({
            x, y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1, color
        });
    }
    setParticles(prev => [...prev, ...newParticles]);
  }

  const update = useCallback(() => {
    let newPlayer = { ...player };
    newPlayer.velocityY += 0.5; // Gravity
    newPlayer.y += newPlayer.velocityY;
    newPlayer.x += newPlayer.velocityX;

    if (newPlayer.x < 0) newPlayer.x = gameDimensions.current.width;
    if (newPlayer.x > gameDimensions.current.width) newPlayer.x = 0;

    let newPlatforms = [...platforms];
    let newScore = score;
    let gemsToAdd = 0;
    
    if (newPlayer.velocityY > 0) {
        newPlatforms.forEach((p, index) => {
            if (
                !p.broken &&
                newPlayer.x + newPlayer.width / 2 > p.x &&
                newPlayer.x - newPlayer.width / 2 < p.x + p.width &&
                newPlayer.y + newPlayer.height / 2 > p.y &&
                newPlayer.y + newPlayer.height / 2 < p.y + p.height + 10
            ) {
                if (p.type === 'breakable') {
                    newPlatforms[index] = { ...p, broken: true };
                    createParticles(p.x + p.width / 2, p.y, '#ff6b6b');
                } else {
                    newPlayer.velocityY = -15;
                    createParticles(p.x + p.width / 2, p.y, '#fff');
                    gemsToAdd += 1;
                }
            }
        });
    }

    newPlatforms.forEach(p => {
        if (p.type === 'moving') {
            p.x += p.velocityX;
            if (p.x <= 0 || p.x + p.width >= gameDimensions.current.width) {
                p.velocityX *= -1;
            }
        }
    });

    if (newPlayer.y < gameDimensions.current.height / 2) {
        const diff = (gameDimensions.current.height / 2) - newPlayer.y;
        newScore += Math.floor(diff / 10);
        newPlayer.y = gameDimensions.current.height / 2;
        newPlatforms.forEach(p => p.y += diff);
    }
    
    setScore(newScore);
    if(gemsToAdd > 0) {
        setGems(prev => {
            const newGems = prev + gemsToAdd;
            localStorage.setItem('astroLeapGems', newGems.toString());
            return newGems;
        });
    }
    
    const nextReward = rewardData[nextRewardIndex];
    if (nextReward && newScore >= nextReward.scoreNeeded) {
        setCurrentReward(nextReward);
        setNextRewardIndex(prev => prev + 1);
        setGameState('reward');
    }

    const filteredPlatforms = newPlatforms.filter(p => p.y < gameDimensions.current.height);
    while (filteredPlatforms.length < 15) {
        const highestY = Math.min(...filteredPlatforms.map(p => p.y));
        filteredPlatforms.push(generatePlatform(highestY - platformConfig.gap, gameDimensions.current.width));
    }
    setPlatforms(filteredPlatforms);
    
    const updatedParticles = particles.map(p => ({
        ...p,
        x: p.x + p.vx,
        y: p.y + p.vy,
        life: p.life - 0.02
    })).filter(p => p.life > 0);
    setParticles(updatedParticles);

    if (newPlayer.y > gameDimensions.current.height) {
        setGameState("gameOver");
    } else {
        setPlayer(newPlayer);
    }
    
    setLevel(Math.floor(newScore / 1000) + 1);

  }, [player, platforms, score, particles, nextRewardIndex, platformConfig.gap]);

  const gameLoop = useCallback((timestamp: number) => {
    if (lastTime.current === 0) lastTime.current = timestamp;
    // const dt = timestamp - lastTime.current;
    lastTime.current = timestamp;

    update();
    draw();
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [update, draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let intervalId: NodeJS.Timeout;
    if (gameState === 'playing') {
      intervalId = setInterval(() => {
        let newVelocityX = 0;
        if (keys.current['ArrowLeft']) newVelocityX = -8;
        if (keys.current['ArrowRight']) newVelocityX = 8;
        setPlayer(p => ({ ...p, velocityX: newVelocityX }));
      }, 1000 / 60);
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if(intervalId) clearInterval(intervalId);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === "playing") {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    } else {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameState, gameLoop]);


  const showRewardedAd = () => {
    setGameState("ad");
  };

  const closeRewardedAd = (addGems: boolean) => {
    if (addGems) {
      setGems(prev => {
        const newGems = prev + 100;
        localStorage.setItem('astroLeapGems', newGems.toString());
        return newGems;
      });
      if (currentReward) {
        setGameState("video");
      } else { // from game over screen
        setScore(s => s * 2);
        setGameState("gameOver");
      }
    } else {
       if (currentReward) {
        setGameState("reward");
      } else {
        setGameState("gameOver");
      }
    }
  };
  
  const handleTouchControl = (direction: 'left' | 'right' | 'stop') => {
      let newVelocityX = 0;
      if (direction === 'left') newVelocityX = -8;
      if (direction === 'right') newVelocityX = 8;
      setPlayer(p => ({ ...p, velocityX: newVelocityX }));
  };

  return (
    <main className="fixed inset-0 overflow-hidden bg-background text-foreground">
      <SpaceBackground />
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full opacity-90" />
      
      {gameState === "start" && (
        <StartScreen onStart={startGame} nextReward={rewardData[0]} />
      )}

      {gameState === "playing" && (
        <GameOverlay 
          score={score} 
          level={level} 
          nextRewardDist={rewardData[nextRewardIndex] ? Math.max(0, rewardData[nextRewardIndex].scoreNeeded - score) : 0}
          onLeftPress={() => handleTouchControl('left')}
          onRightPress={() => handleTouchControl('right')}
          onRelease={() => handleTouchControl('stop')}
        />
      )}

      <RewardDialog 
        open={gameState === 'reward'} 
        onOpenChange={(open) => { if (!open) continueGame(); }} 
        reward={currentReward} 
        onContinue={continueGame}
        onWatchAd={showRewardedAd}
      />
      
      <VideoDialog
        open={gameState === 'video'}
        onOpenChange={(open) => { if (!open) continueGame(); }}
        reward={currentReward}
      />

      <RewardedAdDialog
        open={gameState === 'ad'}
        onClose={closeRewardedAd}
      />

      <GameOverDialog
        open={gameState === 'gameOver'}
        score={score}
        gems={gems}
        onRestart={restartGame}
        onDoubleRewards={() => {
          setCurrentReward(null); // Ensure we know context is gameover
          showRewardedAd();
        }}
      />
    </main>
  );
}

const StartScreen = ({ onStart, nextReward }: { onStart: () => void; nextReward?: Reward }) => (
  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center animate-fade-in">
    <div className="relative">
      <h1 className="text-5xl md:text-7xl font-bold mb-2 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-gradient">
        Astro Leap
      </h1>
      <p className="text-lg md:text-xl text-muted-foreground mb-8">Jump higher, unlock epic rewards</p>
    </div>

    {nextReward && (
        <Card className="max-w-sm w-full bg-card/50 backdrop-blur-sm border-white/20 mb-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-center"><Gift className="w-5 h-5"/>Next Reward</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-muted-foreground/50 flex flex-col items-center justify-center bg-black/30">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                    <span className="text-sm mt-2 text-muted-foreground">Level {Math.floor(nextReward.scoreNeeded / 1000) + 1}</span>
                </div>
            </CardContent>
        </Card>
    )}

    <Button onClick={onStart} size="lg" className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-xl px-12 py-8 rounded-full shadow-lg hover:shadow-purple-500/50 transition-shadow duration-300 transform hover:scale-105">
      <Play className="mr-2"/> PLAY NOW
    </Button>

    <div className="mt-12 w-full max-w-md p-2 rounded-lg bg-black/20 min-h-[50px] flex items-center justify-center text-muted-foreground text-sm">
      Banner Ad
    </div>
  </div>
);

const GameOverlay = ({ score, level, nextRewardDist, onLeftPress, onRightPress, onRelease }: { score: number, level: number, nextRewardDist: number, onLeftPress: () => void, onRightPress: () => void, onRelease: () => void }) => (
  <div className="absolute inset-0 z-10 pointer-events-none">
      <div className="flex justify-between items-center p-4 text-white">
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full"><span className="text-muted-foreground">Height:</span> {score}m</div>
          <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-full"><span className="text-muted-foreground">Level:</span> {level}</div>
      </div>
      <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white">
          <span className="text-muted-foreground">Next Reward in:</span> {nextRewardDist}m
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-between px-8 pointer-events-auto">
          <Button size="icon" className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md" onTouchStart={onLeftPress} onTouchEnd={onRelease} onMouseDown={onLeftPress} onMouseUp={onRelease}><ArrowLeft className="w-10 h-10"/></Button>
          <Button size="icon" className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md" onTouchStart={onRightPress} onTouchEnd={onRelease} onMouseDown={onRightPress} onMouseUp={onRelease}><ArrowRight className="w-10 h-10"/></Button>
      </div>
  </div>
);

const RewardDialog = ({ open, onOpenChange, reward, onContinue, onWatchAd }: { open: boolean; onOpenChange: (open: boolean) => void; reward: Reward | null; onContinue: () => void; onWatchAd: () => void; }) => {
    if (!reward) return null;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md w-full bg-gradient-to-br from-gray-900 to-blue-900/70 border-purple-500/50 text-white overflow-hidden">
                <div className="absolute inset-0 animate-confetti-fall opacity-30" />
                <DialogHeader className="text-center items-center z-10">
                    <PartyPopper className="w-12 h-12 text-yellow-400 mb-2 animate-bounce"/>
                    <DialogTitle className="text-3xl font-bold">REWARD UNLOCKED!</DialogTitle>
                    <DialogDescription className="text-blue-200">{reward.title}</DialogDescription>
                </DialogHeader>
                <div className="my-6 flex flex-col items-center z-10">
                    <div className="relative rounded-lg overflow-hidden border-4 border-yellow-400 shadow-2xl shadow-yellow-500/30 animate-reward-appear">
                        <Image src={reward.image.imageUrl} alt={reward.title} width={300} height={400} className="max-h-60 w-auto" data-ai-hint={reward.image.imageHint} />
                        <div className="absolute bottom-2 right-2 bg-black/70 text-yellow-300 text-xs font-bold px-2 py-1 rounded">PREMIUM</div>
                    </div>
                    <p className="mt-4 text-center text-blue-100">{reward.description}</p>
                </div>
                <div className="flex flex-col gap-4 z-10">
                    <Button onClick={onWatchAd} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-lg py-6 flex flex-col">
                        <div className="flex items-center gap-2"><Tv className="w-5 h-5"/> WATCH AD FOR HD VIDEO</div>
                        <span className="text-xs font-normal">+100 GEMS BONUS</span>
                    </Button>
                    <Button variant="ghost" onClick={onContinue} className="w-full">Continue Playing <ArrowRight className="w-4 h-4 ml-2"/></Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const VideoDialog = ({ open, onOpenChange, reward }: { open: boolean; onOpenChange: (open: boolean) => void; reward: Reward | null; }) => {
    if (!reward) return null;
    const [unlocked, setUnlocked] = useState(false);
    
    useEffect(() => {
        if(open) {
            setUnlocked(false);
            const timer = setTimeout(() => setUnlocked(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg w-full bg-gray-900 border-teal-500/50 text-white">
                <DialogHeader className="text-center items-center">
                    <DialogTitle className="text-3xl font-bold">EXCLUSIVE CONTENT UNLOCKED!</DialogTitle>
                </DialogHeader>
                <div className="my-4">
                    <div className="relative rounded-lg overflow-hidden border-2 border-teal-400">
                        <video key={reward.video} controls autoPlay muted className="w-full">
                            <source src={reward.video} type="video/mp4" />
                        </video>
                        {!unlocked && (
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center animate-fade-in">
                                <Lock className="w-16 h-16 text-teal-400 animate-unlock-bounce"/>
                                <p className="text-lg mt-2">Unlocking Video...</p>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 text-center">
                        <h3 className="text-xl font-bold">{reward.title}</h3>
                        <p className="text-muted-foreground">Thanks for watching! Enjoy your exclusive content.</p>
                        <div className="inline-flex items-center gap-2 bg-yellow-400/20 text-yellow-300 font-bold px-4 py-2 rounded-full mt-4 animate-bonus-pulse">
                            <Gem className="w-5 h-5" /> +100 Gems Earned
                        </div>
                    </div>
                </div>
                <Button onClick={() => onOpenChange(false)} className="w-full">Close & Continue</Button>
            </DialogContent>
        </Dialog>
    );
};

const RewardedAdDialog = ({ open, onClose }: { open: boolean; onClose: (completed: boolean) => void; }) => {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (open) {
            setCountdown(5);
            const interval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(false); }}>
            <DialogContent className="max-w-md w-full bg-[#1a1a2e] border-[#16213e] text-white p-0 overflow-hidden">
                <DialogHeader className="sr-only">
                    <DialogTitle>Sponsored Ad</DialogTitle>
                    <DialogDescription>This is a simulation. In production, a video ad would be displayed here.</DialogDescription>
                </DialogHeader>
                <div className="bg-[#16213e] px-6 py-4 flex justify-between items-center text-[#e94560] font-bold">
                    <span><Tv className="inline-block mr-2" /> Sponsored Ad</span>
                    <span>{countdown}s</span>
                </div>
                <div className="p-10 min-h-[250px] flex flex-col items-center justify-center text-center">
                    <div className="text-6xl mb-4">🏢</div>
                    <h3 className="text-xl font-bold">Sponsor Advertisement</h3>
                    <p className="text-muted-foreground">This is a simulation. In production, a video ad would be displayed here.</p>
                </div>
                <div className="p-4 bg-[#16213e] text-center">
                    <Button onClick={() => onClose(true)} disabled={countdown > 0} className="w-full disabled:opacity-50 enabled:bg-[#0f3460]">
                        {countdown > 0 ? `Claim Reward in ${countdown}` : "Claim Reward"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const GameOverDialog = ({ open, score, gems, onRestart, onDoubleRewards }: { open: boolean, score: number, gems: number, onRestart: () => void, onDoubleRewards: () => void }) => (
    <Dialog open={open}>
        <DialogContent className="max-w-md w-full bg-card/80 backdrop-blur-lg border-red-500/50 text-white">
            <DialogHeader className="text-center items-center">
                <DialogTitle className="text-4xl font-bold text-red-500">GAME OVER</DialogTitle>
            </DialogHeader>
            <div className="my-6 bg-black/20 p-6 rounded-lg flex justify-around text-center">
                <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Medal className="w-4 h-4"/>Max Height</div>
                    <div className="text-4xl font-bold text-yellow-400">{score}m</div>
                </div>
                <div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1"><Gem className="w-4 h-4"/>Gems</div>
                    <div className="text-4xl font-bold text-yellow-400">{gems}</div>
                </div>
            </div>
            <div className="flex flex-col gap-4">
                <Button onClick={onRestart} size="lg"><RotateCw className="w-5 h-5 mr-2"/> Play Again</Button>
                <Button onClick={onDoubleRewards} size="lg" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold"><Tv className="w-5 h-5 mr-2"/> Watch Ad to Double Score</Button>
            </div>
             <div className="mt-6 w-full p-2 rounded-lg bg-black/20 min-h-[50px] flex items-center justify-center text-muted-foreground text-sm">
              Interstitial Ad Placeholder
            </div>
        </DialogContent>
    </Dialog>
);
