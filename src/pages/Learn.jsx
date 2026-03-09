import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Volume2, ArrowLeft, CheckCircle, Clock, Brain } from 'lucide-react'
import { STAGES, getLessons, getPreviousLetters } from '../data/hangul'
import { addXp, unlockNextStage } from '../store/progress'
import { speak } from '../utils/audio'

export default function Learn({ progress, updateProgress }) {
  const { stageId, lessonIdx } = useParams()
  const navigate = useNavigate()
  const stage = STAGES.find(s => s.id === Number(stageId))
  const lesson = getLessons(stage)?.[Number(lessonIdx)]
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [direction, setDirection] = useState(0)
  const startTime = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!stage || !lesson) return <div className="text-center py-20 text-slate-400">Lesson not found</div>

  // Current lesson's letters + 1-2 interleaved review from previous lessons
  const cards = useMemo(() => {
    const previousLetters = getPreviousLetters(stage, Number(lessonIdx))
    const reviewCount = Math.min(2, previousLetters.length)
    const shuffledPrev = [...previousLetters].sort(() => Math.random() - 0.5)
    const reviewCards = shuffledPrev.slice(0, reviewCount)
    return [...lesson.letters, ...reviewCards]
  }, [stage, lessonIdx, lesson])

  const letter = cards[currentIndex]
  const isLast = currentIndex === cards.length - 1
  const isReviewCard = currentIndex >= lesson.letters.length
  const char = letter?.char || letter?.word

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const showNudge = elapsed >= 900 // 15 min nudge

  const goNext = () => {
    if (isLast) {
      // Finished lesson — mark learned milestone, navigate to quiz
      updateProgress(prev => {
        const next = { ...prev }
        const key = `${stage.id}-${lessonIdx}`
        next.lessonProgress = { ...next.lessonProgress }
        next.lessonProgress[key] = Math.max(next.lessonProgress[key] || 0, 50)
        // Mark milestone
        next.lessonMilestones = { ...next.lessonMilestones }
        next.lessonMilestones[key] = { ...(next.lessonMilestones[key] || {}), learned: true }
        return addXp(next, 10)
      })
      navigate(`/quiz/${stage.id}/${lessonIdx}`)
      return
    }
    setDirection(1)
    setFlipped(false)
    setCurrentIndex(i => i + 1)
  }

  const goPrev = () => {
    if (currentIndex === 0) return
    setDirection(-1)
    setFlipped(false)
    setCurrentIndex(i => i - 1)
  }

  const handleFlip = () => {
    const willFlip = !flipped
    setFlipped(willFlip)
    if (willFlip) speak(char)
  }

  if (!letter) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/stages" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors no-underline text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock size={10} />{formatTime(elapsed)}
          </span>
          <span className="text-sm text-slate-400">
            {lesson.title} · {currentIndex + 1}/{cards.length}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-6 overflow-hidden">
        <motion.div
          animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          className="h-full bg-primary-500 rounded-full"
        />
      </div>

      {/* Card info */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
          {isReviewCard ? (
            <span className="text-amber-400 flex items-center gap-1">
              <Brain size={10} /> Review from earlier
            </span>
          ) : (
            <span className="text-primary-400">
              New: {currentIndex + 1} of {lesson.letters.length}
            </span>
          )}
        </div>
      </div>

      {/* Session nudge */}
      {showNudge && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center"
        >
          <p className="text-amber-400 text-xs font-medium">
            {Math.round(elapsed / 60)} minutes in — great focus! Consider a short break soon for best retention.
          </p>
        </motion.div>
      )}

      {/* Card */}
      <div className="flex justify-center mb-8">
        <motion.div
          key={currentIndex}
          initial={{ x: direction * 200, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={handleFlip}
          className="w-72 sm:w-80 cursor-pointer"
        >
          <div className={`bg-slate-800/80 border rounded-3xl p-8 text-center min-h-[360px] flex flex-col items-center justify-center relative overflow-hidden
            ${isReviewCard ? 'border-amber-500/30' : 'border-slate-600/50'}`}>
            <AnimatePresence mode="wait">
              {!flipped ? (
                <motion.div
                  key="front"
                  initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} exit={{ rotateY: -90 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <span className="hangul text-8xl sm:text-9xl font-black text-white mb-4">{char}</span>
                  <div className="text-slate-500 text-sm">Tap to reveal</div>
                </motion.div>
              ) : (
                <motion.div
                  key="back"
                  initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} exit={{ rotateY: -90 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center gap-3"
                >
                  <span className="hangul text-5xl font-bold text-white">{char}</span>

                  <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); speak(char) }}
                    className="w-12 h-12 rounded-full bg-primary-600 hover:bg-primary-500
                      flex items-center justify-center cursor-pointer border-0
                      text-white shadow-lg transition-colors"
                  >
                    <Volume2 size={20} />
                  </motion.button>

                  <div className="text-2xl font-bold text-primary-400">{letter.roman}</div>

                  {letter.sound && (
                    <div className="text-slate-400 text-sm">Sound: "{letter.sound}"</div>
                  )}

                  {letter.mnemonic && (
                    <div className="text-sm text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl">
                      {letter.mnemonic}
                    </div>
                  )}

                  {letter.articulation && (
                    <div className="text-xs text-slate-400 italic">
                      {letter.articulation}
                    </div>
                  )}

                  {letter.hint && !letter.mnemonic && (
                    <div className="text-slate-300 text-sm bg-slate-700/50 px-4 py-2 rounded-xl">
                      {letter.hint}
                    </div>
                  )}
                  {letter.meaning && (
                    <div className="text-lg text-success-400 font-medium">{letter.meaning}</div>
                  )}
                  {letter.components && (
                    <div className="text-sm text-slate-400">
                      Made from: <span className="hangul text-primary-300">{letter.components.join(' + ')}</span>
                    </div>
                  )}
                  {letter.base && (
                    <div className="text-sm text-slate-400">
                      Based on: <span className="hangul text-primary-300">{letter.base}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="w-12 h-12 rounded-full bg-slate-700/50 border border-slate-600/50
            flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed
            text-white hover:bg-slate-600/50 transition-colors"
        >
          <ChevronLeft size={20} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={(e) => { e.stopPropagation(); speak(char) }}
          className="w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-500
            flex items-center justify-center cursor-pointer border-0
            text-white shadow-lg transition-colors"
        >
          <Volume2 size={22} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={goNext}
          className={`w-12 h-12 rounded-full flex items-center justify-center cursor-pointer border-0 text-white transition-colors
            ${isLast
              ? 'bg-success-500 hover:bg-success-400'
              : 'bg-slate-700/50 border border-slate-600/50 hover:bg-slate-600/50'
            }`}
        >
          {isLast ? <CheckCircle size={20} /> : <ChevronRight size={20} />}
        </motion.button>
      </div>

      <div className="text-center mt-3 text-xs text-slate-500">
        {isLast && (
          <span className="text-success-400 font-medium">Complete! Move to quiz →</span>
        )}
      </div>
    </motion.div>
  )
}
