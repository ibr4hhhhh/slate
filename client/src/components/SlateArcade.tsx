import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useGameLogic } from '@/hooks/useGameLogic';

type GameType = 'lobby' | 'dice' | 'mines' | 'crash' | 'plinko' | 'limbo' | 'blackjack' | 'roulette' | 'keno' | 'hilo' | 'towers';

interface MinesState {
  bet: number;
  mineCount: number;
  mineSet: Set<number>;
  revealed: Set<number>;
  busted: boolean;
  started: boolean;
}

interface CrashState {
  bet: number;
  multiplier: number;
  cashed: boolean;
  crashed: boolean;
  isRunning: boolean;
}

interface BlackjackState {
  bet: number;
  dealerCards: string[];
  playerCards: string[];
  dealerValue: number;
  playerValue: number;
  gameOver: boolean;
  dealerHidden: boolean;
}

const PAGES = [
  { id: 'lobby', label: 'Lobby' },
  { id: 'dice', label: 'Dice' },
  { id: 'mines', label: 'Mines' },
  { id: 'crash', label: 'Crash' },
  { id: 'plinko', label: 'Plinko' },
  { id: 'limbo', label: 'Limbo' },
  { id: 'blackjack', label: 'Blackjack' },
  { id: 'roulette', label: 'Roulette' },
  { id: 'keno', label: 'Keno' },
  { id: 'hilo', label: 'Hi-Lo' },
  { id: 'towers', label: 'Towers' },
];

const EDGE = 0.01;

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);

export default function SlateArcade() {
  const [balance, setBalance] = useLocalStorage('slate_balance', 100);
  const [currentGame, setCurrentGame] = useState<GameType>('lobby');
  const { playSound, addPopAnimation, addGlowAnimation } = useGameLogic();

  // Game states
  const [diceBet, setDiceBet] = useState(1.0);
  const [diceTarget, setDiceTarget] = useState(49.5);
  const [diceResult, setDiceResult] = useState<{ roll: number; payout: number; status: string } | null>(null);

  const [minesState, setMinesState] = useState<MinesState | null>(null);
  const [crashState, setCrashState] = useState<CrashState | null>(null);
  const crashTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [plinkoBet, setPlinkoBet] = useState(1.0);
  const [plinkoRows, setPlinkoRows] = useState(12);
  const [plinkoRisk, setPlinkoRisk] = useState('medium');
  const [plinkoResult, setPlinkoResult] = useState<{ bin: number; multiplier: number; status: string } | null>(null);

  const [limboBet, setLimboBet] = useState(1.0);
  const [limboTarget, setLimboTarget] = useState(2.0);
  const [limboResult, setLimboResult] = useState<{ crash: number; status: string } | null>(null);

  const [bjState, setBjState] = useState<BlackjackState | null>(null);
  const [bjDeck, setBjDeck] = useState<string[]>([]);

  const [rouletteBet, setRouletteBet] = useState(1.0);
  const [rouletteType, setRouletteType] = useState('red');
  const [rouletteNumber, setRouletteNumber] = useState(7);
  const [rouletteResult, setRouletteResult] = useState<{ number: number; color: string; status: string } | null>(null);

  const balanceRef = useRef<HTMLDivElement>(null);

  const withdraw = (amount: number): boolean => {
    if (amount > balance) return false;
    setBalance(balance - amount);
    return true;
  };

  const deposit = (amount: number) => {
    setBalance(balance + amount);
    if (balanceRef.current) {
      addGlowAnimation(balanceRef.current);
    }
  };

  const switchGame = (game: GameType) => {
    setCurrentGame(game);
    playSound('click');
  };

  const handleDeposit = () => {
    deposit(100);
    playSound('win');
  };

  const handleReset = () => {
    setBalance(100);
    playSound('click');
  };

  // Dice Game
  const rollDice = () => {
    if (diceBet <= 0 || diceTarget < 1 || diceTarget > 99) return;
    if (!withdraw(diceBet)) {
      setDiceResult({ roll: 0, payout: 0, status: 'Insufficient balance.' });
      playSound('lose');
      return;
    }

    const roll = Math.random() * 100;
    const payout = (1 - EDGE) * (100 / diceTarget);
    
    if (roll < diceTarget) {
      const winAmount = diceBet * payout;
      deposit(winAmount);
      setDiceResult({
        roll,
        payout,
        status: `You WIN +$${winAmount.toFixed(2)} 🎉`
      });
      playSound('win');
    } else {
      setDiceResult({
        roll,
        payout,
        status: `You lose -$${diceBet.toFixed(2)}.`
      });
      playSound('lose');
    }
  };

  // Mines Game
  const startMines = () => {
    const bet = diceBet;
    const mines = Math.min(10, Math.max(1, minesState?.mineCount || 3));
    if (bet <= 0) return;
    if (!withdraw(bet)) {
      setMinesState(prev => prev ? { ...prev, started: false, busted: true } : null);
      playSound('lose');
      return;
    }

    const size = 25;
    const mineSet = new Set<number>();
    while (mineSet.size < mines) {
      mineSet.add(Math.floor(Math.random() * size));
    }

    setMinesState({
      bet,
      mineCount: mines,
      mineSet,
      revealed: new Set(),
      busted: false,
      started: true
    });
  };

  const revealTile = (index: number) => {
    if (!minesState || minesState.busted || !minesState.started) return;
    if (minesState.revealed.has(index)) return;

    const newRevealed = new Set(minesState.revealed);
    newRevealed.add(index);

    if (minesState.mineSet.has(index)) {
      setMinesState({
        ...minesState,
        revealed: newRevealed,
        busted: true
      });
      playSound('lose');
    } else {
      setMinesState({
        ...minesState,
        revealed: newRevealed
      });
      playSound('click');
    }
  };

  const cashoutMines = () => {
    if (!minesState || minesState.busted || !minesState.started) return;
    const multiplier = calculateMinesMultiplier(minesState.revealed.size, minesState.mineCount);
    const winAmount = minesState.bet * multiplier;
    deposit(winAmount);
    setMinesState({
      ...minesState,
      started: false
    });
    playSound('win');
  };

  const calculateMinesMultiplier = (safePicks: number, mines: number): number => {
    const total = 25;
    let prob = 1;
    let safe = total - mines;
    let remaining = total;
    
    for (let i = 0; i < safePicks; i++) {
      prob *= (safe / remaining);
      safe--;
      remaining--;
    }
    
    const fairPayout = 1 / prob;
    return fairPayout * (1 - EDGE);
  };

  // Crash Game
  const startCrash = () => {
    const bet = diceBet;
    if (bet <= 0) return;
    if (!withdraw(bet)) {
      setCrashState(prev => prev ? { ...prev, isRunning: false } : null);
      playSound('lose');
      return;
    }

    const targetMultiplier = 1.0 + Math.pow(Math.random(), 2) * 9.0;
    
    setCrashState({
      bet,
      multiplier: 1.0,
      cashed: false,
      crashed: false,
      isRunning: true
    });

    if (crashTimerRef.current) {
      clearInterval(crashTimerRef.current);
    }

    crashTimerRef.current = setInterval(() => {
      setCrashState(prev => {
        if (!prev || prev.cashed || prev.crashed) return prev;
        
        const newMultiplier = Number((prev.multiplier * 1.015).toFixed(3));
        
        if (newMultiplier >= targetMultiplier) {
          if (crashTimerRef.current) {
            clearInterval(crashTimerRef.current);
          }
          playSound('lose');
          return { ...prev, multiplier: newMultiplier, crashed: true, isRunning: false };
        }
        
        return { ...prev, multiplier: newMultiplier };
      });
    }, 100);
  };

  const crashCashout = () => {
    if (!crashState || crashState.cashed || crashState.crashed) return;
    
    if (crashTimerRef.current) {
      clearInterval(crashTimerRef.current);
    }
    
    const winAmount = crashState.bet * crashState.multiplier * (1 - EDGE);
    deposit(winAmount);
    
    setCrashState({
      ...crashState,
      cashed: true,
      isRunning: false
    });
    playSound('win');
  };

  // Plinko Game
  const dropPlinko = () => {
    const bet = plinkoBet;
    const rows = Math.min(16, Math.max(8, plinkoRows));
    if (bet <= 0) return;
    if (!withdraw(bet)) {
      setPlinkoResult({ bin: 0, multiplier: 0, status: 'Insufficient balance.' });
      playSound('lose');
      return;
    }

    const multipliers = getPlinkoMultipliers(rows, plinkoRisk);
    
    // Simulate ball drop
    let position = 0;
    for (let r = 0; r < rows; r++) {
      if (Math.random() < 0.5) {
        // Stay in same relative position
      } else {
        position++;
      }
    }
    
    const bin = position;
    const multiplier = multipliers[bin] || 1;
    const winAmount = bet * multiplier;
    
    deposit(winAmount);
    setPlinkoResult({
      bin: bin + 1,
      multiplier,
      status: `Ball landed in bin ${bin + 1}. +$${winAmount.toFixed(2)} at ${multiplier.toFixed(2)}× 🎉`
    });
    playSound('win');
  };

  const getPlinkoMultipliers = (rows: number, risk: string): number[] => {
    const bins = rows + 1;
    const mid = Math.floor(bins / 2);
    const base: number[] = [];
    
    for (let i = 0; i < bins; i++) {
      const distance = Math.abs(i - mid);
      const riskMultiplier = risk === 'high' ? 8 : risk === 'medium' ? 4 : 2;
      base.push(1 + (distance / (mid || 1)) * riskMultiplier);
    }
    
    const edgeAdjustment = (1 - EDGE);
    return base.map(x => Number((x * edgeAdjustment).toFixed(2)));
  };

  // Limbo Game
  const playLimbo = () => {
    const bet = limboBet;
    const target = Math.max(1.01, limboTarget);
    if (bet <= 0) return;
    if (!withdraw(bet)) {
      setLimboResult({ crash: 0, status: 'Insufficient balance.' });
      playSound('lose');
      return;
    }

    const crash = 1 + Math.random() * 9;
    
    if (crash >= target) {
      const winAmount = bet * target * (1 - EDGE);
      deposit(winAmount);
      setLimboResult({
        crash,
        status: `Win +$${winAmount.toFixed(2)} at ${target.toFixed(2)}×`
      });
      playSound('win');
    } else {
      setLimboResult({
        crash,
        status: `Lost -$${bet.toFixed(2)} (crash ${crash.toFixed(2)}×)`
      });
      playSound('lose');
    }
  };

  // Blackjack Game
  const newDeck = (): string[] => {
    const deck: string[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push(rank + suit);
      }
    }
    return deck.sort(() => Math.random() - 0.5);
  };

  const getCardValue = (card: string): number => {
    const rank = card.slice(0, -1);
    if (rank === 'A') return 11;
    if (['K', 'Q', 'J'].includes(rank)) return 10;
    return Number(rank);
  };

  const getHandValue = (hand: string[]): number => {
    let total = 0;
    let aces = 0;
    
    for (const card of hand) {
      const value = getCardValue(card);
      if (card.startsWith('A')) aces++;
      total += value;
    }
    
    while (total > 21 && aces > 0) {
      total -= 10;
      aces--;
    }
    
    return total;
  };

  const dealBlackjack = () => {
    const bet = 5; // Fixed bet for blackjack
    if (!withdraw(bet)) {
      playSound('lose');
      return;
    }

    let deck = bjDeck;
    if (deck.length < 20) {
      deck = newDeck();
      setBjDeck(deck);
    }

    const dealerCards = [deck.pop()!, deck.pop()!];
    const playerCards = [deck.pop()!, deck.pop()!];
    
    setBjDeck([...deck]);
    setBjState({
      bet,
      dealerCards,
      playerCards,
      dealerValue: getHandValue([dealerCards[1]]), // Only show one card
      playerValue: getHandValue(playerCards),
      gameOver: false,
      dealerHidden: true
    });
    playSound('click');
  };

  const hitBlackjack = () => {
    if (!bjState || bjState.gameOver) return;
    
    let deck = [...bjDeck];
    const newPlayerCards = [...bjState.playerCards, deck.pop()!];
    setBjDeck(deck);
    
    const playerValue = getHandValue(newPlayerCards);
    
    if (playerValue > 21) {
      setBjState({
        ...bjState,
        playerCards: newPlayerCards,
        playerValue,
        gameOver: true,
        dealerHidden: false,
        dealerValue: getHandValue(bjState.dealerCards)
      });
      playSound('lose');
    } else {
      setBjState({
        ...bjState,
        playerCards: newPlayerCards,
        playerValue
      });
      playSound('click');
    }
  };

  const standBlackjack = () => {
    if (!bjState || bjState.gameOver) return;
    
    let deck = [...bjDeck];
    let dealerCards = [...bjState.dealerCards];
    
    // Dealer hits on soft 17
    while (getHandValue(dealerCards) < 17) {
      dealerCards.push(deck.pop()!);
    }
    
    setBjDeck(deck);
    
    const dealerValue = getHandValue(dealerCards);
    const playerValue = getHandValue(bjState.playerCards);
    
    let result = '';
    if (playerValue > 21) {
      result = 'Player busts. You lose.';
      playSound('lose');
    } else if (dealerValue > 21 || playerValue > dealerValue) {
      const winAmount = bjState.bet * 2;
      deposit(winAmount);
      result = `You win +$${winAmount.toFixed(2)}.`;
      playSound('win');
    } else if (playerValue === dealerValue) {
      deposit(bjState.bet);
      result = 'Push. Bet returned.';
      playSound('click');
    } else {
      result = 'Dealer wins.';
      playSound('lose');
    }
    
    setBjState({
      ...bjState,
      dealerCards,
      dealerValue,
      gameOver: true,
      dealerHidden: false
    });
  };

  // Roulette Game
  const spinRoulette = () => {
    const bet = rouletteBet;
    const type = rouletteType;
    const pick = rouletteNumber;
    if (bet <= 0) return;
    if (!withdraw(bet)) {
      setRouletteResult({ number: 0, color: 'green', status: 'Insufficient balance.' });
      playSound('lose');
      return;
    }

    const number = Math.floor(Math.random() * 37);
    const color = number === 0 ? 'green' : (REDS.has(number) ? 'red' : 'black');
    
    let winAmount = 0;
    if (type === 'single' && number === pick) {
      winAmount = bet * 36 * (1 - EDGE);
    } else if (type === 'red' && color === 'red') {
      winAmount = bet * 2 * (1 - EDGE);
    } else if (type === 'black' && color === 'black') {
      winAmount = bet * 2 * (1 - EDGE);
    } else if (type === 'odd' && number !== 0 && number % 2 === 1) {
      winAmount = bet * 2 * (1 - EDGE);
    } else if (type === 'even' && number !== 0 && number % 2 === 0) {
      winAmount = bet * 2 * (1 - EDGE);
    }
    
    if (winAmount > 0) {
      deposit(winAmount);
      setRouletteResult({
        number,
        color,
        status: `Win +$${winAmount.toFixed(2)}!`
      });
      playSound('win');
    } else {
      setRouletteResult({
        number,
        color,
        status: `Lose -$${bet.toFixed(2)}.`
      });
      playSound('lose');
    }
  };

  const renderGameCard = (game: typeof PAGES[0]) => (
    <div key={game.id} className="card">
      <h3>{game.label}</h3>
      <p className="help">
        {game.label === 'Dice' ? 'Pick target & roll.'
          : game.label === 'Mines' ? 'Avoid hidden mines.'
          : game.label === 'Crash' ? 'Cash out before crash.'
          : game.label === 'Plinko' ? 'Drop a ball into bins.'
          : game.label === 'Limbo' ? 'Hit your target ×.'
          : game.label === 'Blackjack' ? 'Beat 21 without bust.'
          : game.label === 'Roulette' ? 'Bet colors or numbers.'
          : game.label === 'Keno' ? 'Pick numbers; draw 20.'
          : game.label === 'Hi-Lo' ? 'Guess next card.'
          : 'Climb by picking safe tiles.'}
      </p>
      <button 
        className="btn acc play-btn" 
        onClick={() => switchGame(game.id as GameType)}
        data-testid={`button-play-${game.id}`}
      >
        Play
      </button>
    </div>
  );

  const renderMinesGrid = () => {
    const tiles = [];
    for (let i = 0; i < 25; i++) {
      const isRevealed = minesState?.revealed.has(i);
      const isMine = minesState?.mineSet.has(i);
      const isStarted = minesState?.started;
      
      let className = 'tile';
      let content = '?';
      
      if (isRevealed) {
        className += ' revealed';
        if (isMine) {
          className += ' mine';
          content = '💥';
        } else {
          className += ' safe';
          content = '✓';
        }
      }
      
      tiles.push(
        <button
          key={i}
          className={className}
          onClick={() => revealTile(i)}
          disabled={!isStarted || isRevealed || minesState?.busted}
          data-testid={`tile-${i}`}
        >
          {content}
        </button>
      );
    }
    return tiles;
  };

  const renderCard = (card: string, hidden = false) => {
    if (hidden) {
      return <div className="cardx back" key="hidden">?</div>;
    }
    
    const isRed = card.includes('♥') || card.includes('♦');
    return (
      <div key={card} className={`cardx ${isRed ? 'red' : ''}`}>
        {card}
      </div>
    );
  };

  const renderPlinkoCanvas = () => {
    return (
      <div className="plinko-canvas">
        <canvas 
          width="240" 
          height="300" 
          style={{ background: '#0a0f18' }}
          data-testid="plinko-canvas"
        />
        <div className="bins">
          {getPlinkoMultipliers(plinkoRows, plinkoRisk).map((mult, i) => (
            <div key={i} className="bin" data-x={mult.toFixed(2)} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <header className="topbar">
        <div className="brand">
          <div className="badge" aria-hidden="true"></div>
          <div>slate <span>arcade</span></div>
        </div>
        <nav className="nav">
          {PAGES.map(page => (
            <button
              key={page.id}
              className="nav-btn"
              aria-current={currentGame === page.id ? 'page' : 'false'}
              onClick={() => switchGame(page.id as GameType)}
              data-testid={`nav-${page.id}`}
            >
              {page.label}
            </button>
          ))}
        </nav>
        <div className="wallet">
          <div className="chip" ref={balanceRef} data-testid="balance">
            ${balance.toFixed(2)}
          </div>
          <button className="btn acc" onClick={handleDeposit} data-testid="button-deposit">
            + Deposit
          </button>
          <button className="btn warn" onClick={handleReset} data-testid="button-reset">
            Reset
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* Lobby */}
        <section className={`view ${currentGame === 'lobby' ? 'view--active' : ''}`}>
          <h1>Welcome to Slate Arcade</h1>
          <p className="help">
            Stake-inspired energy, original design. <strong>Fake money only</strong>. No real deposits, no cashouts.
          </p>
          <div className="cards">
            {PAGES.filter(p => p.id !== 'lobby').map(renderGameCard)}
          </div>
          <div className="help" style={{ marginTop: '12px' }}>
            Educational demo. No affiliation with any gambling brand.
          </div>
        </section>

        {/* Dice */}
        <section className={`view ${currentGame === 'dice' ? 'view--active' : ''}`}>
          <h2>Dice</h2>
          <div className="help">Win if RNG &lt; target. Payout = (1 - edge) * (100 / target).</div>
          <div className="panel">
            <label>
              Bet ($)
              <input
                type="number"
                min="0"
                step="0.01"
                value={diceBet}
                onChange={(e) => setDiceBet(Number(e.target.value))}
                data-testid="input-dice-bet"
              />
            </label>
            <label>
              Target % (1–99)
              <input
                type="number"
                min="1"
                max="99"
                value={diceTarget}
                onChange={(e) => setDiceTarget(Number(e.target.value))}
                data-testid="input-dice-target"
              />
            </label>
            <button onClick={rollDice} data-testid="button-dice-roll">Roll</button>
          </div>
          <div className="readout">
            <div>Roll: <span data-testid="dice-roll">{diceResult?.roll.toFixed(2) || '—'}</span></div>
            <div>Payout: <span data-testid="dice-payout">{diceResult?.payout.toFixed(2) + '×' || '—'}</span></div>
            <div className="status" data-testid="dice-status">{diceResult?.status || 'Place a bet.'}</div>
          </div>
        </section>

        {/* Mines */}
        <section className={`view ${currentGame === 'mines' ? 'view--active' : ''}`}>
          <h2>Mines</h2>
          <div className="help">Avoid the mines on a 5×5 grid. Cash out anytime.</div>
          <div className="panel">
            <label>
              Bet ($)
              <input
                type="number"
                min="0"
                step="0.01"
                value={diceBet}
                onChange={(e) => setDiceBet(Number(e.target.value))}
                data-testid="input-mines-bet"
              />
            </label>
            <label>
              Mines (1–10)
              <input
                type="number"
                min="1"
                max="10"
                value={minesState?.mineCount || 3}
                onChange={(e) => setMinesState(prev => prev ? { ...prev, mineCount: Number(e.target.value) } : { 
                  bet: 0, mineCount: Number(e.target.value), mineSet: new Set(), revealed: new Set(), busted: false, started: false 
                })}
                data-testid="input-mines-count"
              />
            </label>
            <button onClick={startMines} data-testid="button-mines-start">Start</button>
            <button 
              onClick={cashoutMines} 
              disabled={!minesState?.started || minesState?.busted}
              data-testid="button-mines-cashout"
            >
              Cash Out
            </button>
          </div>
          <div className="readout">
            <div>Safe picks: <span data-testid="mines-safe">{minesState?.revealed.size || 0}</span></div>
            <div>Current Multiplier: <span data-testid="mines-multiplier">
              {minesState ? calculateMinesMultiplier(minesState.revealed.size, minesState.mineCount).toFixed(2) + 'x' : '1.00x'}
            </span></div>
            <div className="status" data-testid="mines-status">
              {minesState?.busted ? `Boom! You hit a mine. -$${minesState.bet.toFixed(2)}` 
                : minesState?.started ? 'Keep going or cash out.'
                : 'Start a round.'}
            </div>
          </div>
          <div className="grid" data-testid="mines-grid">
            {renderMinesGrid()}
          </div>
        </section>

        {/* Crash */}
        <section className={`view ${currentGame === 'crash' ? 'view--active' : ''}`}>
          <h2>Crash</h2>
          <div className="help">Multiplier rises until it crashes. Cash out before it explodes.</div>
          <div className="panel">
            <label>
              Bet ($)
              <input
                type="number"
                min="0"
                step="0.01"
                value={diceBet}
                onChange={(e) => setDiceBet(Number(e.target.value))}
                data-testid="input-crash-bet"
              />
            </label>
            <button onClick={startCrash} data-testid="button-crash-start">Start</button>
            <button 
              onClick={crashCashout}
              disabled={!crashState?.isRunning || crashState?.cashed || crashState?.crashed}
              data-testid="button-crash-cashout"
            >
              Cash Out
            </button>
          </div>
          <div className="crash-wrap">
            <div className="crash-meter" data-testid="crash-multiplier">
              {crashState?.multiplier.toFixed(2) || '1.00'}×
            </div>
            <div className="status" data-testid="crash-status">
              {crashState?.crashed ? '💥 Crashed!'
                : crashState?.cashed ? `Cashed out ${crashState.multiplier.toFixed(2)}× for +$${(crashState.bet * crashState.multiplier * (1 - EDGE)).toFixed(2)} 🎉`
                : crashState?.isRunning ? 'Rising...'
                : 'Start a round.'}
            </div>
          </div>
        </section>

        {/* Plinko */}
        <section className={`view ${currentGame === 'plinko' ? 'view--active' : ''}`}>
          <h2>Plinko</h2>
          <div className="help">Drop a ball through pegs into multiplier bins. Multipliers vary by risk.</div>
          <div className="panel">
            <label>
              Bet ($)
              <input
                type="number"
                min="0"
                step="0.01"
                value={plinkoBet}
                onChange={(e) => setPlinkoBet(Number(e.target.value))}
                data-testid="input-plinko-bet"
              />
            </label>
            <label>
              Rows (8–16)
              <input
                type="number"
                min="8"
                max="16"
                value={plinkoRows}
                onChange={(e) => setPlinkoRows(Number(e.target.value))}
                data-testid="input-plinko-rows"
              />
            </label>
            <label>
              Risk
              <select 
                value={plinkoRisk} 
                onChange={(e) => setPlinkoRisk(e.target.value)}
                data-testid="select-plinko-risk"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
            <button onClick={dropPlinko} data-testid="button-plinko-drop">Drop</button>
          </div>
          <div className="plinko">
            {renderPlinkoCanvas()}
            <div>
              <div className="readout">
                <div>Bin: <span data-testid="plinko-bin">{plinkoResult?.bin || '—'}</span></div>
                <div>Multiplier: <span data-testid="plinko-multiplier">{plinkoResult?.multiplier.toFixed(2) + 'x' || '—'}</span></div>
                <div className="status" data-testid="plinko-status">{plinkoResult?.status || 'Configure and drop.'}</div>
              </div>
              <div className="help">Note: Simple simulation with house edge ~1% baked into multipliers.</div>
            </div>
          </div>
        </section>

        {/* Limbo */}
        <section className={`view ${currentGame === 'limbo' ? 'view--active' : ''}`}>
          <h2>Limbo</h2>
          <div className="help">Set a target multiplier. Random crash {'>'}=1.00×. Win if crash {'>'}= target.</div>
          <div className="panel">
            <label>
              Bet ($)
              <input
                type="number"
                min="0"
                step="0.01"
                value={limboBet}
                onChange={(e) => setLimboBet(Number(e.target.value))}
                data-testid="input-limbo-bet"
              />
            </label>
            <label>
              Target ×
              <input
                type="number"
                min="1.01"
                step="0.01"
                value={limboTarget}
                onChange={(e) => setLimboTarget(Number(e.target.value))}
                data-testid="input-limbo-target"
              />
            </label>
            <button onClick={playLimbo} data-testid="button-limbo-go">Go</button>
          </div>
          <div className="readout">
            <div>Crash: <span data-testid="limbo-crash">{limboResult?.crash.toFixed(2) + '×' || '—'}</span></div>
            <div className="status" data-testid="limbo-status">{limboResult?.status || 'Pick a target.'}</div>
          </div>
        </section>

        {/* Blackjack */}
        <section className={`view ${currentGame === 'blackjack' ? 'view--active' : ''}`}>
          <h2>Blackjack</h2>
          <div className="panel">
            <label>
              Bet ($)
              <input
                type="number"
                min="0"
                step="0.01"
                value="5.00"
                readOnly
                data-testid="input-blackjack-bet"
              />
            </label>
            <button onClick={dealBlackjack} data-testid="button-blackjack-deal">Deal</button>
            <button 
              onClick={hitBlackjack}
              disabled={!bjState || bjState.gameOver}
              data-testid="button-blackjack-hit"
            >
              Hit
            </button>
            <button 
              onClick={standBlackjack}
              disabled={!bjState || bjState.gameOver}
              data-testid="button-blackjack-stand"
            >
              Stand
            </button>
          </div>
          <div className="readout">
            <div>Dealer (<span data-testid="blackjack-dealer-value">{bjState?.dealerValue || 0}</span>):</div>
          </div>
          <div className="cards-row" data-testid="blackjack-dealer-cards">
            {bjState?.dealerCards.map((card, i) => 
              renderCard(card, bjState.dealerHidden && i === 0)
            )}
          </div>
          <div style={{ height: '8px' }}></div>
          <div className="readout">
            <div>Player (<span data-testid="blackjack-player-value">{bjState?.playerValue || 0}</span>):</div>
          </div>
          <div className="cards-row" data-testid="blackjack-player-cards">
            {bjState?.playerCards.map(card => renderCard(card))}
          </div>
          <div className="status" data-testid="blackjack-status">
            {bjState?.gameOver 
              ? bjState.playerValue > 21 ? 'You bust.'
                : bjState.dealerValue > 21 || bjState.playerValue > bjState.dealerValue ? 'You win!'
                : bjState.playerValue === bjState.dealerValue ? 'Push'
                : 'Dealer wins'
              : bjState ? 'Your move.'
              : 'Deal to start.'}
          </div>
        </section>

        {/* Roulette */}
        <section className={`view ${currentGame === 'roulette' ? 'view--active' : ''}`}>
          <h2>Roulette</h2>
          <div className="panel">
            <label>
              Bet ($)
              <input
                type="number"
                min="0"
                step="0.01"
                value={rouletteBet}
                onChange={(e) => setRouletteBet(Number(e.target.value))}
                data-testid="input-roulette-bet"
              />
            </label>
            <label>
              Bet Type
              <select 
                value={rouletteType} 
                onChange={(e) => setRouletteType(e.target.value)}
                data-testid="select-roulette-type"
              >
                <option value="red">Red (1:1)</option>
                <option value="black">Black (1:1)</option>
                <option value="odd">Odd (1:1)</option>
                <option value="even">Even (1:1)</option>
                <option value="single">Single Number (35:1)</option>
              </select>
            </label>
            {rouletteType === 'single' && (
              <label>
                Number
                <input
                  type="number"
                  min="0"
                  max="36"
                  value={rouletteNumber}
                  onChange={(e) => setRouletteNumber(Number(e.target.value))}
                  data-testid="input-roulette-number"
                />
              </label>
            )}
            <button onClick={spinRoulette} data-testid="button-roulette-spin">Spin</button>
          </div>
          <div className="roulette-container">
            <div className="roulette-wheel">
              <div className="roulette-pointer"></div>
            </div>
            <div>
              <div className="readout">
                <div>Result: <span data-testid="roulette-result">
                  {rouletteResult ? `${rouletteResult.number} (${rouletteResult.color})` : '—'}
                </span></div>
                <div className="status" data-testid="roulette-status">
                  {rouletteResult?.status || 'Place a bet.'}
                </div>
              </div>
              <div className="help">Simple European-style simulation (single 0). Colors alternate; 0 is green.</div>
            </div>
          </div>
        </section>

        {/* Placeholder sections for other games */}
        <section className={`view ${currentGame === 'keno' ? 'view--active' : ''}`}>
          <h2>Keno</h2>
          <div className="help">Pick up to 10 numbers (1–40). We draw 20.</div>
          <div className="status">Coming soon...</div>
        </section>

        <section className={`view ${currentGame === 'hilo' ? 'view--active' : ''}`}>
          <h2>Hi-Lo</h2>
          <div className="help">Guess if the next card is higher or lower.</div>
          <div className="status">Coming soon...</div>
        </section>

        <section className={`view ${currentGame === 'towers' ? 'view--active' : ''}`}>
          <h2>Towers</h2>
          <div className="help">Climb columns by picking safe tiles. One gem per row, others are traps.</div>
          <div className="status">Coming soon...</div>
        </section>
      </main>

      <footer className="footer">
        © 2025 Slate Arcade — For education & fun only. No real gambling. Original UI (not affiliated with Stake).
      </footer>
    </div>
  );
}
