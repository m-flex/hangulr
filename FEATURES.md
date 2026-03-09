# Hangulr — Feature Roadmap

## Built
- [x] Flashcard learning (5 stages)
- [x] Multiple-choice quiz (char → romanization)
- [x] Drawing with pixel recognition + grading
- [x] Word browse + type quiz
- [x] Audio pronunciation (Google TTS proxy)
- [x] XP, levels, achievements, streaks
- [x] Progress persistence (localStorage)

## High Impact, Medium Effort
- [x] **Reverse quiz modes** — audio → pick letter, romanization → pick character (mixed into quiz)
- [x] **Spaced repetition review** — SM-2 algorithm with proper intervals (1d → 6d → 15d → 37d → 92d)
- [x] **Syllable block builder** — pick consonant + vowel to compose syllables (Stage 3)

## Research-Backed Learning Features
- [x] **SM-2 spaced repetition** — real algorithm tracking easinessFactor, intervals, repetitions per card
- [x] **Visual mnemonics** — every character has a shape-to-sound mnemonic and articulatory description
- [x] **Error re-testing** — missed quiz items re-appear 2-4 questions later in the same session
- [x] **Smaller lesson chunks** — 4 new letters per group (research: 3-5 optimal), blocked then interleaved
- [x] **Interleaved review** — previous letters mixed into current learning group
- [x] **Session timer + nudge** — tracks time, gently suggests breaks at 15-20 minutes
- [x] **Articulatory teaching** — explains mouth/tongue position for each consonant and vowel
- [x] **Mnemonic on error** — shows the visual memory aid when you get a question wrong

## High Impact, Low Effort
- [x] **Listening quiz** — audio plays automatically, pick which character you heard (mixed into quiz)
- [x] **Weak letter review** — SM-2 driven, most overdue items first
- [x] **Daily streak / session tracking** — "3 days in a row" with calendar heatmap, streak in navbar
- [x] **Settings page** — reset progress, toggle audio, toggle drawing guide, export/import JSON

## Medium Impact, Medium Effort
- [x] **Timed challenge mode** — 30-second blitz, personal best tracking, streak bonuses
- [x] **Stats/analytics page** — per-letter accuracy heatmap, SRS review status, session history
- [x] **Stroke order animation** — animated reveal showing character being written, "Watch" button in draw practice
- [x] **Sentence building** — arrange scrambled word cards into Korean sentences, 12 sentences

## Nice to Have
- [x] **Keyboard typing practice** — virtual Korean Dubeolsik keyboard, find-the-key exercises
- [x] **More vocabulary** — colors, animals, body parts, days of the week (31 new words)
- [x] **Dark/light theme toggle** — in Settings page, CSS variable overrides
- [x] **Export/import progress** — JSON backup (in Settings page)

---

## Learning Method Research Applied

Based on evidence from Ebbinghaus (1885), Roediger & Karpicke (2006), Leitner (1973), and others:

1. **Spaced repetition (SM-2)** — intervals of 1, 6, then ×2.5. Missed items reset to 1 day. Target 85-90% recall.
2. **Active recall** — always require producing an answer, never passive recognition only.
3. **Interleaving** — blocked practice for new items, then interleaved with previous for discrimination.
4. **Multi-modal** — visual (flashcards + mnemonics) + auditory (TTS) + kinesthetic (drawing).
5. **Visual mnemonics** — shape-to-sound associations leveraging Hangul's articulatory design.
6. **Optimal sessions** — 10-15 min for new material, 5-15 min for review. Nudge after 15-20 min.
7. **Error correction** — show correct answer + mnemonic, reset SRS interval, re-test within session.
8. **Phonetic awareness** — pair visual character with sound immediately, teach articulatory basis.
9. **Contextual progression** — isolated letters → syllable blocks → words.
10. **Gamification** — progress bars and mastery levels (research-backed), not over-reliant on streaks.
