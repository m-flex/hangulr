/**
 * Pixel-based drawing recognition for Hangul characters.
 *
 * Approach:
 * 1. Render the target character onto a hidden reference canvas.
 * 2. Extract binary masks (ink vs empty) from both reference and user canvases.
 * 3. Downsample both to a coarse grid to be forgiving of slight offsets.
 * 4. Compute coverage (how much of the reference the user covered) and
 *    precision (how much of the user's ink lands on the reference).
 * 5. Return a weighted score.
 */

const GRID = 24 // downsample to 24x24 grid for comparison
const INK_THRESHOLD = 30 // alpha channel threshold to count as "ink"

/**
 * Render a Hangul character to an offscreen canvas and return its ImageData.
 */
function renderReference(char, width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000000'
  ctx.font = `bold ${Math.min(width, height) * 0.7}px 'Noto Sans KR', 'Malgun Gothic', sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(char, width / 2, height / 2)
  return ctx.getImageData(0, 0, width, height)
}

/**
 * Convert full-res ImageData into a coarse binary grid.
 * Each cell = 1 if any pixel in that region has alpha > threshold.
 */
function toBinaryGrid(imageData, width, height) {
  const grid = new Uint8Array(GRID * GRID)
  const cellW = width / GRID
  const cellH = height / GRID
  const data = imageData.data

  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const startX = Math.floor(gx * cellW)
      const endX = Math.floor((gx + 1) * cellW)
      const startY = Math.floor(gy * cellH)
      const endY = Math.floor((gy + 1) * cellH)
      let hasInk = false

      for (let y = startY; y < endY && !hasInk; y++) {
        for (let x = startX; x < endX && !hasInk; x++) {
          const alpha = data[(y * width + x) * 4 + 3]
          if (alpha > INK_THRESHOLD) {
            hasInk = true
          }
        }
      }

      grid[gy * GRID + gx] = hasInk ? 1 : 0
    }
  }
  return grid
}

/**
 * Dilate a binary grid by 1 cell in all directions.
 * This makes matching more forgiving of slight positional offsets.
 */
function dilate(grid) {
  const out = new Uint8Array(GRID * GRID)
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      if (grid[y * GRID + x]) {
        // Set this cell and all 8 neighbours
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = y + dy, nx = x + dx
            if (ny >= 0 && ny < GRID && nx >= 0 && nx < GRID) {
              out[ny * GRID + nx] = 1
            }
          }
        }
      }
    }
  }
  return out
}

/**
 * Score the user's drawing against a reference character.
 *
 * @param {HTMLCanvasElement} userCanvas - The canvas the user drew on
 * @param {string} char - The target Hangul character
 * @returns {{ score: number, coverage: number, precision: number, grade: string }}
 */
export function scoreDrawing(userCanvas, char) {
  const w = userCanvas.width
  const h = userCanvas.height

  // Get user drawing data
  const userCtx = userCanvas.getContext('2d')
  const userData = userCtx.getImageData(0, 0, w, h)

  // Render reference
  const refData = renderReference(char, w, h)

  // Convert to coarse grids
  const userGrid = toBinaryGrid(userData, w, h)
  const refGrid = toBinaryGrid(refData, w, h)

  // Dilate reference by 1 cell for tolerance
  const refDilated = dilate(refGrid)

  // Count cells
  let refCells = 0
  let userCells = 0
  let overlapOnRef = 0      // user ink that falls on (dilated) reference
  let overlapOnUser = 0     // reference ink that falls on (dilated) user

  const userDilated = dilate(userGrid)

  for (let i = 0; i < GRID * GRID; i++) {
    if (refGrid[i]) refCells++
    if (userGrid[i]) userCells++
    if (userGrid[i] && refDilated[i]) overlapOnRef++
    if (refGrid[i] && userDilated[i]) overlapOnUser++
  }

  // Avoid division by zero
  if (refCells === 0 || userCells === 0) {
    return { score: 0, coverage: 0, precision: 0, grade: 'Try Again' }
  }

  // Coverage: how much of the reference character did the user draw?
  const coverage = overlapOnUser / refCells

  // Precision: how much of the user's ink is on the reference?
  const precision = overlapOnRef / userCells

  // Weighted score: coverage matters more (you need to draw the whole char)
  // but precision prevents random scribbles from passing
  const score = Math.round((coverage * 0.6 + precision * 0.4) * 100)

  let grade
  if (score >= 85) grade = 'Perfect'
  else if (score >= 70) grade = 'Great'
  else if (score >= 50) grade = 'Good'
  else if (score >= 35) grade = 'Almost'
  else grade = 'Try Again'

  return { score, coverage: Math.round(coverage * 100), precision: Math.round(precision * 100), grade }
}
