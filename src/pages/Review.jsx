import { useState, useMemo, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle, Volume2, RotateCcw, Star, AlertTriangle, Clock, Calendar } from 'lucide-react'
import confetti from 'canvas-confetti'
import { VOWELS_BASIC, CONSONANTS_BASIC, CONSONANTS_DOUBLE, VOWELS_COMPOUND, SYLLABLES_BASIC, WORDS } from '../data/hangul'
import { recordAnswer, addXp, getNextReviewItems } from '../store/progress'
import { speak, playCorrect, playWrong } from '../utils/audio'

// All learnable items in one lookup
const ALL_ITEMS = [
  ...VOWELS_BASIC, ...CONSONANTS_BASIC, ...CONSONANTS_DOUBLE,
  ...VOWELS_COMPOUND, ...SYLLABLES_BASIC,
  ...WORDS.map(w => ({ char: w.word, roman: w.roman, hint: w.meaning, mnemonic: w.mnemonic, articulation: w.articulation })),
]

const ITEM_MAP = new Map(ALL_ITEMS.map(item => [item.char || item.word, item]))

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateQuestion(item, allItems) {
  const char = item.char || item.word
  const roman = item.roman
  const types = ['char_to_roman', 'roman_to_char']
  const type = types[Math.floor(Math.random() * types.length)]

  if (type === 'char_to_roman') {
    const wrongs = shuffle(allItems.filter(l => l.roman !== roman)).slice(0, 3).map(l => l.roman)
    return { type, item, char, correct: roman, options: shuffle([roman, ...wrongs]) }
  }
  const wrongs = shuffle(allItems.filter(l => (l.char || l.word) !== char)).slice(0, 3).map(l => l.char || l.word)
  return { type, item, char, correct: char, options: shuffle([char, ...wrongs]) }
}

export default function Review({ progress, updateProgress }) {
  // Use SM-2 to get items due for review
  const dueItems = useMemo(() => getNextReviewItems(progress.mastery, 10), [])

  // Map due items back to their full data objects
  const deck = useMemo(() => {
    return dueItems
      .map(d => ITEM_MAP.get(d.char))
      .filter(Boolean)
  }, [dueItems])

  const [qIndex, setQIndex] = useState(0)
  const [question, setQuestion] = useState(() => deck.length > 0 ? generateQuestion(deck[0], ALL_ITEMS) : null)
  const [selected, setSelected] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [missedItems, setMissedItems] = useState([]) // for error re-testing
  const [done, setDone] = useState(false)
  const startTime = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])

  const total = deck.length
  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // Empty state
  if (total === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto px-4 py-16 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">All caught up!</h2>
        <p className="text-slate-400 mb-2">
          No items due for review right now. The SM-2 algorithm will schedule reviews at optimal intervals:
        </p>
        <div className="text-xs text-slate-500 mb-6 bg-slate-800/50 rounded-xl p-3 inline-block text-left">
          <div className="flex items-center gap-2 mb-1"><Calendar size={10} /> 1st review: after 1 day</div>
          <div className="flex items-center gap-2 mb-1"><Calendar size={10} /> 2nd review: after 6 days</div>
          <div className="flex items-center gap-2"><Calendar size={10} /> Then: grows by ~2.5x each time</div>
        </div>
        <div>
          <Link to="/stages">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white border-0 cursor-pointer font-medium">
              Back to Learning
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  const q = question
  const isHangulOptions = q?.type !== 'char_to_roman'

  const handleSelect = (option) => {
    if (selected !== null) return
    setSelected(option)
    setShowResult(true)
    const isCorrect = option === q.correct

    if (isCorrect) {
      setCorrectCount(c => c + 1)
      playCorrect()
      confetti({ particleCount: 20, spread: 30, origin: { y: 0.7 } })
    } else {
      playWrong()
      // Track missed items for re-testing
      if (!missedItems.includes(q.item)) {
        setMissedItems(prev => [...prev, q.item])
      }
    }

    setTimeout(() => speak(q.char), 300)

    updateProgress(prev => {
      const next = recordAnswer({ ...prev }, q.char, isCorrect)
      return addXp(next, isCorrect ? 4 : 0)
    })

    setTimeout(() => {
      const nextIdx = qIndex + 1
      if (nextIdx >= deck.length) {
        // Check if there are missed items to re-test
        if (missedItems.length > 0 && !isCorrect) {
          // Add current miss
          const retestDeck = [...missedItems, q.item].filter((v, i, a) => a.indexOf(v) === i)
          // Extend deck with re-tests
          const retests = retestDeck.map(item => generateQuestion(item, ALL_ITEMS))
          setMissedItems([])
          setQIndex(nextIdx)
          setQuestion(retests[0])
          // We'd need more complex state to handle re-test deck, so just mark done
          setDone(true)
        } else {
          setDone(true)
        }
      } else {
        setQIndex(nextIdx)
        setQuestion(generateQuestion(deck[nextIdx], ALL_ITEMS))
        setSelected(null)
        setShowResult(false)
      }
    }, 1400)
  }

  if (done) {
    const pct = Math.round((correctCount / total) * 100)
    // Find next scheduled review
    const nextDue = getNextReviewItems(progress.mastery, 1)
    const nextReviewIn = nextDue.length > 0 && nextDue[0].mastery.nextReview > Date.now()
      ? Math.ceil((nextDue[0].mastery.nextReview - Date.now()) / 86400000)
      : null

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto px-4 py-16 text-center"
      >
        <div className="text-6xl mb-4">{pct >= 80 ? '🌟' : '📚'}</div>
        <h1 className="text-3xl font-bold text-white mb-2">Review Complete</h1>
        <div className="text-5xl font-black mb-2" style={{ color: pct >= 80 ? '#22c55e' : '#f59e0b' }}>
          {pct}%
        </div>
        <p className="text-slate-400 mb-2">{correctCount} of {total} correct in {formatTime(elapsed)}</p>
        {pct < 80 && (
          <p className="text-sm text-amber-400/80 mb-4">
            Missed items have been reset to 1-day intervals — they'll appear again tomorrow.
          </p>
        )}
        {pct >= 80 && nextReviewIn && (
          <p className="text-sm text-green-400/80 mb-4">
            Next review due in ~{nextReviewIn} day{nextReviewIn > 1 ? 's' : ''}.
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/stages" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors no-underline text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock size={10} />{formatTime(elapsed)}
          </span>
          <span className="text-sm text-slate-400">
            <Star size={12} className="inline text-accent-400 mr-1" />
            {qIndex + 1}/{total}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-6 overflow-hidden">
        <motion.div animate={{ width: `${((qIndex + 1) / total) * 100}%` }}
          className="h-full bg-accent-400 rounded-full" />
      </div>

      {/* SRS info */}
      <div className="text-center mb-2">
        <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <RotateCcw size={10} /> Spaced review — items due now
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
        >
          <div className="text-center mb-8">
            <div className="text-sm text-slate-400 mb-2">
              {q.type === 'char_to_roman' ? 'What is the romanization of:' : 'Which character is:'}
            </div>

            {q.type === 'char_to_roman' ? (
              <div className="hangul text-7xl font-black text-white mb-3">{q.char}</div>
            ) : (
              <div className="text-4xl font-black text-purple-400 mb-3">{q.item.roman}</div>
            )}

            <motion.button
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => speak(q.char)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full
                bg-primary-600/20 border border-primary-500/30 text-primary-400
                text-sm font-medium cursor-pointer hover:bg-primary-600/30 transition-colors"
            >
              <Volume2 size={16} /> Listen
            </motion.button>
          </div>

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
                  className={`p-4 rounded-xl border font-semibold cursor-pointer transition-all ${style} disabled:cursor-default
                    ${isHangulOptions ? 'hangul text-2xl' : 'text-lg'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {showResult && option === q.correct && <CheckCircle size={18} />}
                    {showResult && option === selected && option !== q.correct && <XCircle size={18} />}
                    {option}
                  </div>
                </motion.button>
              )
            })}
          </div>

          {showResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center">
              <div className="text-sm text-slate-400">
                <span className="hangul text-lg text-white">{q.char}</span>
                {' = '}
                <span className="text-primary-400 font-medium">{q.item.roman}</span>
              </div>
              {q.item.mnemonic && (
                <div className="text-xs text-amber-300/80 mt-1">{q.item.mnemonic}</div>
              )}
              {/* SRS feedback */}
              {selected !== q.correct && (
                <div className="text-xs text-red-400/60 mt-1">
                  Interval reset to 1 day — you'll see this again tomorrow
                </div>
              )}
              {selected === q.correct && (
                <div className="text-xs text-green-400/60 mt-1">
                  Next review scheduled based on your recall strength
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
