import { useState, useCallback, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { loadProgress, saveProgress, checkAchievements } from './store/progress'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import StageMap from './pages/StageMap'
import Learn from './pages/Learn'
import Quiz from './pages/Quiz'
import DrawPractice from './pages/DrawPractice'
import WordLearn from './pages/WordLearn'
import SyllableBuilder from './pages/SyllableBuilder'
import Review from './pages/Review'
import Stats from './pages/Stats'
import Settings from './pages/Settings'
import TimedChallenge from './pages/TimedChallenge'
import SentencePractice from './pages/SentencePractice'
import KeyboardPractice from './pages/KeyboardPractice'
import Dictation from './pages/Dictation'
import WeakLetterDrill from './pages/WeakLetterDrill'
import ReadingPractice from './pages/ReadingPractice'
import MinimalPairs from './pages/MinimalPairs'
import SpeedTyping from './pages/SpeedTyping'
import WordWriting from './pages/WordWriting'
import CharacterStories from './pages/CharacterStories'
import DailyChallenge from './pages/DailyChallenge'
import CheatSheet from './pages/CheatSheet'
import ListeningDrill from './pages/ListeningDrill'
import AchievementToast from './components/AchievementToast'
import VoiceCheck from './components/VoiceCheck'

export default function App() {
  const [progress, setProgress] = useState(() => loadProgress())
  const [toast, setToast] = useState(null)
  const location = useLocation()

  // Theme: read from settings, apply to document
  const theme = progress.settings?.theme || 'dark'
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const updateProgress = useCallback((updater) => {
    setProgress(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      const newAchievements = checkAchievements(next)
      if (newAchievements.length > 0) {
        setToast(newAchievements[0])
        setTimeout(() => setToast(null), 3000)
      }
      saveProgress(next)
      return next
    })
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar progress={progress} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Dashboard progress={progress} />} />
            <Route path="/stages" element={<StageMap progress={progress} />} />
            <Route path="/learn/:stageId/:lessonIdx" element={<Learn progress={progress} updateProgress={updateProgress} />} />
            <Route path="/quiz/:stageId/:lessonIdx" element={<Quiz progress={progress} updateProgress={updateProgress} />} />
            <Route path="/draw/:stageId/:lessonIdx" element={<DrawPractice progress={progress} updateProgress={updateProgress} />} />
            <Route path="/words" element={<WordLearn progress={progress} updateProgress={updateProgress} />} />
            <Route path="/syllables" element={<SyllableBuilder progress={progress} updateProgress={updateProgress} />} />
            <Route path="/review" element={<Review progress={progress} updateProgress={updateProgress} />} />
            <Route path="/stats" element={<Stats progress={progress} />} />
            <Route path="/settings" element={<Settings progress={progress} updateProgress={updateProgress} />} />
            <Route path="/challenge" element={<TimedChallenge progress={progress} updateProgress={updateProgress} />} />
            <Route path="/sentences" element={<SentencePractice progress={progress} updateProgress={updateProgress} />} />
            <Route path="/keyboard" element={<KeyboardPractice progress={progress} updateProgress={updateProgress} />} />
            <Route path="/dictation" element={<Dictation progress={progress} updateProgress={updateProgress} />} />
            <Route path="/weak-drill" element={<WeakLetterDrill progress={progress} updateProgress={updateProgress} />} />
            <Route path="/reading" element={<ReadingPractice progress={progress} updateProgress={updateProgress} />} />
            <Route path="/minimal-pairs" element={<MinimalPairs progress={progress} updateProgress={updateProgress} />} />
            <Route path="/speed-typing" element={<SpeedTyping progress={progress} updateProgress={updateProgress} />} />
            <Route path="/word-writing" element={<WordWriting progress={progress} updateProgress={updateProgress} />} />
            <Route path="/stories" element={<CharacterStories />} />
            <Route path="/daily" element={<DailyChallenge progress={progress} updateProgress={updateProgress} />} />
            <Route path="/cheatsheet" element={<CheatSheet progress={progress} />} />
            <Route path="/listening" element={<ListeningDrill progress={progress} updateProgress={updateProgress} />} />
          </Routes>
        </AnimatePresence>
      </main>
      <AchievementToast achievement={toast} />
      <VoiceCheck />
    </div>
  )
}
