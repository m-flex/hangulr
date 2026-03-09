import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Volume2, Lock } from 'lucide-react'
import { VOWELS_BASIC, CONSONANTS_BASIC, CONSONANTS_DOUBLE, VOWELS_COMPOUND, SYLLABLES_BASIC } from '../data/hangul'
import { speak } from '../utils/audio'

const SECTIONS = [
  { title: 'Basic Vowels', items: VOWELS_BASIC, key: 'char' },
  { title: 'Basic Consonants', items: CONSONANTS_BASIC, key: 'char' },
  { title: 'Double Consonants', items: CONSONANTS_DOUBLE, key: 'char' },
  { title: 'Compound Vowels', items: VOWELS_COMPOUND, key: 'char' },
  { title: 'Basic Syllables', items: SYLLABLES_BASIC, key: 'char' },
]

const SECTION_COLORS = [
  { bg: 'bg-blue-500/10', border: 'border-blue-500/30', accent: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400' },
  { bg: 'bg-purple-500/10', border: 'border-purple-500/30', accent: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400' },
  { bg: 'bg-orange-500/10', border: 'border-orange-500/30', accent: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-400' },
  { bg: 'bg-teal-500/10', border: 'border-teal-500/30', accent: 'text-teal-400', badge: 'bg-teal-500/20 text-teal-400' },
  { bg: 'bg-green-500/10', border: 'border-green-500/30', accent: 'text-green-400', badge: 'bg-green-500/20 text-green-400' },
]

export default function CheatSheet({ progress }) {
  const [playingChar, setPlayingChar] = useState(null)
  const mastery = progress?.mastery || {}

  const isLearned = (char) => {
    return !!mastery[char]
  }

  const handleSpeak = (char) => {
    if (!isLearned(char)) return
    setPlayingChar(char)
    speak(char)
    setTimeout(() => setPlayingChar(null), 800)
  }

  const learnedCount = (items, key) =>
    items.filter(item => isLearned(item[key])).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors no-underline text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <h1 className="text-lg font-bold text-white">Hangul Cheat Sheet</h1>
        <div className="w-16" />
      </div>

      <p className="text-center text-slate-400 text-sm mb-8">
        Tap any learned character to hear its pronunciation
      </p>

      {/* Sections */}
      <div className="space-y-8">
        {SECTIONS.map((section, sectionIndex) => {
          const colors = SECTION_COLORS[sectionIndex]
          const learned = learnedCount(section.items, section.key)
          const total = section.items.length

          return (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.08 }}
            >
              {/* Section header */}
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-base font-semibold ${colors.accent}`}>
                  {section.title}
                </h2>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors.badge}`}>
                  {learned}/{total}
                </span>
              </div>

              {/* Character grid */}
              <div className={`rounded-2xl border ${colors.border} ${colors.bg} p-3`}>
                <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
                  {section.items.map((item) => {
                    const char = item[section.key]
                    const roman = item.roman
                    const learned = isLearned(char)
                    const isPlaying = playingChar === char

                    return (
                      <motion.button
                        key={char}
                        whileHover={learned ? { scale: 1.08 } : {}}
                        whileTap={learned ? { scale: 0.95 } : {}}
                        onClick={() => handleSpeak(char)}
                        className={`
                          relative flex flex-col items-center justify-center gap-0.5
                          rounded-xl border cursor-pointer transition-all duration-150
                          px-1 py-2 min-w-0
                          ${learned
                            ? isPlaying
                              ? 'bg-primary-500/20 border-primary-400/60 shadow-lg shadow-primary-400/20'
                              : 'bg-slate-800/60 border-slate-600/40 hover:bg-slate-700/60 hover:border-slate-500/50'
                            : 'bg-slate-900/40 border-slate-700/30 opacity-40 cursor-not-allowed'
                          }
                        `}
                        disabled={!learned}
                      >
                        {/* Lock overlay for unlearned */}
                        {!learned && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Lock size={12} className="text-slate-600" />
                          </div>
                        )}

                        {/* Character */}
                        <span className={`hangul text-xl sm:text-2xl font-bold leading-none
                          ${learned
                            ? isPlaying ? 'text-primary-400' : 'text-white'
                            : 'text-slate-700 blur-[1px]'
                          }`}>
                          {char}
                        </span>

                        {/* Romanization */}
                        <span className={`text-[10px] leading-tight truncate w-full text-center
                          ${learned
                            ? isPlaying ? 'text-primary-400' : 'text-slate-400'
                            : 'text-transparent'
                          }`}>
                          {roman}
                        </span>

                        {/* Speaker indicator */}
                        {learned && isPlaying && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1"
                          >
                            <Volume2 size={10} className="text-primary-400" />
                          </motion.div>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-10 text-center">
        <p className="text-slate-500 text-xs">
          Characters unlock as you learn them through lessons and quizzes
        </p>
      </div>
    </motion.div>
  )
}
