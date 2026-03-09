import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Zap, Trophy, Timer, Flame, RotateCcw } from 'lucide-react'
import confetti from 'canvas-confetti'
import { VOWELS_BASIC, CONSONANTS_BASIC, CONSONANTS_DOUBLE, VOWELS_COMPOUND, SYLLABLES_BASIC } from '../data/hangul'
import { updateTimedBest, recordSession } from '../store/progress'
import { speak, playCorrect, playWrong } from '../utils/audio'

const ALL_ITEMS = [
  ...VOWELS_BASIC,
  ...CONSONANTS_BASIC,
  ...CONSONANTS_DOUBLE,
  ...VOWELS_COMPOUND,
  ...SYLLABLES_BASIC,
]

const GAME_DURATION = 30

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function makeQuestion(allItems) {
  const item = allItems[Math.floor(Math.random() * allItems.length)]
  const char = item.char || item.word
  const roman = item.roman
  const type = Math.random() < 0.5 ? 'char_to_roman' : 'roman_to_char'

  if (type === 'char_to_roman') {
    const wrongs = shuffle(allItems.filter(l => l.roman !== roman)).slice(0, 3).map(l => l.roman)
    return { type, item, char, correct: roman, options: shuffle([roman, ...wrongs]) }
  }
  const wrongs = shuffle(allItems.filter(l => (l.char || l.word) !== char)).slice(0, 3).map(l => l.char || l.word)
  return { type, item, char, correct: char, options: shuffle([char, ...wrongs]) }
}

function calcScore(correct, streak) {
  return correct + Math.floor(streak * 0.5)
}

export default function TimedChallenge({ progress, updateProgress }) {
  const [gameState, setGameState] = useState('ready') // 'ready' | 'playing' | 'done'
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [question, setQuestion] = useState(() => makeQuestion(ALL_ITEMS))
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [totalAnswered, setTotalAnswered] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [flashOption, setFlashOption] = useState(null) // { option, correct: bool }
  const [isNewBest, setIsNewBest] = useState(false)
  const timerRef = useRef(null)
  const gameStateRef = useRef(gameState)
  const scoreRef = useRef(0)
  const streakRef = useRef(0)
  const correctRef = useRef(0)
  const totalRef = useRef(0)

  // Keep refs in sync
  gameStateRef.current = gameState
  scoreRef.current = score
  streakRef.current = streak
  correctRef.current = correctCount
  totalRef.current = totalAnswered

  const personalBest = progress?.timedBests?.blitz30?.score || 0

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
    }

    updateProgress(prev => {
      const next = { ...prev }
      return updateTimedBest(recordSession(next), 'blitz30', finalScore)
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
    setGameState('playing')
    setTimeLeft(GAME_DURATION)
    setScore(0)
    setStreak(0)
    setTotalAnswered(0)
    setCorrectCount(0)
    setQuestion(makeQuestion(ALL_ITEMS))
    setFlashOption(null)
    setIsNewBest(false)
    scoreRef.current = 0
    streakRef.current = 0
    correctRef.current = 0
    totalRef.current = 0
  }

  const handleAnswer = (option) => {
    if (gameStateRef.current !== 'playing' || flashOption) return

    const isCorrect = option === question.correct
    setTotalAnswered(t => t + 1)

    if (isCorrect) {
      const newStreak = streakRef.current + 1
      const points = 1 + Math.floor(newStreak * 0.5)
      setStreak(newStreak)
      streakRef.current = newStreak
      setScore(s => s + points)
      scoreRef.current += points
      setCorrectCount(c => c + 1)
      correctRef.current += 1
      playCorrect()
      // No delay -- next question immediately
      setQuestion(makeQuestion(ALL_ITEMS))
    } else {
      setStreak(0)
      streakRef.current = 0
      playWrong()
      setFlashOption({ option, correct: false })
      // Brief flash then next question
      setTimeout(() => {
        if (gameStateRef.current === 'playing') {
          setFlashOption(null)
          setQuestion(makeQuestion(ALL_ITEMS))
        }
      }, 300)
    }
  }

  const isHangulOptions = question.type !== 'char_to_roman'

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
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-500/30 mb-6"
          >
            <Zap size={40} className="text-amber-400" />
          </motion.div>

          <h1 className="text-3xl font-black text-white mb-2">Blitz Mode</h1>
          <p className="text-slate-400 mb-8">
            30 seconds. As many questions as you can. How high can you score?
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
                {personalBest > 0 ? personalBest : '---'}
              </div>
            </div>
          </motion.div>

          <div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-12 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500
                text-white font-bold text-lg border-0 cursor-pointer shadow-lg shadow-amber-500/25
                hover:shadow-amber-500/40 transition-shadow"
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
                <span className="text-white font-medium">30 seconds</span> on the clock. Answer fast!
              </span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Flame size={12} className="text-orange-400" />
              </div>
              <span className="text-slate-400">
                <span className="text-white font-medium">Streak bonus</span> — consecutive correct answers multiply your points
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
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0
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
              <Zap size={64} className="text-amber-400 mx-auto" />
            ) : (
              <Timer size={64} className="text-slate-500 mx-auto" />
            )}
          </div>
        )}

        <h1 className="text-3xl font-black text-white mb-2">
          {isNewBest ? 'Incredible!' : score > 10 ? 'Nice Run!' : 'Keep Going!'}
        </h1>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.15 }}
          className="text-6xl font-black mb-2"
          style={{ color: isNewBest ? '#fbbf24' : '#818cf8' }}
        >
          {score}
        </motion.div>
        <p className="text-slate-500 text-sm mb-6">points</p>

        {/* Stats row */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{correctCount}</div>
            <div className="text-xs text-slate-500">Correct</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalAnswered}</div>
            <div className="text-xs text-slate-500">Answered</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{accuracy}%</div>
            <div className="text-xs text-slate-500">Accuracy</div>
          </div>
        </div>

        {/* Personal best comparison */}
        {!isNewBest && personalBest > 0 && (
          <div className="text-sm text-slate-500 mb-6">
            Personal best: <span className="text-amber-400 font-bold">{personalBest}</span>
            {score > 0 && (
              <span className="text-slate-600"> ({personalBest - score} away)</span>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
            className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl
              bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold
              border-0 cursor-pointer shadow-lg shadow-amber-500/25"
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
  const timerUrgent = timeLeft <= 5

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-xl mx-auto px-4 py-6"
    >
      {/* Top bar: timer + score + streak */}
      <div className="flex items-center justify-between mb-6">
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

        {/* Streak */}
        <AnimatePresence>
          {streak >= 2 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="flex items-center gap-1 text-orange-400 font-bold text-sm px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30"
            >
              <Flame size={14} />
              <span>{streak}x</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score */}
        <motion.div
          key={score}
          initial={{ scale: 1.3, color: '#4ade80' }}
          animate={{ scale: 1, color: '#ffffff' }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 text-2xl font-black"
        >
          <Zap size={18} className="text-amber-400" />
          {score}
        </motion.div>
      </div>

      {/* Timer bar */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-8 overflow-hidden">
        <motion.div
          animate={{ width: `${(timeLeft / GAME_DURATION) * 100}%` }}
          transition={{ duration: 0.3 }}
          className={`h-full rounded-full ${timerUrgent ? 'bg-danger-400' : 'bg-primary-500'}`}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.char + question.type + totalAnswered}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          {/* Question prompt */}
          <div className="text-center mb-6">
            <div className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">
              {question.type === 'char_to_roman' ? 'What is the romanization?' : 'Which character is this?'}
            </div>
            {question.type === 'char_to_roman' ? (
              <div className="hangul text-7xl sm:text-8xl font-black text-white">{question.char}</div>
            ) : (
              <div className="text-4xl sm:text-5xl font-black text-primary-400">{question.item.roman}</div>
            )}
          </div>

          {/* Options grid */}
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((option, i) => {
              let style = 'bg-slate-800/80 border-slate-600/50 text-white hover:border-primary-400/50 hover:bg-slate-700/80'

              if (flashOption) {
                if (option === question.correct) {
                  style = 'bg-success-400/20 border-success-400/50 text-success-400'
                } else if (option === flashOption.option && !flashOption.correct) {
                  style = 'bg-danger-400/20 border-danger-400/50 text-danger-400'
                } else {
                  style = 'bg-slate-800/40 border-slate-700/30 text-slate-600'
                }
              }

              return (
                <motion.button
                  key={option + i}
                  whileHover={!flashOption ? { scale: 1.03 } : {}}
                  whileTap={!flashOption ? { scale: 0.97 } : {}}
                  onClick={() => handleAnswer(option)}
                  disabled={!!flashOption}
                  className={`p-4 rounded-xl border-2 font-semibold cursor-pointer
                    transition-all duration-100 ${style} disabled:cursor-default
                    ${isHangulOptions ? 'hangul text-2xl' : 'text-lg'}
                    active:scale-95`}
                >
                  {option}
                </motion.button>
              )
            })}
          </div>

          {/* Streak bonus indicator */}
          <AnimatePresence>
            {streak >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center mt-4 text-xs text-orange-400/70"
              >
                Streak bonus: +{Math.floor(streak * 0.5)} per correct answer
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
