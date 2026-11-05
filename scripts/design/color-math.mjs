/** Design-time colour maths: contrast ratios + palette-derived tints. Not shipped. */
const hex2rgb = (h) => {
  const s = h.replace('#', '')
  const v = s.length === 3 ? s.split('').map((c) => c + c).join('') : s
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16))
}
const rgb2hex = ([r, g, b]) =>
  '#' + [r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('').toUpperCase()
const lin = (c) => {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
const lum = (h) => {
  const [r, g, b] = hex2rgb(h).map(lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
export const contrast = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}
/** mix(a, b, t) — t is the fraction of b, mixed in sRGB (matches `color-mix(in srgb, …)`). */
export const mix = (a, b, t) => {
  const A = hex2rgb(a)
  const B = hex2rgb(b)
  return rgb2hex(A.map((c, i) => c * (1 - t) + B[i] * t))
}
/** smallest fraction of `tint` mixed into `base` that reaches `target` contrast against `bg`. */
export const stepTo = (base, tint, bg, target, epsilon = 0.005) => {
  let t = 0
  while (t <= 1) {
    if (contrast(mix(base, tint, t), bg) >= target) return { t, hex: mix(base, tint, t) }
    t += epsilon
  }
  return null
}
export const report = (name, fg, bg) => {
  const c = contrast(fg, bg)
  const aa = c >= 4.5 ? 'AA' : c >= 3 ? 'AA-large' : 'FAIL'
  return `${name.padEnd(38)} ${fg} on ${bg}  ${c.toFixed(2).padStart(6)}  ${aa}`
}
