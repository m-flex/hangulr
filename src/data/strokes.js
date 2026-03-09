/**
 * Stroke path data for Hangul characters.
 * Each character maps to an array of strokes in correct writing order.
 * Each stroke is an array of [x, y] waypoints normalized to 0–1 coordinate space.
 *
 * Stroke order rules (Korean 획순):
 *   - Horizontal before vertical (when crossing)
 *   - Top to bottom
 *   - Left to right
 *   - Outside before inside
 *   - Closing stroke last
 */

// Helper: generate circle points (counterclockwise from top, standard for ㅇ)
function circle(cx, cy, r, points = 20) {
  const pts = []
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2 - Math.PI / 2
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
  }
  return pts
}

const STROKE_DATA = {
  // ===== Basic Vowels =====

  // ㅏ (a) — 2 strokes: vertical down, then horizontal tick right
  'ㅏ': [
    [[0.4, 0.12], [0.4, 0.88]],
    [[0.4, 0.5], [0.72, 0.5]],
  ],
  // ㅓ (eo) — 2 strokes: vertical down, then horizontal tick left
  'ㅓ': [
    [[0.6, 0.12], [0.6, 0.88]],
    [[0.6, 0.5], [0.28, 0.5]],
  ],
  // ㅗ (o) — 2 strokes: short vertical tick up, then horizontal base
  'ㅗ': [
    [[0.5, 0.6], [0.5, 0.3]],
    [[0.12, 0.6], [0.88, 0.6]],
  ],
  // ㅜ (u) — 2 strokes: horizontal base, then short vertical tick down
  'ㅜ': [
    [[0.12, 0.4], [0.88, 0.4]],
    [[0.5, 0.4], [0.5, 0.7]],
  ],
  // ㅡ (eu) — 1 stroke: horizontal
  'ㅡ': [
    [[0.12, 0.5], [0.88, 0.5]],
  ],
  // ㅣ (i) — 1 stroke: vertical
  'ㅣ': [
    [[0.5, 0.12], [0.5, 0.88]],
  ],
  // ㅑ (ya) — 3 strokes: vertical down, upper tick right, lower tick right
  'ㅑ': [
    [[0.35, 0.12], [0.35, 0.88]],
    [[0.35, 0.37], [0.7, 0.37]],
    [[0.35, 0.63], [0.7, 0.63]],
  ],
  // ㅕ (yeo) — 3 strokes: vertical down, upper tick left, lower tick left
  'ㅕ': [
    [[0.65, 0.12], [0.65, 0.88]],
    [[0.65, 0.37], [0.3, 0.37]],
    [[0.65, 0.63], [0.3, 0.63]],
  ],
  // ㅛ (yo) — 3 strokes: left tick up, right tick up, horizontal base
  'ㅛ': [
    [[0.35, 0.6], [0.35, 0.3]],
    [[0.65, 0.6], [0.65, 0.3]],
    [[0.12, 0.6], [0.88, 0.6]],
  ],
  // ㅠ (yu) — 3 strokes: horizontal base, left tick down, right tick down
  'ㅠ': [
    [[0.12, 0.4], [0.88, 0.4]],
    [[0.35, 0.4], [0.35, 0.7]],
    [[0.65, 0.4], [0.65, 0.7]],
  ],

  // ===== Basic Consonants =====

  // ㄱ (g/k) — 2 strokes: horizontal right, vertical down
  'ㄱ': [
    [[0.2, 0.25], [0.78, 0.25]],
    [[0.78, 0.25], [0.78, 0.8]],
  ],
  // ㄴ (n) — 2 strokes: vertical down, horizontal right
  'ㄴ': [
    [[0.22, 0.2], [0.22, 0.78]],
    [[0.22, 0.78], [0.8, 0.78]],
  ],
  // ㄷ (d/t) — 3 strokes: top horizontal, left vertical down, bottom horizontal
  'ㄷ': [
    [[0.2, 0.22], [0.8, 0.22]],
    [[0.2, 0.22], [0.2, 0.78]],
    [[0.2, 0.78], [0.8, 0.78]],
  ],
  // ㄹ (r/l) — 5 strokes: zigzag staircase
  //   1. top horizontal right
  //   2. short vertical down (right side)
  //   3. horizontal left (middle)
  //   4. short vertical down (left side)
  //   5. bottom horizontal right
  'ㄹ': [
    [[0.15, 0.15], [0.85, 0.15]],
    [[0.85, 0.15], [0.85, 0.35]],
    [[0.85, 0.35], [0.15, 0.35]],
    [[0.15, 0.35], [0.15, 0.58]],
    [[0.15, 0.58], [0.85, 0.58]],
  ],
  // ㅁ (m) — 3 strokes: left vertical, angular top→right (one stroke), bottom closing
  'ㅁ': [
    [[0.2, 0.2], [0.2, 0.8]],
    [[0.2, 0.2], [0.8, 0.2], [0.8, 0.8]],
    [[0.2, 0.8], [0.8, 0.8]],
  ],
  // ㅂ (b/p) — 4 strokes: left vertical, right vertical, middle bar, bottom bar
  'ㅂ': [
    [[0.2, 0.15], [0.2, 0.85]],
    [[0.8, 0.15], [0.8, 0.85]],
    [[0.2, 0.48], [0.8, 0.48]],
    [[0.2, 0.85], [0.8, 0.85]],
  ],
  // ㅅ (s) — 2 strokes: left diagonal down-left, right diagonal down-right
  'ㅅ': [
    [[0.5, 0.18], [0.18, 0.82]],
    [[0.5, 0.18], [0.82, 0.82]],
  ],
  // ㅇ (ng/silent) — 1 stroke: circle counterclockwise from top
  'ㅇ': [
    circle(0.5, 0.5, 0.28),
  ],
  // ㅈ (j) — 3 strokes: top horizontal, left diagonal, right diagonal
  'ㅈ': [
    [[0.2, 0.2], [0.8, 0.2]],
    [[0.5, 0.35], [0.18, 0.85]],
    [[0.5, 0.35], [0.82, 0.85]],
  ],
  // ㅊ (ch) — 4 strokes: top tick, horizontal, left diagonal, right diagonal
  'ㅊ': [
    [[0.45, 0.06], [0.55, 0.15]],
    [[0.2, 0.25], [0.8, 0.25]],
    [[0.5, 0.4], [0.18, 0.88]],
    [[0.5, 0.4], [0.82, 0.88]],
  ],
  // ㅋ (k) — 3 strokes: top horizontal, vertical down (right side), middle horizontal
  'ㅋ': [
    [[0.2, 0.22], [0.8, 0.22]],
    [[0.78, 0.22], [0.78, 0.82]],
    [[0.2, 0.5], [0.78, 0.5]],
  ],
  // ㅌ (t) — 4 strokes: top horizontal, left vertical, middle horizontal, bottom horizontal
  'ㅌ': [
    [[0.2, 0.18], [0.8, 0.18]],
    [[0.2, 0.18], [0.2, 0.78]],
    [[0.2, 0.45], [0.8, 0.45]],
    [[0.2, 0.78], [0.8, 0.78]],
  ],
  // ㅍ (p) — 4 strokes: top horizontal, left inner vertical, right inner vertical, bottom horizontal
  'ㅍ': [
    [[0.15, 0.2], [0.85, 0.2]],
    [[0.35, 0.2], [0.35, 0.78]],
    [[0.65, 0.2], [0.65, 0.78]],
    [[0.15, 0.78], [0.85, 0.78]],
  ],
  // ㅎ (h) — 3 strokes: top tick, horizontal bar, circle below
  'ㅎ': [
    [[0.45, 0.08], [0.55, 0.16]],
    [[0.2, 0.28], [0.8, 0.28]],
    circle(0.5, 0.58, 0.22),
  ],

  // ===== Double Consonants (쌍자음) =====
  // Written as the base consonant twice: left first, then right

  // ㄲ — 4 strokes: left ㄱ (2), right ㄱ (2)
  'ㄲ': [
    [[0.1, 0.25], [0.42, 0.25]],
    [[0.42, 0.25], [0.42, 0.8]],
    [[0.55, 0.25], [0.88, 0.25]],
    [[0.88, 0.25], [0.88, 0.8]],
  ],
  // ㄸ — 6 strokes: left ㄷ (3), right ㄷ (3)
  'ㄸ': [
    [[0.08, 0.22], [0.42, 0.22]],
    [[0.08, 0.22], [0.08, 0.78]],
    [[0.08, 0.78], [0.42, 0.78]],
    [[0.55, 0.22], [0.92, 0.22]],
    [[0.55, 0.22], [0.55, 0.78]],
    [[0.55, 0.78], [0.92, 0.78]],
  ],
  // ㅃ — 8 strokes: left ㅂ (4), right ㅂ (4)
  'ㅃ': [
    [[0.08, 0.15], [0.08, 0.85]],
    [[0.42, 0.15], [0.42, 0.85]],
    [[0.08, 0.48], [0.42, 0.48]],
    [[0.08, 0.85], [0.42, 0.85]],
    [[0.55, 0.15], [0.55, 0.85]],
    [[0.92, 0.15], [0.92, 0.85]],
    [[0.55, 0.48], [0.92, 0.48]],
    [[0.55, 0.85], [0.92, 0.85]],
  ],
  // ㅆ — 4 strokes: left ㅅ (2), right ㅅ (2)
  'ㅆ': [
    [[0.28, 0.18], [0.08, 0.82]],
    [[0.28, 0.18], [0.45, 0.82]],
    [[0.72, 0.18], [0.55, 0.82]],
    [[0.72, 0.18], [0.92, 0.82]],
  ],
  // ㅉ — 6 strokes: left ㅈ (3), right ㅈ (3)
  'ㅉ': [
    [[0.08, 0.2], [0.42, 0.2]],
    [[0.25, 0.35], [0.08, 0.85]],
    [[0.25, 0.35], [0.42, 0.85]],
    [[0.55, 0.2], [0.92, 0.2]],
    [[0.73, 0.35], [0.55, 0.85]],
    [[0.73, 0.35], [0.92, 0.85]],
  ],

  // ===== Compound Vowels (복합 모음) =====
  // Written by drawing first component, then second component

  // ㅐ (ae) = ㅏ + ㅣ — 3 strokes: left vertical, tick right, right vertical
  'ㅐ': [
    [[0.3, 0.12], [0.3, 0.88]],
    [[0.3, 0.5], [0.55, 0.5]],
    [[0.7, 0.12], [0.7, 0.88]],
  ],
  // ㅒ (yae) = ㅑ + ㅣ — 4 strokes: left vertical, upper tick, lower tick, right vertical
  'ㅒ': [
    [[0.25, 0.12], [0.25, 0.88]],
    [[0.25, 0.37], [0.5, 0.37]],
    [[0.25, 0.63], [0.5, 0.63]],
    [[0.7, 0.12], [0.7, 0.88]],
  ],
  // ㅔ (e) = ㅓ + ㅣ — 3 strokes: left vertical, tick left, right vertical
  'ㅔ': [
    [[0.5, 0.12], [0.5, 0.88]],
    [[0.5, 0.5], [0.25, 0.5]],
    [[0.72, 0.12], [0.72, 0.88]],
  ],
  // ㅖ (ye) = ㅕ + ㅣ — 4 strokes: left vertical, upper tick left, lower tick left, right vertical
  'ㅖ': [
    [[0.5, 0.12], [0.5, 0.88]],
    [[0.5, 0.37], [0.25, 0.37]],
    [[0.5, 0.63], [0.25, 0.63]],
    [[0.72, 0.12], [0.72, 0.88]],
  ],
  // ㅘ (wa) = ㅗ + ㅏ — 4 strokes: ㅗ tick up, ㅗ horizontal, ㅏ vertical, ㅏ tick right
  'ㅘ': [
    [[0.3, 0.6], [0.3, 0.3]],
    [[0.1, 0.6], [0.52, 0.6]],
    [[0.65, 0.12], [0.65, 0.88]],
    [[0.65, 0.5], [0.88, 0.5]],
  ],
  // ㅙ (wae) = ㅗ + ㅐ — 5 strokes: ㅗ tick up, ㅗ horizontal, ㅐ left vertical, ㅐ tick right, ㅐ right vertical
  'ㅙ': [
    [[0.22, 0.6], [0.22, 0.3]],
    [[0.08, 0.6], [0.42, 0.6]],
    [[0.55, 0.12], [0.55, 0.88]],
    [[0.55, 0.5], [0.72, 0.5]],
    [[0.85, 0.12], [0.85, 0.88]],
  ],
  // ㅚ (oe) = ㅗ + ㅣ — 3 strokes: ㅗ tick up, ㅗ horizontal, ㅣ vertical
  'ㅚ': [
    [[0.35, 0.6], [0.35, 0.3]],
    [[0.1, 0.6], [0.55, 0.6]],
    [[0.72, 0.12], [0.72, 0.88]],
  ],
  // ㅝ (wo) = ㅜ + ㅓ — 4 strokes: ㅜ horizontal, ㅜ tick down, ㅓ vertical, ㅓ tick left
  'ㅝ': [
    [[0.1, 0.4], [0.52, 0.4]],
    [[0.3, 0.4], [0.3, 0.7]],
    [[0.65, 0.12], [0.65, 0.88]],
    [[0.65, 0.5], [0.42, 0.5]],
  ],
  // ㅞ (we) = ㅜ + ㅔ — 5 strokes: ㅜ horizontal, ㅜ tick down, ㅔ left vertical, ㅔ tick left, ㅔ right vertical
  'ㅞ': [
    [[0.08, 0.4], [0.42, 0.4]],
    [[0.22, 0.4], [0.22, 0.7]],
    [[0.58, 0.12], [0.58, 0.88]],
    [[0.58, 0.5], [0.42, 0.5]],
    [[0.78, 0.12], [0.78, 0.88]],
  ],
  // ㅟ (wi) = ㅜ + ㅣ — 3 strokes: ㅜ horizontal, ㅜ tick down, ㅣ vertical
  'ㅟ': [
    [[0.1, 0.4], [0.55, 0.4]],
    [[0.35, 0.4], [0.35, 0.7]],
    [[0.72, 0.12], [0.72, 0.88]],
  ],
  // ㅢ (ui) = ㅡ + ㅣ — 2 strokes: ㅡ horizontal, ㅣ vertical
  'ㅢ': [
    [[0.1, 0.5], [0.55, 0.5]],
    [[0.72, 0.12], [0.72, 0.88]],
  ],
}

export function getStrokes(char) {
  return STROKE_DATA[char] || null
}
