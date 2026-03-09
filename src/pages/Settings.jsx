import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Volume2, Eye, Download, Upload, Trash2, Flame, Calendar, Sun, Moon } from 'lucide-react'
import { getDailyStreak, getSessionHeatmap, resetProgress } from '../store/progress'

export default function Settings({ progress, updateProgress }) {
  const [resetConfirm, setResetConfirm] = useState('')
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importData, setImportData] = useState(null)
  const fileInputRef = useRef(null)

  const audioEnabled = progress.settings?.audioEnabled ?? true
  const drawGuideDefault = progress.settings?.drawGuideDefault ?? true
  const theme = progress.settings?.theme || 'dark'
  const streak = getDailyStreak(progress.sessionDates)
  const heatmap = getSessionHeatmap(progress.sessionDates, 90)

  function toggleAudio() {
    updateProgress(prev => {
      const next = { ...prev }
      const current = prev.settings?.audioEnabled ?? true
      next.settings = { ...next.settings, audioEnabled: !current }
      return next
    })
  }

  function toggleDrawGuide() {
    updateProgress(prev => {
      const next = { ...prev }
      const current = prev.settings?.drawGuideDefault ?? true
      next.settings = { ...next.settings, drawGuideDefault: !current }
      return next
    })
  }

  function toggleTheme() {
    updateProgress(prev => {
      const next = { ...prev }
      const current = prev.settings?.theme || 'dark'
      next.settings = { ...next.settings, theme: current === 'dark' ? 'light' : 'dark' }
      return next
    })
  }

  function handleExport() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hangulr-progress-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result)
        setImportData(data)
        setShowImportDialog(true)
      } catch {
        alert('Invalid JSON file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function confirmImport() {
    if (importData) {
      updateProgress(() => importData)
    }
    setShowImportDialog(false)
    setImportData(null)
  }

  function handleReset() {
    if (resetConfirm === 'RESET') {
      updateProgress(() => resetProgress())
      setShowResetDialog(false)
      setResetConfirm('')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto px-4 py-8"
    >
      {/* Back link */}
      <Link
        to="/stages"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back to Stages</span>
      </Link>

      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

      {/* Daily Streak */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Flame size={22} className="text-danger-400" />
          <h2 className="text-lg font-semibold text-white">Daily Streak</h2>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-black text-danger-400">{streak}</span>
          <span className="text-slate-400 text-sm">
            {streak === 1 ? 'day' : 'days'} in a row
          </span>
        </div>
      </motion.div>

      {/* Calendar Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Calendar size={22} className="text-primary-400" />
          <h2 className="text-lg font-semibold text-white">Activity (Last 90 Days)</h2>
        </div>
        <div className="flex flex-wrap gap-1">
          {heatmap.map((day, i) => (
            <div
              key={i}
              title={`${day.date}${day.active ? ' — active' : ''}`}
              className={`w-3 h-3 rounded-sm transition-colors ${
                day.active
                  ? 'bg-primary-500'
                  : 'bg-slate-700/50'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
          <div className="w-3 h-3 rounded-sm bg-slate-700/50" />
          <span>No activity</span>
          <div className="w-3 h-3 rounded-sm bg-primary-500 ml-2" />
          <span>Active</span>
        </div>
      </motion.div>

      {/* Audio Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 size={22} className="text-accent-400" />
            <div>
              <h2 className="text-white font-semibold">Audio Pronunciation</h2>
              <p className="text-sm text-slate-400">Play audio when learning new characters</p>
            </div>
          </div>
          <button
            onClick={toggleAudio}
            className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer border-0 ${
              audioEnabled ? 'bg-primary-500' : 'bg-slate-600'
            }`}
          >
            <motion.div
              layout
              className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md"
              style={{ left: audioEnabled ? '1.75rem' : '0.125rem' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </motion.div>

      {/* Drawing Guide Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye size={22} className="text-success-400" />
            <div>
              <h2 className="text-white font-semibold">Drawing Ghost Guide</h2>
              <p className="text-sm text-slate-400">Show guide overlay in drawing practice by default</p>
            </div>
          </div>
          <button
            onClick={toggleDrawGuide}
            className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer border-0 ${
              drawGuideDefault ? 'bg-primary-500' : 'bg-slate-600'
            }`}
          >
            <motion.div
              layout
              className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md"
              style={{ left: drawGuideDefault ? '1.75rem' : '0.125rem' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </motion.div>

      {/* Theme Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={22} className="text-primary-400" /> : <Sun size={22} className="text-amber-400" />}
            <div>
              <h2 className="text-white font-semibold">Theme</h2>
              <p className="text-sm text-slate-400">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer border-0 ${
              theme === 'light' ? 'bg-amber-500' : 'bg-slate-600'
            }`}
          >
            <motion.div
              layout
              className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md"
              style={{ left: theme === 'light' ? '1.75rem' : '0.125rem' }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </motion.div>

      {/* Data Management */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 mb-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Data Management</h2>
        <div className="space-y-3">
          {/* Export */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleExport}
            className="w-full flex items-center gap-3 bg-slate-700/50 hover:bg-slate-700
              text-white px-4 py-3 rounded-xl cursor-pointer border border-slate-600/50
              transition-colors text-left"
          >
            <Download size={20} className="text-primary-400" />
            <div>
              <div className="font-medium">Export Progress</div>
              <div className="text-xs text-slate-400">Download your progress as a JSON file</div>
            </div>
          </motion.button>

          {/* Import */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleImportClick}
            className="w-full flex items-center gap-3 bg-slate-700/50 hover:bg-slate-700
              text-white px-4 py-3 rounded-xl cursor-pointer border border-slate-600/50
              transition-colors text-left"
          >
            <Upload size={20} className="text-accent-400" />
            <div>
              <div className="font-medium">Import Progress</div>
              <div className="text-xs text-slate-400">Restore progress from a JSON backup</div>
            </div>
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Reset */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowResetDialog(true)}
            className="w-full flex items-center gap-3 bg-red-950/30 hover:bg-red-950/50
              text-white px-4 py-3 rounded-xl cursor-pointer border border-red-900/30
              transition-colors text-left"
          >
            <Trash2 size={20} className="text-danger-400" />
            <div>
              <div className="font-medium text-danger-400">Reset All Progress</div>
              <div className="text-xs text-slate-400">Permanently erase all learning data</div>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* Import Confirmation Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-2xl p-6 border border-slate-700 max-w-sm w-full"
          >
            <h3 className="text-lg font-bold text-white mb-2">Import Progress</h3>
            <p className="text-sm text-slate-400 mb-6">
              This will replace all your current progress with the imported data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowImportDialog(false); setImportData(null) }}
                className="flex-1 py-2 px-4 rounded-xl bg-slate-700 hover:bg-slate-600
                  text-white font-medium cursor-pointer border-0 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmImport}
                className="flex-1 py-2 px-4 rounded-xl bg-primary-600 hover:bg-primary-500
                  text-white font-medium cursor-pointer border-0 transition-colors"
              >
                Import
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-2xl p-6 border border-red-900/50 max-w-sm w-full"
          >
            <h3 className="text-lg font-bold text-danger-400 mb-2">Reset All Progress</h3>
            <p className="text-sm text-slate-400 mb-4">
              This will permanently erase all your learning data, achievements, and streaks. This cannot be undone.
            </p>
            <p className="text-sm text-slate-300 mb-3">
              Type <span className="font-mono font-bold text-danger-400">RESET</span> to confirm:
            </p>
            <input
              type="text"
              value={resetConfirm}
              onChange={e => setResetConfirm(e.target.value)}
              placeholder="Type RESET"
              className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700
                text-white placeholder-slate-600 focus:outline-none focus:border-danger-400
                mb-4 font-mono"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowResetDialog(false); setResetConfirm('') }}
                className="flex-1 py-2 px-4 rounded-xl bg-slate-700 hover:bg-slate-600
                  text-white font-medium cursor-pointer border-0 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetConfirm !== 'RESET'}
                className={`flex-1 py-2 px-4 rounded-xl font-medium border-0 transition-colors ${
                  resetConfirm === 'RESET'
                    ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                Reset Everything
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}
