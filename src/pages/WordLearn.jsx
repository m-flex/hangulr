import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Volume2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import confetti from 'canvas-confetti'
import { WORDS } from '../data/hangul'
import { recordAnswer } from '../store/progress'
import { speak, playCorrect, playWrong } from '../utils/audio'

const CATEGORIES = [...new Set(WORDS.map(w => w.category))]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function WordLearn({ progress, updateProgress }) {
  const [mode, setMode] = useState('browse')
  const [category, setCategory] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showMeaning, setShowMeaning] = useState(false)
  const [input, setInput] = useState('')
  const [quizResult, setQuizResult] = useState(null)
  const [score, setScore] = useState(0)

  const words = useMemo(() => {
    const filtered = category ? WORDS.filter(w => w.category === category) : WORDS
    return mode === 'quiz' ? shuffle(filtered) : filtered
  }, [category, mode])

  const word = words[currentIndex]

  const checkAnswer = () => {
    if (!input.trim()) return
    const correct = input.trim().toLowerCase() === word.roman.toLowerCase()
    setQuizResult(correct ? 'correct' : 'wrong')

    if (correct) {
      setScore(s => s + 1)
      playCorrect()
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 } })
    } else {
      playWrong()
    }

    // Always speak the word after answering
    setTimeout(() => speak(word.word, 0.7), 400)

    updateProgress(prev => {
      const next = { ...prev }
      const updated = recordAnswer(next, word.word, correct)
      updated.stageProgress = { ...updated.stageProgress }
      updated.stageProgress[5] = Math.max(updated.stageProgress[5] || 0,
        Math.round((Object.keys(updated.mastery).filter(k => WORDS.some(w => w.word === k)).length / WORDS.length) * 100)
      )
      return updated
    })

    setTimeout(() => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex(i => i + 1)
        setInput('')
        setQuizResult(null)
      }
    }, 1800)
  }

  const reset = () => {
    setCurrentIndex(0)
    setInput('')
    setQuizResult(null)
    setScore(0)
    setShowMeaning(false)
  }

  const nav = (dir) => {
    const next = currentIndex + dir
    if (next < 0 || next >= words.length) return
    setCurrentIndex(next)
    setInput('')
    setQuizResult(null)
    setShowMeaning(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-xl mx-auto px-4 py-8"
    >
      <div className="flex items-center justify-between mb-6">
        <Link to="/stages" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors no-underline text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="text-sm text-slate-400">{currentIndex + 1}/{words.length}</div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-4">Korean Words</h1>

      {/* Mode & Category selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setMode('browse'); reset() }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer transition-colors
            ${mode === 'browse' ? 'bg-primary-600 border-primary-500 text-white' : 'bg-transparent border-slate-600 text-slate-400 hover:text-white'}`}
        >
          Browse
        </button>
        <button
          onClick={() => { setMode('quiz'); reset() }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border cursor-pointer transition-colors
            ${mode === 'quiz' ? 'bg-primary-600 border-primary-500 text-white' : 'bg-transparent border-slate-600 text-slate-400 hover:text-white'}`}
        >
          Quiz
        </button>
        <div className="w-px bg-slate-700 mx-1" />
        <button
          onClick={() => { setCategory(null); reset() }}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors
            ${!category ? 'bg-slate-700 border-slate-600 text-white' : 'bg-transparent border-slate-700 text-slate-500 hover:text-white'}`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); reset() }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer capitalize transition-colors
              ${category === cat ? 'bg-slate-700 border-slate-600 text-white' : 'bg-transparent border-slate-700 text-slate-500 hover:text-white'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Word card */}
      {word && (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex + mode}
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -30, opacity: 0 }}
            className="bg-slate-800/80 border border-slate-600/50 rounded-2xl p-8 text-center mb-6"
          >
            <div className="hangul text-6xl sm:text-7xl font-black text-white mb-3">
              {word.word}
            </div>

            {/* Audio button - always visible */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => speak(word.word, 0.7)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full
                bg-primary-600/20 border border-primary-500/30 text-primary-400
                text-sm font-medium cursor-pointer hover:bg-primary-600/30 transition-colors mb-3"
            >
              <Volume2 size={16} />
              Listen
            </motion.button>

            {mode === 'browse' && (
              <>
                <div className="text-xl text-primary-400 font-semibold mb-1">{word.roman}</div>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <button
                    onClick={() => setShowMeaning(!showMeaning)}
                    className="flex items-center gap-1 text-sm text-slate-400 hover:text-white cursor-pointer bg-transparent border-0"
                  >
                    {showMeaning ? <EyeOff size={14} /> : <Eye size={14} />}
                    {showMeaning ? 'Hide' : 'Show'} meaning
                  </button>
                </div>
                {showMeaning && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-lg text-success-400 font-medium"
                  >
                    {word.meaning}
                  </motion.div>
                )}
              </>
            )}

            {mode === 'quiz' && (
              <div className="mt-4">
                <div className="text-sm text-slate-400 mb-2">
                  Type the romanization:
                </div>
                <div className="flex gap-2 max-w-xs mx-auto">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                    disabled={quizResult !== null}
                    placeholder="Type here..."
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5
                      text-white text-center text-lg font-medium outline-none
                      focus:border-primary-500 transition-colors disabled:opacity-50"
                    autoFocus
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={checkAnswer}
                    disabled={quizResult !== null || !input.trim()}
                    className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500
                      text-white border-0 cursor-pointer font-medium disabled:opacity-40"
                  >
                    Check
                  </motion.button>
                </div>
                {quizResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`mt-3 flex items-center justify-center gap-2 text-lg font-bold
                      ${quizResult === 'correct' ? 'text-success-400' : 'text-danger-400'}`}
                  >
                    {quizResult === 'correct' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    {quizResult === 'correct' ? 'Correct!' : `Answer: ${word.roman}`}
                  </motion.div>
                )}
                {quizResult === null && (
                  <div className="mt-2 text-xs text-slate-500">
                    Meaning: <span className="text-slate-400">{word.meaning}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => nav(-1)}
          disabled={currentIndex === 0}
          className="w-11 h-11 rounded-xl bg-slate-700/50 border border-slate-600/50
            flex items-center justify-center cursor-pointer disabled:opacity-30 text-white"
        >
          <ArrowLeft size={18} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => speak(word.word, 0.7)}
          className="w-12 h-12 rounded-full bg-primary-600 hover:bg-primary-500
            flex items-center justify-center cursor-pointer border-0 text-white"
        >
          <Volume2 size={20} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => nav(1)}
          disabled={currentIndex === words.length - 1}
          className="w-11 h-11 rounded-xl bg-slate-700/50 border border-slate-600/50
            flex items-center justify-center cursor-pointer disabled:opacity-30 text-white rotate-180"
        >
          <ArrowLeft size={18} />
        </motion.button>
      </div>

      {mode === 'quiz' && (
        <div className="text-center mt-4 text-sm text-slate-500">
          Score: <span className="text-white font-bold">{score}</span> / {words.length}
        </div>
      )}
    </motion.div>
  )
}
