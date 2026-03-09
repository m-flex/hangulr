import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, X } from 'lucide-react'

export default function VoiceCheck() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (dismissed) return

    const timer = setTimeout(async () => {
      try {
        // Test if our TTS proxy works
        const res = await fetch('/api/tts?text=%ED%95%9C')
        if (res.ok) {
          setShow(false)
          return
        }
      } catch { /* proxy failed */ }

      // Proxy failed — check local voices
      if (typeof speechSynthesis !== 'undefined') {
        const voices = speechSynthesis.getVoices()
        const hasKorean = voices.some(v => v.lang.startsWith('ko'))
        if (!hasKorean) setShow(true)
      } else {
        setShow(true)
      }
    }, 2000)

    return () => clearTimeout(timer)
  }, [dismissed])

  if (!show || dismissed) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50"
      >
        <div className="bg-slate-800 border border-orange-400/30 rounded-xl p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <Volume2 size={20} className="text-orange-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-orange-400 mb-1">Audio unavailable</div>
              <div className="text-xs text-slate-300 leading-relaxed">
                Korean pronunciation could not be loaded. Check your internet connection.
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-slate-500 hover:text-white cursor-pointer bg-transparent border-0 p-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
