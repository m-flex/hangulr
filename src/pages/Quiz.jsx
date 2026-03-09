import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle, XCircle, Flame, RotateCcw, Volume2, Ear, Eye, Clock } from 'lucide-react'
import confetti from 'canvas-confetti'
import { STAGES, getLessons, getPreviousLetters } from '../data/hangul'
import { recordAnswer, unlockNextStage } from '../store/progress'
import { speak, playCorrect, playWrong } from '../utils/audio'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const Q_TYPES = ['char_to_roman', 'roman_to_char', 'listen_to_char']

function makeQuestion(letter, allLetters, type) {
  const char = letter.char || letter.word
  const roman = letter.roman

  if (type === 'char_to_roman') {
    const wrongs = shuffle(allLetters.filter(l => l.roman !== roman)).slice(0, 3).map(l => l.roman)
    return {
      type, letter, char, correct: roman,
      options: shuffle([roman, ...wrongs]),
      prompt: char, hint: letter.meaning || letter.hint,
      isRetry: false,
    }
  }
  if (type === 'roman_to_char') {
    const wrongs = shuffle(allLetters.filter(l => (l.char || l.word) !== char)).slice(0, 3).map(l => l.char || l.word)
    return {
      type, letter, char, correct: char,
      options: shuffle([char, ...wrongs]),
      prompt: roman, hint: letter.meaning || letter.hint,
      isRetry: false,
    }
  }
  // listen_to_char
  const wrongs = shuffle(allLetters.filter(l => (l.char || l.word) !== char)).slice(0, 3).map(l => l.char || l.word)
  return {
    type, letter, char, correct: char,
    options: shuffle([char, ...wrongs]),
    prompt: null, hint: null,
    isRetry: false,
  }
}

function generateQuestions(lessonLetters, allLetters, previousLetters) {
  // Quiz each lesson letter at least twice (different question types)
  // Plus 1-2 interleaved from previous lessons
  const questions = []
  const lessonPool = shuffle(lessonLetters)

  // Each lesson letter gets 2 questions with different types
  lessonPool.forEach((letter, i) => {
    const type1 = Q_TYPES[i % Q_TYPES.length]
    const type2 = Q_TYPES[(i + 1) % Q_TYPES.length]
    questions.push(makeQuestion(letter, allLetters, type1))
    questions.push(makeQuestion(letter, allLetters, type2))
  })

  // Add 1-2 review questions from previous lessons
  if (previousLetters.length > 0) {
    const reviewPool = shuffle(previousLetters).slice(0, 2)
    reviewPool.forEach((letter, i) => {
      const type = Q_TYPES[i % Q_TYPES.length]
      const q = makeQuestion(letter, allLetters, type)
      q.isReview = true
      questions.push(q)
    })
  }

  return shuffle(questions)
}

const typeLabels = {
  char_to_roman: { icon: Eye, text: 'What is the romanization of:', color: 'text-primary-400' },
  roman_to_char: { icon: Eye, text: 'Which character is:', color: 'text-purple-400' },
  listen_to_char: { icon: Ear, text: 'Listen and pick the character:', color: 'text-green-400' },
}

export default function Quiz({ progress, updateProgress }) {
  const { stageId, lessonIdx } = useParams()
  const stage = STAGES.find(s => s.id === Number(stageId))
  const lessons = getLessons(stage)
  const lesson = lessons?.[Number(lessonIdx)]
  const previousLetters = useMemo(() => getPreviousLetters(stage, Number(lessonIdx)), [stage, lessonIdx])

  const [questions, setQuestions] = useState(() =>
    generateQuestions(lesson?.letters || [], stage?.letters || [], previousLetters)
  )
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [done, setDone] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const startTime = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])

  if (!stage || !lesson) return <div className="text-center py-20 text-slate-400">Quiz not found</div>

  const q = questions[qIndex]
  const totalQ = questions.length
  const tl = typeLabels[q.type]
  const TypeIcon = tl.icon
  const isHangulOptions = q.type !== 'char_to_roman'

  // Auto-play audio for listening questions
  useEffect(() => {
    if (q.type === 'listen_to_char') {
      speak(q.char)
    }
  }, [qIndex, q.type, q.char])

  const handleSelect = (option) => {
    if (selected !== null) return
    setSelected(option)
    setShowResult(true)
    const isCorrect = option === q.correct

    if (isCorrect) {
      setCorrectCount(c => c + 1)
      setStreak(s => s + 1)
      playCorrect()
      confetti({ particleCount: 30, spread: 40, origin: { y: 0.7 }, colors: ['#22c55e', '#4ade80'] })
    } else {
      setStreak(0)
      playWrong()

      // ERROR RE-TESTING: insert a retry 2-4 positions later
      if (!q.isRetry) {
        setQuestions(prev => {
          const copy = [...prev]
          const retryType = Q_TYPES[Math.floor(Math.random() * Q_TYPES.length)]
          const retry = makeQuestion(q.letter, stage.letters, retryType)
          retry.isRetry = true
          const insertAt = Math.min(qIndex + 2 + Math.floor(Math.random() * 3), copy.length)
          copy.splice(insertAt, 0, retry)
          return copy
        })
      }
    }

    setTimeout(() => speak(q.char), 300)
    updateProgress(prev => recordAnswer({ ...prev }, q.char, isCorrect))

    setTimeout(() => {
      if (qIndex + 1 >= questions.length) {
        setDone(true)
        const finalCorrect = correctCount + (isCorrect ? 1 : 0)
        const score = Math.round((finalCorrect / questions.length) * 100)
        if (score >= 70) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } })
          updateProgress(prev => {
            const next = { ...prev }
            // Update lesson progress
            const key = `${stage.id}-${lessonIdx}`
            next.lessonProgress = { ...next.lessonProgress }
            next.lessonProgress[key] = Math.max(next.lessonProgress[key] || 0, score)
            // Mark quiz milestone
            next.lessonMilestones = { ...next.lessonMilestones }
            const existing = next.lessonMilestones[key] || {}
            next.lessonMilestones[key] = { ...existing, quizScore: Math.max(existing.quizScore || 0, score) }
            // Update stage progress (average of all lessons)
            const allLessons = getLessons(stage)
            const totalPct = allLessons.reduce((sum, _, i) => sum + (next.lessonProgress[`${stage.id}-${i}`] || 0), 0)
            next.stageProgress = { ...next.stageProgress }
            next.stageProgress[stage.id] = Math.round(totalPct / allLessons.length)
            // Unlock next stage if all lessons in this stage are done
            const allDone = allLessons.every((_, i) => (next.lessonProgress[`${stage.id}-${i}`] || 0) >= 70)
            if (allDone) return unlockNextStage(next, stage.id)
            return next
          })
        }
      } else {
        setQIndex(i => i + 1)
        setSelected(null)
        setShowResult(false)
      }
    }, 1500)
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const restart = () => {
    setQuestions(generateQuestions(lesson.letters, stage.letters, previousLetters))
    setQIndex(0)
    setSelected(null)
    setCorrectCount(0)
    setStreak(0)
    setDone(false)
    setShowResult(false)
    startTime.current = Date.now()
  }

  // ── Results screen ──
  if (done) {
    const score = Math.round((correctCount / totalQ) * 100)
    const passed = score >= 70
    const lessonNum = Number(lessonIdx)
    const hasNextLesson = lessonNum + 1 < lessons.length

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto px-4 py-16 text-center"
      >
        <div className="text-6xl mb-4">{passed ? '🎉' : '💪'}</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {passed ? 'Great Job!' : 'Keep Practicing!'}
        </h1>
        <div className="text-5xl font-black mb-2" style={{ color: passed ? '#22c55e' : '#f59e0b' }}>
          {score}%
        </div>
        <p className="text-slate-400 mb-1">
          {correctCount} out of {totalQ} correct — {lesson.title}
        </p>
        {passed && hasNextLesson && (
          <p className="text-green-400 text-sm mb-2">Next lesson unlocked!</p>
        )}
        <p className="text-slate-500 text-sm mb-8">
          Completed in {formatTime(elapsed)}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={restart}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
              bg-slate-700 hover:bg-slate-600 text-white border-0 cursor-pointer font-medium"
          >
            <RotateCcw size={16} /> Try Again
          </motion.button>
          {passed ? (
            <Link to={`/draw/${stage.id}/${lessonIdx}`}>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                  bg-primary-600 hover:bg-primary-500 text-white border-0 cursor-pointer font-medium w-full"
              >
                Practice Drawing →
              </motion.button>
            </Link>
          ) : (
            <Link to="/stages">
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                  bg-primary-600 hover:bg-primary-500 text-white border-0 cursor-pointer font-medium w-full"
              >
                Back to Stages
              </motion.button>
            </Link>
          )}
        </div>
      </motion.div>
    )
  }

  // Session nudge after 20 minutes
  const showNudge = elapsed >= 1200 && !done

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-xl mx-auto px-4 py-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/stages" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors no-underline text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <div className="flex items-center gap-3">
          {streak >= 3 && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="flex items-center gap-1 text-orange-400 text-sm font-bold"
            >
              <Flame size={16} />{streak}
            </motion.div>
          )}
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Clock size={10} />{formatTime(elapsed)}
          </span>
          <span className="text-sm text-slate-400">{qIndex + 1}/{questions.length}</span>
        </div>
      </div>

      {/* Lesson label */}
      <div className="text-center mb-2">
        <span className="text-xs text-slate-500">{stage.title} · {lesson.title}</span>
      </div>

      {/* Session nudge */}
      {showNudge && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center"
        >
          <p className="text-amber-400 text-xs font-medium">
            You've been studying for {Math.round(elapsed / 60)} minutes — consider a break!
          </p>
        </motion.div>
      )}

      {/* Retry badge */}
      {q.isRetry && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400">
            <RotateCcw size={10} /> Retry — you missed this one earlier
          </span>
        </motion.div>
      )}
      {q.isReview && !q.isRetry && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-2">
          <span className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400">
            Review from previous lesson
          </span>
        </motion.div>
      )}

      {/* Progress */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-8 overflow-hidden">
        <motion.div
          animate={{ width: `${((qIndex + 1) / questions.length) * 100}%` }}
          className="h-full bg-primary-500 rounded-full"
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={qIndex}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-1.5 text-xs font-medium mb-3 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 ${tl.color}`}>
              <TypeIcon size={12} />
              {q.type === 'char_to_roman' && 'Read'}
              {q.type === 'roman_to_char' && 'Recognize'}
              {q.type === 'listen_to_char' && 'Listen'}
            </div>

            <div className="text-sm text-slate-400 mb-2">{tl.text}</div>

            {q.type === 'char_to_roman' && (
              <div className="hangul text-7xl sm:text-8xl font-black text-white mb-3">{q.prompt}</div>
            )}
            {q.type === 'roman_to_char' && (
              <div className="text-4xl sm:text-5xl font-black text-purple-400 mb-3">{q.prompt}</div>
            )}
            {q.type === 'listen_to_char' && (
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => speak(q.char)}
                className="w-20 h-20 rounded-full bg-green-600/20 border-2 border-green-500/40
                  flex items-center justify-center cursor-pointer text-green-400 mx-auto mb-3
                  hover:bg-green-600/30 transition-colors"
              >
                <Volume2 size={32} />
              </motion.button>
            )}

            {q.type !== 'listen_to_char' && (
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => speak(q.char)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full
                  bg-primary-600/20 border border-primary-500/30 text-primary-400
                  text-sm font-medium cursor-pointer hover:bg-primary-600/30 transition-colors mb-2"
              >
                <Volume2 size={16} /> Listen
              </motion.button>
            )}

            {q.hint && !showResult && (
              <div className="text-sm text-slate-500">{q.hint}</div>
            )}
          </div>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3">
            {q.options.map((option, i) => {
              let style = 'bg-slate-800/80 border-slate-600/50 text-white hover:border-primary-400/50'
              if (showResult && option === q.correct)
                style = 'bg-green-500/20 border-green-500/50 text-green-400'
              else if (showResult && option === selected && option !== q.correct)
                style = 'bg-red-500/20 border-red-500/50 text-red-400'

              return (
                <motion.button
                  key={option + i}
                  whileHover={selected === null ? { scale: 1.03 } : {}}
                  whileTap={selected === null ? { scale: 0.97 } : {}}
                  onClick={() => handleSelect(option)}
                  disabled={selected !== null}
                  className={`p-4 rounded-xl border font-semibold cursor-pointer
                    transition-all ${style} disabled:cursor-default
                    ${isHangulOptions ? 'hangul text-2xl' : 'text-lg'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {showResult && option === q.correct && <CheckCircle size={18} />}
                    {showResult && option === selected && option !== q.correct && <XCircle size={18} />}
                    {option}
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Answer details + mnemonic */}
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center"
            >
              <div className="text-sm text-slate-400">
                <span className="hangul text-lg text-white">{q.char}</span>
                {' = '}
                <span className="text-primary-400 font-medium">{q.letter.roman}</span>
              </div>
              {q.letter.mnemonic && (
                <div className="text-xs text-slate-500 mt-1 bg-slate-800/50 inline-block px-3 py-1 rounded-lg">
                  {q.letter.mnemonic}
                </div>
              )}
              {q.letter.articulation && (
                <div className="text-xs text-slate-600 mt-1">{q.letter.articulation}</div>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
