// 3D simplex noise after Stefan Gustavson's public domain reference. Returns
// roughly -1 to 1. The permutation is shuffled per instance, so every page load
// gets a different field.

// Midpoints of a cube's edges, flattened
const GRAD3 = new Float32Array([
  [1, 1, 0],
  [-1, 1, 0],
  [1, -1, 0],
  [-1, -1, 0],
  [1, 0, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, -1, 1],
  [0, 1, -1],
  [0, -1, -1],
].flat())

const F3 = 1 / 3
const G3 = 1 / 6

// Falloff from one simplex corner, zero past a radius of about 0.77
function corner(gradient: number, x: number, y: number, z: number) {
  const t = 0.6 - x * x - y * y - z * z

  if (t < 0)
    return 0

  const g = gradient * 3

  return t * t * t * t * (GRAD3[g] * x + GRAD3[g + 1] * y + GRAD3[g + 2] * z)
}

export function createNoise3D(random = Math.random) {
  const p = new Uint8Array(256)

  for (let i = 0; i < 256; i++)
    p[i] = i

  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const swap = p[i]

    p[i] = p[j]
    p[j] = swap
  }

  // Doubled so lookups can skip wrapping the index
  const perm = new Uint8Array(512)
  const permMod12 = new Uint8Array(512)

  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255]
    permMod12[i] = perm[i] % 12
  }

  return (x: number, y: number, z: number) => {
    // Skew into simplex space to find the cell, then unskew back
    const s = (x + y + z) * F3
    const i = Math.floor(x + s)
    const j = Math.floor(y + s)
    const k = Math.floor(z + s)

    const t = (i + j + k) * G3
    const x0 = x - (i - t)
    const y0 = y - (j - t)
    const z0 = z - (k - t)

    // Which of the six tetrahedra in the cell the point sits in
    let i1, j1, k1, i2, j2, k2

    if (x0 >= y0) {
      if (y0 >= z0)
        [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 1, 0]
      else if (x0 >= z0)
        [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 0, 1]
      else
        [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 1, 0, 1]
    }
    else {
      if (y0 < z0)
        [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 0, 1, 1]
      else if (x0 < z0)
        [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 0, 1, 1]
      else
        [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 1, 1, 0]
    }

    const ii = i & 255
    const jj = j & 255
    const kk = k & 255

    const n0 = corner(permMod12[ii + perm[jj + perm[kk]]], x0, y0, z0)
    const n1 = corner(permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]], x0 - i1 + G3, y0 - j1 + G3, z0 - k1 + G3)
    const n2 = corner(permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]], x0 - i2 + 2 * G3, y0 - j2 + 2 * G3, z0 - k2 + 2 * G3)
    const n3 = corner(permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]], x0 - 1 + 3 * G3, y0 - 1 + 3 * G3, z0 - 1 + 3 * G3)

    return 32 * (n0 + n1 + n2 + n3)
  }
}
