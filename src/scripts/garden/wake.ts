export interface Air {
  vx: number
  vy: number
  curl: number
}

const COLS = 48
const ROWS = 32

export function createWake() {
  let vx = new Float32Array(COLS * ROWS)
  let vy = new Float32Array(COLS * ROWS)
  let nx = new Float32Array(COLS * ROWS)
  let ny = new Float32Array(COLS * ROWS)

  const at = (x: number, y: number) => Math.min(ROWS - 1, Math.max(0, y)) * COLS + Math.min(COLS - 1, Math.max(0, x))

  function splat(u: number, v: number, dx: number, dy: number, radius: number) {
    const r2 = radius * radius
    const reach = Math.ceil(radius * COLS) + 1
    const cx = u * COLS - 0.5
    const cy = v * ROWS - 0.5
    for (let j = Math.max(0, Math.floor(cy) - reach); j <= Math.min(ROWS - 1, Math.ceil(cy) + reach); j++) {
      for (let i = Math.max(0, Math.floor(cx) - reach); i <= Math.min(COLS - 1, Math.ceil(cx) + reach); i++) {
        const du = (i + 0.5) / COLS - u
        const dv = (j + 0.5) / ROWS - v
        const f = Math.exp(-(du * du + dv * dv) / r2)
        vx[j * COLS + i] += dx * f
        vy[j * COLS + i] += dy * f
      }
    }
  }

  function step(dt: number) {
    const decay = Math.exp(-dt * 1.6)
    const mix = Math.min(0.5, dt * 6)
    for (let j = 0; j < ROWS; j++) {
      for (let i = 0; i < COLS; i++) {
        const k = j * COLS + i
        const ax = (vx[at(i - 1, j)] + vx[at(i + 1, j)] + vx[at(i, j - 1)] + vx[at(i, j + 1)]) / 4
        const ay = (vy[at(i - 1, j)] + vy[at(i + 1, j)] + vy[at(i, j - 1)] + vy[at(i, j + 1)]) / 4
        nx[k] = (vx[k] + (ax - vx[k]) * mix) * decay
        ny[k] = (vy[k] + (ay - vy[k]) * mix) * decay
      }
    }
    ;[vx, nx] = [nx, vx]
    ;[vy, ny] = [ny, vy]
  }

  function sample(u: number, v: number, out: Air) {
    const gx = Math.min(COLS - 1.001, Math.max(0, u * COLS - 0.5))
    const gy = Math.min(ROWS - 1.001, Math.max(0, v * ROWS - 0.5))
    const i = Math.floor(gx)
    const j = Math.floor(gy)
    const fx = gx - i
    const fy = gy - j
    const bilinear = (f: Float32Array) =>
      (f[at(i, j)] * (1 - fx) + f[at(i + 1, j)] * fx) * (1 - fy) + (f[at(i, j + 1)] * (1 - fx) + f[at(i + 1, j + 1)] * fx) * fy
    out.vx = bilinear(vx)
    out.vy = bilinear(vy)
    out.curl = 0.5 * (vy[at(i + 1, j)] - vy[at(i - 1, j)] - (vx[at(i, j + 1)] - vx[at(i, j - 1)]))
  }

  return { splat, step, sample }
}
