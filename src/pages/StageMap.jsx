import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, BookOpen, PenTool, HelpCircle, ChevronRight, ChevronDown, Puzzle, RotateCcw, Keyboard, MessageSquare, CheckCircle, Ear, PenLine, Volume2, Target, Calendar, BookMarked, Zap, Eye } from 'lucide-react'
import { STAGES, getLessons } from '../data/hangul'

const stageColors = {
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-400' },
}

function getMilestones(progress, stageId, lessonIdx) {
  const m = progress.lessonMilestones?.[`${stageId}-${lessonIdx}`] || {}
  return {
    learned: !!m.learned,
    quizPassed: (m.quizScore || 0) >= 70,
    drawn: !!m.drawn,
  }
}

function isLessonUnlocked(progress, stageId, lessonIdx) {
  if (lessonIdx === 0) return true
  // Previous lesson must have passed the quiz
  const prev = getMilestones(progress, stageId, lessonIdx - 1)
  return prev.quizPassed
}

/** What's the next thing the user should do for this lesson? */
function getNextStep(progress, stageId, lessonIdx) {
  const m = getMilestones(progress, stageId, lessonIdx)
  if (!m.learned) return { step: 'learn', path: `/learn/${stageId}/${lessonIdx}`, label: 'Start Learning' }
  if (!m.quizPassed) return { step: 'quiz', path: `/quiz/${stageId}/${lessonIdx}`, label: 'Take Quiz' }
  if (!m.drawn) return { step: 'draw', path: `/draw/${stageId}/${lessonIdx}`, label: 'Practice Drawing' }
  return { step: 'done', path: `/learn/${stageId}/${lessonIdx}`, label: 'Review' }
}

export default function StageMap({ progress }) {
  const hasReviewItems = Object.keys(progress.mastery).length > 0
  const navigate = useNavigate()
  const [expandedStage, setExpandedStage] = useState(() => {
    for (const stage of STAGES) {
      if (progress.stagesUnlocked.includes(stage.id)) {
        const lessons = getLessons(stage)
        const allDone = lessons.every((_, i) => getMilestones(progress, stage.id, i).drawn)
        if (!allDone) return stage.id
      }
    }
    return STAGES[0].id
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="max-w-3xl mx-auto px-4 py-8"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Learning Path</h1>
          <p className="text-slate-400">Master Hangul step by step</p>
        </div>
        {hasReviewItems && (
          <Link to="/review">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                border cursor-pointer transition-colors
                border-amber-500/30 text-amber-400 bg-amber-500/5 hover:bg-amber-500/10"
            >
              <RotateCcw size={14} />
              Review
              <ChevronRight size={12} />
            </motion.button>
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {STAGES.map((stage, i) => {
          const unlocked = progress.stagesUnlocked.includes(stage.id)
          const colors = stageColors[stage.color] || stageColors.blue
          const isWords = stage.type === 'words'
          const isSyllable = stage.type === 'syllable'
          const lessons = getLessons(stage)
          const completedLessons = lessons.filter((_, li) => getMilestones(progress, stage.id, li).quizPassed).length
          const stageCompletion = lessons.length > 0 ? Math.round((completedLessons / lessons.length) * 100) : 0
          const isExpanded = expandedStage === stage.id

          return (
            <motion.div
              key={stage.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`rounded-2xl border transition-all overflow-hidden
                ${unlocked
                  ? `${colors.bg} ${colors.border}`
                  : 'bg-slate-800/30 border-slate-700/30 opacity-50'
                }`}
            >
              {/* Stage header */}
              <div
                className={`p-5 ${unlocked ? 'cursor-pointer' : ''}`}
                onClick={() => unlocked && setExpandedStage(isExpanded ? null : stage.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{stage.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className={`text-lg font-bold ${unlocked ? 'text-white' : 'text-slate-500'}`}>
                        {stage.title}
                      </h2>
                      {!unlocked && <Lock size={16} className="text-slate-600" />}
                      {unlocked && stageCompletion === 100 && (
                        <CheckCircle size={16} className="text-green-400" />
                      )}
                    </div>
                    <p className={`text-sm ${unlocked ? 'text-slate-400' : 'text-slate-600'}`}>
                      {stage.description}
                    </p>
                    {unlocked && (
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stageCompletion}%` }}
                            className={`h-full rounded-full bg-gradient-to-r
                              ${stage.color === 'blue' ? 'from-blue-500 to-blue-400' : ''}
                              ${stage.color === 'purple' ? 'from-purple-500 to-purple-400' : ''}
                              ${stage.color === 'green' ? 'from-green-500 to-green-400' : ''}
                              ${stage.color === 'orange' ? 'from-orange-500 to-orange-400' : ''}
                              ${stage.color === 'pink' ? 'from-pink-500 to-pink-400' : ''}
                            `}
                          />
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {completedLessons}/{lessons.length}
                        </span>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="text-slate-400">
                          <ChevronDown size={16} />
                        </motion.div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded lessons */}
              <AnimatePresence>
                {unlocked && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-2">
                      {isWords ? (
                        <Link to="/words" className="no-underline">
                          <motion.div whileHover={{ scale: 1.01 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 cursor-pointer hover:border-pink-500/30 transition-colors">
                            <BookOpen size={18} className="text-pink-400" />
                            <span className="text-white font-medium">Browse & Quiz Words</span>
                            <ChevronRight size={14} className="text-slate-500 ml-auto" />
                          </motion.div>
                        </Link>
                      ) : (
                        lessons.map((lesson, li) => {
                          const available = isLessonUnlocked(progress, stage.id, li)
                          const ms = getMilestones(progress, stage.id, li)
                          const next = getNextStep(progress, stage.id, li)
                          const allDone = ms.learned && ms.quizPassed && ms.drawn

                          return (
                            <motion.div
                              key={li}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: li * 0.04 }}
                              onClick={() => available && navigate(next.path)}
                              className={`rounded-xl border p-3 transition-all
                                ${available
                                  ? 'bg-slate-800/40 border-slate-700/40 cursor-pointer hover:border-slate-600/60 hover:bg-slate-800/60'
                                  : 'bg-slate-800/20 border-slate-700/20 opacity-40'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Lesson number / check */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0
                                  ${allDone
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : available
                                    ? `${colors.bg} ${colors.text} border ${colors.border}`
                                    : 'bg-slate-700/30 text-slate-500 border border-slate-700/30'
                                  }`}>
                                  {allDone ? <CheckCircle size={14} /> : li + 1}
                                </div>

                                {/* Lesson info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${available ? 'text-white' : 'text-slate-500'}`}>
                                      {lesson.title}
                                    </span>
                                  </div>
                                  <div className={`text-xs hangul ${available ? 'text-slate-400' : 'text-slate-600'}`}>
                                    {lesson.preview}
                                  </div>
                                </div>

                                {/* Milestone steps */}
                                {available && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <MilestoneIcon done={ms.learned} active={next.step === 'learn'} icon={BookOpen} label="Learn"
                                      onClick={ms.learned ? (e) => { e.stopPropagation(); navigate(`/learn/${stage.id}/${li}`) } : undefined} />
                                    <div className="w-3 h-px bg-slate-600" />
                                    <MilestoneIcon done={ms.quizPassed} active={next.step === 'quiz'} icon={HelpCircle} label="Quiz"
                                      onClick={ms.learned ? (e) => { e.stopPropagation(); navigate(`/quiz/${stage.id}/${li}`) } : undefined} />
                                    <div className="w-3 h-px bg-slate-600" />
                                    <MilestoneIcon done={ms.drawn} active={next.step === 'draw'} icon={PenTool} label="Draw"
                                      onClick={ms.quizPassed ? (e) => { e.stopPropagation(); navigate(`/draw/${stage.id}/${li}`) } : undefined} />
                                  </div>
                                )}

                                {!available && <Lock size={12} className="text-slate-600 shrink-0" />}
                                {available && <ChevronRight size={14} className="text-slate-500 shrink-0" />}
                              </div>

                              {/* Next step label */}
                              {available && !allDone && (
                                <div className="mt-1.5 ml-11 text-xs text-slate-500">
                                  Next: <span className={colors.text}>{next.label}</span>
                                </div>
                              )}
                            </motion.div>
                          )
                        })
                      )}

                      {/* Syllable builder link for syllable stages */}
                      {isSyllable && (
                        <Link to="/syllables" className="no-underline">
                          <motion.div whileHover={{ scale: 1.01 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 cursor-pointer hover:border-green-500/30 transition-colors">
                            <Puzzle size={18} className="text-green-400" />
                            <span className="text-white font-medium text-sm">Syllable Builder</span>
                            <ChevronRight size={14} className="text-slate-500 ml-auto" />
                          </motion.div>
                        </Link>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Extra practice modes */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-white mb-4">Extra Practice</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PracticeLink to="/daily" icon={Calendar} color="amber" title="Daily Challenge" desc="Today's puzzle — bonus XP" />
          <PracticeLink to="/dictation" icon={Ear} color="pink" title="Dictation" desc="Hear it, type it" />
          <PracticeLink to="/keyboard" icon={Keyboard} color="green" title="Build Syllables" desc="Compose on the Korean keyboard" />
          <PracticeLink to="/sentences" icon={MessageSquare} color="purple" title="Sentence Building" desc="Arrange words into sentences" />
          <PracticeLink to="/minimal-pairs" icon={Volume2} color="blue" title="Minimal Pairs" desc="Distinguish similar sounds" />
          <PracticeLink to="/listening" icon={Ear} color="cyan" title="Listening Drill" desc="Audio comprehension at any speed" />
          <PracticeLink to="/reading" icon={Eye} color="emerald" title="Reading Practice" desc="Read Korean and self-assess" />
          <PracticeLink to="/word-writing" icon={PenLine} color="orange" title="Word Writing" desc="Draw full Korean words" />
          <PracticeLink to="/speed-typing" icon={Zap} color="yellow" title="Speed Typing" desc="Type syllables against the clock" />
          <PracticeLink to="/stories" icon={BookOpen} color="rose" title="Character Stories" desc="Origins and mnemonics" />
          <PracticeLink to="/weak-drill" icon={Target} color="red" title="Weak Areas" desc="Practice your problem characters" />
          <PracticeLink to="/cheatsheet" icon={BookMarked} color="slate" title="Cheat Sheet" desc="Quick reference for all characters" />
        </div>
      </div>
    </motion.div>
  )
}

function MilestoneIcon({ done, active, icon: Icon, label, onClick }) {
  const clickable = !!onClick
  return (
    <div
      className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors
        ${done
          ? `bg-green-500/20 text-green-400 ${clickable ? 'hover:bg-green-500/40 hover:ring-1 hover:ring-green-400/50 cursor-pointer' : ''}`
          : active
          ? 'bg-primary-500/20 text-primary-400 ring-1 ring-primary-400/50'
          : `bg-slate-700/30 text-slate-600 ${clickable ? 'hover:bg-slate-600/50 cursor-pointer' : ''}`
        }`}
      title={clickable ? `Redo ${label}` : label}
      onClick={onClick}
    >
      {done ? <CheckCircle size={12} /> : <Icon size={11} />}
    </div>
  )
}

function PracticeLink({ to, icon: Icon, color, title, desc }) {
  return (
    <Link to={to} className="no-underline">
      <motion.div whileHover={{ scale: 1.02 }}
        className={`flex items-center gap-4 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-${color}-500/30 transition-colors`}>
        <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 border border-${color}-500/30 flex items-center justify-center`}>
          <Icon size={20} className={`text-${color}-400`} />
        </div>
        <div>
          <div className="text-white font-medium text-sm">{title}</div>
          <div className="text-xs text-slate-400">{desc}</div>
        </div>
      </motion.div>
    </Link>
  )
}
