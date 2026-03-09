import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

export default function LetterCard({ letter, mastery, onClick, size = 'md', showRoman = true }) {
  const stars = mastery?.stars || 0
  const sizes = {
    sm: 'w-16 h-16 text-2xl',
    md: 'w-24 h-24 text-4xl',
    lg: 'w-32 h-32 text-6xl',
    xl: 'w-44 h-44 text-8xl',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onClick?.(letter)}
      className={`${sizes[size]} relative flex flex-col items-center justify-center rounded-2xl
        bg-slate-800/80 border border-slate-600/50 hover:border-primary-400/50
        transition-colors cursor-pointer group`}
    >
      <span className="hangul font-bold">{letter.char || letter.word}</span>
      {showRoman && (
        <span className="text-xs text-slate-400 mt-1 font-medium">
          {letter.roman}
        </span>
      )}
      {stars > 0 && (
        <div className="absolute -top-1 -right-1 flex">
          {[...Array(stars)].map((_, i) => (
            <Star
              key={i}
              size={12}
              className="text-accent-400 fill-accent-400 -ml-0.5"
            />
          ))}
        </div>
      )}
    </motion.button>
  )
}
