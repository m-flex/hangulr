import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, ChevronRight, BookOpen, Volume2 } from 'lucide-react'
import confetti from 'canvas-confetti'
import { SENTENCES } from '../data/hangul'
import { addXp, recordSession } from '../store/progress'
import { speak, playCorrect, playWrong } from '../utils/audio'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function SentencePractice({ progress, updateProgress }) {
  const [challenges] = useState(() => shuffle(SENTENCES).slice(0, 8))
  const [cIndex, setCIndex] = useState(0)
  const [slots, setSlots] = useState([])        // placed words in order
  const [result, setResult] = useState(null)     // 'correct' | 'wrong' | null
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const challenge = challenges[cIndex]
  const total = challenges.length

  // Scrambled word cards for the current challenge
  const scrambled = useMemo(() => shuffle(challenge.korean), [cIndex])

  // Words still available in the pool (not yet placed)
  const pool = scrambled.filter(word => {
    // Count how many times this word appears in scrambled vs slots
    const inSlots = slots.filter(w => w === word).length
    const inScrambled = scrambled.filter(w => w === word).length
    // Show remaining copies
    const remaining = inScrambled - inSlots
    return remaining > 0
  })

  // More precise pool calculation: track by index
  const poolWords = useMemo(() => {
    const used = [...slots]
    return scrambled.filter(word => {
      const idx = used.indexOf(word)
      if (idx !== -1) {
        used.splice(idx, 1)
        return false
      }
      return true
    })
  }, [scrambled, slots])

  const handlePlaceWord = (word) => {
    if (result) return
    if (slots.length >= challenge.korean.length) return
    speak(word)
    setSlots(prev => [...prev, word])
  }

  const handleRemoveWord = (index) => {
    if (result) return
    setSlots(prev => prev.filter((_, i) => i !== index))
  }

  const handleCheck = () => {
    if (slots.length !== challenge.korean.length) return

    const isCorrect = slots.every((word, i) => word === challenge.korean[i])
    setResult(isCorrect ? 'correct' : 'wrong')

    if (isCorrect) {
      setScore(s => s + 1)
      playCorrect()
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } })
      updateProgress(prev => addXp({ ...prev }, 5))
      speak(challenge.korean.join(' '))

      setTimeout(() => {
        if (cIndex + 1 >= total) {
          updateProgress(prev => recordSession({ ...prev }))
          setDone(true)
        } else {
          setCIndex(i => i + 1)
          setSlots([])
          setResult(null)
        }
      }, 1500)
    } else {
      playWrong()
    }
  }

  const handleContinueAfterWrong = () => {
    if (cIndex + 1 >= total) {
      updateProgress(prev => recordSession({ ...prev }))
      setDone(true)
    } else {
      setCIndex(i => i + 1)
      setSlots([])
      setResult(null)
    }
  }

  const handleReset = () => {
    if (result) return
    setSlots([])
  }

  const restart = () => {
    setCIndex(0)
    setSlots([])
    setResult(null)
    setScore(0)
    setDone(false)
  }

  // ── Results screen ──
  if (done) {
    const pct = Math.round((score / total) * 100)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto px-4 py-16 text-center"
      >
        <div className="text-6xl mb-4">{pct >= 70 ? '🎉' : '💪'}</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {pct >= 70 ? 'Great Sentences!' : 'Keep Practicing!'}
        </h1>
        <div className="text-5xl font-black mb-2" style={{ color: pct >= 70 ? '#22c55e' : '#f59e0b' }}>
          {pct}%
        </div>
        <p className="text-slate-400 mb-8">{score} of {total} sentences built correctly</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={restart}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white border-0 cursor-pointer font-medium">
            <RotateCcw size={16} /> Try Again
          </motion.button>
          <Link to="/stages">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white border-0 cursor-pointer font-medium w-full">
              Back to Stages
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  // ── Main exercise ──
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/stages" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors no-underline text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <span className="text-sm text-slate-400">{cIndex + 1}/{total}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-8 overflow-hidden">
        <motion.div animate={{ width: `${((cIndex + 1) / total) * 100}%` }}
          className="h-full bg-primary-500 rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={cIndex}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
        >
          {/* English prompt */}
          <div className="text-center mb-2">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-3">
              <BookOpen size={14} />
              <span>Build the sentence</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {challenge.english}
            </h2>
            {challenge.hint && (
              <p className="text-sm text-slate-500 italic">{challenge.hint}</p>
            )}
          </div>

          {/* Answer slots */}
          <div className="mt-8 mb-6">
            <div className="text-xs text-slate-500 mb-2 font-medium">Your answer:</div>
            <div className="flex flex-wrap gap-2 justify-center min-h-[3.5rem] p-3 rounded-2xl border-2 border-dashed border-slate-700/50 bg-slate-800/30">
              {challenge.korean.map((_, i) => (
                <motion.div
                  key={i}
                  layout
                  className={`min-w-[3.5rem] h-12 rounded-xl border-2 flex items-center justify-center px-3 transition-all
                    ${slots[i]
                      ? (result === 'correct'
                          ? 'border-success-400 bg-success-400/10'
                          : result === 'wrong'
                            ? (slots[i] === challenge.korean[i]
                                ? 'border-success-400 bg-success-400/10'
                                : 'border-danger-400 bg-danger-400/10')
                            : 'border-primary-400 bg-primary-400/10 cursor-pointer hover:border-primary-300')
                      : 'border-slate-600/50 bg-slate-800/50'
                    }`}
                  onClick={() => slots[i] && handleRemoveWord(i)}
                >
                  {slots[i] ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="hangul text-lg font-bold text-white"
                    >
                      {slots[i]}
                    </motion.span>
                  ) : (
                    <span className="text-slate-600 text-sm">{i + 1}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Correct answer feedback (on wrong) */}
          <AnimatePresence>
            {result === 'wrong' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="flex items-center justify-center gap-2 text-sm text-danger-400 mb-2">
                  <XCircle size={14} />
                  <span>Correct order:</span>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {challenge.korean.map((word, i) => (
                    <span
                      key={i}
                      className="hangul text-lg font-bold text-success-400 px-3 py-1 rounded-lg bg-success-400/10 border border-success-400/30"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Correct answer feedback */}
          <AnimatePresence>
            {result === 'correct' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 text-success-400 mb-4"
              >
                <CheckCircle size={20} />
                <span className="font-semibold">Perfect!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Word card pool */}
          <div className="mb-6">
            <div className="text-xs text-slate-500 mb-2 font-medium">Tap to place:</div>
            <div className="flex flex-wrap gap-2 justify-center min-h-[3rem]">
              <AnimatePresence>
                {poolWords.map((word, i) => (
                  <motion.button
                    key={`${word}-${i}`}
                    layout
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handlePlaceWord(word)}
                    disabled={!!result}
                    className="hangul text-lg font-bold px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50
                      text-white cursor-pointer hover:border-accent-400/50 hover:bg-slate-700/50
                      transition-colors disabled:opacity-40 disabled:cursor-default"
                  >
                    {word}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3">
            {result === 'wrong' ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => speak(challenge.korean.join(' '))}
                  className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600
                    text-white border-0 cursor-pointer font-medium text-sm flex items-center gap-2"
                >
                  <Volume2 size={14} /> Listen
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleContinueAfterWrong}
                  className="px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-500
                    text-white border-0 cursor-pointer font-semibold text-sm flex items-center gap-2"
                >
                  Continue <ChevronRight size={14} />
                </motion.button>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  disabled={slots.length === 0 || !!result}
                  className="px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-30
                    text-white border-0 cursor-pointer font-medium text-sm flex items-center gap-2
                    disabled:cursor-default"
                >
                  <RotateCcw size={14} /> Reset
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCheck}
                  disabled={slots.length !== challenge.korean.length || !!result}
                  className="px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40
                    text-white border-0 cursor-pointer font-semibold text-sm flex items-center gap-2
                    disabled:cursor-default"
                >
                  Check <ChevronRight size={14} />
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
