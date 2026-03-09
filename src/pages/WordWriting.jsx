import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RotateCcw, ChevronRight, Volume2, CheckCircle } from 'lucide-react'
import confetti from 'canvas-confetti'
import { WORDS } from '../data/hangul'
import { addXp, recordSession } from '../store/progress'
import { scoreDrawing } from '../utils/drawRecognition'
import { speak, playCorrect, playWrong } from '../utils/audio'

const PASS_SCORE = 45
const TOTAL_WORDS = 6

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Split a Korean word into individual syllable characters
function splitSyllables(word) {
  return word.split('')
}

export default function WordWriting({ progress, updateProgress }) {
  const [words] = useState(() => shuffle(WORDS).slice(0, TOTAL_WORDS))
  const [wordIdx, setWordIdx] = useState(0)
  const [syllableIdx, setSyllableIdx] = useState(0)
  const [result, setResult] = useState(null)
  const [wordResults, setWordResults] = useState([]) // per-word scores
  const [done, setDone] = useState(false)
  const canvasRef = useRef(null)
  const drawCanvasRef = useRef(null)
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })

  const word = words[wordIdx]
  const syllables = splitSyllables(word.word)
  const currentChar = syllables[syllableIdx]
  const isLastSyllable = syllableIdx === syllables.length - 1
  const isLastWord = wordIdx === words.length - 1

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  const drawGuide = (ctx, ch, w, h) => {
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h)
    ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(100, 116, 139, 0.12)'
    ctx.font = `bold ${Math.min(w, h) * 0.65}px 'Noto Sans KR', 'Malgun Gothic', sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(ch, w / 2, h / 2)
  }

  const clearCanvas = (char) => {
    const canvas = canvasRef.current
    const dCanvas = drawCanvasRef.current
    if (!canvas || !dCanvas) return
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    dCanvas.getContext('2d').clearRect(0, 0, dCanvas.width, dCanvas.height)
    drawGuide(canvas.getContext('2d'), char || currentChar, canvas.width, canvas.height)
    setResult(null)
  }

  useEffect(() => {
    // Pass the current char explicitly to avoid stale closure
    const syls = splitSyllables(words[wordIdx].word)
    clearCanvas(syls[syllableIdx])
  }, [syllableIdx, wordIdx])

  const startDraw = (e) => {
    e.preventDefault()
    if (result) return
    isDrawingRef.current = true
    lastPosRef.current = getPos(e)
  }

  const draw = (e) => {
    if (!isDrawingRef.current || result) return
    e.preventDefault()
    const pos = getPos(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.beginPath(); ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y); ctx.lineTo(pos.x, pos.y); ctx.stroke()
    const dCtx = drawCanvasRef.current.getContext('2d')
    dCtx.strokeStyle = '#ffffff'; dCtx.lineWidth = 8; dCtx.lineCap = 'round'; dCtx.lineJoin = 'round'
    dCtx.beginPath(); dCtx.moveTo(lastPosRef.current.x, lastPosRef.current.y); dCtx.lineTo(pos.x, pos.y); dCtx.stroke()
    lastPosRef.current = pos
  }

  const stopDraw = () => { isDrawingRef.current = false }

  const handleCheck = () => {
    const res = scoreDrawing(drawCanvasRef.current, currentChar)
    setResult(res)
    if (res.score >= PASS_SCORE) {
      playCorrect()
      confetti({ particleCount: 20, spread: 40, origin: { y: 0.6 } })
    } else {
      playWrong()
    }
  }

  const handleNext = () => {
    if (isLastSyllable) {
      // Word complete
      const newResults = [...wordResults, word.word]
      setWordResults(newResults)
      speak(word.word)

      if (isLastWord) {
        updateProgress(prev => {
          let next = { ...prev, drawCount: (prev.drawCount || 0) + syllables.length }
          next = addXp(next, 15)
          return recordSession(next)
        })
        setDone(true)
      } else {
        setWordIdx(i => i + 1)
        setSyllableIdx(0)
        setResult(null)
      }
    } else {
      setSyllableIdx(i => i + 1)
      setResult(null)
    }
  }

  const passed = result && result.score >= PASS_SCORE

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">✍️</div>
        <h1 className="text-3xl font-bold text-white mb-2">Words Written!</h1>
        <p className="text-slate-400 mb-6">{wordResults.length} words completed</p>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {wordResults.map((w, i) => (
            <span key={i} className="hangul text-xl px-3 py-1 rounded-lg bg-success-400/10 border border-success-400/30 text-success-400">{w}</span>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white border-0 cursor-pointer font-medium">
            <RotateCcw size={16} /> New Words
          </motion.button>
          <Link to="/stages">
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white border-0 cursor-pointer font-medium w-full">
              Back to Stages
            </motion.button>
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="max-w-xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/stages" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors no-underline text-sm">
          <ArrowLeft size={16} /> Back
        </Link>
        <span className="text-sm text-slate-400">Word {wordIdx + 1}/{words.length}</span>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-6 overflow-hidden">
        <motion.div animate={{ width: `${((wordIdx + syllableIdx / syllables.length) / words.length) * 100}%` }}
          className="h-full bg-primary-500 rounded-full" />
      </div>

      {/* Target word with syllable highlight */}
      <div className="text-center mb-4">
        <div className="text-sm text-slate-400 mb-2">Write this word:</div>
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="flex gap-1">
            {syllables.map((s, i) => (
              <span key={i} className={`hangul text-4xl font-black transition-colors
                ${i < syllableIdx ? 'text-success-400' : i === syllableIdx ? 'text-white' : 'text-slate-600'}`}>
                {s}
              </span>
            ))}
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => speak(word.word)}
            className="w-9 h-9 rounded-full bg-primary-600/30 border border-primary-500/30 flex items-center justify-center cursor-pointer text-primary-400">
            <Volume2 size={14} />
          </motion.button>
        </div>
        <div className="text-primary-400 font-medium">{word.roman}</div>
        <div className="text-slate-500 text-sm">{word.meaning}</div>
        <div className="text-xs text-slate-600 mt-1">
          Syllable {syllableIdx + 1} of {syllables.length}: <span className="hangul text-slate-400">{currentChar}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex justify-center mb-4">
        <div className="relative bg-slate-800/80 border-2 border-slate-600/50 rounded-2xl overflow-hidden">
          <canvas ref={canvasRef} width={300} height={300}
            className="drawing-canvas block" style={{ width: '100%', maxWidth: 300, aspectRatio: '1' }}
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
          <canvas ref={drawCanvasRef} width={300} height={300} style={{ display: 'none' }} />
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className={`px-5 py-3 rounded-2xl text-center backdrop-blur-sm border-2
                  ${passed ? 'bg-success-400/10 border-success-400/40' : 'bg-danger-400/10 border-danger-400/40'}`}>
                  <div className={`text-2xl font-black ${passed ? 'text-success-400' : 'text-danger-400'}`}>
                    {passed ? 'Good!' : 'Try Again'}
                  </div>
                  <div className="text-white font-bold">{result.score}%</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={clearCanvas}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white border-0 cursor-pointer font-medium text-sm">
          <RotateCcw size={14} /> Clear
        </motion.button>

        {!passed ? (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleCheck} disabled={!canvasRef.current || passed}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white border-0 cursor-pointer font-medium text-sm">
            Check
          </motion.button>
        ) : (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white border-0 cursor-pointer font-medium text-sm">
            {isLastSyllable && isLastWord ? 'Done' : isLastSyllable ? 'Next Word' : 'Next Syllable'} <ChevronRight size={14} />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
