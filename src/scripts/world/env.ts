/*
 * Sky, sun or moon, stars, fog, the lights and drifting dust: everything that
 * sets the time of day, painted the way Abeto's Messenger paints it. Day is a
 * bright late afternoon (teal sky, flat cel clouds with lit tops and shaded
 * undersides, the sun low over the sea in +z); night is kaali-peeli night
 * (indigo sky, dark clouds with moonlit rims, a flat-shaded moon, twinkling
 * stars). Fog takes the horizon colour so the skyline fades into the sky in
 * layers. Real lights: hemisphere, sun/moon (shadows on desktop, its shadow
 * box riding along with the camera's subject) and one warm point light that
 * follows the subject. The sky, stars and dust sit on the fx layer.
 */
import * as THREE from 'three'
import type { Ctx } from './context'
import { PAL, fx } from './style'

const C = (hex: string, k = 1) => new THREE.Color(hex).multiplyScalar(k)

/** Everything that changes between day (mix 0) and night (mix 1). */
const DAY = {
  top: C(PAL.sky.dayTop), mid: C(PAL.sky.dayHorizon), horizon: C('#f4e3c3'),
  glow: C('#ffd193'), glowAmt: 0.55,
  disc: C('#fff2d2', 4), discR: 0.045, halo: C('#fff0cc'),
  cLit: C('#fffaf0'), cBody: C('#e7f6f1'), cShade: C('#a6d8d5'), cover: 0.56,
  hemiSky: C('#d6eef0'), hemiGround: C('#b39a7a'), hemiI: 1.55,
  sun: C('#fff1dc'), sunI: 2.0,
  fogNear: 30, fogFar: 300,
  warmI: 1.5, stars: 0, dust: C('#fff0c8'), dustI: 0.3, exposure: 1.0
}
const NIGHT: typeof DAY = {
  top: C(PAL.sky.nightTop), mid: C(PAL.sky.nightHorizon), horizon: C('#4e3644'),
  glow: C('#56619a'), glowAmt: 0.35,
  disc: C('#f6efd8', 1.6), discR: 0.034, halo: C('#5d6cab'),
  cLit: C('#7b84bb'), cBody: C('#1d2347'), cShade: C('#121630'), cover: 0.6,
  hemiSky: C('#7d8fd0'), hemiGround: C('#2a2230'), hemiI: 1.0,
  sun: C('#c6d3ff'), sunI: 0.85,
  fogNear: 45, fogFar: 340,
  warmI: 10, stars: 1, dust: C('#ffc874'), dustI: 0.85, exposure: 1.12
}

// Where the disc is painted (over the sea, clear of the Sea Link deck), and
// where the light really comes from: higher than the disc, so shadows stay
// short and the camera-facing sides of things catch the light.
const SUN_SKY = new THREE.Vector3(0.14, 0.19, 0.97).normalize()
const MOON_SKY = new THREE.Vector3(0.11, 0.245, 0.963).normalize()
const SUN_LIGHT = new THREE.Vector3(0.3, 0.55, 0.78).normalize()
const MOON_LIGHT = new THREE.Vector3(0.2, 0.62, 0.76).normalize()

const SHADOW_SPAN = 70
const SHADOW_MAP = 2048

/** Value-noise fbm and the cloud field, shared by the sky and the stars (so clouds hide stars). */
const noiseGLSL = (oct: number) => `
uniform float uTime;
uniform float uCover;
float h12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), f.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < ${oct}; i++) {
    s += a * vnoise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p + vec2(7.3, 3.1);
    a *= 0.5;
  }
  return s * ${(1 / (1 - Math.pow(0.5, oct))).toFixed(5)};
}
// a flat cloud deck overhead, squashed along x so clouds read as long streaks
vec2 skyPlane(vec3 d) {
  return d.xz / (max(d.y, 0.0) + 0.14) * vec2(0.4, 0.85) + vec2(uTime * 0.012, uTime * 0.003);
}
float cloudAt(vec2 p) {
  vec2 w = vec2(vnoise(p * 0.45 + 11.0), vnoise(p * 0.45 + 37.0)) - 0.5;
  return fbm(p * 0.9 + w * 0.9);
}
`

const SKY_VS = `varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const skyFS = (oct: number) => `uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uFog;
uniform vec3 uGlow;
uniform float uGlowAmt;
uniform vec3 uSunDir;
uniform vec3 uDisc;
uniform float uDiscR;
uniform vec3 uHalo;
uniform float uNight;
uniform vec3 uCLit;
uniform vec3 uCBody;
uniform vec3 uCShade;
varying vec3 vDir;
${noiseGLSL(oct)}
float blob(vec2 p, vec2 c, float r) {
  return 1.0 - smoothstep(r - 0.04, r + 0.04, length(p - c));
}
void main() {
  vec3 d = normalize(vDir);
  float h = d.y;
  vec3 col = mix(uHorizon, uMid, smoothstep(-0.02, 0.22, h));
  col = mix(col, uTop, smoothstep(0.18, 0.75, h));
  // late-afternoon warmth (or moon haze) around the disc, strongest low down
  float sd = max(dot(d, uSunDir), 0.0);
  col = mix(col, uGlow, uGlowAmt * pow(sd, 8.0) * (1.0 - 0.7 * smoothstep(0.0, 0.5, h)));
  // a painted halo: two flat rings and a soft glow
  float ch = length(d - uSunDir);
  float aa = fwidth(ch) + 1e-5;
  float r1 = 1.0 - smoothstep(uDiscR * 1.9 - aa, uDiscR * 1.9 + aa, ch);
  float r2 = 1.0 - smoothstep(uDiscR * 3.2 - aa, uDiscR * 3.2 + aa, ch);
  col = mix(col, uHalo, r2 * 0.16 + r1 * 0.2);
  col += uHalo * exp(-ch * 16.0) * 0.22;
  // the disc; at night it is a moon with flat maria and a shaded side
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), uSunDir));
  vec3 up = cross(uSunDir, rt);
  vec2 lc = vec2(dot(d - uSunDir, rt), dot(d - uSunDir, up)) / uDiscR;
  float mar = max(max(blob(lc, vec2(-0.3, 0.2), 0.32), blob(lc, vec2(0.28, -0.16), 0.24)), blob(lc, vec2(0.06, 0.5), 0.16));
  float shadeSide = smoothstep(0.5, 0.56, dot(lc, vec2(0.6, -0.8)));
  vec3 dc = uDisc * (1.0 - uNight * max(mar * 0.26, shadeSide * 0.14));
  col = mix(col, dc, 1.0 - smoothstep(uDiscR - aa, uDiscR + aa, ch));
  // flat painted clouds: hard-edged body, shaded underside, lit top
  vec2 p = skyPlane(d);
  float clearSun = (1.0 - smoothstep(uDiscR * 2.0, uDiscR * 6.0, ch)) * 0.3;
  float n = cloudAt(p) - clearSun;
  float aaN = fwidth(n) * 0.8 + 0.002;
  float fade = smoothstep(0.015, 0.14, h);
  if (fade > 0.0 && n > uCover - aaN) {
    vec2 away = normalize(d.xz * vec2(0.4, 0.85) + 1e-5);
    float m = smoothstep(uCover - aaN, uCover + aaN, n);
    float under = 1.0 - smoothstep(uCover - aaN, uCover + aaN, cloudAt(p + away * 0.2) - clearSun);
    vec3 cc = mix(uCBody, uCShade, under);
#ifdef RIM
    float top = (1.0 - smoothstep(uCover - aaN, uCover + aaN, cloudAt(p - away * 0.09) - clearSun)) * (1.0 - under);
#else
    float top = (1.0 - smoothstep(uCover + 0.015, uCover + 0.04, n)) * (1.0 - under);
#endif
    cc = mix(cc, uCLit * (1.0 + 0.35 * pow(sd, 6.0)), top);
    // far clouds sink into the haze
    cc = mix(cc, col, (1.0 - smoothstep(0.03, 0.4, h)) * 0.45);
    col = mix(col, cc, m * fade);
  }
  // meet the fog exactly at the horizon so fogged sea and land run into the sky
  col = mix(uFog, col, smoothstep(0.0, 0.05, h));
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

const starVS = (oct: number) => `attribute float aSeed;
uniform float uPr;
uniform float uOpacity;
varying float vA;
${noiseGLSL(oct)}
void main() {
  vec3 d = normalize(position);
  float clear = 1.0 - smoothstep(uCover - 0.04, uCover + 0.02, cloudAt(skyPlane(d)));
  float tw = 0.72 + 0.28 * sin(uTime * (1.1 + fract(aSeed * 7.13) * 2.6) + aSeed * 6.2832);
  vA = uOpacity * tw * clear * smoothstep(0.06, 0.2, d.y) * (0.45 + 0.55 * fract(aSeed * 3.71));
  gl_PointSize = uPr * (1.6 + 1.8 * fract(aSeed * 5.17));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const STAR_FS = `uniform vec3 uColor;
varying float vA;
void main() {
  float r = length(gl_PointCoord - 0.5);
  gl_FragColor = vec4(uColor, (1.0 - smoothstep(0.2, 0.5, r)) * vA);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

const DUST_VS = `attribute float aSeed;
uniform float uTime;
uniform float uScale;
uniform float uSize;
varying float vA;
void main() {
  vec3 p = position;
  p.y += sin(uTime * 0.6 + aSeed) * 0.5;
  p.x += cos(uTime * 0.4 + aSeed) * 0.6;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float dz = -mv.z;
  // fade motes that drift right up to the lens, and the far ones
  vA = smoothstep(1.5, 4.0, dz) * (1.0 - smoothstep(28.0, 40.0, dz)) * (0.6 + 0.4 * sin(uTime * 1.3 + aSeed * 3.0));
  gl_PointSize = clamp(uSize * uScale / max(dz, 0.5), 1.0, 48.0);
  gl_Position = projectionMatrix * mv;
}`

const DUST_FS = `uniform vec3 uColor;
uniform float uOpacity;
varying float vA;
void main() {
  float a = 1.0 - smoothstep(0.0, 0.5, length(gl_PointCoord - 0.5));
  gl_FragColor = vec4(uColor, a * a * vA * uOpacity);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

export const buildEnv = (ctx: Ctx) => {
  const { scene, renderer, compact, reduced } = ctx
  const rand = ctx.rng(11)
  const oct = compact ? 3 : 4

  // A neutral curve keeps the flat cel colours honest; exposure follows the mode.
  renderer.toneMapping = THREE.NeutralToneMapping

  const fog = new THREE.Fog(0xffffff, DAY.fogNear, DAY.fogFar)
  scene.fog = fog

  // ——— lights ———
  const hemi = new THREE.HemisphereLight(0xffffff, 0x000000, 1)
  const sun = new THREE.DirectionalLight(0xffffff, 2)
  sun.castShadow = !compact
  renderer.shadowMap.enabled = !compact
  if (!compact) {
    renderer.shadowMap.type = THREE.PCFShadowMap
    sun.shadow.mapSize.set(SHADOW_MAP, SHADOW_MAP)
    const sc = sun.shadow.camera
    sc.left = -SHADOW_SPAN / 2
    sc.right = SHADOW_SPAN / 2
    sc.top = SHADOW_SPAN / 2
    sc.bottom = -SHADOW_SPAN / 2
    sc.near = 1
    sc.far = 240
    sc.updateProjectionMatrix()
    // toon bands make acne obvious; push a little along the normal instead of a big bias
    sun.shadow.bias = -0.0005
    sun.shadow.normalBias = 0.04
  }
  const warm = new THREE.PointLight(0xffb867, 0, 45, 1.2)
  scene.add(hemi, sun, sun.target, warm)

  // ——— sky dome ———
  const shared = { uTime: { value: 0 }, uCover: { value: DAY.cover } }
  const su = {
    ...shared,
    uTop: { value: new THREE.Color() },
    uMid: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uFog: { value: new THREE.Color() },
    uGlow: { value: new THREE.Color() },
    uGlowAmt: { value: 0 },
    uSunDir: { value: SUN_SKY.clone() },
    uDisc: { value: new THREE.Color() },
    uDiscR: { value: DAY.discR },
    uHalo: { value: new THREE.Color() },
    uNight: { value: 0 },
    uCLit: { value: new THREE.Color() },
    uCBody: { value: new THREE.Color() },
    uCShade: { value: new THREE.Color() }
  }
  const sky = fx(new THREE.Mesh(
    new THREE.SphereGeometry(600, 32, 16),
    new THREE.ShaderMaterial({
      uniforms: su,
      defines: compact ? {} : { RIM: 1 },
      vertexShader: SKY_VS,
      fragmentShader: skyFS(oct),
      side: THREE.BackSide,
      depthWrite: false
    })
  ))
  sky.renderOrder = -10
  sky.frustumCulled = false
  scene.add(sky)

  // ——— stars (twinkle at night, hidden behind clouds) ———
  const starN = compact ? 500 : 900
  const starPos = new Float32Array(starN * 3)
  const starSeed = new Float32Array(starN)
  for (let i = 0; i < starN; i++) {
    const y = 0.06 + rand() * 0.94
    const r = Math.sqrt(1 - y * y) * 480
    const a = rand() * Math.PI * 2
    starPos.set([Math.cos(a) * r, y * 480, Math.sin(a) * r], i * 3)
    starSeed[i] = rand() * 100
  }
  const starGeo = new THREE.BufferGeometry()
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
  starGeo.setAttribute('aSeed', new THREE.BufferAttribute(starSeed, 1))
  const stu = {
    ...shared,
    uPr: { value: 1 },
    uOpacity: { value: 0 },
    uColor: { value: C('#fff1d0', 1.3) }
  }
  const stars = fx(new THREE.Points(starGeo, new THREE.ShaderMaterial({
    uniforms: stu,
    vertexShader: starVS(oct),
    fragmentShader: STAR_FS,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })))
  stars.renderOrder = -9
  stars.frustumCulled = false
  scene.add(stars)

  // ——— drifting dust by day, warm motes in the lamplight at night ———
  const dustN = compact ? 90 : 220
  const dustPos = new Float32Array(dustN * 3)
  const dustSeed = new Float32Array(dustN)
  for (let i = 0; i < dustN; i++) {
    dustPos.set([-30 + rand() * 60, 0.5 + rand() * 13.5, -30 + rand() * 40], i * 3)
    dustSeed[i] = rand() * 10
  }
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dustSeed, 1))
  const du = {
    uTime: shared.uTime,
    uScale: { value: 800 },
    uSize: { value: 0.05 },
    uColor: { value: new THREE.Color() },
    uOpacity: { value: 0 }
  }
  const dust = fx(new THREE.Points(dustGeo, new THREE.ShaderMaterial({
    uniforms: du,
    vertexShader: DUST_VS,
    fragmentShader: DUST_FS,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  })))
  dust.frustumCulled = false
  scene.add(dust)

  // ——— day / night ———
  const lightDir = SUN_LIGHT.clone()
  ctx.onMode((mix) => {
    const c = (a: THREE.Color, b: THREE.Color, out: THREE.Color) => out.copy(a).lerp(b, mix)
    const n = (a: number, b: number) => a + (b - a) * mix
    c(DAY.top, NIGHT.top, su.uTop.value)
    c(DAY.mid, NIGHT.mid, su.uMid.value)
    c(DAY.horizon, NIGHT.horizon, su.uHorizon.value)
    // the sky's own colour just above the skyline (same blend as the shader at h ≈ 0.06)
    su.uFog.value.copy(su.uHorizon.value).lerp(su.uMid.value, 0.26)
    fog.color.copy(su.uFog.value)
    fog.near = n(DAY.fogNear, NIGHT.fogNear)
    fog.far = n(DAY.fogFar, NIGHT.fogFar)
    c(DAY.glow, NIGHT.glow, su.uGlow.value)
    su.uGlowAmt.value = n(DAY.glowAmt, NIGHT.glowAmt)
    su.uSunDir.value.copy(SUN_SKY).lerp(MOON_SKY, mix).normalize()
    c(DAY.disc, NIGHT.disc, su.uDisc.value)
    su.uDiscR.value = n(DAY.discR, NIGHT.discR)
    c(DAY.halo, NIGHT.halo, su.uHalo.value)
    su.uNight.value = mix
    c(DAY.cLit, NIGHT.cLit, su.uCLit.value)
    c(DAY.cBody, NIGHT.cBody, su.uCBody.value)
    c(DAY.cShade, NIGHT.cShade, su.uCShade.value)
    shared.uCover.value = n(DAY.cover, NIGHT.cover)

    c(DAY.hemiSky, NIGHT.hemiSky, hemi.color)
    c(DAY.hemiGround, NIGHT.hemiGround, hemi.groundColor)
    hemi.intensity = n(DAY.hemiI, NIGHT.hemiI)
    c(DAY.sun, NIGHT.sun, sun.color)
    sun.intensity = n(DAY.sunI, NIGHT.sunI)
    lightDir.copy(SUN_LIGHT).lerp(MOON_LIGHT, mix).normalize()
    warm.intensity = n(DAY.warmI, NIGHT.warmI)

    stu.uOpacity.value = n(DAY.stars, NIGHT.stars)
    stars.visible = stu.uOpacity.value > 0.01
    c(DAY.dust, NIGHT.dust, du.uColor.value)
    du.uOpacity.value = n(DAY.dustI, NIGHT.dustI)
    renderer.toneMappingExposure = n(DAY.exposure, NIGHT.exposure)
  })

  // ——— every frame ———
  const UP = new THREE.Vector3(0, 1, 0)
  const right = new THREE.Vector3()
  const upL = new THREE.Vector3()
  const focus = new THREE.Vector3()
  const step = new THREE.Vector3()
  const buf = new THREE.Vector2()
  const texel = SHADOW_SPAN / SHADOW_MAP
  ctx.onFrame(({ t, camera, target }) => {
    const cp = camera.position
    sky.position.copy(cp)
    stars.position.copy(cp)
    dust.position.set(cp.x, 0, cp.z - 6)
    if (!reduced) shared.uTime.value = t
    stu.uPr.value = renderer.getPixelRatio()
    renderer.getDrawingBufferSize(buf)
    du.uScale.value = buf.y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2))

    // Sun/moon: same direction everywhere, its shadow box centred between the
    // camera and its subject and snapped to whole shadow texels so edges don't crawl.
    focus.copy(target).lerp(cp, 0.45)
    focus.y = 0
    if (!compact) {
      right.crossVectors(UP, lightDir).normalize()
      upL.crossVectors(lightDir, right)
      const a = Math.round(focus.dot(right) / texel) * texel
      const b = Math.round(focus.dot(upL) / texel) * texel
      const d = focus.dot(lightDir)
      focus.copy(right).multiplyScalar(a).addScaledVector(upL, b).addScaledVector(lightDir, d)
    }
    sun.target.position.copy(focus)
    sun.position.copy(focus).addScaledVector(lightDir, 120)

    // the warm light hangs a few metres above the way to the subject
    step.subVectors(target, cp)
    const dist = step.length()
    step.multiplyScalar(Math.min(10, dist * 0.5) / Math.max(dist, 0.001))
    warm.position.copy(cp).add(step)
    warm.position.y = Math.max(warm.position.y + 3.5, 5.5)
  })
}
