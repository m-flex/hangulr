import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Volume2, CheckCircle, RotateCcw, Ear } from 'lucide-react'
import confetti from 'canvas-confetti'
import { VOWELS_BASIC, CONSONANTS_BASIC, WORDS, SYLLABLES_BASIC } from '../data/hangul'
import { addXp, recordAnswer, recordSession } from '../store/progress'
import { speak, playCorrect, playWrong } from '../utils/audio'

// ── Helpers ─────────────────────

const TOTAL_ROUNDS = 10

const ALL_ITEMS = [
  ...VOWELS_BASIC.map(v => ({ char: v.char, roman: v.roman, type: 'letter' })),
  ...CONSONANTS_BASIC.map(c => ({ char: c.char, roman: c.roman, type: 'letter' })),
  ...SYLLABLES_BASIC.map(s => ({ char: s.char, roman: s.roman, type: 'syllable' })),
  ...WORDS.map(w => ({ char: w.word, roman: w.roman, type: 'word', meaning: w.meaning })),
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateQuestions() {
  const shuffled = shuffle(ALL_ITEMS)
  const selected = shuffled.slice(0, TOTAL_ROUNDS)

  return selected.map(item => {
    // Pick 3 wrong options of the same type preferably
    const sameType = ALL_ITEMS.filter(i => i.char !== item.char && i.type === item.type)
    const otherType = ALL_ITEMS.filter(i => i.char !== item.char && i.type !== item.type)

    let wrongPool = shuffle(sameType)
    if (wrongPool.length < 3) {
      wrongPool = [...wrongPool, ...shuffle(otherType)]
    }
    const wrongs = wrongPool.slice(0, 3)
    const options = shuffle([item, ...wrongs])

    return {
      answer: item,
      options,
    }
  })
}

const SPEEDS = [
  { label: 'Slow', rate: 0.5, icon: '🐢' },
  { label: 'Normal', rate: 0.75, icon: '🚶' },
  { label: 'Fast', rate: 1.0, icon: '🏃' },
]

export default function ListeningDrill({ progress, updateProgress }) {
  const [questions] = useState(generateQuestions)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [selectedSpeed, setSelectedSpeed] = useState(1) // index into SPEEDS, default Normal
  const [result, setResult] = useState(null) // 'correct' | 'wrong' | null
  const [selectedOption, setSelectedOption] = useState(null)
  const [gameState, setGameState] = useState('playing') // 'playing' | 'done'
  const [hasPlayed, setHasPlayed] = useState(false)

  const currentQuestion = questions[currentIndex]
  const rate = SPEEDS[selectedSpeed].rate

  const handlePlay = useCallback(() => {
    speak(currentQuestion.answer.char, rate)
    setHasPlayed(true)
  }, [currentQuestion, rate])

  const handleOptionSelect = useCallback((option) => {
    if (result) return
    if (!hasPlayed) return // must listen first

    setSelectedOption(option)

    if (option.char === currentQuestion.answer.char) {
      setResult('correct')
      setCorrectCount(c => c + 1)
      playCorrect()

      updateProgress(prev => {
        let next = { ...prev }
        next = recordAnswer(next, currentQuestion.answer.char, true)
        return next
      })

      confetti({ particleCount: 25, spread: 40, origin: { y: 0.6 } })

      // Auto-advance after delay
      setTimeout(() => {
        advanceToNext()
      }, 1000)
    } else {
      setResult('wrong')
      playWrong()

      updateProgress(prev => {
        let next = { ...prev }
        next = recordAnswer(next, currentQuestion.answer.char, false)
        return next
      })
    }
  }, [result, hasPlayed, currentQuestion])

  const advanceToNext = useCallback(() => {
    if (currentIndex + 1 >= TOTAL_ROUNDS) {
      setGameState('done')
      updateProgress(prev => {
        let next = { ...prev }
        next = addXp(next, 10)
        return recordSession(next)
      })
    } else {
      setCurrentIndex(i => i + 1)
      setResult(null)
      setSelectedOption(null)
      setHasPlayed(false)
    }
  }, [currentIndex, updateProgress])

  const handleContinueAfterWrong = useCallback(() => {
    advanceToNext()
  }, [advanceToNext])

  const restart = () => {
    window.location.reload()
  }

  // ── Results screen ──
  if (gameState === 'done') {
    const accuracy = Math.round((correctCount / TOTAL_ROUNDS) * 100)
    if (accuracy >= 70) {
      confetti({
        particleCount: accuracy >= 90 ? 120 : 60,
        spread: 80,
        origin: { y: 0.5 },
      })
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto px-4 py-16 text-center"
      >
        <div className="text-6xl mb-4">{accuracy >= 70 ? '👂' : '💪'}</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {accuracy >= 90 ? 'Excellent Ears!' : accuracy >= 70 ? 'Good Listening!' : 'Keep Practicing!'}
        </h1>
        <div className="text-5xl font-black mb-2" style={{
          color: accuracy >= 90 ? '#4ade80' : accuracy >= 70 ? '#60a5fa' : '#fbbf24'
        }}>
          {accuracy}%
        </div>
        <p className="text-slate-400 mb-2">{correctCount} of {TOTAL_ROUNDS} correct</p>
        <p className="text-slate-500 text-sm mb-2">Speed: {SPEEDS[selectedSpeed].icon} {SPEEDS[selectedSpeed].label}</p>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-400 text-sm font-medium mb-8"
        >
          +{10 + correctCount * 3} XP earned
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={restart}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white border-0 cursor-pointer font-medium">
            <RotateCcw size={16} /> Try Again
          </motion.button>
          <Link to="/">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white border-0 cursor-pointer font-medium w-full">
              <ArrowLeft size={16} /> Back to Home
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  // ── Playing screen ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors no-underline text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex items-center gap-2">
          <Ear size={16} className="text-primary-400" />
          <span className="text-sm text-slate-400">{currentIndex + 1}/{TOTAL_ROUNDS}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-6 overflow-hidden">
        <motion.div
          animate={{ width: `${(currentIndex / TOTAL_ROUNDS) * 100}%` }}
          className="h-full bg-primary-500 rounded-full"
        />
      </div>

      {/* Speed selector */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {SPEEDS.map((speed, i) => (
          <motion.button
            key={speed.label}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedSpeed(i)}
            className={`px-4 py-2 rounded-xl border-2 cursor-pointer font-medium text-sm transition-all
              ${selectedSpeed === i
                ? 'bg-primary-500/20 border-primary-400/60 text-primary-400'
                : 'bg-slate-800/60 border-slate-600/40 text-slate-400 hover:border-slate-500/50'
              }`}
          >
            {speed.icon} {speed.label}
          </motion.button>
        ))}
      </div>

      {/* Speaker button */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="text-center mb-8"
        >
          <div className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-4">
            Listen and choose
          </div>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlay}
            className={`
              w-28 h-28 rounded-full border-2 cursor-pointer
              flex flex-col items-center justify-center gap-1 mx-auto
              transition-all duration-200
              ${hasPlayed
                ? 'bg-primary-500/15 border-primary-400/50 text-primary-400'
                : 'bg-slate-800/80 border-slate-600/50 text-slate-300 animate-pulse'
              }
            `}
          >
            <Volume2 size={32} />
            <span className="text-xs font-medium">
              {hasPlayed ? 'Replay' : 'Listen'}
            </span>
          </motion.button>

          {!hasPlayed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-slate-500 text-xs mt-3"
            >
              Tap to listen before choosing
            </motion.p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Options grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {currentQuestion.options.map((option, i) => {
          const isSelected = selectedOption?.char === option.char
          const isCorrectOption = option.char === currentQuestion.answer.char

          let optionStyle = 'bg-slate-800/60 border-slate-600/40 text-white hover:bg-slate-700/60 hover:border-primary-400/40'

          if (result === 'correct' && isSelected) {
            optionStyle = 'bg-success-400/15 border-success-400/60 text-success-400'
          } else if (result === 'wrong') {
            if (isSelected) {
              optionStyle = 'bg-danger-400/15 border-danger-400/60 text-danger-400'
            } else if (isCorrectOption) {
              optionStyle = 'bg-success-400/15 border-success-400/60 text-success-400 animate-pulse'
            }
          }

          if (!hasPlayed) {
            optionStyle = 'bg-slate-800/40 border-slate-700/30 text-slate-600 cursor-not-allowed'
          }

          return (
            <motion.button
              key={`${currentIndex}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={!result && hasPlayed ? { scale: 1.03 } : {}}
              whileTap={!result && hasPlayed ? { scale: 0.97 } : {}}
              onClick={() => handleOptionSelect(option)}
              disabled={!!result || !hasPlayed}
              className={`
                flex flex-col items-center justify-center gap-1
                px-4 py-5 rounded-2xl border-2 cursor-pointer
                transition-all duration-150
                disabled:cursor-default
                ${optionStyle}
              `}
            >
              <span className="hangul text-3xl sm:text-4xl font-black leading-none">
                {option.char}
              </span>
              <span className="text-xs text-slate-500 mt-1">{option.roman}</span>
              {option.meaning && (
                <span className="text-[10px] text-slate-600">{option.meaning}</span>
              )}

              {/* Correct/wrong indicators */}
              {result === 'correct' && isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle size={16} className="text-success-400 mt-1" />
                </motion.div>
              )}
              {result === 'wrong' && isCorrectOption && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle size={16} className="text-success-400 mt-1" />
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Feedback area */}
      <AnimatePresence>
        {result === 'correct' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-center mb-4">
            <span className="text-success-400 font-medium text-sm flex items-center justify-center gap-1">
              <CheckCircle size={14} /> Correct!
            </span>
          </motion.div>
        )}
        {result === 'wrong' && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-center mb-4 space-y-2">
            <p className="text-danger-400 text-sm">
              The answer was <span className="hangul font-bold text-white">{currentQuestion.answer.char}</span>
              <span className="text-slate-400 ml-1">({currentQuestion.answer.roman})</span>
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleContinueAfterWrong}
              className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white
                border-0 cursor-pointer font-medium text-sm inline-flex items-center gap-2"
            >
              Continue
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-sm">
          <div className="w-2 h-2 rounded-full bg-success-400" />
          <span className="text-slate-400">{correctCount}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <div className="w-2 h-2 rounded-full bg-danger-400" />
          <span className="text-slate-400">{currentIndex - correctCount + (result === 'wrong' ? 0 : 0)}</span>
        </div>
      </div>
    </motion.div>
  )
}
