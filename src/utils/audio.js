/**
 * Audio utilities for Hangulr.
 *
 * Korean TTS via Cloudflare Worker proxy → Naver Dictionary TTS.
 * Voices: kyuri (female), jinho (male).
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

// Convert bare Hangul jamo to pronounceable syllables for TTS
// Vowel jamo (ㅏ-ㅣ) → syllable with silent ㅇ (아-이)
// Consonant jamo (ㄱ-ㅎ) → syllable with ㅡ (그-흐)
const CONS_TO_INITIAL = {
  'ㄱ':0,'ㄲ':1,'ㄴ':2,'ㄷ':3,'ㄸ':4,'ㄹ':5,'ㅁ':6,'ㅂ':7,'ㅃ':8,
  'ㅅ':9,'ㅆ':10,'ㅇ':11,'ㅈ':12,'ㅉ':13,'ㅊ':14,'ㅋ':15,'ㅌ':16,'ㅍ':17,'ㅎ':18
}

function normalizeForTTS(text) {
  return text.replace(/[\u3131-\u3163]/g, ch => {
    const code = ch.charCodeAt(0)
    // Vowel jamo: ㅏ(0x314F) - ㅣ(0x3163) → compose with ㅇ initial
    if (code >= 0x314F && code <= 0x3163) {
      const medialIdx = code - 0x314F
      return String.fromCharCode(0xAC00 + (11 * 21 + medialIdx) * 28)
    }
    // Consonant jamo: compose with ㅡ (medial index 18)
    const initialIdx = CONS_TO_INITIAL[ch]
    if (initialIdx !== undefined) {
      return String.fromCharCode(0xAC00 + (initialIdx * 21 + 18) * 28)
    }
    return ch
  })
}

export async function speak(text, rate = 0.75) {
  if (!isAudioEnabled()) return
  text = normalizeForTTS(text)

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
    // Map Web Speech rate (0.75 default) to Naver speed (-5 to 5, 0 = normal)
    // rate 0.75 → speed -2 (slightly slow, good for learners)
    // rate 1.0  → speed 0 (normal)
    const naverSpeed = Math.round(Math.max(-5, Math.min(5, (rate - 0.75) * 8)))
    const cacheKey = `${text}|${naverSpeed}`
    let blobUrl = audioCache.get(cacheKey)

    if (!blobUrl) {
      const encoded = encodeURIComponent(text)
      const res = await fetch(`${TTS_WORKER}/?text=${encoded}&speed=${naverSpeed}&v=2`)
      if (!res.ok) throw new Error(`TTS returned ${res.status}`)
      const blob = await res.blob()
      blobUrl = URL.createObjectURL(blob)
      audioCache.set(cacheKey, blobUrl)
    }

    const audio = new Audio(blobUrl)
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
