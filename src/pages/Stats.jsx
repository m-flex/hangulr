import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft, BarChart3, Target, CheckCircle, Clock, Calendar,
  TrendingUp, Star, Flame, AlertCircle,
} from 'lucide-react'
import {
  VOWELS_BASIC, CONSONANTS_BASIC, CONSONANTS_DOUBLE,
  VOWELS_COMPOUND, SYLLABLES_BASIC, WORDS,
} from '../data/hangul'
import { getNextReviewItems, getDailyStreak, getSessionHeatmap } from '../store/progress'

const DAY_MS = 86400000

const CATEGORIES = [
  { key: 'vowels', label: 'Basic Vowels', items: VOWELS_BASIC, charKey: 'char' },
  { key: 'consonants', label: 'Basic Consonants', items: CONSONANTS_BASIC, charKey: 'char' },
  { key: 'double', label: 'Double Consonants', items: CONSONANTS_DOUBLE, charKey: 'char' },
  { key: 'compound', label: 'Compound Vowels', items: VOWELS_COMPOUND, charKey: 'char' },
  { key: 'syllables', label: 'Syllables', items: SYLLABLES_BASIC, charKey: 'char' },
  { key: 'words', label: 'Words', items: WORDS, charKey: 'word' },
]

function getAccuracyColor(ratio) {
  if (ratio === null) return 'bg-slate-700/40 text-slate-500'
  if (ratio >= 0.85) return 'bg-emerald-500/25 text-emerald-400 border-emerald-500/30'
  if (ratio >= 0.6) return 'bg-yellow-500/25 text-yellow-400 border-yellow-500/30'
  return 'bg-red-500/25 text-red-400 border-red-500/30'
}

function getAccuracyBg(ratio) {
  if (ratio === null) return 'bg-slate-700/30'
  if (ratio >= 0.85) return 'bg-emerald-500/20'
  if (ratio >= 0.6) return 'bg-yellow-500/20'
  return 'bg-red-500/20'
}

export default function Stats({ progress }) {
  const mastery = progress.mastery || {}

  // -- Computed stats --
  const stats = useMemo(() => {
    const entries = Object.values(mastery)
    const totalSeen = entries.reduce((s, m) => s + (m.seen || 0), 0)
    const totalCorrect = entries.reduce((s, m) => s + (m.correct || 0), 0)
    const accuracyRate = totalSeen > 0 ? totalCorrect / totalSeen : 0
    const mastered = entries.filter(m => (m.stars || 0) >= 3).length
    const inProgress = entries.filter(m => (m.seen || 0) > 0 && (m.stars || 0) < 3).length
    return { totalSeen, totalCorrect, accuracyRate, mastered, inProgress }
  }, [mastery])

  // -- SM-2 review status --
  const reviewStats = useMemo(() => {
    const now = Date.now()
    const dueNow = getNextReviewItems(mastery)
    let next24h = 0
    let next7d = 0
    for (const entry of Object.values(mastery)) {
      const nr = entry.nextReview || 0
      if (nr > now && nr <= now + DAY_MS) next24h++
      else if (nr > now && nr <= now + 7 * DAY_MS) next7d++
    }
    return { dueNow: dueNow.length, next24h, next7d }
  }, [mastery])

  // -- Daily streak & heatmap --
  const sessionDates = progress.sessionDates || []
  const dailyStreak = useMemo(() => getDailyStreak(sessionDates), [sessionDates])
  const heatmap = useMemo(() => getSessionHeatmap(sessionDates, 84), [sessionDates])
  const totalSessions = new Set(sessionDates).size

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/stages">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 rounded-xl bg-slate-800/50 border border-slate-700/50
              text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </motion.button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="text-primary-400" size={28} />
            Statistics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Your learning progress at a glance</p>
        </div>
      </div>

      {/* Overview stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <MiniStat icon={<Calendar className="text-primary-400" size={18} />} value={totalSessions} label="Sessions" />
        <MiniStat icon={<Target className="text-accent-400" size={18} />} value={progress.totalAttempts || 0} label="Total Answers" />
        <MiniStat
          icon={<TrendingUp className="text-success-400" size={18} />}
          value={`${Math.round(stats.accuracyRate * 100)}%`}
          label="Accuracy"
        />
        <MiniStat icon={<Star className="text-accent-400" size={18} />} value={stats.mastered} label="Mastered" />
        <MiniStat icon={<Clock className="text-primary-400" size={18} />} value={stats.inProgress} label="In Progress" />
        <MiniStat icon={<Flame className="text-danger-400" size={18} />} value={dailyStreak} label="Day Streak" />
      </div>

      {/* SM-2 Review Status */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-8">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <AlertCircle size={18} className="text-accent-400" />
          Spaced Repetition Status
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl bg-slate-700/30">
            <div className="text-2xl font-bold text-danger-400">{reviewStats.dueNow}</div>
            <div className="text-xs text-slate-400 mt-1">Due Now</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-700/30">
            <div className="text-2xl font-bold text-accent-400">{reviewStats.next24h}</div>
            <div className="text-xs text-slate-400 mt-1">Next 24h</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-700/30">
            <div className="text-2xl font-bold text-primary-400">{reviewStats.next7d}</div>
            <div className="text-xs text-slate-400 mt-1">Next 7 Days</div>
          </div>
        </div>
        {reviewStats.dueNow > 0 && (
          <div className="mt-4 text-center">
            <Link to="/stages">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="text-sm px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500
                  text-white font-medium transition-colors cursor-pointer border-0"
              >
                Review {reviewStats.dueNow} item{reviewStats.dueNow !== 1 ? 's' : ''}
              </motion.button>
            </Link>
          </div>
        )}
      </div>

      {/* Activity Heatmap */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-8">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-primary-400" />
          Activity (Last 12 Weeks)
        </h2>
        <div className="flex flex-wrap gap-1">
          {heatmap.map((d, i) => (
            <div
              key={i}
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm transition-colors ${
                d.active ? 'bg-primary-500' : 'bg-slate-700/40'
              }`}
              title={`${d.date}${d.active ? ' - Active' : ''}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-3 mt-3 text-xs text-slate-500">
          <span>Less</span>
          <div className="w-3 h-3 rounded-sm bg-slate-700/40" />
          <div className="w-3 h-3 rounded-sm bg-primary-500" />
          <span>More</span>
        </div>
      </div>

      {/* Per-letter Accuracy Heatmap */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
        <h2 className="text-white font-semibold mb-6 flex items-center gap-2">
          <CheckCircle size={18} className="text-success-400" />
          Letter Accuracy Heatmap
        </h2>

        <div className="flex items-center gap-4 mb-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500/30 border border-red-500/30" /> &lt;60%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-yellow-500/30 border border-yellow-500/30" /> 60-84%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500/30 border border-emerald-500/30" /> 85%+
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-700/40" /> Not practiced
          </span>
        </div>

        <div className="space-y-6">
          {CATEGORIES.map(cat => (
            <div key={cat.key}>
              <h3 className="text-sm font-medium text-slate-300 mb-2">{cat.label}</h3>
              <div className="flex flex-wrap gap-2">
                {cat.items.map(item => {
                  const ch = item[cat.charKey]
                  const m = mastery[ch]
                  const ratio = m && m.seen > 0 ? m.correct / m.seen : null
                  const stars = m?.stars || 0
                  return (
                    <motion.div
                      key={ch}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative flex flex-col items-center justify-center
                        w-12 h-14 sm:w-14 sm:h-16 rounded-lg border text-sm
                        ${getAccuracyColor(ratio)} transition-colors`}
                      title={
                        ratio !== null
                          ? `${ch}: ${Math.round(ratio * 100)}% (${m.correct}/${m.seen})`
                          : `${ch}: not practiced`
                      }
                    >
                      <span className="hangul font-bold text-base sm:text-lg">{ch}</span>
                      {ratio !== null && (
                        <span className="text-[10px] opacity-75 leading-none mt-0.5">
                          {Math.round(ratio * 100)}%
                        </span>
                      )}
                      {stars >= 3 && (
                        <span className="absolute -top-1 -right-1 text-[10px]">
                          <Star size={10} className="text-accent-400 fill-accent-400" />
                        </span>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function MiniStat({ icon, value, label }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 text-center"
    >
      <div className="flex justify-center mb-1.5">{icon}</div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[11px] text-slate-400">{label}</div>
    </motion.div>
  )
}
