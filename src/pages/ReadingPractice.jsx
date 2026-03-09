import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, BookOpen, Eye, ThumbsUp, ThumbsDown, RotateCcw, Volume2 } from 'lucide-react'
import { WORDS, SENTENCES, SYLLABLES_BASIC } from '../data/hangul'
import { addXp, recordSession } from '../store/progress'
import { speak, playCorrect } from '../utils/audio'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildPool() {
  const items = []
  // Add words
  WORDS.forEach(w => items.push({
    type: 'word',
    display: w.word,
    roman: w.roman,
    meaning: w.meaning,
    speakText: w.word,
  }))
  // Add sentences
  SENTENCES.forEach(s => items.push({
    type: 'sentence',
    display: s.korean.join(' '),
    roman: null,
    meaning: s.english,
    speakText: s.korean.join(' '),
  }))
  // Add some syllables
  SYLLABLES_BASIC.forEach(s => items.push({
    type: 'syllable',
    display: s.char,
    roman: s.roman,
    meaning: null,
    speakText: s.char,
  }))
  return shuffle(items).slice(0, 8)
}

const TOTAL_ROUNDS = 8
const XP_PER_CORRECT = 5

export default function ReadingPractice({ progress, updateProgress }) {
  const [pool] = useState(() => buildPool())
  const [round, setRound] = useState(0)
  const [phase, setPhase] = useState('reading') // 'reading' | 'revealed'
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const item = pool[round]
  const total = pool.length

  const handleReveal = () => {
    setPhase('revealed')
    speak(item.speakText)
  }

  const handleKnew = () => {
    setScore(s => s + 1)
    playCorrect()
    updateProgress(prev => addXp({ ...prev }, XP_PER_CORRECT))
    advance()
  }

  const handleDidntKnow = () => {
    advance()
  }

  const advance = () => {
    if (round + 1 >= total) {
      updateProgress(prev => recordSession({ ...prev }))
      setDone(true)
    } else {
      setRound(r => r + 1)
      setPhase('reading')
    }
  }

  const restart = () => {
    setRound(0)
    setPhase('reading')
    setScore(0)
    setDone(false)
  }

  // ── Results screen ──
  if (done) {
    const pct = Math.round((score / total) * 100)
    const earnedXp = score * XP_PER_CORRECT
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto px-4 py-16 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary-600/20 border border-primary-500/30 mb-6"
        >
          <BookOpen size={40} className="text-primary-400" />
        </motion.div>

        <h1 className="text-3xl font-bold text-white mb-2">
          {pct >= 70 ? 'Well Read!' : 'Keep Practicing!'}
        </h1>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.15 }}
          className="text-5xl font-black mb-2"
          style={{ color: pct >= 70 ? '#22c55e' : '#f59e0b' }}
        >
          {pct}%
        </motion.div>
        <p className="text-slate-400 mb-2">{score} of {total} correct</p>
        <p className="text-sm text-amber-400 font-medium mb-8">+{earnedXp} XP earned</p>

        {/* Stats row */}
        <div className="flex justify-center gap-6 mb-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{score}</div>
            <div className="text-xs text-slate-500">Knew it</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{total - score}</div>
            <div className="text-xs text-slate-500">Didn't know</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{total}</div>
            <div className="text-xs text-slate-500">Total</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={restart}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
              bg-slate-700 hover:bg-slate-600 text-white border-0 cursor-pointer font-medium"
          >
            <RotateCcw size={16} /> Try Again
          </motion.button>
          <Link to="/stages">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                bg-primary-600 hover:bg-primary-500 text-white border-0 cursor-pointer font-medium w-full"
            >
              <ArrowLeft size={16} /> Back to Stages
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  // ── Main reading practice ──
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
        <span className="text-sm text-slate-400">{round + 1}/{total}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-8 overflow-hidden">
        <motion.div
          animate={{ width: `${((round + 1) / total) * 100}%` }}
          className="h-full bg-primary-500 rounded-full"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={round}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
        >
          {/* Type badge */}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-6">
            <BookOpen size={14} />
            <span>
              {item.type === 'word' && 'Read the word'}
              {item.type === 'sentence' && 'Read the sentence'}
              {item.type === 'syllable' && 'Read the syllable'}
            </span>
          </div>

          {/* Korean text display */}
          <div className="text-center mb-8">
            <div className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700/50">
              <div
                className={`hangul font-black text-white ${
                  item.type === 'sentence' ? 'text-4xl sm:text-5xl' : 'text-6xl sm:text-8xl'
                }`}
              >
                {item.display}
              </div>
            </div>
          </div>

          {/* Revealed info */}
          <AnimatePresence>
            {phase === 'revealed' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/50 space-y-3">
                  {item.roman && (
                    <div className="text-center">
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Romanization</div>
                      <div className="text-2xl font-bold text-primary-400">{item.roman}</div>
                    </div>
                  )}
                  {item.meaning && (
                    <div className="text-center">
                      <div className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Meaning</div>
                      <div className="text-xl font-semibold text-white">{item.meaning}</div>
                    </div>
                  )}
                  <div className="flex justify-center pt-1">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => speak(item.speakText)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600
                        text-white border-0 cursor-pointer font-medium text-sm"
                    >
                      <Volume2 size={14} /> Listen again
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-3">
            {phase === 'reading' ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReveal}
                className="flex items-center justify-center gap-2 px-10 py-4 rounded-xl
                  bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold text-lg
                  border-0 cursor-pointer shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-shadow"
              >
                <Eye size={20} /> Reveal
              </motion.button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleKnew}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                    bg-success-500/20 border-2 border-success-500/40 text-success-400
                    hover:bg-success-500/30 hover:border-success-400/60
                    font-semibold cursor-pointer transition-colors"
                >
                  <ThumbsUp size={16} /> I knew it
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDidntKnow}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                    bg-danger-500/20 border-2 border-danger-500/40 text-danger-400
                    hover:bg-danger-500/30 hover:border-danger-400/60
                    font-semibold cursor-pointer transition-colors"
                >
                  <ThumbsDown size={16} /> I didn't know
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
