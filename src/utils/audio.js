/**
 * Audio utilities for Hangulr.
 *
 * Korean TTS strategy:
 *   1. Google Translate TTS via <audio> element (works cross-origin since
 *      media requests aren't subject to CORS the way fetch is).
 *   2. Web Speech API fallback if Google TTS fails.
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

// ── Korean TTS ──────────────────────────────────────────────────

let currentAudio = null

// Cache: text → blob URL (avoids repeated network requests)
const audioCache = new Map()

function ttsUrl(text) {
  const encoded = encodeURIComponent(text)
  return `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ko&q=${encoded}`
}

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
      // Fetch the audio as a blob so we can cache it and control playback rate.
      // Using no-cors mode: the response is opaque but we can still play it
      // by constructing a blob URL. If fetch fails, fall through to the
      // Audio-element-with-src approach below.
      const res = await fetch(ttsUrl(text))
      if (!res.ok) throw new Error('fetch failed')
      const blob = await res.blob()
      blobUrl = URL.createObjectURL(blob)
      audioCache.set(text, blobUrl)
    }

    const audio = new Audio(blobUrl)
    audio.playbackRate = Math.max(0.5, Math.min(rate / 0.75, 2))
    currentAudio = audio
    await audio.play()
  } catch {
    // Fetch didn't work (CORS, network, etc.)
    // Try playing the URL directly as an <audio> src — browsers often allow
    // cross-origin media even when fetch is blocked.
    try {
      const audio = new Audio(ttsUrl(text))
      audio.crossOrigin = 'anonymous'
      currentAudio = audio
      await audio.play()
    } catch {
      // Last resort: Web Speech API
      speakFallback(text, rate)
    }
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
