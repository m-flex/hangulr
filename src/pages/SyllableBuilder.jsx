import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle, RotateCcw, Volume2, Shuffle } from 'lucide-react'
import confetti from 'canvas-confetti'
import { CONSONANTS_BASIC, VOWELS_BASIC, SYLLABLES_BASIC } from '../data/hangul'
import { recordAnswer, addXp } from '../store/progress'
import { speak, playCorrect, playWrong } from '../utils/audio'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function SyllableBuilder({ progress, updateProgress }) {
  const [challenges] = useState(() => shuffle(SYLLABLES_BASIC).slice(0, 10))
  const [cIndex, setCIndex] = useState(0)
  const [selectedConsonant, setSelectedConsonant] = useState(null)
  const [selectedVowel, setSelectedVowel] = useState(null)
  const [result, setResult] = useState(null) // 'correct' | 'wrong' | null
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const challenge = challenges[cIndex]
  const total = challenges.length

  // Show a subset of consonants/vowels as choices (correct + distractors)
  const consonantChoices = useMemo(() => {
    const correct = challenge.components[0]
    const others = shuffle(CONSONANTS_BASIC.filter(c => c.char !== correct)).slice(0, 4).map(c => c.char)
    return shuffle([correct, ...others])
  }, [cIndex])

  const vowelChoices = useMemo(() => {
    const correct = challenge.components[1]
    const others = shuffle(VOWELS_BASIC.filter(v => v.char !== correct)).slice(0, 4).map(v => v.char)
    return shuffle([correct, ...others])
  }, [cIndex])

  const handleCheck = () => {
    if (!selectedConsonant || !selectedVowel) return

    const isCorrect =
      selectedConsonant === challenge.components[0] &&
      selectedVowel === challenge.components[1]

    setResult(isCorrect ? 'correct' : 'wrong')

    if (isCorrect) {
      setScore(s => s + 1)
      playCorrect()
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.6 } })
      updateProgress(prev => {
        const next = recordAnswer({ ...prev }, challenge.char, true)
        next.stageProgress = { ...next.stageProgress }
        next.stageProgress[3] = Math.max(next.stageProgress[3] || 0,
          Math.round(((score + 1) / total) * 100))
        return addXp(next, 5)
      })
    } else {
      playWrong()
      updateProgress(prev => recordAnswer({ ...prev }, challenge.char, false))
    }

    speak(challenge.char)

    setTimeout(() => {
      if (cIndex + 1 >= total) {
        setDone(true)
      } else {
        setCIndex(i => i + 1)
        setSelectedConsonant(null)
        setSelectedVowel(null)
        setResult(null)
      }
    }, 1500)
  }

  const restart = () => {
    setCIndex(0)
    setSelectedConsonant(null)
    setSelectedVowel(null)
    setResult(null)
    setScore(0)
    setDone(false)
  }

  if (done) {
    const pct = Math.round((score / total) * 100)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto px-4 py-16 text-center"
      >
        <div className="text-6xl mb-4">{pct >= 70 ? '🧩' : '💪'}</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {pct >= 70 ? 'Great Building!' : 'Keep Practicing!'}
        </h1>
        <div className="text-5xl font-black mb-2" style={{ color: pct >= 70 ? '#22c55e' : '#f59e0b' }}>
          {pct}%
        </div>
        <p className="text-slate-400 mb-8">{score} of {total} syllables built correctly</p>
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

      {/* Progress */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-8 overflow-hidden">
        <motion.div animate={{ width: `${((cIndex + 1) / total) * 100}%` }}
          className="h-full bg-green-500 rounded-full" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={cIndex}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
        >
          {/* Target */}
          <div className="text-center mb-6">
            <div className="text-sm text-slate-400 mb-1">Build this syllable:</div>
            <div className="flex items-center justify-center gap-3">
              <span className="hangul text-6xl font-black text-white">{challenge.char}</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => speak(challenge.char)}
                className="w-10 h-10 rounded-full bg-green-600/20 border border-green-500/30
                  flex items-center justify-center cursor-pointer text-green-400"
              >
                <Volume2 size={16} />
              </motion.button>
            </div>
            <div className="text-green-400 font-medium mt-1">{challenge.roman}</div>
          </div>

          {/* Building blocks display */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {/* Consonant slot */}
            <div className={`w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center transition-all
              ${selectedConsonant
                ? (result === 'correct' ? 'border-green-500 bg-green-500/10' :
                   result === 'wrong' ? 'border-red-500 bg-red-500/10' :
                   'border-primary-400 bg-primary-400/10')
                : 'border-slate-600'
              }`}>
              {selectedConsonant ? (
                <span className="hangul text-4xl font-bold text-white">{selectedConsonant}</span>
              ) : (
                <span className="text-slate-600 text-xs">Consonant</span>
              )}
            </div>

            <div className="text-2xl text-slate-600 font-bold">+</div>

            {/* Vowel slot */}
            <div className={`w-24 h-24 rounded-2xl border-2 border-dashed flex items-center justify-center transition-all
              ${selectedVowel
                ? (result === 'correct' ? 'border-green-500 bg-green-500/10' :
                   result === 'wrong' ? 'border-red-500 bg-red-500/10' :
                   'border-purple-400 bg-purple-400/10')
                : 'border-slate-600'
              }`}>
              {selectedVowel ? (
                <span className="hangul text-4xl font-bold text-white">{selectedVowel}</span>
              ) : (
                <span className="text-slate-600 text-xs">Vowel</span>
              )}
            </div>

            <div className="text-2xl text-slate-600 font-bold">=</div>

            {/* Result slot */}
            <div className={`w-24 h-24 rounded-2xl border-2 flex items-center justify-center transition-all
              ${result === 'correct' ? 'border-green-500 bg-green-500/10 glow-green' :
                result === 'wrong' ? 'border-red-500 bg-red-500/10' :
                'border-slate-700 bg-slate-800/50'
              }`}>
              {result === 'correct' ? (
                <CheckCircle size={32} className="text-green-400" />
              ) : result === 'wrong' ? (
                <XCircle size={32} className="text-red-400" />
              ) : (
                <span className="text-slate-700 text-2xl">?</span>
              )}
            </div>
          </div>

          {/* Consonant choices */}
          <div className="mb-4">
            <div className="text-xs text-slate-500 mb-2 font-medium">Pick a consonant:</div>
            <div className="flex flex-wrap gap-2 justify-center">
              {consonantChoices.map(c => (
                <motion.button
                  key={c}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => !result && setSelectedConsonant(c)}
                  disabled={!!result}
                  className={`w-14 h-14 rounded-xl hangul text-xl font-bold cursor-pointer border transition-all
                    ${selectedConsonant === c
                      ? 'bg-primary-600 border-primary-400 text-white'
                      : 'bg-slate-800 border-slate-600/50 text-slate-300 hover:border-primary-400/50'
                    } disabled:cursor-default`}
                >
                  {c}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Vowel choices */}
          <div className="mb-6">
            <div className="text-xs text-slate-500 mb-2 font-medium">Pick a vowel:</div>
            <div className="flex flex-wrap gap-2 justify-center">
              {vowelChoices.map(v => (
                <motion.button
                  key={v}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => !result && setSelectedVowel(v)}
                  disabled={!!result}
                  className={`w-14 h-14 rounded-xl hangul text-xl font-bold cursor-pointer border transition-all
                    ${selectedVowel === v
                      ? 'bg-purple-600 border-purple-400 text-white'
                      : 'bg-slate-800 border-slate-600/50 text-slate-300 hover:border-purple-400/50'
                    } disabled:cursor-default`}
                >
                  {v}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Check / answer feedback */}
          {result === 'wrong' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-red-400 mb-4"
            >
              Answer: <span className="hangul font-bold">{challenge.components[0]}</span> + <span className="hangul font-bold">{challenge.components[1]}</span> = <span className="hangul font-bold">{challenge.char}</span>
            </motion.div>
          )}

          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCheck}
              disabled={!selectedConsonant || !selectedVowel || !!result}
              className="px-8 py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-40
                text-white border-0 cursor-pointer font-semibold text-sm"
            >
              Check
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
