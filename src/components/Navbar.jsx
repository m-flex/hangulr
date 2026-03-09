import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Map, Trophy, BarChart3, Zap, Settings } from 'lucide-react'
import { getLevel, getDailyStreak } from '../store/progress'

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/stages', icon: Map, label: 'Learn' },
  { path: '/challenge', icon: Zap, label: 'Blitz' },
  { path: '/stats', icon: BarChart3, label: 'Stats' },
]

export default function Navbar({ progress }) {
  const location = useLocation()
  const level = getLevel(progress.xp)
  const dailyStreak = getDailyStreak(progress.sessionDates)

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <span className="hangul text-2xl font-bold" style={{ color: level.color }}>한</span>
          <span className="text-lg font-semibold text-white tracking-tight">Hangulr</span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path
            return (
              <Link
                key={path}
                to={path}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors
                  ${active ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute inset-0 bg-slate-700/50 rounded-lg"
                    transition={{ type: 'spring', duration: 0.4 }}
                  />
                )}
                <Icon size={16} className="relative z-10" />
                <span className="relative z-10 hidden sm:inline">{label}</span>
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          {dailyStreak > 0 && (
            <div className="flex items-center gap-1 text-xs font-bold text-orange-400">
              <span>🔥</span>{dailyStreak}d
            </div>
          )}
          <div className="flex items-center gap-1.5 text-sm">
            <Trophy size={14} className="text-accent-400" />
            <span className="font-semibold text-accent-400">{progress.xp}</span>
            <span className="text-slate-500 hidden sm:inline">XP</span>
          </div>
          <div
            className="px-2 py-0.5 rounded-full text-xs font-bold hidden sm:block"
            style={{ backgroundColor: level.color + '22', color: level.color }}
          >
            Lv.{level.level}
          </div>
          <Link to="/settings" className="text-slate-400 hover:text-white transition-colors p-1">
            <Settings size={16} />
          </Link>
        </div>
      </div>
    </nav>
  )
}
