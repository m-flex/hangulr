import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronLeft, ChevronRight, Volume2 } from 'lucide-react'
import { VOWELS_BASIC, CONSONANTS_BASIC } from '../data/hangul'
import { speak } from '../utils/audio'

const CATEGORIES = [
  { label: 'Vowels', chars: VOWELS_BASIC, color: 'blue' },
  { label: 'Consonants', chars: CONSONANTS_BASIC, color: 'purple' },
]

export default function CharacterStories() {
  const [catIdx, setCatIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [direction, setDirection] = useState(0)

  const category = CATEGORIES[catIdx]
  const char = category.chars[charIdx]

  const goNext = () => {
    if (charIdx < category.chars.length - 1) {
      setDirection(1)
      setCharIdx(i => i + 1)
    } else if (catIdx < CATEGORIES.length - 1) {
      setDirection(1)
      setCatIdx(i => i + 1)
      setCharIdx(0)
    }
  }

  const goPrev = () => {
    if (charIdx > 0) {
      setDirection(-1)
      setCharIdx(i => i - 1)
    } else if (catIdx > 0) {
      setDirection(-1)
      setCatIdx(i => i - 1)
      setCharIdx(CATEGORIES[catIdx - 1].chars.length - 1)
    }
  }

  const isFirst = catIdx === 0 && charIdx === 0
  const isLast = catIdx === CATEGORIES.length - 1 && charIdx === category.chars.length - 1

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="max-w-lg mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/stages" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors no-underline text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <span className="text-sm text-slate-400">{category.label} · {charIdx + 1}/{category.chars.length}</span>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-8 overflow-hidden">
        <motion.div
          animate={{ width: `${((charIdx + 1) / category.chars.length) * 100}%` }}
          className={`h-full rounded-full ${category.color === 'blue' ? 'bg-blue-500' : 'bg-purple-500'}`}
        />
      </div>

      {/* Category tabs */}
      <div className="flex justify-center gap-2 mb-6">
        {CATEGORIES.map((cat, i) => (
          <button key={i}
            onClick={() => { setCatIdx(i); setCharIdx(0); setDirection(0) }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border cursor-pointer transition-colors
              ${catIdx === i
                ? 'bg-primary-500/20 border-primary-500/40 text-primary-400'
                : 'bg-transparent border-slate-700 text-slate-500 hover:text-slate-300'}`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Character card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${catIdx}-${charIdx}`}
          initial={{ x: direction * 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction * -200, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-8 mb-6"
        >
          {/* Character display */}
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}
              className="hangul text-8xl font-black text-white mb-3 inline-block"
            >
              {char.char}
            </motion.div>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-bold text-primary-400">{char.roman}</span>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => speak(char.char)}
                className="w-10 h-10 rounded-full bg-primary-600/30 border border-primary-500/30 flex items-center justify-center cursor-pointer text-primary-400">
                <Volume2 size={16} />
              </motion.button>
            </div>
            {char.sound && (
              <div className="text-slate-500 text-sm mt-1">Sound: "{char.sound}"</div>
            )}
          </div>

          {/* Mnemonic */}
          {char.mnemonic && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="text-xs text-amber-400/70 font-medium uppercase tracking-wider mb-1">Memory Trick</div>
              <p className="text-amber-300 text-sm leading-relaxed">{char.mnemonic}</p>
            </motion.div>
          )}

          {/* Articulation */}
          {char.articulation && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="mb-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="text-xs text-blue-400/70 font-medium uppercase tracking-wider mb-1">How to Pronounce</div>
              <p className="text-blue-300 text-sm leading-relaxed">{char.articulation}</p>
            </motion.div>
          )}

          {/* Hint */}
          {char.hint && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="p-4 rounded-xl bg-slate-700/30 border border-slate-600/30">
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Sounds Like</div>
              <p className="text-slate-300 text-sm">{char.hint}</p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={goPrev} disabled={isFirst}
          className="w-12 h-12 rounded-full bg-slate-700/50 border border-slate-600/50 flex items-center justify-center cursor-pointer disabled:opacity-30 text-white hover:bg-slate-600/50 transition-colors">
          <ChevronLeft size={20} />
        </motion.button>

        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => speak(char.char)}
          className="w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-500 flex items-center justify-center cursor-pointer border-0 text-white shadow-lg transition-colors">
          <Volume2 size={22} />
        </motion.button>

        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={goNext} disabled={isLast}
          className="w-12 h-12 rounded-full bg-slate-700/50 border border-slate-600/50 flex items-center justify-center cursor-pointer disabled:opacity-30 text-white hover:bg-slate-600/50 transition-colors">
          <ChevronRight size={20} />
        </motion.button>
      </div>

      <p className="text-center text-slate-500 text-xs mt-4">
        Swipe through characters to learn their stories and pronunciation
      </p>
    </motion.div>
  )
}
