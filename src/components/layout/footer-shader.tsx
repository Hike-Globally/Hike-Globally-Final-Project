'use client'

import { useEffect, useRef } from 'react'

/**
 * Animated background of the shader footer ported from footer-sample.html
 * (shader-footer.framer.website, first/"Desktop" variant): slow liquid
 * deep-blue waves flowing across black, strongest along the lower half.
 *
 * The sample renders this through Framer's WebGL "Shader" element; this is a
 * faithful re-implementation of that look — layered fbm domain-warped noise
 * quantised into topographic wave bands with the sample's blue ramp on black.
 * Honours `prefers-reduced-motion` (freezes on a single frame) and pauses
 * rendering while the footer is off-screen.
 */

const FRAGMENT = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = p * 2.03 + vec2(19.7, 7.3);
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = vec2(uv.x * aspect, uv.y);

  float t = u_time * 0.055;

  /* domain-warped flow field */
  float warp = fbm(p * 1.7 + vec2(t * 0.6, -t * 0.35));
  float n = fbm(p * 2.1 + vec2(-t * 0.45, t * 0.3) + warp * 1.35);

  /* waves live in the lower part of the footer and fade to black upwards */
  float mask = smoothstep(1.15, 0.15, uv.y + 0.45 * (n - 0.5));
  /* bias toward the lower-left, like the reference */
  mask *= 0.55 + 0.45 * smoothstep(1.6, 0.2, length(p - vec2(0.35 * aspect, 0.15)));

  float w = n * mask;

  /* topographic liquid bands */
  float bands = w * 5.0;
  float edge = smoothstep(0.0, 0.06, abs(fract(bands) - 0.5));
  float q = (floor(bands) + smoothstep(0.35, 0.65, fract(bands))) / 5.0;

  vec3 deep = vec3(0.008, 0.106, 0.176);
  vec3 mid = vec3(0.024, 0.243, 0.388);
  vec3 bright = vec3(0.063, 0.400, 0.596);

  vec3 color = vec3(0.0);
  color = mix(color, deep, smoothstep(0.10, 0.26, q));
  color = mix(color, mid, smoothstep(0.26, 0.44, q));
  color = mix(color, bright, smoothstep(0.44, 0.62, q));
  color *= 0.86 + 0.14 * edge;

  gl_FragColor = vec4(color, 1.0);
}
`

const VERTEX = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

export function FooterShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      powerPreference: 'low-power',
    })
    if (!gl) return

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null
    }

    const vertex = compile(gl.VERTEX_SHADER, VERTEX)
    const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT)
    if (!vertex || !fragment) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertex)
    gl.attachShader(program, fragment)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )
    const location = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0)

    const resolution = gl.getUniformLocation(program, 'u_resolution')
    const time = gl.getUniformLocation(program, 'u_time')

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.max(1, Math.round(canvas.clientWidth * dpr))
      const height = Math.max(1, Math.round(canvas.clientHeight * dpr))
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }
    }

    let frame = 0
    let running = true
    let inView = true
    const start = performance.now()

    const render = () => {
      if (!running) return
      if (inView) {
        resize()
        gl.uniform2f(resolution, canvas.width, canvas.height)
        gl.uniform1f(time, reduced ? 24 : (performance.now() - start) / 1000)
        gl.drawArrays(gl.TRIANGLES, 0, 3)
      }
      if (!reduced) frame = requestAnimationFrame(render)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        if (reduced && inView) render()
      },
      { rootMargin: '120px' },
    )
    observer.observe(canvas)

    const onResize = () => {
      resize()
      if (reduced) render()
    }
    window.addEventListener('resize', onResize)

    render()

    return () => {
      running = false
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
      observer.disconnect()
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}
    >
      <canvas
        ref={canvasRef}
        draggable={false}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  )
}
