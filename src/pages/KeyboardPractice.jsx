import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Keyboard, CheckCircle, RotateCcw, Delete } from 'lucide-react'
import confetti from 'canvas-confetti'
import { SYLLABLES_BASIC, SYLLABLES_BATCHIM, composeSyllable, isConsonant, isVowel } from '../data/hangul'
import { addXp, recordSession } from '../store/progress'
import { speak, playCorrect, playWrong } from '../utils/audio'

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

// ── Helpers ─────────────────────

const TOTAL_QUESTIONS = 12

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function KeyboardPractice({ progress, updateProgress }) {
  const [questions] = useState(() => {
    const batchimUnlocked = progress?.stagesUnlocked?.includes(6)
    if (batchimUnlocked) {
      // Mix ~4 batchim syllables into the 12 questions (8 CV + 4 CVC)
      const cv = shuffle(SYLLABLES_BASIC).slice(0, 8)
      const cvc = shuffle(SYLLABLES_BATCHIM).slice(0, 4)
      return shuffle([...cv, ...cvc])
    }
    return shuffle(SYLLABLES_BASIC).slice(0, TOTAL_QUESTIONS)
  })
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [initial, setInitial] = useState(null)    // chosen initial consonant
  const [medial, setMedial] = useState(null)      // chosen vowel (for CVC tracking)
  const [result, setResult] = useState(null)       // 'correct' | 'wrong' | null
  const [composed, setComposed] = useState(null)   // the syllable the user built
  const [gameState, setGameState] = useState('playing')
  const [wrongTotal, setWrongTotal] = useState(0)
  const [flash, setFlash] = useState(null)         // key char that was just pressed

  const target = questions[currentIndex]
  const targetInitial = target?.components[0]
  const targetVowel = target?.components[1]
  const targetFinal = target?.components.length === 3 ? target.components[2] : null
  const isCVC = target?.components.length === 3

  const advanceToNext = useCallback(() => {
    if (currentIndex + 1 >= TOTAL_QUESTIONS) {
      setGameState('done')
      updateProgress(prev => {
        let next = { ...prev }
        next = addXp(next, (correctCount + 1) * 3)
        return recordSession(next)
      })
    } else {
      setCurrentIndex(i => i + 1)
      setInitial(null)
      setMedial(null)
      setResult(null)
      setComposed(null)
    }
  }, [currentIndex, correctCount, updateProgress])

  const handleKeyPress = useCallback((keyChar) => {
    if (result) return

    setFlash(keyChar)
    setTimeout(() => setFlash(null), 150)

    if (isConsonant(keyChar)) {
      if (medial && isCVC) {
        // We already have initial + medial, and target is CVC → this is the final consonant
        const syllable = composeSyllable(initial, medial, keyChar)
        setComposed(syllable)
        speak(keyChar)

        if (syllable === target.char) {
          // Correct!
          setResult('correct')
          setCorrectCount(c => c + 1)
          playCorrect()
          speak(syllable)
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.5 } })
          setTimeout(() => advanceToNext(), 1000)
        } else {
          // Wrong syllable
          setResult('wrong')
          setWrongTotal(w => w + 1)
          playWrong()
        }
      } else {
        // Set or replace initial consonant
        setInitial(keyChar)
        setMedial(null)
        setComposed(null)
        speak(keyChar)
      }
    } else if (isVowel(keyChar)) {
      if (!initial) {
        // No consonant yet — flash error
        playWrong()
        return
      }
      setMedial(keyChar)
      speak(keyChar)

      if (isCVC) {
        // CVC target: compose partial CV for display, but don't check yet
        const partial = composeSyllable(initial, keyChar)
        setComposed(partial)
      } else {
        // CV target: compose and check immediately
        const syllable = composeSyllable(initial, keyChar)
        setComposed(syllable)

        if (syllable === target.char) {
          // Correct!
          setResult('correct')
          setCorrectCount(c => c + 1)
          playCorrect()
          speak(syllable)
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.5 } })
          setTimeout(() => advanceToNext(), 1000)
        } else {
          // Wrong syllable
          setResult('wrong')
          setWrongTotal(w => w + 1)
          playWrong()
        }
      }
    }
  }, [result, initial, medial, target, isCVC, advanceToNext])

  const handleClear = useCallback(() => {
    if (result === 'correct') return
    setInitial(null)
    setMedial(null)
    setComposed(null)
    setResult(null)
  }, [result])

  const handleRetryAfterWrong = useCallback(() => {
    setInitial(null)
    setMedial(null)
    setComposed(null)
    setResult(null)
  }, [])

  const restart = () => {
    window.location.reload()
  }

  const getKeyStyle = useCallback((keyChar) => {
    if (flash === keyChar) {
      return 'bg-primary-400/30 border-primary-400/60 text-white scale-95'
    }
    // After wrong: highlight the correct keys
    if (result === 'wrong') {
      if (keyChar === targetInitial || keyChar === targetVowel || keyChar === targetFinal) {
        return 'bg-accent-400/20 border-accent-400/50 text-accent-400 animate-pulse'
      }
    }
    // Currently selected initial
    if (initial === keyChar && !composed) {
      return 'bg-primary-500/25 border-primary-400/60 text-primary-400 shadow-lg shadow-primary-400/20'
    }
    // After correct
    if (result === 'correct' && (keyChar === targetInitial || keyChar === targetVowel || keyChar === targetFinal)) {
      return 'bg-success-400/25 border-success-400/60 text-success-400'
    }
    return 'bg-slate-800/80 border-slate-600/50 text-white hover:bg-slate-700/80 hover:border-primary-400/40'
  }, [flash, result, initial, composed, targetInitial, targetVowel, targetFinal])

  // ── Results screen ──
  if (gameState === 'done') {
    const finalCorrect = correctCount
    const accuracy = Math.round((finalCorrect / TOTAL_QUESTIONS) * 100)
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
        <div className="text-6xl mb-4">{accuracy >= 70 ? '🎉' : '💪'}</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {accuracy >= 90 ? 'Excellent!' : accuracy >= 70 ? 'Great Job!' : 'Keep Practicing!'}
        </h1>
        <div className="text-5xl font-black mb-2" style={{ color: accuracy >= 90 ? '#4ade80' : accuracy >= 70 ? '#60a5fa' : '#fbbf24' }}>
          {accuracy}%
        </div>
        <p className="text-slate-400 mb-2">{finalCorrect} of {TOTAL_QUESTIONS} syllables built correctly</p>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-400 text-sm font-medium mb-8"
        >
          +{finalCorrect * 3} XP earned
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={restart}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white border-0 cursor-pointer font-medium">
            <RotateCcw size={16} /> Try Again
          </motion.button>
          <Link to="/stages">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white border-0 cursor-pointer font-medium w-full">
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
        <div className="flex items-center gap-2">
          <Keyboard size={16} className="text-primary-400" />
          <span className="text-sm text-slate-400">{currentIndex + 1}/{TOTAL_QUESTIONS}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-6 overflow-hidden">
        <motion.div
          animate={{ width: `${(currentIndex / TOTAL_QUESTIONS) * 100}%` }}
          className="h-full bg-primary-500 rounded-full"
        />
      </div>

      {/* Target syllable */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
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
              {target.char}
            </span>
            <div className="text-primary-400 font-semibold text-lg">{target.roman}</div>
            <div className="text-slate-500 text-xs mt-1">
              <span className="hangul text-slate-400">{target.components[0]}</span>
              <span className="text-slate-600 mx-1">+</span>
              <span className="hangul text-slate-400">{target.components[1]}</span>
              {isCVC && (
                <>
                  <span className="text-slate-600 mx-1">+</span>
                  <span className="hangul text-slate-400">{target.components[2]}</span>
                </>
              )}
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
            ${medial
              ? (result === 'correct'
                  ? 'border-success-400/60 bg-success-400/10'
                  : result === 'wrong'
                    ? (medial === targetVowel ? 'border-success-400/60 bg-success-400/10' : 'border-danger-400/60 bg-danger-400/10')
                    : 'border-primary-400/60 bg-primary-400/10')
              : 'border-slate-600/50 border-dashed bg-slate-800/30'
            }`}>
            {medial ? (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className={`hangul text-2xl font-bold ${
                  result === 'correct' ? 'text-success-400'
                  : result === 'wrong' && medial !== targetVowel ? 'text-danger-400'
                  : 'text-white'
                }`}>
                {medial}
              </motion.span>
            ) : (
              <span className="text-slate-600 text-xs">중성</span>
            )}
          </div>

          {/* Final consonant slot (CVC only) */}
          {isCVC && (
            <>
              <span className="text-slate-600 text-lg">+</span>

              <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all
                ${result
                  ? (result === 'correct'
                      ? 'border-success-400/60 bg-success-400/10'
                      : 'border-danger-400/60 bg-danger-400/10')
                  : medial && !result
                    ? 'border-slate-500/50 border-dashed bg-slate-800/30'
                    : 'border-slate-600/50 border-dashed bg-slate-800/30'
                }`}>
                {result && composed ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className={`hangul text-2xl font-bold ${
                      result === 'correct' ? 'text-success-400' : 'text-danger-400'
                    }`}>
                    {/* Show the final consonant the user entered by checking if composed differs from partial CV */}
                    {(() => {
                      const partialCV = composeSyllable(initial, medial)
                      return composed !== partialCV ? target.components[2] : ''
                    })()}
                  </motion.span>
                ) : (
                  <span className="text-slate-600 text-xs">종성</span>
                )}
              </div>
            </>
          )}

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
              The correct keys are highlighted. Tap{' '}
              <span className="hangul text-accent-400">{targetInitial}</span> then{' '}
              <span className="hangul text-accent-400">{targetVowel}</span>
              {targetFinal && (
                <> then <span className="hangul text-accent-400">{targetFinal}</span></>
              )}
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
          <span className="text-slate-400">{correctCount}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <div className="w-2 h-2 rounded-full bg-danger-400" />
          <span className="text-slate-400">{wrongTotal}</span>
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
                  {/* Subtle label: C or V */}
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
        {isCVC
          ? 'Tap consonant, then vowel, then final consonant'
          : 'Tap the consonant first, then the vowel to build the syllable'}
      </p>
    </motion.div>
  )
}
