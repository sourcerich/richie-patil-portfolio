import * as THREE from 'three'

const VS = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

const FS = `uniform sampler2D tColor;
uniform sampler2D tNormal;
uniform sampler2D tDepth;
uniform vec2 uRes;
uniform float uPx;
uniform float uNear;
uniform float uFar;
uniform float uBoil;
uniform vec3 uInk;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float dist(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  return uNear * uFar / (uFar - d * (uFar - uNear));
}
vec3 nrm(vec2 uv) { return texture2D(tNormal, uv).xyz * 2.0 - 1.0; }

void main() {
  vec2 wob = vec2(noise(vUv * 7.0 + uBoil), noise(vUv * 7.0 + uBoil + 17.3)) - 0.5;
  vec2 uv = vUv + wob * 2.0 * uPx / uRes;
  float dc = dist(uv);
  float far = smoothstep(14.0, 30.0, dc);
  float weight = uPx * (0.8 + 0.6 * noise(vUv * 38.0 - uBoil * 3.1)) * mix(1.15, 0.6, far);
  vec2 o = weight / uRes;

  vec3 nc = nrm(uv);
  float edge = 0.0;
  for (int i = 0; i < 4; i++) {
    vec2 dir = i == 0 ? vec2(o.x, 0) : i == 1 ? vec2(-o.x, 0) : i == 2 ? vec2(0, o.y) : vec2(0, -o.y);
    float dn = dist(uv + dir);
    edge = max(edge, smoothstep(0.02, 0.05, abs(dn - dc) / min(dn, dc)));
    edge = max(edge, smoothstep(0.55, 0.85, 1.0 - dot(nc, nrm(uv + dir))));
  }

  edge *= smoothstep(0.04, 0.16, noise(vUv * uRes / (uPx * 14.0) + uBoil * 2.3));
  edge *= mix(1.0, 0.7, far);

  vec4 col = texture2D(tColor, vUv);
  float g = hash(floor(vUv * uRes / max(1.0, uPx * 0.8)) + uBoil * 13.0) - 0.5;
  col.rgb *= 1.0 + g * 0.05;
  vec3 rgb = mix(col.rgb, uInk, edge);
  float a = max(col.a, edge);
  rgb = linearToOutputTexel(vec4(rgb, 1.0)).rgb;
  gl_FragColor = vec4(rgb * a, a);
}`

export const createInk = (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
  const colorRT = new THREE.WebGLRenderTarget(1, 1)
  colorRT.texture.colorSpace = THREE.SRGBColorSpace
  const normalRT = new THREE.WebGLRenderTarget(1, 1)
  normalRT.depthTexture = new THREE.DepthTexture(1, 1)
  const normalMat = new THREE.MeshNormalMaterial({ side: THREE.DoubleSide })

  const uniforms = {
    tColor: { value: colorRT.texture },
    tNormal: { value: normalRT.texture },
    tDepth: { value: normalRT.depthTexture },
    uRes: { value: new THREE.Vector2(1, 1) },
    uPx: { value: 1.5 },
    uNear: { value: camera.near },
    uFar: { value: camera.far },
    uBoil: { value: 0 },
    uInk: { value: new THREE.Color('#6b2c1a') }
  }
  const quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({ uniforms, vertexShader: VS, fragmentShader: FS, transparent: true, depthTest: false, depthWrite: false, premultipliedAlpha: true })
  )
  quad.frustumCulled = false
  const quadScene = new THREE.Scene()
  quadScene.add(quad)
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

  return {
    setSize(w: number, h: number, dpr: number) {
      const fw = Math.max(1, Math.round(w * dpr))
      const fh = Math.max(1, Math.round(h * dpr))
      colorRT.setSize(fw, fh)
      normalRT.setSize(fw, fh)
      uniforms.uRes.value.set(fw, fh)
      uniforms.uPx.value = 1.4 * dpr
    },
    render(boil: number) {
      renderer.setClearColor(0x000000, 0)
      renderer.setRenderTarget(colorRT)
      renderer.clear()
      renderer.render(scene, camera)
      scene.overrideMaterial = normalMat
      renderer.setClearColor(0x8080ff, 1)
      renderer.setRenderTarget(normalRT)
      renderer.clear()
      renderer.render(scene, camera)
      scene.overrideMaterial = null
      renderer.setClearColor(0x000000, 0)
      renderer.setRenderTarget(null)
      uniforms.uNear.value = camera.near
      uniforms.uFar.value = camera.far
      uniforms.uBoil.value = boil
      renderer.clear()
      renderer.render(quadScene, quadCam)
    }
  }
}
