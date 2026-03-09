import { useState, useRef, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, RotateCcw, ChevronLeft, ChevronRight, Volume2, Play } from 'lucide-react'
import confetti from 'canvas-confetti'
import { STAGES, getLessons } from '../data/hangul'
import { getStrokes } from '../data/strokes'
import { addXp } from '../store/progress'
import { scoreDrawing } from '../utils/drawRecognition'
import { speak } from '../utils/audio'
import { playCorrect, playWrong } from '../utils/audio'

const PASS_SCORE = 50

const gradeColors = {
  'Perfect': { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/40' },
  'Great': { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/40' },
  'Good': { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/40' },
  'Almost': { text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/40' },
  'Try Again': { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/40' },
}

export default function DrawPractice({ progress, updateProgress }) {
  const { stageId, lessonIdx } = useParams()
  const stage = STAGES.find(s => s.id === Number(stageId))
  const lesson = getLessons(stage)?.[Number(lessonIdx)]
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [result, setResult] = useState(null) // { score, grade, coverage, precision }
  const [showGuide, setShowGuide] = useState(() => progress.settings?.drawGuideDefault !== false)
  const [isAnimating, setIsAnimating] = useState(false)
  const navigate = useNavigate()
  const [passedLetters, setPassedLetters] = useState(new Set())
  const canvasRef = useRef(null)
  const drawCanvasRef = useRef(null) // separate layer for user strokes only
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const animFrameRef = useRef(null)

  if (!stage || !lesson) return <div className="text-center py-20 text-slate-400">Lesson not found</div>

  const letters = lesson.letters
  const letter = letters[currentIndex]
  const char = letter.char || letter.word

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

  const startDraw = (e) => {
    e.preventDefault()
    if (result) return
    isDrawingRef.current = true
    const pos = getPos(e)
    lastPosRef.current = pos
  }

  const draw = (e) => {
    if (!isDrawingRef.current || result) return
    e.preventDefault()
    const pos = getPos(e)

    // Draw on visual canvas
    const ctx = canvasRef.current.getContext('2d')
    ctx.strokeStyle = '#60a5fa'
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()

    // Draw on hidden recognition canvas (no guide, just user strokes)
    const dCtx = drawCanvasRef.current.getContext('2d')
    dCtx.strokeStyle = '#ffffff'
    dCtx.lineWidth = 8
    dCtx.lineCap = 'round'
    dCtx.lineJoin = 'round'
    dCtx.beginPath()
    dCtx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
    dCtx.lineTo(pos.x, pos.y)
    dCtx.stroke()

    lastPosRef.current = pos
    setHasDrawn(true)
  }

  const stopDraw = () => {
    isDrawingRef.current = false
  }

  const drawGuide = (ctx, ch, w, h) => {
    // Crosshair guides
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(w / 2, 0)
    ctx.lineTo(w / 2, h)
    ctx.moveTo(0, h / 2)
    ctx.lineTo(w, h / 2)
    ctx.stroke()
    ctx.setLineDash([])

    // Ghost character
    if (showGuide) {
      ctx.fillStyle = 'rgba(100, 116, 139, 0.15)'
      ctx.font = `bold ${Math.min(w, h) * 0.7}px 'Noto Sans KR', 'Malgun Gothic', sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(ch, w / 2, h / 2)
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const dCanvas = drawCanvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    dCanvas.getContext('2d').clearRect(0, 0, dCanvas.width, dCanvas.height)
    drawGuide(canvas.getContext('2d'), char, canvas.width, canvas.height)
    setHasDrawn(false)
    setResult(null)
  }

  // Stroke order animation: draws each stroke individually in proper writing order
  const animateStroke = () => {
    if (isAnimating) return
    const canvas = canvasRef.current
    if (!canvas) return

    const strokes = getStrokes(char)
    if (!strokes) {
      // Fallback for characters without stroke data (e.g. syllable blocks):
      // render the full character with a simple fade-in
      setIsAnimating(true)
      clearCanvas()
      const ctx = canvas.getContext('2d')
      const w = canvas.width, h = canvas.height
      ctx.fillStyle = '#60a5fa'
      ctx.font = `bold ${Math.min(w, h) * 0.7}px 'Noto Sans KR', 'Malgun Gothic', sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(char, w / 2, h / 2)
      setTimeout(() => { setIsAnimating(false); clearCanvas() }, 1200)
      return
    }

    setIsAnimating(true)
    clearCanvas()

    const w = canvas.width
    const h = canvas.height
    const ctx = canvas.getContext('2d')
    const pad = 20 // padding from edges

    // Convert normalized [0,1] coords to canvas pixels
    const toPixel = ([nx, ny]) => [pad + nx * (w - 2 * pad), pad + ny * (h - 2 * pad)]

    // Calculate total path length across all strokes for timing
    const strokeLengths = strokes.map(pts => {
      const px = pts.map(toPixel)
      let len = 0
      for (let i = 1; i < px.length; i++) {
        len += Math.hypot(px[i][0] - px[i - 1][0], px[i][1] - px[i - 1][1])
      }
      return len
    })

    const msPerStroke = 400 // time to draw each stroke
    const pauseBetween = 150 // pause between strokes
    let strokeIdx = 0
    let strokeStart = null
    // Store completed strokes so we can redraw them each frame
    const completedStrokes = []

    const drawCompletedStrokes = () => {
      ctx.clearRect(0, 0, w, h)
      drawGuide(ctx, char, w, h)
      // Redraw all completed strokes
      for (const points of completedStrokes) {
        ctx.strokeStyle = '#60a5fa'
        ctx.lineWidth = 10
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(points[0][0], points[0][1])
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i][0], points[i][1])
        }
        ctx.stroke()
      }
    }

    const animate = (now) => {
      if (strokeIdx >= strokes.length) {
        // All strokes done — hold briefly then clear
        drawCompletedStrokes()
        setTimeout(() => { setIsAnimating(false); clearCanvas() }, 800)
        return
      }

      if (strokeStart === null) strokeStart = now
      const elapsed = now - strokeStart
      const progress = Math.min(elapsed / msPerStroke, 1)

      const currentStroke = strokes[strokeIdx]
      const pixelPts = currentStroke.map(toPixel)
      const totalLen = strokeLengths[strokeIdx]
      const targetLen = progress * totalLen

      // Find how far along the polyline we should draw
      drawCompletedStrokes()

      ctx.strokeStyle = '#60a5fa'
      ctx.lineWidth = 10
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(pixelPts[0][0], pixelPts[0][1])

      let accumulated = 0
      for (let i = 1; i < pixelPts.length; i++) {
        const segLen = Math.hypot(pixelPts[i][0] - pixelPts[i - 1][0], pixelPts[i][1] - pixelPts[i - 1][1])
        if (accumulated + segLen <= targetLen) {
          ctx.lineTo(pixelPts[i][0], pixelPts[i][1])
          accumulated += segLen
        } else {
          // Partial segment
          const remaining = targetLen - accumulated
          const t = segLen > 0 ? remaining / segLen : 0
          const x = pixelPts[i - 1][0] + (pixelPts[i][0] - pixelPts[i - 1][0]) * t
          const y = pixelPts[i - 1][1] + (pixelPts[i][1] - pixelPts[i - 1][1]) * t
          ctx.lineTo(x, y)
          break
        }
      }
      ctx.stroke()

      // Draw a dot at the pen tip for visual feedback
      if (progress < 1) {
        // Find current tip position
        let tipAccum = 0
        let tipX = pixelPts[0][0], tipY = pixelPts[0][1]
        for (let i = 1; i < pixelPts.length; i++) {
          const segLen = Math.hypot(pixelPts[i][0] - pixelPts[i - 1][0], pixelPts[i][1] - pixelPts[i - 1][1])
          if (tipAccum + segLen <= targetLen) {
            tipX = pixelPts[i][0]
            tipY = pixelPts[i][1]
            tipAccum += segLen
          } else {
            const remaining = targetLen - tipAccum
            const t = segLen > 0 ? remaining / segLen : 0
            tipX = pixelPts[i - 1][0] + (pixelPts[i][0] - pixelPts[i - 1][0]) * t
            tipY = pixelPts[i - 1][1] + (pixelPts[i][1] - pixelPts[i - 1][1]) * t
            break
          }
        }
        ctx.fillStyle = '#93c5fd'
        ctx.beginPath()
        ctx.arc(tipX, tipY, 6, 0, Math.PI * 2)
        ctx.fill()
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate)
      } else {
        // Stroke complete — save it and move to next after pause
        completedStrokes.push(pixelPts)
        strokeIdx++
        strokeStart = null
        if (strokeIdx < strokes.length) {
          setTimeout(() => {
            animFrameRef.current = requestAnimationFrame(animate)
          }, pauseBetween)
        } else {
          // Final redraw and hold
          drawCompletedStrokes()
          setTimeout(() => { setIsAnimating(false); clearCanvas() }, 800)
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const dCanvas = drawCanvasRef.current
    if (!canvas || !dCanvas) return
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    dCanvas.getContext('2d').clearRect(0, 0, dCanvas.width, dCanvas.height)
    drawGuide(canvas.getContext('2d'), char, canvas.width, canvas.height)
    setHasDrawn(false)
    setResult(null)
    setIsAnimating(false)
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
  }, [currentIndex, showGuide])

  const handleSubmit = () => {
    if (!hasDrawn) return
    // Score the drawing against the hidden recognition canvas
    const res = scoreDrawing(drawCanvasRef.current, char)
    setResult(res)

    if (res.score >= PASS_SCORE) {
      playCorrect()
      const particleCount = res.grade === 'Perfect' ? 80 : res.grade === 'Great' ? 50 : 30
      confetti({
        particleCount,
        spread: 60,
        origin: { y: 0.6 },
        colors: res.grade === 'Perfect' ? ['#facc15', '#fde047', '#fbbf24'] : ['#60a5fa', '#3b82f6'],
      })
      const newPassed = new Set(passedLetters)
      newPassed.add(char)
      setPassedLetters(newPassed)

      updateProgress(prev => {
        const next = { ...prev, drawCount: (prev.drawCount || 0) + 1 }
        // Mark drawn milestone if all letters in lesson are passed
        if (newPassed.size >= letters.length) {
          const key = `${stageId}-${lessonIdx}`
          next.lessonMilestones = { ...next.lessonMilestones }
          next.lessonMilestones[key] = { ...(next.lessonMilestones[key] || {}), drawn: true }
        }
        return addXp(next, res.grade === 'Perfect' ? 15 : res.grade === 'Great' ? 10 : 5)
      })
    } else {
      playWrong()
    }
  }

  const isLast = currentIndex === letters.length - 1

  const goNext = () => {
    if (isLast) {
      navigate('/stages')
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
    }
  }

  const passed = result && result.score >= PASS_SCORE
  const gc = result ? gradeColors[result.grade] : null

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
          <ArrowLeft size={16} />
          Back
        </Link>
        <span className="text-sm text-slate-400">{currentIndex + 1}/{letters.length}</span>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-slate-700 rounded-full mb-6 overflow-hidden">
        <motion.div
          animate={{ width: `${((currentIndex + 1) / letters.length) * 100}%` }}
          className="h-full bg-primary-500 rounded-full"
        />
      </div>

      {/* Target character */}
      <div className="text-center mb-4">
        <div className="text-sm text-slate-400 mb-1">Draw this character:</div>
        <div className="flex items-center justify-center gap-3">
          <span className="hangul text-5xl font-black text-white">{char}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => speak(char)}
            className="w-10 h-10 rounded-full bg-primary-600/30 border border-primary-500/30
              flex items-center justify-center cursor-pointer text-primary-400"
          >
            <Volume2 size={16} />
          </motion.button>
        </div>
        <div className="text-primary-400 font-medium mt-1">{letter.roman}</div>
        {letter.hint && (
          <div className="text-xs text-slate-500 mt-0.5">{letter.hint}</div>
        )}
      </div>

      {/* Guide toggle */}
      <div className="flex justify-center mb-3">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className={`text-xs px-3 py-1 rounded-full border cursor-pointer transition-colors
            ${showGuide
              ? 'bg-slate-700/50 border-slate-600 text-slate-300'
              : 'bg-transparent border-slate-700 text-slate-500'
            }`}
        >
          {showGuide ? 'Hide Guide' : 'Show Guide'}
        </button>
        <button
          onClick={animateStroke}
          disabled={isAnimating}
          className="text-xs px-3 py-1 rounded-full border cursor-pointer transition-colors
            bg-primary-600/20 border-primary-500/30 text-primary-400 hover:bg-primary-600/30 disabled:opacity-40"
        >
          <Play size={10} className="inline mr-1" />
          {isAnimating ? 'Playing...' : 'Watch Stroke'}
        </button>
      </div>

      {/* Canvas */}
      <div className="flex justify-center mb-4">
        <div className="relative bg-slate-800/80 border-2 border-slate-600/50 rounded-2xl overflow-hidden">
          <canvas
            ref={canvasRef}
            width={360}
            height={360}
            className="drawing-canvas block"
            style={{ width: '100%', maxWidth: 360, aspectRatio: '1' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
          {/* Hidden canvas for recognition (no guide drawn on it) */}
          <canvas
            ref={drawCanvasRef}
            width={360}
            height={360}
            style={{ display: 'none' }}
          />

          {/* Result overlay */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className={`${gc.bg} ${gc.border} border-2 rounded-2xl px-6 py-4 text-center backdrop-blur-sm`}>
                  <div className={`text-3xl font-black ${gc.text}`}>{result.grade}!</div>
                  <div className="text-white text-lg font-bold">{result.score}%</div>
                  <div className="text-slate-400 text-xs mt-1">
                    Coverage {result.coverage}% · Precision {result.precision}%
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Score bar */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <div className="flex justify-between text-xs mb-1">
            <span className={gc.text}>{result.grade}</span>
            <span className="text-slate-400">{result.score}% (need {PASS_SCORE}%)</span>
          </div>
          <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.score}%` }}
              transition={{ duration: 0.5 }}
              className={`h-full rounded-full ${
                passed ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </div>
          {!passed && (
            <p className="text-red-400/80 text-xs mt-2 text-center">
              Not quite! Try to trace the shape more accurately. Hit Clear and try again.
            </p>
          )}
          {passed && (
            <p className="text-green-400/80 text-xs mt-2 text-center">
              {result.grade === 'Perfect' ? 'Amazing work!' : result.grade === 'Great' ? 'Well done!' : 'Passed! Keep practicing for a better score.'}
            </p>
          )}
        </motion.div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="w-11 h-11 rounded-xl bg-slate-700/50 border border-slate-600/50
            flex items-center justify-center cursor-pointer disabled:opacity-30
            text-white hover:bg-slate-600/50"
        >
          <ChevronLeft size={18} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearCanvas}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl
            bg-slate-700 hover:bg-slate-600 text-white border-0 cursor-pointer font-medium text-sm"
        >
          <RotateCcw size={14} />
          Clear
        </motion.button>

        {!result || !passed ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            disabled={!hasDrawn || (result && !passed)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-primary-600 hover:bg-primary-500 disabled:opacity-40 text-white
              border-0 cursor-pointer font-medium text-sm"
          >
            Check
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={goNext}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl
              bg-green-600 hover:bg-green-500 text-white
              border-0 cursor-pointer font-medium text-sm"
          >
            {isLast ? 'Done ✓' : 'Next →'}
          </motion.button>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => speak(char)}
          className="w-11 h-11 rounded-xl bg-primary-600/30 border border-primary-500/30
            flex items-center justify-center cursor-pointer text-primary-400"
        >
          <Volume2 size={16} />
        </motion.button>
      </div>

      <p className="text-center text-slate-500 text-xs mt-4">
        {showGuide
          ? 'Trace over the ghost letter · Toggle guide off for a challenge'
          : 'Draw the character from memory · Toggle guide on for help'
        }
      </p>
    </motion.div>
  )
}
