import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Trophy, Target, Flame, Star, RotateCcw, Zap, BarChart3, Calendar, Ear } from 'lucide-react'
import { getLevel, getDailyStreak } from '../store/progress'
import { ACHIEVEMENTS, STAGES } from '../data/hangul'

export default function Dashboard({ progress }) {
  const level = getLevel(progress.xp)
  const earnedAchievements = ACHIEVEMENTS.filter(a => progress.achievements.includes(a.id))
  const dailyStreak = getDailyStreak(progress.sessionDates)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      {/* Hero */}
      <div className="text-center mb-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="hangul text-8xl sm:text-9xl font-black mb-4 inline-block"
          style={{ color: level.color }}
        >
          한글
        </motion.div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          Learn Hangul
        </h1>
        <p className="text-slate-400 text-lg">
          Master the Korean alphabet step by step
        </p>
      </div>

      {/* Start button */}
      <div className="flex justify-center mb-10">
        <Link to="/stages">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 bg-primary-600 hover:bg-primary-500 text-white
              px-8 py-4 rounded-2xl text-lg font-semibold shadow-lg glow-blue
              cursor-pointer border-0 transition-colors"
          >
            <Play size={24} />
            {progress.totalAttempts > 0 ? 'Continue Learning' : 'Start Learning'}
          </motion.button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatCard
          icon={<Star className="text-accent-400" size={20} />}
          value={progress.xp}
          label="Total XP"
        />
        <StatCard
          icon={<Target className="text-primary-400" size={20} />}
          value={Object.keys(progress.mastery).length}
          label="Letters Learned"
        />
        <StatCard
          icon={<span className="text-lg">🔥</span>}
          value={dailyStreak > 0 ? `${dailyStreak}d` : '0'}
          label="Daily Streak"
        />
        <StatCard
          icon={<Trophy className="text-success-400" size={20} />}
          value={`${earnedAchievements.length}/${ACHIEVEMENTS.length}`}
          label="Achievements"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        <Link to="/daily">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium cursor-pointer hover:bg-amber-500/20 transition-colors">
            <Calendar size={16} /> Daily Challenge
          </motion.button>
        </Link>
        <Link to="/challenge">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 text-sm font-medium cursor-pointer hover:bg-orange-500/20 transition-colors">
            <Zap size={16} /> Timed Challenge
          </motion.button>
        </Link>
        <Link to="/dictation">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-400 text-sm font-medium cursor-pointer hover:bg-pink-500/20 transition-colors">
            <Ear size={16} /> Dictation
          </motion.button>
        </Link>
        <Link to="/stats">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500/10 border border-primary-500/30 text-primary-400 text-sm font-medium cursor-pointer hover:bg-primary-500/20 transition-colors">
            <BarChart3 size={16} /> View Stats
          </motion.button>
        </Link>
      </div>

      {/* Level progress */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm text-slate-400">Level {level.level}</span>
            <span className="font-bold text-white ml-2">{level.title}</span>
          </div>
          {level.xpForNext > 0 && (
            <span className="text-sm text-slate-500">{level.xpForNext} XP to next level</span>
          )}
        </div>
        <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${level.progress * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ backgroundColor: level.color }}
          />
        </div>
      </div>

      {/* Achievements preview */}
      {earnedAchievements.length > 0 && (
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-8">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Trophy size={18} className="text-accent-400" />
            Achievements
          </h3>
          <div className="flex flex-wrap gap-3">
            {ACHIEVEMENTS.map(a => {
              const earned = progress.achievements.includes(a.id)
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm
                    ${earned
                      ? 'bg-slate-700/50 border border-accent-400/30'
                      : 'bg-slate-800/50 border border-slate-700/30 opacity-40'
                    }`}
                  title={a.desc}
                >
                  <span className="text-lg">{a.icon}</span>
                  <span className={earned ? 'text-white' : 'text-slate-500'}>{a.title}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Stage overview */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h3 className="text-white font-semibold mb-4">Learning Path</h3>
        <div className="space-y-3">
          {STAGES.map(stage => {
            const unlocked = progress.stagesUnlocked.includes(stage.id)
            const stageCompletion = progress.stageProgress[stage.id] || 0
            return (
              <div
                key={stage.id}
                className={`flex items-center gap-4 p-3 rounded-xl transition-colors
                  ${unlocked ? 'bg-slate-700/30' : 'bg-slate-800/30 opacity-50'}`}
              >
                <span className="text-2xl">{stage.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white">{stage.title}</div>
                  <div className="text-xs text-slate-400">{stage.subtitle}</div>
                </div>
                <div className="text-right">
                  {unlocked ? (
                    <span className="text-sm font-medium text-primary-400">
                      {Math.round(stageCompletion)}%
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600">Locked</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({ icon, value, label }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center"
    >
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </motion.div>
  )
}
