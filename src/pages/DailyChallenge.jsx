import { useState, useCallback, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Calendar, CheckCircle, RotateCcw, Volume2, Delete } from 'lucide-react'
import confetti from 'canvas-confetti'
import { SYLLABLES_BASIC, SENTENCES } from '../data/hangul'
import { addXp, recordSession } from '../store/progress'
import { speak, playCorrect, playWrong } from '../utils/audio'

// ── Seeded RNG ─────────────────────

function seededRandom(seed) {
  let s = 0
  for (let i = 0; i < seed.length; i++) s = ((s << 5) - s + seed.charCodeAt(i)) | 0
  return function () {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

function seededShuffle(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Korean Dubeolsik keyboard layout ─────────────────────

const KEYBOARD_ROWS = [
  [
    { normal: 'ㅂ', shift: 'ㅃ' },
    { normal: 'ㅈ', shift: 'ㅉ' },
    { normal: 'ㄷ', shift: 'ㄸ' },
    { normal: 'ㄱ', shift: 'ㄲ' },
    { normal: 'ㅅ', shift: 'ㅆ' },
    { normal: 'ㅛ', shift: 'ㅛ' },
    { normal: 'ㅕ', shift: 'ㅕ' },
    { normal: 'ㅑ', shift: 'ㅑ' },
    { normal: 'ㅐ', shift: 'ㅒ' },
    { normal: 'ㅔ', shift: 'ㅖ' },
  ],
  [
    { normal: 'ㅁ', shift: 'ㅁ' },
    { normal: 'ㄴ', shift: 'ㄴ' },
    { normal: 'ㅇ', shift: 'ㅇ' },
    { normal: 'ㄹ', shift: 'ㄹ' },
    { normal: 'ㅎ', shift: 'ㅎ' },
    { normal: 'ㅗ', shift: 'ㅗ' },
    { normal: 'ㅓ', shift: 'ㅓ' },
    { normal: 'ㅏ', shift: 'ㅏ' },
    { normal: 'ㅣ', shift: 'ㅣ' },
  ],
  [
    { normal: 'ㅋ', shift: 'ㅋ' },
    { normal: 'ㅌ', shift: 'ㅌ' },
    { normal: 'ㅊ', shift: 'ㅊ' },
    { normal: 'ㅍ', shift: 'ㅍ' },
    { normal: 'ㅠ', shift: 'ㅠ' },
    { normal: 'ㅜ', shift: 'ㅜ' },
    { normal: 'ㅡ', shift: 'ㅡ' },
  ],
]

// ── Hangul composition ─────────────────────

const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'.split('')
const MEDIALS = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'.split('')

const CONSONANTS = new Set(INITIALS)
const VOWELS = new Set(MEDIALS)

function compose(initial, medial) {
  const i = INITIALS.indexOf(initial)
  const m = MEDIALS.indexOf(medial)
  if (i === -1 || m === -1) return null
  return String.fromCharCode(0xAC00 + (i * 21 + m) * 28)
}

function isConsonant(ch) { return CONSONANTS.has(ch) }
function isVowel(ch) { return VOWELS.has(ch) }

// ── Helpers ─────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function getTimeToMidnight() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow - now
}

function formatCountdown(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const SYLLABLE_COUNT = 5

export default function DailyChallenge({ progress, updateProgress }) {
  const today = todayStr()
  const alreadyCompleted = progress?.dailyChallengeDate === today

  // Countdown timer for "come back tomorrow"
  const [countdown, setCountdown] = useState(getTimeToMidnight())

  useEffect(() => {
    if (!alreadyCompleted) return
    const interval = setInterval(() => {
      setCountdown(getTimeToMidnight())
    }, 1000)
    return () => clearInterval(interval)
  }, [alreadyCompleted])

  // Generate today's challenge from the seed
  const { syllableTargets, sentence } = useMemo(() => {
    const rng = seededRandom(today)
    const shuffledSyllables = seededShuffle(SYLLABLES_BASIC, rng)
    const targets = shuffledSyllables.slice(0, SYLLABLE_COUNT)
    const sentenceIndex = Math.floor(rng() * SENTENCES.length)
    const sent = SENTENCES[sentenceIndex]
    return { syllableTargets: targets, sentence: sent }
  }, [today])

  // ── Phase state ──
  const [phase, setPhase] = useState('syllables') // 'syllables' | 'sentence' | 'done'
  const [syllableIndex, setSyllableIndex] = useState(0)
  const [syllableCorrect, setSyllableCorrect] = useState(0)

  // Keyboard compose state (for syllable phase)
  const [initial, setInitial] = useState(null)
  const [composed, setComposed] = useState(null)
  const [result, setResult] = useState(null) // 'correct' | 'wrong' | null
  const [flash, setFlash] = useState(null)

  // Sentence unscramble state
  const scrambledWords = useMemo(() => {
    const rng = seededRandom(today + '-sentence')
    return seededShuffle(sentence.korean, rng)
  }, [today, sentence])

  const [selectedWords, setSelectedWords] = useState([])
  const [remainingWords, setRemainingWords] = useState(scrambledWords)
  const [sentenceResult, setSentenceResult] = useState(null) // 'correct' | 'wrong' | null

  // Total score
  const [totalScore, setTotalScore] = useState(0)

  // ── Already completed view ──
  if (alreadyCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto px-4 py-16 text-center"
      >
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors no-underline text-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary-400" />
            <span className="text-sm text-slate-400">Daily Challenge</span>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-success-400/15 border-2 border-success-400/40 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle size={40} className="text-success-400" />
        </motion.div>

        <h1 className="text-2xl font-bold text-white mb-2">Daily Challenge Complete!</h1>
        <p className="text-slate-400 mb-6">You've already completed today's challenge. Come back tomorrow!</p>

        <div className="inline-flex flex-col items-center gap-1 px-6 py-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 mb-8">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Next challenge in</span>
          <span className="text-3xl font-mono font-bold text-primary-400">{formatCountdown(countdown)}</span>
        </div>

        <div className="flex justify-center">
          <Link to="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white border-0 cursor-pointer font-medium"
            >
              <ArrowLeft size={16} /> Back to Home
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  // ── Syllable phase: current target ──
  const currentTarget = syllableTargets[syllableIndex]
  const targetInitial = currentTarget?.components[0]
  const targetVowel = currentTarget?.components[1]

  // ── Keyboard handlers (syllable phase) ──
  const advanceSyllable = () => {
    const nextIndex = syllableIndex + 1
    if (nextIndex >= SYLLABLE_COUNT) {
      // Move to sentence phase
      setPhase('sentence')
    } else {
      setSyllableIndex(nextIndex)
    }
    setInitial(null)
    setComposed(null)
    setResult(null)
  }

  const handleKeyPress = (keyChar) => {
    if (result) return

    setFlash(keyChar)
    setTimeout(() => setFlash(null), 150)

    if (isConsonant(keyChar)) {
      setInitial(keyChar)
      setComposed(null)
      speak(keyChar)
    } else if (isVowel(keyChar)) {
      if (!initial) {
        playWrong()
        return
      }
      const syllable = compose(initial, keyChar)
      setComposed(syllable)
      speak(keyChar)

      if (syllable === currentTarget.char) {
        setResult('correct')
        setSyllableCorrect(c => c + 1)
        setTotalScore(s => s + 1)
        playCorrect()
        speak(syllable)
        confetti({ particleCount: 25, spread: 40, origin: { y: 0.5 } })
        setTimeout(() => advanceSyllable(), 900)
      } else {
        setResult('wrong')
        playWrong()
      }
    }
  }

  const handleClear = () => {
    if (result === 'correct') return
    setInitial(null)
    setComposed(null)
    setResult(null)
  }

  const handleRetryAfterWrong = () => {
    setInitial(null)
    setComposed(null)
    setResult(null)
  }

  // ── Sentence unscramble handlers ──
  const handleWordTap = (word, index) => {
    if (sentenceResult) return
    setSelectedWords(prev => [...prev, word])
    setRemainingWords(prev => {
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
  }

  const handleSelectedWordTap = (word, index) => {
    if (sentenceResult) return
    setRemainingWords(prev => [...prev, word])
    setSelectedWords(prev => {
      const next = [...prev]
      next.splice(index, 1)
      return next
    })
  }

  const handleCheckSentence = () => {
    const isCorrect = selectedWords.length === sentence.korean.length &&
      selectedWords.every((w, i) => w === sentence.korean[i])

    if (isCorrect) {
      setSentenceResult('correct')
      setTotalScore(s => s + 5)
      playCorrect()
      speak(sentence.korean.join(''))
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.5 } })
      setTimeout(() => {
        finishChallenge(totalScore + 5)
      }, 1200)
    } else {
      setSentenceResult('wrong')
      playWrong()
    }
  }

  const handleRetrySentence = () => {
    setSentenceResult(null)
    setSelectedWords([])
    setRemainingWords(scrambledWords)
  }

  const finishChallenge = (finalScore) => {
    setPhase('done')
    updateProgress(prev => {
      let next = { ...prev }
      next = addXp(next, 20 + finalScore * 2)
      next = recordSession(next)
      next.dailyChallengeDate = today
      return next
    })
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.4 } })
  }

  const getKeyStyle = (keyChar) => {
    if (flash === keyChar) {
      return 'bg-primary-400/30 border-primary-400/60 text-white scale-95'
    }
    if (result === 'wrong') {
      if (keyChar === targetInitial || keyChar === targetVowel) {
        return 'bg-accent-400/20 border-accent-400/50 text-accent-400 animate-pulse'
      }
    }
    if (initial === keyChar && !composed) {
      return 'bg-primary-500/25 border-primary-400/60 text-primary-400 shadow-lg shadow-primary-400/20'
    }
    if (result === 'correct' && (keyChar === targetInitial || keyChar === targetVowel)) {
      return 'bg-success-400/25 border-success-400/60 text-success-400'
    }
    return 'bg-slate-800/80 border-slate-600/50 text-white hover:bg-slate-700/80 hover:border-primary-400/40'
  }

  // ── Done screen ──
  if (phase === 'done') {
    const maxScore = SYLLABLE_COUNT + 5
    const percentage = Math.round((totalScore / maxScore) * 100)

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto px-4 py-16 text-center"
      >
        <div className="text-6xl mb-4">{percentage >= 80 ? '🎉' : '💪'}</div>
        <h1 className="text-3xl font-bold text-white mb-2">Daily Challenge Complete!</h1>

        <div className="text-5xl font-black mb-2" style={{
          color: percentage >= 90 ? '#4ade80' : percentage >= 60 ? '#60a5fa' : '#fbbf24'
        }}>
          {totalScore}/{maxScore}
        </div>
        <p className="text-slate-400 mb-2">
          {syllableCorrect}/{SYLLABLE_COUNT} syllables + {sentenceResult === 'correct' ? '5' : '0'}/5 sentence bonus
        </p>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-400 text-sm font-medium mb-4"
        >
          +{20 + totalScore * 2} XP earned (includes 20 XP daily bonus)
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Link to="/">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white border-0 cursor-pointer font-medium w-full">
              <ArrowLeft size={16} /> Back to Home
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  // ── Sentence unscramble phase ──
  if (phase === 'sentence') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto px-4 py-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors no-underline text-sm">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary-400" />
            <span className="text-sm text-slate-400">Phase 2 of 2</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-700 rounded-full mb-6 overflow-hidden">
          <motion.div
            animate={{ width: '75%' }}
            className="h-full bg-primary-500 rounded-full"
          />
        </div>

        <div className="text-center mb-6">
          <div className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">
            Unscramble the sentence
          </div>
          <p className="text-slate-300 text-lg mb-1">{sentence.english}</p>
          <p className="text-slate-500 text-sm">{sentence.hint}</p>
        </div>

        {/* Selected words area */}
        <div className="min-h-[60px] p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 mb-4 flex flex-wrap gap-2 items-center justify-center">
          {selectedWords.length === 0 && (
            <span className="text-slate-600 text-sm">Tap words below to arrange them</span>
          )}
          <AnimatePresence>
            {selectedWords.map((word, i) => (
              <motion.button
                key={`selected-${i}-${word}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelectedWordTap(word, i)}
                className={`hangul px-4 py-2 rounded-xl border-2 cursor-pointer font-bold text-lg transition-colors
                  ${sentenceResult === 'correct'
                    ? 'bg-success-400/15 border-success-400/50 text-success-400'
                    : sentenceResult === 'wrong'
                      ? 'bg-danger-400/15 border-danger-400/50 text-danger-400'
                      : 'bg-primary-500/15 border-primary-400/50 text-white hover:bg-primary-500/25'
                  }`}
              >
                {word}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Remaining words (scrambled) */}
        <div className="flex flex-wrap gap-2 items-center justify-center mb-6">
          <AnimatePresence>
            {remainingWords.map((word, i) => (
              <motion.button
                key={`remaining-${i}-${word}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleWordTap(word, i)}
                className="hangul px-4 py-2 rounded-xl border-2 border-slate-600/50 bg-slate-800/80 text-white
                  hover:bg-slate-700/80 hover:border-primary-400/40 cursor-pointer font-bold text-lg transition-colors"
              >
                {word}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Feedback */}
        <AnimatePresence>
          {sentenceResult === 'wrong' && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-center mb-4 space-y-2">
              <p className="text-danger-400 text-sm">Not quite right. Try again!</p>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={handleRetrySentence}
                className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white
                  border-0 cursor-pointer font-medium text-sm inline-flex items-center gap-2"
              >
                <RotateCcw size={12} /> Reset
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Check button */}
        {selectedWords.length === sentence.korean.length && !sentenceResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCheckSentence}
              className="px-8 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white
                border-0 cursor-pointer font-medium text-base inline-flex items-center gap-2"
            >
              <CheckCircle size={16} /> Check Answer
            </motion.button>
          </motion.div>
        )}

        {/* Score so far */}
        <div className="text-center mt-6">
          <span className="text-slate-500 text-xs">Syllables: {syllableCorrect}/{SYLLABLE_COUNT}</span>
        </div>
      </motion.div>
    )
  }

  // ── Syllable building phase ──
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
          <Calendar size={16} className="text-primary-400" />
          <span className="text-sm text-slate-400">Phase 1 — Syllable {syllableIndex + 1}/{SYLLABLE_COUNT}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-6 overflow-hidden">
        <motion.div
          animate={{ width: `${(syllableIndex / SYLLABLE_COUNT) * 50}%` }}
          className="h-full bg-primary-500 rounded-full"
        />
      </div>

      {/* Target syllable */}
      <AnimatePresence mode="wait">
        <motion.div
          key={syllableIndex}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          className="text-center mb-6"
        >
          <div className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-3">
            Build this syllable
          </div>
          <div className="inline-flex flex-col items-center gap-1 px-8 py-5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
            <span className="hangul text-6xl sm:text-7xl font-black text-white leading-none">
              {currentTarget.char}
            </span>
            <div className="text-primary-400 font-semibold text-lg">{currentTarget.roman}</div>
            <div className="text-slate-500 text-xs mt-1">
              <span className="hangul text-slate-400">{currentTarget.components[0]}</span>
              <span className="text-slate-600 mx-1">+</span>
              <span className="hangul text-slate-400">{currentTarget.components[1]}</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Composition area */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          {/* Initial consonant slot */}
          <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all
            ${initial
              ? (result === 'correct'
                  ? 'border-success-400/60 bg-success-400/10'
                  : result === 'wrong'
                    ? (initial === targetInitial ? 'border-success-400/60 bg-success-400/10' : 'border-danger-400/60 bg-danger-400/10')
                    : 'border-primary-400/60 bg-primary-400/10')
              : 'border-slate-600/50 border-dashed bg-slate-800/30'
            }`}>
            {initial ? (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className={`hangul text-2xl font-bold ${
                  result === 'correct' ? 'text-success-400'
                  : result === 'wrong' && initial !== targetInitial ? 'text-danger-400'
                  : 'text-white'
                }`}>
                {initial}
              </motion.span>
            ) : (
              <span className="text-slate-600 text-xs">초성</span>
            )}
          </div>

          <span className="text-slate-600 text-lg">+</span>

          {/* Vowel slot */}
          <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all
            ${composed
              ? (result === 'correct'
                  ? 'border-success-400/60 bg-success-400/10'
                  : result === 'wrong'
                    ? 'border-danger-400/60 bg-danger-400/10'
                    : 'border-primary-400/60 bg-primary-400/10')
              : 'border-slate-600/50 border-dashed bg-slate-800/30'
            }`}>
            {composed ? (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className={`hangul text-2xl font-bold ${
                  result === 'correct' ? 'text-success-400' : result === 'wrong' ? 'text-danger-400' : 'text-white'
                }`}>
                {targetVowel}
              </motion.span>
            ) : (
              <span className="text-slate-600 text-xs">중성</span>
            )}
          </div>

          <span className="text-slate-600 text-lg">=</span>

          {/* Result */}
          <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-all
            ${composed
              ? (result === 'correct'
                  ? 'border-success-400/60 bg-success-400/10'
                  : result === 'wrong'
                    ? 'border-danger-400/60 bg-danger-400/10'
                    : 'border-primary-400/60 bg-primary-400/10')
              : initial
                ? 'border-slate-500/50 bg-slate-800/50'
                : 'border-slate-700/50 bg-slate-800/30'
            }`}>
            <motion.span
              key={composed || initial || 'empty'}
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className={`hangul text-3xl font-black ${
                result === 'correct' ? 'text-success-400'
                : result === 'wrong' ? 'text-danger-400'
                : 'text-white'
              }`}>
              {composed || initial || ''}
            </motion.span>
          </div>
        </div>

        {/* Clear button */}
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={handleClear}
          disabled={!initial && !composed}
          className="w-10 h-10 rounded-lg bg-slate-700/50 border border-slate-600/50
            flex items-center justify-center cursor-pointer disabled:opacity-20
            text-slate-400 hover:text-white hover:bg-slate-600/50 transition-colors"
        >
          <Delete size={16} />
        </motion.button>
      </div>

      {/* Feedback */}
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
              You built <span className="hangul font-bold">{composed}</span> — not quite!
            </p>
            <p className="text-slate-400 text-xs">
              The correct keys are highlighted. Tap <span className="hangul text-accent-400">{targetInitial}</span> then <span className="hangul text-accent-400">{targetVowel}</span>
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={handleRetryAfterWrong}
              className="px-5 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white
                border-0 cursor-pointer font-medium text-sm inline-flex items-center gap-2"
            >
              <RotateCcw size={12} /> Try Again
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-sm">
          <div className="w-2 h-2 rounded-full bg-success-400" />
          <span className="text-slate-400">{syllableCorrect}</span>
        </div>
      </div>

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
                  whileHover={!result ? { scale: 1.08 } : {}}
                  whileTap={!result ? { scale: 0.92 } : {}}
                  onClick={() => handleKeyPress(keyChar)}
                  disabled={result === 'correct'}
                  className={`
                    hangul relative flex items-center justify-center
                    rounded-lg sm:rounded-xl border-2 cursor-pointer
                    font-bold text-lg sm:text-xl
                    w-8 h-10 sm:w-11 sm:h-12 md:w-12 md:h-14
                    transition-all duration-150
                    disabled:cursor-default
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

      <p className="text-center text-slate-500 text-xs mt-5">
        Tap the consonant first, then the vowel to build the syllable
      </p>
    </motion.div>
  )
}
