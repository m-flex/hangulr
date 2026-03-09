import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Volume2, CheckCircle, RotateCcw, Ear } from 'lucide-react'
import confetti from 'canvas-confetti'
import { VOWELS_BASIC, CONSONANTS_BASIC, CONSONANTS_DOUBLE, VOWELS_COMPOUND } from '../data/hangul'
import { addXp, recordSession } from '../store/progress'
import { speak, playCorrect, playWrong } from '../utils/audio'

const PAIRS = [
  // Vowel confusions
  ['ㅏ', 'ㅓ'],  // a vs eo
  ['ㅗ', 'ㅜ'],  // o vs u
  ['ㅡ', 'ㅣ'],  // eu vs i
  ['ㅐ', 'ㅔ'],  // ae vs e
  ['ㅑ', 'ㅕ'],  // ya vs yeo
  ['ㅛ', 'ㅠ'],  // yo vs yu
  // Consonant confusions
  ['ㄱ', 'ㅋ'],  // g vs k (aspirated)
  ['ㄷ', 'ㅌ'],  // d vs t
  ['ㅂ', 'ㅍ'],  // b vs p
  ['ㅈ', 'ㅊ'],  // j vs ch
  ['ㄱ', 'ㄲ'],  // g vs kk (tense)
  ['ㄷ', 'ㄸ'],  // d vs tt
  ['ㅂ', 'ㅃ'],  // b vs pp
  ['ㅅ', 'ㅆ'],  // s vs ss
  ['ㅈ', 'ㅉ'],  // j vs jj
  ['ㄴ', 'ㄹ'],  // n vs r/l
  ['ㅁ', 'ㅂ'],  // m vs b
]

const TOTAL_ROUNDS = 10
const XP_PER_CORRECT = 10
const BONUS_XP_PERFECT = 50
const AUTO_ADVANCE_MS = 800

const ALL_CHARS = [...VOWELS_BASIC, ...CONSONANTS_BASIC, ...CONSONANTS_DOUBLE, ...VOWELS_COMPOUND]
const charMap = {}
ALL_CHARS.forEach(c => { charMap[c.char] = c })

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateRounds() {
  const picked = shuffle(PAIRS).slice(0, TOTAL_ROUNDS)
  return picked.map(pair => {
    const answerIdx = Math.random() < 0.5 ? 0 : 1
    const correct = pair[answerIdx]
    // Randomize display order of the two options
    const options = Math.random() < 0.5 ? [pair[0], pair[1]] : [pair[1], pair[0]]
    return { pair, correct, options }
  })
}

export default function MinimalPairs({ progress, updateProgress }) {
  const [rounds, setRounds] = useState(() => generateRounds())
  const [roundIdx, setRoundIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [done, setDone] = useState(false)
  const [xpEarned, setXpEarned] = useState(0)
  const advanceTimer = useRef(null)

  const round = rounds[roundIdx]

  // Auto-play audio when round changes
  useEffect(() => {
    if (!done && round) {
      speak(round.correct)
    }
  }, [roundIdx, done])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    }
  }, [])

  const handleReplay = useCallback(() => {
    if (round) speak(round.correct)
  }, [round])

  const advance = useCallback(() => {
    if (roundIdx + 1 >= TOTAL_ROUNDS) {
      setDone(true)
      const finalCorrect = correctCount + (selected === round?.correct ? 1 : 0)
      // We compute XP in handleSelect, but add perfect bonus here
      if (finalCorrect === TOTAL_ROUNDS) {
        updateProgress(prev => addXp({ ...prev }, BONUS_XP_PERFECT))
        setXpEarned(e => e + BONUS_XP_PERFECT)
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } })
      } else {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } })
      }
      updateProgress(prev => recordSession({ ...prev }))
    } else {
      setRoundIdx(i => i + 1)
      setSelected(null)
    }
  }, [roundIdx, correctCount, selected, round, updateProgress])

  const handleSelect = useCallback((option) => {
    if (selected !== null || done) return
    setSelected(option)

    const isCorrect = option === round.correct

    if (isCorrect) {
      setCorrectCount(c => c + 1)
      playCorrect()
      updateProgress(prev => addXp({ ...prev }, XP_PER_CORRECT))
      setXpEarned(e => e + XP_PER_CORRECT)
      confetti({ particleCount: 25, spread: 35, origin: { y: 0.7 }, colors: ['#22c55e', '#4ade80'] })
      // Auto-advance after correct
      advanceTimer.current = setTimeout(advance, AUTO_ADVANCE_MS)
    } else {
      playWrong()
    }
  }, [selected, done, round, advance, updateProgress])

  const handleContinueAfterWrong = useCallback(() => {
    advance()
  }, [advance])

  const restart = useCallback(() => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    setRounds(generateRounds())
    setRoundIdx(0)
    setSelected(null)
    setCorrectCount(0)
    setDone(false)
    setXpEarned(0)
  }, [])

  // ── Results screen ──
  if (done) {
    const score = Math.round((correctCount / TOTAL_ROUNDS) * 100)
    const perfect = correctCount === TOTAL_ROUNDS

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto px-4 py-16 text-center"
      >
        <div className="text-6xl mb-4">{perfect ? '🎯' : score >= 70 ? '👂' : '💪'}</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {perfect ? 'Perfect Ear!' : score >= 70 ? 'Nice Listening!' : 'Keep Training!'}
        </h1>
        <div
          className="text-5xl font-black mb-2"
          style={{ color: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444' }}
        >
          {score}%
        </div>
        <p className="text-slate-400 mb-1">
          {correctCount} of {TOTAL_ROUNDS} correct
        </p>
        <p className="text-primary-400 text-sm font-medium mb-1">
          +{xpEarned} XP earned
        </p>
        {perfect && (
          <p className="text-green-400 text-xs mb-1">Includes +{BONUS_XP_PERFECT} XP perfect bonus!</p>
        )}
        <p className="text-slate-500 text-sm mb-8">Minimal Pair Discrimination</p>

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
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                bg-primary-600 hover:bg-primary-500 text-white border-0 cursor-pointer font-medium w-full"
            >
              Back to Home
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  // ── Active round ──
  const isCorrect = selected === round.correct
  const isWrong = selected !== null && !isCorrect

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
          to="/"
          className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors no-underline text-sm"
        >
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Ear size={12} /> Minimal Pairs
          </span>
          <span className="text-sm text-slate-400">
            {roundIdx + 1}/{TOTAL_ROUNDS}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-10 overflow-hidden">
        <motion.div
          animate={{ width: `${((roundIdx + 1) / TOTAL_ROUNDS) * 100}%` }}
          className="h-full bg-primary-500 rounded-full"
          transition={{ duration: 0.3 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={roundIdx}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Prompt: speaker button */}
          <div className="text-center mb-3">
            <div className="text-sm text-slate-400 mb-4">Which character did you hear?</div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleReplay}
              className="w-24 h-24 rounded-full bg-primary-600/20 border-2 border-primary-500/40
                flex items-center justify-center cursor-pointer text-primary-400 mx-auto mb-2
                hover:bg-primary-600/30 transition-colors"
            >
              <Volume2 size={40} />
            </motion.button>
            <div className="text-xs text-slate-500">Tap to replay</div>
          </div>

          {/* Two character option cards */}
          <div className="flex gap-4 justify-center mt-10">
            {round.options.map((option) => {
              const info = charMap[option]
              const roman = info?.roman || ''

              let cardStyle = 'bg-slate-800/50 border-slate-700/50 text-white hover:border-primary-400/60'

              if (selected !== null) {
                if (option === round.correct) {
                  cardStyle = 'bg-green-500/20 border-green-500/60 text-green-400'
                } else if (option === selected && option !== round.correct) {
                  cardStyle = 'bg-red-500/20 border-red-500/60 text-red-400'
                } else {
                  cardStyle = 'bg-slate-800/30 border-slate-700/30 text-slate-500'
                }
              }

              return (
                <motion.button
                  key={option}
                  whileHover={selected === null ? { scale: 1.05 } : {}}
                  whileTap={selected === null ? { scale: 0.95 } : {}}
                  onClick={() => handleSelect(option)}
                  disabled={selected !== null}
                  className={`flex flex-col items-center justify-center gap-2 min-w-[100px] w-36 h-40
                    rounded-2xl border-2 cursor-pointer transition-all font-semibold
                    disabled:cursor-default ${cardStyle}`}
                >
                  <span className="hangul text-5xl font-black">{option}</span>
                  <span className="text-sm opacity-70">{roman}</span>
                  {selected !== null && option === round.correct && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <CheckCircle size={20} />
                    </motion.span>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Feedback area */}
          {selected !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              {isCorrect && (
                <div className="text-green-400 font-semibold text-lg">Correct!</div>
              )}
              {isWrong && (
                <div>
                  <div className="text-red-400 font-semibold text-lg mb-3">
                    Not quite — it was <span className="hangul text-xl">{round.correct}</span>{' '}
                    ({charMap[round.correct]?.roman || ''})
                  </div>
                  <div className="flex gap-3 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleReplay}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl
                        bg-slate-700 hover:bg-slate-600 text-white border-0 cursor-pointer text-sm font-medium"
                    >
                      <Volume2 size={14} /> Listen Again
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleContinueAfterWrong}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl
                        bg-primary-600 hover:bg-primary-500 text-white border-0 cursor-pointer text-sm font-medium"
                    >
                      Continue
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
