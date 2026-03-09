import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

export default function AchievementToast({ achievement }) {
  useEffect(() => {
    if (achievement) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.2 },
        colors: ['#facc15', '#3b82f6', '#22c55e'],
      })
    }
  }, [achievement])

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="bg-slate-800 border border-accent-400/50 rounded-xl px-6 py-3 glow-gold flex items-center gap-3 shadow-2xl">
            <span className="text-3xl">{achievement.icon}</span>
            <div>
              <div className="text-accent-400 font-bold text-sm">Achievement Unlocked!</div>
              <div className="text-white font-semibold">{achievement.title}</div>
              <div className="text-slate-400 text-xs">{achievement.desc} · +{achievement.xp} XP</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
