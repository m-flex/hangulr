import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Target, CheckCircle, RotateCcw } from 'lucide-react'
import confetti from 'canvas-confetti'
import { VOWELS_BASIC, CONSONANTS_BASIC, CONSONANTS_DOUBLE, VOWELS_COMPOUND } from '../data/hangul'
import { addXp, recordAnswer, recordSession } from '../store/progress'
import { speak, playCorrect, playWrong } from '../utils/audio'

const ALL_CHARS = [...VOWELS_BASIC, ...CONSONANTS_BASIC, ...CONSONANTS_DOUBLE, ...VOWELS_COMPOUND]
const charLookup = {}
ALL_CHARS.forEach(c => { charLookup[c.char] = c })

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getWeakChars(mastery, count = 10) {
  const entries = Object.entries(mastery)
    .filter(([, m]) => m.seen >= 1)
    .map(([char, m]) => ({
      char,
      accuracy: m.seen > 0 ? m.correct / m.seen : 0,
      easiness: m.easinessFactor || 2.5,
      seen: m.seen,
    }))
  // Sort by accuracy (lowest first), then by easiness (lowest first)
  entries.sort((a, b) => a.accuracy - b.accuracy || a.easiness - b.easiness)
  return entries.slice(0, count)
}

function makeQuestion(charData, allChars) {
  const roman = charData.roman
  const wrongs = shuffle(allChars.filter(c => c.roman !== roman)).slice(0, 3).map(c => c.roman)
  return {
    char: charData.char,
    correct: roman,
    options: shuffle([roman, ...wrongs]),
    letter: charData,
    isRetry: false,
  }
}

function buildQuestions(weakChars) {
  const questions = []
  for (const entry of weakChars) {
    const data = charLookup[entry.char]
    if (!data) continue
    questions.push(makeQuestion(data, ALL_CHARS))
  }
  return shuffle(questions)
}

export default function WeakLetterDrill({ progress, updateProgress }) {
  const mastery = progress?.mastery || {}
  const weakChars = useMemo(() => getWeakChars(mastery), [mastery])
  const learnedCount = Object.keys(mastery).filter(k => mastery[k].seen >= 1).length

  const [questions, setQuestions] = useState(() => buildQuestions(weakChars))
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const startTime = useRef(Date.now())

  // Not enough characters learned
  if (learnedCount < 5) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto px-4 py-16 text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-800/50 border border-slate-700/50 mb-6">
          <Target size={40} className="text-slate-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Learn more characters first!</h1>
        <p className="text-slate-400 mb-8">
          You need to practice at least 5 characters before Weak Letter Drill becomes available.
          You've learned {learnedCount} so far.
        </p>
        <Link to="/stages">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium border-0 cursor-pointer"
          >
            Go to Stages
          </motion.button>
        </Link>
      </motion.div>
    )
  }

  // No questions could be built (edge case)
  if (questions.length === 0 && !done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto px-4 py-16 text-center"
      >
        <h1 className="text-2xl font-bold text-white mb-3">No weak characters found</h1>
        <p className="text-slate-400 mb-8">Great job — all your characters look strong!</p>
        <Link to="/stages">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium border-0 cursor-pointer"
          >
            Back to Stages
          </motion.button>
        </Link>
      </motion.div>
    )
  }

  const q = questions[qIndex]
  const totalQ = questions.length

  const handleSelect = (option) => {
    if (selected !== null) return
    setSelected(option)
    setShowResult(true)
    const isCorrect = option === q.correct

    if (isCorrect) {
      setCorrectCount(c => c + 1)
      setXpEarned(x => x + 5)
      playCorrect()
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 }, colors: ['#22c55e', '#4ade80'] })
    } else {
      playWrong()
      // Re-insert wrong answer 2-3 positions later
      if (!q.isRetry) {
        setQuestions(prev => {
          const copy = [...prev]
          const data = charLookup[q.char]
          if (data) {
            const retry = makeQuestion(data, ALL_CHARS)
            retry.isRetry = true
            const insertAt = Math.min(qIndex + 2 + Math.floor(Math.random() * 2), copy.length)
            copy.splice(insertAt, 0, retry)
          }
          return copy
        })
      }
    }

    setTimeout(() => speak(q.char), 300)
    updateProgress(prev => recordAnswer({ ...prev }, q.char, isCorrect))

    setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        setDone(true)
        const finalCorrect = correctCount + (isCorrect ? 1 : 0)
        const finalXp = xpEarned + (isCorrect ? 5 : 0)
        if (finalCorrect >= Math.ceil(questions.length * 0.7)) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } })
        }
        updateProgress(prev => {
          const next = { ...prev }
          return addXp(recordSession(next), finalXp)
        })
      } else {
        setQIndex(i => i + 1)
        setSelected(null)
        setShowResult(false)
      }
    }, 1500)
  }

  const restart = () => {
    const fresh = getWeakChars(progress?.mastery || {})
    setQuestions(buildQuestions(fresh))
    setQIndex(0)
    setSelected(null)
    setShowResult(false)
    setCorrectCount(0)
    setDone(false)
    setXpEarned(0)
    startTime.current = Date.now()
  }

  // ── Results screen ──
  if (done) {
    const score = Math.round((correctCount / totalQ) * 100)
    const passed = score >= 70

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto px-4 py-16 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 mb-4">
          <Target size={32} className={passed ? 'text-green-400' : 'text-amber-400'} />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {passed ? 'Great Progress!' : 'Keep at it!'}
        </h1>
        <div className="text-5xl font-black mb-2" style={{ color: passed ? '#22c55e' : '#f59e0b' }}>
          {score}%
        </div>
        <p className="text-slate-400 mb-1">
          {correctCount} out of {totalQ} correct
        </p>
        <p className="text-primary-400 text-sm font-medium mb-1">
          +{xpEarned} XP earned
        </p>
        <p className="text-slate-500 text-sm mb-8">
          Focused on your weakest characters
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={restart}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
              bg-slate-700 hover:bg-slate-600 text-white border-0 cursor-pointer font-medium"
          >
            <RotateCcw size={16} /> Retry Weak Letters
          </motion.button>
          <Link to="/stages">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                bg-primary-600 hover:bg-primary-500 text-white border-0 cursor-pointer font-medium w-full"
            >
              Back to Stages
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  // ── Quiz screen ──
  // Build accuracy label for current character
  const charMastery = mastery[q.char]
  const charAccuracy = charMastery && charMastery.seen > 0
    ? Math.round((charMastery.correct / charMastery.seen) * 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/stages"
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors no-underline text-sm"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-slate-400">
            <Target size={14} className="text-red-400" />
            Weak Letter Drill
          </div>
          <span className="text-sm text-slate-400">{qIndex + 1}/{questions.length}</span>
        </div>
      </div>

      {/* Accuracy stat for current char */}
      <div className="text-center mb-2">
        <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-slate-400">
          Your accuracy: <span className={charAccuracy < 50 ? 'text-red-400' : charAccuracy < 75 ? 'text-amber-400' : 'text-green-400'}>{charAccuracy}%</span>
          <span className="text-slate-600">({charMastery?.correct || 0}/{charMastery?.seen || 0})</span>
        </span>
      </div>

      {/* Retry badge */}
      {q.isRetry && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400">
            <RotateCcw size={10} /> Retry — you missed this one earlier
          </span>
        </motion.div>
      )}

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-8 overflow-hidden">
        <motion.div
          animate={{ width: `${((qIndex + 1) / questions.length) * 100}%` }}
          className="h-full bg-red-500 rounded-full"
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-center mb-8">
            <div className="text-sm text-slate-400 mb-2">What is the romanization of:</div>
            <div className="hangul text-7xl sm:text-8xl font-black text-white mb-3">{q.char}</div>

            {q.letter.hint && !showResult && (
              <div className="text-sm text-slate-500">{q.letter.hint}</div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {q.options.map((option, i) => {
              let style = 'bg-slate-800/80 border-slate-600/50 text-white hover:border-primary-400/50'
              if (showResult && option === q.correct)
                style = 'bg-green-500/20 border-green-500/50 text-green-400'
              else if (showResult && option === selected && option !== q.correct)
                style = 'bg-red-500/20 border-red-500/50 text-red-400'

              return (
                <motion.button
                  key={option + i}
                  whileHover={selected === null ? { scale: 1.03 } : {}}
                  whileTap={selected === null ? { scale: 0.97 } : {}}
                  onClick={() => handleSelect(option)}
                  disabled={selected !== null}
                  className={`p-4 rounded-xl border font-semibold cursor-pointer
                    transition-all ${style} disabled:cursor-default text-lg`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {showResult && option === q.correct && <CheckCircle size={18} />}
                    {option}
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Answer details */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center"
            >
              <div className="text-sm text-slate-400">
                <span className="hangul text-lg text-white">{q.char}</span>
                {' = '}
                <span className="text-primary-400 font-medium">{q.letter.roman}</span>
              </div>
              {q.letter.mnemonic && (
                <div className="text-xs text-slate-500 mt-1 bg-slate-800/50 inline-block px-3 py-1 rounded-lg">
                  {q.letter.mnemonic}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
