/**
 * Audio utilities for Hangulr.
 *
 * Korean TTS: proxied through /api/tts → Google Translate TTS.
 * The proxy runs as a Vite middleware plugin (see vite.config.js)
 * so there are no CORS or Referer issues.
 *
 * Fallback: Web Speech API if proxy is unavailable.
 */

// ── Audio enabled check ──────────────────────────────────────────
// Reads setting from localStorage so audio utils don't need React context
function isAudioEnabled() {
  try {
    const saved = localStorage.getItem('hangulr_progress')
    if (saved) {
      const p = JSON.parse(saved)
      return p.settings?.audioEnabled !== false
    }
  } catch {}
  return true
}

// ── Korean TTS ──────────────────────────────────────────────────

let currentAudio = null

// Simple in-memory cache: text → blob URL
const audioCache = new Map()

export async function speak(text, rate = 0.75) {
  if (!isAudioEnabled()) return
  // Stop any currently playing audio
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
  if (typeof speechSynthesis !== 'undefined') {
    speechSynthesis.cancel()
  }

  try {
    let blobUrl = audioCache.get(text)

    if (!blobUrl) {
      const encoded = encodeURIComponent(text)
      const res = await fetch(`/api/tts?text=${encoded}`)
      if (!res.ok) throw new Error(`TTS proxy returned ${res.status}`)
      const blob = await res.blob()
      blobUrl = URL.createObjectURL(blob)
      audioCache.set(text, blobUrl)
    }

    const audio = new Audio(blobUrl)
    audio.playbackRate = Math.max(0.5, Math.min(rate / 0.75, 2))
    currentAudio = audio
    await audio.play()
  } catch {
    // Fallback: Web Speech API
    speakFallback(text, rate)
  }
}

function speakFallback(text, rate) {
  if (typeof speechSynthesis === 'undefined') return

  const voices = speechSynthesis.getVoices()
  const koVoice =
    voices.find(v => v.lang === 'ko-KR') ||
    voices.find(v => v.lang.startsWith('ko')) ||
    null

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ko-KR'
  utterance.rate = rate
  utterance.volume = 1
  if (koVoice) utterance.voice = koVoice

  setTimeout(() => speechSynthesis.speak(utterance), 50)
}

// ── UI Sound Effects (Web Audio API) ────────────────────────────

let audioCtx = null

function getAudioCtx() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume()
    return audioCtx
  }
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    return audioCtx
  } catch {
    return null
  }
}

export function playCorrect() {
  const ctx = getAudioCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.frequency.setValueAtTime(523, ctx.currentTime)
  osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
  osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.4)
}

export function playWrong() {
  const ctx = getAudioCtx()
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(200, ctx.currentTime)
  osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15)
  gain.gain.setValueAtTime(0.1, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.3)
}
