/**
 * Audio utilities for Hangulr.
 *
 * Korean TTS via Cloudflare Worker proxy → Google Translate TTS.
 * Fallback: Web Speech API.
 */

// ── Audio enabled check ──────────────────────────────────────────
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

// ── Pre-load Korean voice for Web Speech API ─────────────────────

let koVoice = null
let voicesLoaded = false

function loadVoices() {
  if (typeof speechSynthesis === 'undefined') return
  const voices = speechSynthesis.getVoices()
  koVoice =
    voices.find(v => v.lang === 'ko-KR') ||
    voices.find(v => v.lang.startsWith('ko')) ||
    null
  voicesLoaded = voices.length > 0
}

if (typeof speechSynthesis !== 'undefined') {
  loadVoices()
  speechSynthesis.addEventListener('voiceschanged', loadVoices)
}

// ── Korean TTS ──────────────────────────────────────────────────

const TTS_WORKER = 'https://hangulr-tts.imminencers.workers.dev'

let currentAudio = null

// Cache: text → blob URL
const audioCache = new Map()

export async function speak(text, rate = 0.75) {
  if (!isAudioEnabled()) return

  // Stop anything currently playing
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
      const res = await fetch(`${TTS_WORKER}/?text=${encoded}`)
      if (!res.ok) throw new Error(`TTS returned ${res.status}`)
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
  if (!voicesLoaded) loadVoices()

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
