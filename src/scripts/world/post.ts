/*
 * How a frame reaches the screen, in the Messenger look. The scene renders
 * into an HDR target; an ink pass draws outlines where depth jumps (always on
 * the nearer object) and where normals crease, thinner and lighter with
 * distance so the far skyline stays clean; bloom lifts only the light sources;
 * a grade adds paper grain, a soft vignette and a touch of warmth; OutputPass
 * tone-maps to sRGB.
 *
 * Desktop pays for one extra scene render: normals + depth of layer 0 only, so
 * the sky and fx never outline. Materials are swapped per mesh for that render
 * (not scene.overrideMaterial) so alpha-cut leaves and transparent decals keep
 * their cut-outs and effects that write no depth stay out of it. Compact
 * screens outline from the main depth buffer alone and bloom at half
 * resolution. If any of it fails, the scene renders straight to the screen.
 */
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import type { Ctx } from './context'
import { INK } from './style'

/** Marks this file's shaders, so a compile failure in them (and only them) falls back to a plain render. */
const TAG = '#define SR_POST 1'
const ALPHA_TAG = '#define SR_POST_ALPHA 1'

const QUAD_VS = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const OUTLINE_FS = `${TAG}
uniform sampler2D tScene;
uniform sampler2D tDepth;
uniform sampler2D tNormal;
uniform vec2 uTexel;
uniform float uPx;
uniform float uNear;
uniform float uFar;
uniform vec3 uInk;
uniform float uStrength;
varying vec2 vUv;

// metres from the camera
float dist(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  return uNear * uFar / (uFar - d * (uFar - uNear));
}

#ifdef USE_NORMALS
// how far the neighbour's normal turns away; neighbours on a nearer object are
// skipped so a silhouette only inks its own (near) side
float crease(vec3 n, vec2 uv, float wn, float w) {
  if (wn > w * 1.03) return 0.0;
  vec3 m = normalize(texture2D(tNormal, uv).xyz * 2.0 - 1.0);
  return 1.0 - dot(n, m);
}
#endif

void main() {
  vec4 c = texture2D(tScene, vUv);
  float z = dist(vUv);
  if (z > uFar * 0.98) {
    gl_FragColor = c;
    return;
  }
  float fade = smoothstep(25.0, 200.0, z);
  float px = max(1.0, uPx * mix(1.0, 0.6, fade));
  vec2 ox = vec2(uTexel.x * px, 0.0);
  vec2 oy = vec2(0.0, uTexel.y * px);
  float w = 1.0 / z;
  float wl = 1.0 / dist(vUv - ox);
  float wr = 1.0 / dist(vUv + ox);
  float wd = 1.0 / dist(vUv - oy);
  float wu = 1.0 / dist(vUv + oy);
  // 1/z is flat across any plane (grazing ground included), so its second
  // difference only fires where a nearer surface ends; the positive side is
  // the near object, which is where the line goes
  float lap = (max(0.0, 2.0 * w - wl - wr) + max(0.0, 2.0 * w - wd - wu)) / w;
  float e = smoothstep(0.018, 0.05, lap) * mix(0.95, 0.35, fade);
#ifdef USE_NORMALS
  float close = 1.0 - smoothstep(30.0, 90.0, z);
  if (close > 0.0) {
    vec3 n = normalize(texture2D(tNormal, vUv).xyz * 2.0 - 1.0);
    vec2 nx = ox * 0.6;
    vec2 ny = oy * 0.6;
    float k = max(max(crease(n, vUv - nx, wl, w), crease(n, vUv + nx, wr, w)), max(crease(n, vUv - ny, wd, w), crease(n, vUv + ny, wu, w)));
    e = max(e, smoothstep(0.3, 0.55, k) * close * 0.85);
  }
#endif
  // far lines become a darker shade of what they sit on rather than ink
  vec3 ink = mix(uInk, c.rgb * 0.4, fade * 0.75);
  gl_FragColor = vec4(mix(c.rgb, ink, clamp(e * uStrength, 0.0, 1.0)), c.a);
}`

const GRADE_FS = `${TAG}
uniform sampler2D tDiffuse;
uniform float uDpr;
uniform float uSeed;
uniform float uGrain;
uniform float uVig;
uniform float uAspect;
uniform vec3 uHi;
uniform vec3 uLo;
varying vec2 vUv;
float h12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vn(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), f.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), f.x), f.y);
}
void main() {
  vec4 c = texture2D(tDiffuse, vUv);
  vec3 col = c.rgb;
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  // split tone: warm light, cool shade
  col *= mix(uLo, uHi, smoothstep(0.02, 0.5, l));
  // a hair more saturation so the flat colours read as paint
  col = max(mix(vec3(l), col, 1.06), 0.0);
  // paper: soft mottling plus fine grain, sized in CSS pixels
  float g = h12(floor(gl_FragCoord.xy / uDpr) + uSeed * 17.0) - 0.5;
  float paper = vn(gl_FragCoord.xy / (uDpr * 140.0)) - 0.5;
  col *= 1.0 + g * uGrain + paper * 0.04;
  col += g * uGrain * 0.01;
  // vignette
  vec2 q = vUv - 0.5;
  q.x *= uAspect;
  col *= 1.0 - uVig * smoothstep(0.4, 1.05, length(q) * 1.25);
  gl_FragColor = vec4(max(col, 0.0), c.a);
}`

type Mat = THREE.Material & {
  map?: THREE.Texture | null
  alphaMap?: THREE.Texture | null
  flatShading?: boolean
  wireframe?: boolean
  isShaderMaterial?: boolean
}

const makePipe = (ctx: Ctx, flags: { alphaBroken: boolean }) => {
  const { renderer, scene, camera, compact, reduced } = ctx
  const ext = renderer.extensions
  const floatRT = ext.has('EXT_color_buffer_float')
  if (!floatRT && !ext.has('EXT_color_buffer_half_float')) throw new Error('no float render targets')

  const size = renderer.getDrawingBufferSize(new THREE.Vector2())
  const pw = Math.max(1, size.x)
  const ph = Math.max(1, size.y)
  const dpr0 = renderer.getPixelRatio()
  const normals = !compact

  // The main scene: MSAA on desktop (the canvas's own antialias is bypassed here);
  // on compact it carries the depth texture the outlines read.
  const sceneRT = new THREE.WebGLRenderTarget(pw, ph, {
    type: THREE.HalfFloatType,
    samples: !compact && floatRT ? (dpr0 >= 2 ? 2 : 4) : 0
  })
  if (!normals) sceneRT.depthTexture = new THREE.DepthTexture(pw, ph)

  let normalRT: THREE.WebGLRenderTarget | null = null
  if (normals) {
    normalRT = new THREE.WebGLRenderTarget(pw, ph, {
      type: THREE.UnsignedByteType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false
    })
    normalRT.depthTexture = new THREE.DepthTexture(pw, ph)
  }

  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(pw, ph, { type: THREE.HalfFloatType, depthBuffer: false }))

  const ou = {
    tScene: { value: sceneRT.texture as THREE.Texture },
    tDepth: { value: (normalRT ? normalRT.depthTexture : sceneRT.depthTexture) as THREE.Texture | null },
    tNormal: { value: (normalRT ? normalRT.texture : null) as THREE.Texture | null },
    uTexel: { value: new THREE.Vector2(1 / pw, 1 / ph) },
    uPx: { value: 1.2 * dpr0 },
    uNear: { value: camera.near },
    uFar: { value: camera.far },
    uInk: { value: INK.clone() },
    uStrength: { value: 1 }
  }
  // textureID 'none': the outline reads the scene target directly, not the composer's buffer
  const outline = new ShaderPass(new THREE.ShaderMaterial({
    uniforms: ou,
    defines: normals ? { USE_NORMALS: 1 } : {},
    vertexShader: QUAD_VS,
    fragmentShader: OUTLINE_FS,
    depthTest: false,
    depthWrite: false
  }), 'none')

  const bloom = new UnrealBloomPass(new THREE.Vector2(pw, ph), 0.25, 0.5, 1.05)
  if (compact) {
    const base = bloom.setSize.bind(bloom)
    bloom.setSize = (w: number, h: number) => base(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)))
  }

  const gu = {
    tDiffuse: { value: null as THREE.Texture | null },
    uDpr: { value: dpr0 },
    uSeed: { value: 0 },
    uGrain: { value: 0.035 },
    uVig: { value: 0.2 },
    uAspect: { value: pw / ph },
    uHi: { value: new THREE.Vector3(1, 1, 1) },
    uLo: { value: new THREE.Vector3(1, 1, 1) }
  }
  const grade = new ShaderPass(new THREE.ShaderMaterial({
    uniforms: gu,
    vertexShader: QUAD_VS,
    fragmentShader: GRADE_FS,
    depthTest: false,
    depthWrite: false
  }))

  composer.addPass(outline)
  composer.addPass(bloom)
  composer.addPass(grade)
  composer.addPass(new OutputPass())

  const HI_DAY = new THREE.Vector3(1.04, 1.0, 0.95)
  const LO_DAY = new THREE.Vector3(0.97, 1.0, 1.04)
  const HI_NIGHT = new THREE.Vector3(1.07, 1.0, 0.9)
  const LO_NIGHT = new THREE.Vector3(0.95, 0.97, 1.08)
  ctx.onMode((mix) => {
    bloom.strength = 0.25 + 0.5 * mix
    bloom.threshold = 1.05 - 0.17 * mix
    bloom.radius = 0.5
    ou.uStrength.value = 1 - 0.1 * mix
    gu.uVig.value = 0.2 + 0.14 * mix
    gu.uGrain.value = 0.035 + 0.025 * mix
    gu.uHi.value.copy(HI_DAY).lerp(HI_NIGHT, mix)
    gu.uLo.value.copy(LO_DAY).lerp(LO_NIGHT, mix)
  })
  ctx.onFrame(({ t }) => {
    // the grain re-rolls a dozen times a second, like film; still when reduced or on phones
    if (!reduced && !compact) gu.uSeed.value = Math.floor(t * 12) % 61
  })

  // ——— the normals + depth pass (desktop) ———
  const L0 = new THREE.Layers()
  const NORMAL_CLEAR = new THREE.Color().setRGB(0.5, 0.5, 1, THREE.LinearSRGBColorSpace)
  const skip = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false })
  let cache = new WeakMap<THREE.Material, THREE.Material>()
  const arrCache = new WeakMap<THREE.Material[], THREE.Material[]>()
  const injectAlpha = (shader: { fragmentShader: string }) => {
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', `${ALPHA_TAG}\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <alphatest_pars_fragment>\nvoid main() {`)
      .replace('#include <normal_fragment_begin>', '#include <map_fragment>\n#include <alphamap_fragment>\n#include <alphatest_fragment>\n#include <normal_fragment_begin>')
  }
  /** The stand-in for one material in the normal pass: null hides it, the material itself means depth only. */
  const normalFor = (src: THREE.Material): THREE.Material | null => {
    const m = src as Mat
    if (!m.visible || !m.colorWrite || !m.depthWrite || m.blending === THREE.AdditiveBlending || (m.transparent && m.opacity < 0.35)) return null
    // custom shaders may move vertices; let them write their own depth and no colour
    if (m.isShaderMaterial) return src
    let n = cache.get(src)
    if (!n) {
      const nm = new THREE.MeshNormalMaterial({ side: m.side, flatShading: !!m.flatShading, wireframe: !!m.wireframe })
      const cut = (m.alphaTest > 0 || m.transparent) && !!(m.map || m.alphaMap)
      if (cut && !flags.alphaBroken) {
        nm.alphaTest = m.alphaTest > 0 ? m.alphaTest : 0.5
        Object.assign(nm, { map: m.map ?? null, alphaMap: m.alphaMap ?? null })
        nm.onBeforeCompile = injectAlpha
      }
      n = nm
      cache.set(src, n)
    }
    return n
  }
  const meshes: THREE.Mesh[] = []
  const saved: (THREE.Material | THREE.Material[])[] = []
  const hidden: THREE.Object3D[] = []
  const muted: THREE.Material[] = []
  const swapIn = (o: THREE.Object3D) => {
    if (!o.layers.test(L0)) return
    const mesh = o as THREE.Mesh
    if (mesh.isMesh) {
      const src = mesh.material
      let next: THREE.Material | THREE.Material[] | null
      if (Array.isArray(src)) {
        let arr = arrCache.get(src)
        if (!arr) {
          arr = src.slice()
          arrCache.set(src, arr)
        }
        for (let i = 0; i < src.length; i++) {
          const n = normalFor(src[i]!)
          if (n === src[i]) {
            arr[i] = skip
          } else arr[i] = n ?? skip
        }
        next = arr
      } else {
        next = normalFor(src)
        if (next === src) {
          if (src.colorWrite) {
            src.colorWrite = false
            muted.push(src)
          }
          return
        }
      }
      // an effect draws nothing here, but stays visible so its children still do
      meshes.push(mesh)
      saved.push(src)
      mesh.material = next ?? skip
    } else if ((o as THREE.Points).isPoints || (o as THREE.Line).isLine || (o as THREE.Sprite).isSprite) {
      o.visible = false
      hidden.push(o)
    }
  }
  const prevClear = new THREE.Color()
  const drawNormals = (target: THREE.WebGLRenderTarget) => {
    const bg = scene.background
    const mask = camera.layers.mask
    const auto = renderer.shadowMap.autoUpdate
    const override = scene.overrideMaterial
    renderer.getClearColor(prevClear)
    const prevAlpha = renderer.getClearAlpha()
    meshes.length = 0
    saved.length = 0
    hidden.length = 0
    muted.length = 0
    try {
      scene.traverseVisible(swapIn)
      scene.background = null
      scene.overrideMaterial = null
      camera.layers.set(0)
      // the shadow map is already current for this frame; don't redraw it for normals
      renderer.shadowMap.autoUpdate = false
      renderer.setClearColor(NORMAL_CLEAR, 1)
      renderer.setRenderTarget(target)
      renderer.clear()
      renderer.render(scene, camera)
    } finally {
      for (let i = 0; i < meshes.length; i++) meshes[i]!.material = saved[i]!
      for (const o of hidden) o.visible = true
      for (const m of muted) m.colorWrite = true
      scene.background = bg
      scene.overrideMaterial = override
      camera.layers.mask = mask
      renderer.shadowMap.autoUpdate = auto
      renderer.setClearColor(prevClear, prevAlpha)
    }
  }

  return {
    resetAlpha() {
      cache = new WeakMap()
    },
    setSize(w: number, h: number) {
      const dpr = renderer.getPixelRatio()
      const fw = Math.max(1, Math.floor(w * dpr))
      const fh = Math.max(1, Math.floor(h * dpr))
      composer.setPixelRatio(dpr)
      composer.setSize(w, h)
      sceneRT.setSize(fw, fh)
      normalRT?.setSize(fw, fh)
      ou.uTexel.value.set(1 / fw, 1 / fh)
      ou.uPx.value = 1.2 * dpr
      gu.uDpr.value = dpr
      gu.uAspect.value = w / Math.max(1, h)
    },
    render() {
      ou.uNear.value = camera.near
      ou.uFar.value = camera.far
      // main render first: it brings the shadow map up to date
      renderer.setRenderTarget(sceneRT)
      if (!renderer.autoClear) renderer.clear()
      renderer.render(scene, camera)
      if (normalRT) drawNormals(normalRT)
      renderer.setRenderTarget(null)
      composer.render()
    }
  }
}

export const buildPost = (ctx: Ctx) => {
  const { renderer, scene, camera } = ctx
  const flags = { alphaBroken: false }
  let broken = false
  let pipe: ReturnType<typeof makePipe> | null = null

  // Watch for compile failures in this file's shaders; everything else logs as usual.
  const prevHandler = renderer.debug.onShaderError
  renderer.debug.onShaderError = (gl, program, vs, fs) => {
    const src = `${gl.getShaderSource(vs) ?? ''}\n${gl.getShaderSource(fs) ?? ''}`
    if (src.includes(ALPHA_TAG)) {
      flags.alphaBroken = true
      pipe?.resetAlpha()
    } else if (src.includes(TAG)) broken = true
    if (prevHandler) prevHandler(gl, program, vs, fs)
    else console.error('THREE.WebGLProgram: shader error', gl.getProgramInfoLog(program), gl.getShaderInfoLog(vs), gl.getShaderInfoLog(fs))
  }

  try {
    pipe = makePipe(ctx, flags)
  } catch (err) {
    console.warn('[world] post-processing unavailable, rendering plainly', err)
    pipe = null
  }

  return {
    /** Called by scene.ts after the canvas size changes (CSS pixels). */
    setSize(w: number, h: number) {
      pipe?.setSize(w, h)
    },
    render() {
      if (pipe && !broken) {
        try {
          pipe.render()
          return
        } catch (err) {
          console.warn('[world] post-processing failed, rendering plainly', err)
          pipe = null
        }
      }
      renderer.setRenderTarget(null)
      renderer.render(scene, camera)
    }
  }
}
