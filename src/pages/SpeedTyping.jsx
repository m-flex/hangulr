import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Timer, Zap, RotateCcw, Trophy } from 'lucide-react'
import confetti from 'canvas-confetti'
import { SYLLABLES_BASIC, SYLLABLES_BATCHIM, composeSyllable, isConsonant, isVowel } from '../data/hangul'
import { addXp, recordSession, updateTimedBest } from '../store/progress'
import { playCorrect, playWrong } from '../utils/audio'

// ── Korean Dubeolsik keyboard layout ─────────────────────

const KEYBOARD_ROWS = [
  [
    { normal: 'ㅂ', shift: 'ㅃ' }, { normal: 'ㅈ', shift: 'ㅉ' },
    { normal: 'ㄷ', shift: 'ㄸ' }, { normal: 'ㄱ', shift: 'ㄲ' },
    { normal: 'ㅅ', shift: 'ㅆ' }, { normal: 'ㅛ', shift: 'ㅛ' },
    { normal: 'ㅕ', shift: 'ㅕ' }, { normal: 'ㅑ', shift: 'ㅑ' },
    { normal: 'ㅐ', shift: 'ㅒ' }, { normal: 'ㅔ', shift: 'ㅖ' },
  ],
  [
    { normal: 'ㅁ', shift: 'ㅁ' }, { normal: 'ㄴ', shift: 'ㄴ' },
    { normal: 'ㅇ', shift: 'ㅇ' }, { normal: 'ㄹ', shift: 'ㄹ' },
    { normal: 'ㅎ', shift: 'ㅎ' }, { normal: 'ㅗ', shift: 'ㅗ' },
    { normal: 'ㅓ', shift: 'ㅓ' }, { normal: 'ㅏ', shift: 'ㅏ' },
    { normal: 'ㅣ', shift: 'ㅣ' },
  ],
  [
    { normal: 'ㅋ', shift: 'ㅋ' }, { normal: 'ㅌ', shift: 'ㅌ' },
    { normal: 'ㅊ', shift: 'ㅊ' }, { normal: 'ㅍ', shift: 'ㅍ' },
    { normal: 'ㅠ', shift: 'ㅠ' }, { normal: 'ㅜ', shift: 'ㅜ' },
    { normal: 'ㅡ', shift: 'ㅡ' },
  ],
]

// ── Helpers ─────────────────────

const GAME_DURATION = 60
const QUEUE_SIZE = 40

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQueue(progress) {
  const hasBatchim = progress?.stagesUnlocked?.includes(6)
  const pool = []
  while (pool.length < QUEUE_SIZE) {
    const batch = shuffle(SYLLABLES_BASIC)
    if (hasBatchim) {
      // Mix in ~30% batchim syllables
      const batchimItems = shuffle(SYLLABLES_BATCHIM).slice(0, Math.ceil(batch.length * 0.3))
      batch.push(...batchimItems)
    }
    pool.push(...shuffle(batch))
  }
  return pool.slice(0, QUEUE_SIZE)
}

export default function SpeedTyping({ progress, updateProgress }) {
  const [gameState, setGameState] = useState('ready') // 'ready' | 'playing' | 'done'
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [queue, setQueue] = useState(() => buildQueue(progress))
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [totalAttempts, setTotalAttempts] = useState(0)
  const [initial, setInitial] = useState(null)
  const [medial, setMedial] = useState(null)
  const [flash, setFlash] = useState(null)        // key char that was just pressed
  const [feedback, setFeedback] = useState(null)   // 'correct' | 'wrong' | null
  const [isNewBest, setIsNewBest] = useState(false)

  const timerRef = useRef(null)
  const gameStateRef = useRef(gameState)
  const scoreRef = useRef(0)
  const wrongRef = useRef(0)
  const totalRef = useRef(0)

  // Keep refs in sync
  gameStateRef.current = gameState
  scoreRef.current = score
  wrongRef.current = wrongCount
  totalRef.current = totalAttempts

  const target = queue[currentIndex]
  const personalBest = progress?.timedBests?.speedType?.score || 0

  // Extend queue if running low
  const extendQueueIfNeeded = useCallback((idx) => {
    if (idx >= queue.length - 3) {
      setQueue(prev => [...prev, ...buildQueue(progress)])
    }
  }, [queue.length, progress])

  const endGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setGameState('done')

    const finalScore = scoreRef.current
    const wasNewBest = finalScore > personalBest

    if (wasNewBest) {
      setIsNewBest(true)
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.4 },
        colors: ['#fbbf24', '#f59e0b', '#eab308', '#22c55e', '#4ade80'],
      })
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { x: 0.25, y: 0.5 },
          colors: ['#fbbf24', '#f59e0b'],
        })
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { x: 0.75, y: 0.5 },
          colors: ['#22c55e', '#4ade80'],
        })
      }, 400)
    } else if (finalScore > 0) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } })
    }

    updateProgress(prev => {
      let next = { ...prev }
      next = addXp(next, finalScore * 2)
      next = recordSession(next)
      return updateTimedBest(next, 'speedType', finalScore)
    })
  }, [personalBest, updateProgress])

  // Countdown timer
  useEffect(() => {
    if (gameState !== 'playing') return

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [gameState, endGame])

  const startGame = () => {
    const newQueue = buildQueue(progress)
    setGameState('playing')
    setTimeLeft(GAME_DURATION)
    setQueue(newQueue)
    setCurrentIndex(0)
    setScore(0)
    setWrongCount(0)
    setTotalAttempts(0)
    setInitial(null)
    setMedial(null)
    setFeedback(null)
    setFlash(null)
    setIsNewBest(false)
    scoreRef.current = 0
    wrongRef.current = 0
    totalRef.current = 0
  }

  const handleKeyPress = useCallback((keyChar) => {
    if (gameStateRef.current !== 'playing' || feedback === 'correct') return

    setFlash(keyChar)
    setTimeout(() => setFlash(null), 120)

    const isCVC = target?.components?.length === 3

    if (isConsonant(keyChar)) {
      if (medial && isCVC) {
        // This consonant is the final (batchim) for a CVC target
        const syllable = composeSyllable(initial, medial, keyChar)
        setTotalAttempts(t => t + 1)
        totalRef.current += 1

        if (syllable === target.char) {
          setFeedback('correct')
          setScore(s => s + 1)
          scoreRef.current += 1
          playCorrect()

          setTimeout(() => {
            if (gameStateRef.current === 'playing') {
              const nextIdx = currentIndex + 1
              extendQueueIfNeeded(nextIdx)
              setCurrentIndex(nextIdx)
              setInitial(null)
              setMedial(null)
              setFeedback(null)
            }
          }, 200)
        } else {
          setFeedback('wrong')
          setWrongCount(w => w + 1)
          wrongRef.current += 1
          playWrong()

          setTimeout(() => {
            if (gameStateRef.current === 'playing') {
              setInitial(null)
              setMedial(null)
              setFeedback(null)
            }
          }, 350)
        }
      } else {
        // Starting a new syllable — set initial consonant
        setInitial(keyChar)
        setMedial(null)
        setFeedback(null)
      }
    } else if (isVowel(keyChar)) {
      if (!initial) {
        playWrong()
        return
      }

      if (isCVC) {
        // CVC target: set medial vowel, wait for final consonant
        setMedial(keyChar)
        setFeedback(null)
      } else {
        // CV target: compose and check immediately
        const syllable = composeSyllable(initial, keyChar)
        setTotalAttempts(t => t + 1)
        totalRef.current += 1

        if (syllable === target.char) {
          setFeedback('correct')
          setScore(s => s + 1)
          scoreRef.current += 1
          playCorrect()

          setTimeout(() => {
            if (gameStateRef.current === 'playing') {
              const nextIdx = currentIndex + 1
              extendQueueIfNeeded(nextIdx)
              setCurrentIndex(nextIdx)
              setInitial(null)
              setMedial(null)
              setFeedback(null)
            }
          }, 200)
        } else {
          setFeedback('wrong')
          setWrongCount(w => w + 1)
          wrongRef.current += 1
          playWrong()

          setTimeout(() => {
            if (gameStateRef.current === 'playing') {
              setInitial(null)
              setMedial(null)
              setFeedback(null)
            }
          }, 350)
        }
      }
    }
  }, [initial, medial, target, currentIndex, feedback, extendQueueIfNeeded])

  const getKeyStyle = useCallback((keyChar) => {
    if (flash === keyChar) {
      return 'bg-primary-400/30 border-primary-400/60 text-white scale-95'
    }
    if (initial === keyChar && !feedback) {
      return 'bg-primary-500/25 border-primary-400/60 text-primary-400 shadow-lg shadow-primary-400/20'
    }
    return 'bg-slate-800/80 border-slate-600/50 text-white hover:bg-slate-700/80 hover:border-primary-400/40'
  }, [flash, initial, feedback])

  const timerUrgent = timeLeft <= 10
  const spm = timeLeft < GAME_DURATION
    ? Math.round((score / (GAME_DURATION - timeLeft)) * 60)
    : 0

  // ── Ready screen ──
  if (gameState === 'ready') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto px-4 py-8"
      >
        <Link
          to="/stages"
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors no-underline text-sm mb-8"
        >
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mb-6"
          >
            <Zap size={40} className="text-emerald-400" />
          </motion.div>

          <h1 className="text-3xl font-black text-white mb-2">Speed Typing Challenge</h1>
          <p className="text-slate-400 mb-8">
            Type syllables as fast as you can!
          </p>

          {/* Personal best display */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 mb-8"
          >
            <Trophy size={20} className="text-amber-400" />
            <div className="text-left">
              <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Personal Best</div>
              <div className="text-2xl font-black text-amber-400">
                {personalBest > 0 ? `${personalBest} syllables` : '---'}
              </div>
            </div>
          </motion.div>

          <div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-12 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500
                text-white font-bold text-lg border-0 cursor-pointer shadow-lg shadow-emerald-500/25
                hover:shadow-emerald-500/40 transition-shadow"
            >
              <span className="flex items-center gap-2 justify-center">
                <Zap size={20} /> Start
              </span>
            </motion.button>
          </div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-10 text-left space-y-3"
          >
            <div className="flex items-start gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Timer size={12} className="text-primary-400" />
              </div>
              <span className="text-slate-400">
                <span className="text-white font-medium">60 seconds</span> on the clock. Compose syllables using the keyboard!
              </span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Zap size={12} className="text-emerald-400" />
              </div>
              <span className="text-slate-400">
                <span className="text-white font-medium">Tap consonant then vowel</span> to build each syllable. Correct = next syllable!
              </span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Trophy size={12} className="text-amber-400" />
              </div>
              <span className="text-slate-400">
                <span className="text-white font-medium">Personal bests</span> are saved automatically
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  // ── Results screen ──
  if (gameState === 'done') {
    const accuracy = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0
    const finalSpm = Math.round((score / GAME_DURATION) * 60)

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto px-4 py-16 text-center"
      >
        {isNewBest ? (
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-sm mb-4">
              <Trophy size={16} /> NEW PERSONAL BEST!
            </div>
          </motion.div>
        ) : (
          <div className="text-6xl mb-4">
            {score > 0 ? (
              <Zap size={64} className="text-emerald-400 mx-auto" />
            ) : (
              <Timer size={64} className="text-slate-500 mx-auto" />
            )}
          </div>
        )}

        <h1 className="text-3xl font-black text-white mb-2">
          {isNewBest ? 'Incredible!' : score >= 20 ? 'Nice Speed!' : score >= 10 ? 'Good Effort!' : 'Keep Practicing!'}
        </h1>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.15 }}
          className="text-6xl font-black mb-2"
          style={{ color: isNewBest ? '#fbbf24' : '#34d399' }}
        >
          {score}
        </motion.div>
        <p className="text-slate-500 text-sm mb-6">syllables typed</p>

        {/* Stats row */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{accuracy}%</div>
            <div className="text-xs text-slate-500">Accuracy</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{finalSpm}</div>
            <div className="text-xs text-slate-500">Syll / min</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{wrongCount}</div>
            <div className="text-xs text-slate-500">Mistakes</div>
          </div>
        </div>

        {/* Personal best comparison */}
        {!isNewBest && personalBest > 0 && (
          <div className="text-sm text-slate-500 mb-6">
            Personal best: <span className="text-amber-400 font-bold">{personalBest}</span>
            {score > 0 && score < personalBest && (
              <span className="text-slate-600"> ({personalBest - score} away)</span>
            )}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-400 text-sm font-medium mb-8"
        >
          +{score * 2} XP earned
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl
              bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold
              border-0 cursor-pointer shadow-lg shadow-emerald-500/25"
          >
            <RotateCcw size={16} /> Play Again
          </motion.button>
          <Link to="/stages">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                bg-slate-700 hover:bg-slate-600 text-white border-0 cursor-pointer font-medium w-full"
            >
              <ArrowLeft size={16} /> Back to Stages
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  // ── Playing screen ──
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-xl mx-auto px-4 py-6"
    >
      {/* Top bar: back, score, timer */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm">
            <div className="w-2 h-2 rounded-full bg-success-400" />
            <span className="text-slate-400">{score}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm">
            <div className="w-2 h-2 rounded-full bg-danger-400" />
            <span className="text-slate-400">{wrongCount}</span>
          </div>
          {spm > 0 && (
            <div className="text-xs text-slate-500 tabular-nums">
              {spm} syll/min
            </div>
          )}
        </div>

        {/* Timer */}
        <motion.div
          animate={timerUrgent ? {
            scale: [1, 1.1, 1],
            color: ['#ef4444', '#ff6b6b', '#ef4444'],
          } : {}}
          transition={timerUrgent ? { duration: 0.5, repeat: Infinity } : {}}
          className={`flex items-center gap-2 text-2xl font-black tabular-nums
            ${timerUrgent ? 'text-danger-400' : 'text-white'}`}
        >
          <Timer size={20} className={timerUrgent ? 'text-danger-400' : 'text-slate-400'} />
          {timeLeft}s
        </motion.div>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-6 overflow-hidden">
        <motion.div
          animate={{ width: `${(timeLeft / GAME_DURATION) * 100}%` }}
          transition={{ duration: 0.3 }}
          className={`h-full rounded-full ${timerUrgent ? 'bg-danger-400' : 'bg-emerald-500'}`}
        />
      </div>

      {/* Target syllable */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ y: 30, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -30, opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.12 }}
          className="text-center mb-5"
        >
          <div className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">
            Type this syllable
          </div>
          <div className={`inline-flex flex-col items-center gap-1 px-10 py-6 rounded-2xl border transition-colors duration-150
            ${feedback === 'correct'
              ? 'bg-success-400/10 border-success-400/40'
              : feedback === 'wrong'
                ? 'bg-danger-400/10 border-danger-400/40'
                : 'bg-slate-800/50 border-slate-700/50'
            }`}
          >
            <span className={`hangul text-7xl font-black leading-none transition-colors duration-150
              ${feedback === 'correct'
                ? 'text-success-400'
                : feedback === 'wrong'
                  ? 'text-danger-400'
                  : 'text-white'
              }`}
            >
              {target?.char}
            </span>
            <div className="text-primary-400 font-semibold text-lg">{target?.roman}</div>
            <div className="text-slate-500 text-xs mt-1">
              <span className="hangul text-slate-400">{target?.components[0]}</span>
              <span className="text-slate-600 mx-1">+</span>
              <span className="hangul text-slate-400">{target?.components[1]}</span>
              {target?.components[2] && (
                <>
                  <span className="text-slate-600 mx-1">+</span>
                  <span className="hangul text-slate-400">{target?.components[2]}</span>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Current input indicator */}
      <div className="flex items-center justify-center gap-2 mb-5 h-10">
        {initial && medial && target?.components?.length === 3 ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2"
          >
            <span className="hangul text-2xl font-bold text-primary-400">
              {composeSyllable(initial, medial) || `${initial}${medial}`}
            </span>
            <span className="text-slate-600">+</span>
            <span className="text-slate-600 text-sm">...</span>
          </motion.div>
        ) : initial ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2"
          >
            <span className="hangul text-2xl font-bold text-primary-400">{initial}</span>
            <span className="text-slate-600">+</span>
            <span className="text-slate-600 text-sm">...</span>
          </motion.div>
        ) : (
          <span className="text-slate-600 text-sm">Tap a consonant to start</span>
        )}
      </div>

      {/* Feedback flash */}
      <AnimatePresence>
        {feedback === 'correct' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center mb-3"
          >
            <span className="text-success-400 font-medium text-sm">Correct!</span>
          </motion.div>
        )}
        {feedback === 'wrong' && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center mb-3"
          >
            <span className="text-danger-400 font-medium text-sm">Wrong — try again!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Virtual keyboard */}
      <div className="space-y-1.5 select-none">
        {KEYBOARD_ROWS.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex justify-center gap-1 sm:gap-1.5"
            style={{ paddingLeft: rowIndex === 1 ? '0.8rem' : rowIndex === 2 ? '1.6rem' : 0 }}
          >
            {row.map((key, keyIndex) => {
              const keyChar = key.normal
              const style = getKeyStyle(keyChar)
              const isVowelKey = isVowel(keyChar)

              return (
                <motion.button
                  key={`${rowIndex}-${keyIndex}`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => handleKeyPress(keyChar)}
                  className={`
                    hangul relative flex items-center justify-center
                    rounded-lg sm:rounded-xl border-2 cursor-pointer
                    font-bold text-lg sm:text-xl
                    w-8 h-10 sm:w-11 sm:h-12 md:w-12 md:h-14
                    transition-all duration-150
                    ${style}
                  `}
                >
                  {keyChar}
                  <span className={`absolute -bottom-0.5 text-[7px] font-normal
                    ${isVowelKey ? 'text-blue-500/40' : 'text-orange-500/40'}`}>
                    {isVowelKey ? '·' : ''}
                  </span>
                </motion.button>
              )
            })}
          </div>
        ))}
      </div>

      <p className="text-center text-slate-500 text-xs mt-4">
        Tap consonant, then vowel{progress?.stagesUnlocked?.includes(6) ? ', then final consonant for 받침' : ''}
      </p>
    </motion.div>
  )
}
