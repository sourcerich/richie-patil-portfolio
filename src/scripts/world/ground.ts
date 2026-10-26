/*
 * The ground the city stands on: dusty earth, the road with its worn
 * asphalt, faded dashes, a zebra crossing and manhole covers, the black-and-
 * yellow painted kerbs and paver footpaths, the two railway tracks on
 * ballast with concrete sleepers, the compound wall behind them plastered
 * with posters and painted ads, curved-arm sodium street lamps along the
 * road, and the paved apron and low sea wall before the water.
 */
import * as THREE from 'three'
import { LAYOUT, type Ctx } from './context'
import { PAL, fx, glow, toon } from './style'
import { glowTexture } from './textures'

type Rng = () => number

const canvas = (w: number, h: number) => {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { c, g: c.getContext('2d')! }
}
const tex = (c: HTMLCanvasElement, rx = 1, ry = 1) => {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(rx, ry)
  t.anisotropy = 8
  return t
}

/** 40 m of road (x) by its 10 m width (y): patches, cracks, oil, faded dashes. Tiles along x. */
const asphalt = (rand: Rng) => {
  const { c, g } = canvas(1024, 256)
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 1024, 256)
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = `rgba(0,0,0,${rand() * 0.06})`
    g.fillRect(rand() * 1024, rand() * 256, 2, 2)
  }
  for (let i = 0; i < 7; i++) {
    g.fillStyle = `rgba(0,0,0,${0.06 + rand() * 0.08})`
    g.fillRect(rand() * 980, rand() * 220, 30 + rand() * 90, 20 + rand() * 40)
  }
  g.strokeStyle = 'rgba(0,0,0,.25)'
  g.lineWidth = 1.5
  for (let i = 0; i < 14; i++) {
    let x = rand() * 1024
    let y = rand() * 256
    g.beginPath()
    g.moveTo(x, y)
    for (let k = 0; k < 6; k++) {
      x += (rand() - 0.5) * 40
      y += (rand() - 0.5) * 30
      g.lineTo(x, y)
    }
    g.stroke()
  }
  for (let i = 0; i < 5; i++) {
    g.fillStyle = 'rgba(20,10,30,.12)'
    g.beginPath()
    g.ellipse(rand() * 1024, 60 + rand() * 140, 14 + rand() * 20, 6 + rand() * 8, 0, 0, Math.PI * 2)
    g.fill()
  }
  // centre dashes, faded and chipped
  for (let x = 10; x < 1024; x += 180) {
    g.fillStyle = 'rgba(245,238,215,.75)'
    g.fillRect(x, 124, 75, 7)
    g.fillStyle = 'rgba(80,80,90,.5)'
    g.fillRect(x + rand() * 60, 124, 6 + rand() * 10, 7)
  }
  return tex(c)
}

/** Interlocking paver blocks, one 4 m tile. */
const pavers = (rand: Rng, base = '#c9bfae') => {
  const { c, g } = canvas(256, 128)
  g.fillStyle = '#857b6c'
  g.fillRect(0, 0, 256, 128)
  for (let y = 0; y < 128; y += 16) {
    for (let x = ((y / 16) % 2) * 12; x < 256; x += 24) {
      const k = 0.88 + rand() * 0.18
      const col = new THREE.Color(base).multiplyScalar(k)
      g.fillStyle = `#${col.getHexString()}`
      g.fillRect(x + 1, y + 1, 22, 14)
    }
  }
  return tex(c)
}

/** Dusty earth with grass tufts and litter specks. */
const earth = (rand: Rng) => {
  const { c, g } = canvas(512, 512)
  g.fillStyle = '#ffffff'
  g.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 90; i++) {
    g.fillStyle = `rgba(${70 + rand() * 40},${110 + rand() * 40},${50 + rand() * 20},${0.25 + rand() * 0.25})`
    g.beginPath()
    g.ellipse(rand() * 512, rand() * 512, 6 + rand() * 30, 4 + rand() * 18, rand() * 3, 0, Math.PI * 2)
    g.fill()
  }
  for (let i = 0; i < 1600; i++) {
    g.fillStyle = `rgba(60,40,20,${rand() * 0.12})`
    g.fillRect(rand() * 512, rand() * 512, 2, 2)
  }
  return tex(c)
}

/** Ballast: grey-brown gravel. */
const gravel = (rand: Rng) => {
  const { c, g } = canvas(256, 64)
  g.fillStyle = '#8a8277'
  g.fillRect(0, 0, 256, 64)
  for (let i = 0; i < 900; i++) {
    const k = 90 + rand() * 90
    g.fillStyle = `rgb(${k},${k * 0.95},${k * 0.88})`
    g.fillRect(rand() * 256, rand() * 64, 2 + rand() * 2, 2)
  }
  return tex(c)
}

/** The compound wall's face: posters, painted ads, graffiti, rust streaks. One 30 m tile. */
const wallFace = (rand: Rng) => {
  const { c, g } = canvas(1024, 96)
  g.fillStyle = '#c9c0ae'
  g.fillRect(0, 0, 1024, 96)
  for (let i = 0; i < 30; i++) {
    g.fillStyle = `rgba(90,80,60,${rand() * 0.15})`
    g.fillRect(rand() * 1024, 0, 3 + rand() * 10, 96)
  }
  const ads = ['VIMAL', 'AMUL', 'LIC', 'TATA SKY', 'जय महाराष्ट्र', 'BEST', 'POSTERS PROHIBITED']
  for (let x = 20; x < 1000; x += 90 + rand() * 80) {
    const kind = rand()
    if (kind < 0.45) {
      // a block of pasted posters
      for (let k = 0; k < 3; k++) {
        g.fillStyle = ['#e44f3c', '#f4cf36', '#3f7fc0', '#f2efe4', '#2f8a5a'][Math.floor(rand() * 5)]!
        g.fillRect(x + k * 18, 18 + rand() * 10, 16, 26)
      }
    } else if (kind < 0.8) {
      // a painted ad
      g.fillStyle = ['#c8202f', '#2f6fb3', '#2f8a5a'][Math.floor(rand() * 3)]!
      g.fillRect(x, 20, 80, 40)
      g.fillStyle = '#f7f1e0'
      g.font = '16px "Yatra One", Georgia, serif'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.fillText(ads[Math.floor(rand() * ads.length)]!, x + 40, 40, 74)
    } else {
      // graffiti
      g.strokeStyle = ['#1f1d24', '#d6312b', '#2f6fb3'][Math.floor(rand() * 3)]!
      g.lineWidth = 3
      g.beginPath()
      g.moveTo(x, 60)
      for (let k = 0; k < 6; k++) g.quadraticCurveTo(x + k * 10 + 5, 30 + rand() * 30, x + k * 10 + 10, 55 + rand() * 10)
      g.stroke()
    }
  }
  g.fillStyle = 'rgba(0,0,0,.18)'
  g.fillRect(0, 86, 1024, 10)
  return tex(c)
}

/** Black-and-yellow kerb stripes. */
const kerbStripes = () => {
  const { c, g } = canvas(64, 8)
  g.fillStyle = PAL.kerbBlack
  g.fillRect(0, 0, 64, 8)
  g.fillStyle = PAL.kerbYellow
  g.fillRect(0, 0, 32, 8)
  return tex(c)
}

export const buildGround = (ctx: Ctx) => {
  const { scene, compact } = ctx
  const rand = ctx.rng(2025)
  const m4 = new THREE.Matrix4()
  const L = 1200
  const CX = 120

  const flat = (w: number, d: number, mat: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.set(x, y, z)
    mesh.receiveShadow = true
    scene.add(mesh)
    return mesh
  }

  // earth everywhere else
  const groundMat = toon('#b49f80', { map: earth(rand) })
  ;(groundMat.map as THREE.Texture).repeat.set(L / 24, 260 / 24)
  flat(L, 260, groundMat, CX, 0, -50)

  // the road
  const roadMat = toon(PAL.asphalt, { map: asphalt(rand) })
  ;(roadMat.map as THREE.Texture).repeat.set(L / 40, 1)
  flat(L, LAYOUT.road.width, roadMat, CX, 0.02, LAYOUT.road.z)

  // zebra crossing just past the taxi, and two manhole covers
  {
    const stripes = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.5, 7).rotateX(-Math.PI / 2), toon('#efe8d6'), 8)
    for (let i = 0; i < 8; i++) stripes.setMatrixAt(i, m4.makeTranslation(14 + i * 1, 0.035, LAYOUT.road.z - 1.3))
    stripes.receiveShadow = true
    scene.add(stripes)
    const covers = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.42, 0.42, 0.02, 14), toon('#3b3a40'), 3)
    ;[[-8, 0.5], [31, -1.4], [70, 1.6]].forEach(([x, z], i) => covers.setMatrixAt(i, m4.makeTranslation(x!, 0.035, z!)))
    scene.add(covers)
  }

  // painted kerbs both sides, paver footpaths behind them
  const kerbMat = toon('#ffffff', { map: kerbStripes() })
  ;(kerbMat.map as THREE.Texture).repeat.set(L / 2, 1)
  for (const z of [LAYOUT.kerbZ, LAYOUT.road.z - LAYOUT.road.width / 2 - 0.4]) {
    const kerb = new THREE.Mesh(new THREE.BoxGeometry(L, 0.25, 0.3), kerbMat)
    kerb.position.set(CX, 0.125, z)
    kerb.receiveShadow = true
    scene.add(kerb)
  }
  const paveMat = toon('#ffffff', { map: pavers(rand) })
  ;(paveMat.map as THREE.Texture).repeat.set(L / 4, 1)
  const near = new THREE.Mesh(new THREE.BoxGeometry(L, 0.2, 3.4), paveMat)
  near.position.set(CX, 0.1, LAYOUT.kerbZ + 1.85)
  near.receiveShadow = true
  scene.add(near)
  const farPath = new THREE.Mesh(new THREE.BoxGeometry(L, 0.2, 1.6), paveMat)
  farPath.position.set(CX, 0.1, LAYOUT.road.z - LAYOUT.road.width / 2 - 1.4)
  farPath.receiveShadow = true
  scene.add(farPath)

  // ——— railway: ballast beds, sleepers, rails ———
  const ballastMat = toon('#ffffff', { map: gravel(rand) })
  ;(ballastMat.map as THREE.Texture).repeat.set(L / 6, 1)
  const railMat = toon('#9aa0a8')
  const railGeo = new THREE.BoxGeometry(L, 0.16, 0.08)
  for (const track of [LAYOUT.tracks.near, LAYOUT.tracks.far]) {
    const bed = new THREE.Mesh(new THREE.BoxGeometry(L, 0.3, 4.4), ballastMat)
    bed.position.set(CX, 0.15, track)
    bed.receiveShadow = true
    scene.add(bed)
    for (const off of [-0.72, 0.72]) {
      const rail = new THREE.Mesh(railGeo, railMat)
      rail.position.set(CX, 0.46, track + off)
      scene.add(rail)
    }
  }
  const sleeperN = compact ? 300 : 600
  const sleepers = new THREE.InstancedMesh(new THREE.BoxGeometry(0.26, 0.1, 2.6), toon('#b0aca3'), sleeperN)
  for (let i = 0; i < sleeperN / 2; i++) {
    for (let t = 0; t < 2; t++) {
      const x = -90 + i * (compact ? 2.4 : 1.2)
      sleepers.setMatrixAt(i * 2 + t, m4.makeTranslation(x, 0.34, t ? LAYOUT.tracks.far : LAYOUT.tracks.near))
    }
  }
  sleepers.receiveShadow = true
  scene.add(sleepers)

  // the compound wall behind the far track, in 30 m panels with gaps
  {
    const faceMat = toon('#ffffff', { map: wallFace(rand) })
    const panels = new THREE.InstancedMesh(new THREE.BoxGeometry(30, 2.6, 0.3).translate(0, 1.3, 0), faceMat, 18)
    for (let i = 0; i < 18; i++) panels.setMatrixAt(i, m4.makeTranslation(-110 + i * 32, 0, -23.5))
    scene.add(panels)
  }

  // ——— the sea side: paved apron and the low sea wall ———
  const apronMat = toon('#ffffff', { map: pavers(rand, '#b9b2a2') })
  ;(apronMat.map as THREE.Texture).repeat.set(L / 4, 38 / 2)
  flat(L, 38, apronMat, CX, 0.015, 27)
  const wall = new THREE.Mesh(new THREE.BoxGeometry(L, 1.1, 0.9), toon('#a9a291'))
  wall.position.set(CX, 0.55, LAYOUT.promenade.wallZ)
  wall.receiveShadow = true
  scene.add(wall)

  // ——— curved-arm sodium lamps along the near footpath ———
  const step = compact ? 32 : 24
  const xs: number[] = []
  // skip lamps that would stand in a camera's face (Start, About, Contact sit near the road)
  for (let x = -28; x <= 224; x += step) if (Math.abs(x - 2) > 9 && Math.abs(x - 52) > 6 && (x < 100 || x > 140)) xs.push(x)
  const poleGeo = new THREE.CylinderGeometry(0.08, 0.13, 7.5, 8).translate(0, 3.75, 0)
  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 7.4, 0), new THREE.Vector3(0, 8.3, 0), new THREE.Vector3(0, 8.1, -2))
  const armGeo = new THREE.TubeGeometry(curve, 8, 0.06, 5)
  const headGeo = new THREE.BoxGeometry(0.35, 0.16, 0.7)
  const poles = new THREE.InstancedMesh(poleGeo, toon('#4a4e55'), xs.length)
  const arms = new THREE.InstancedMesh(armGeo, toon('#4a4e55'), xs.length)
  const headMat = glow('#ffb54a', 1)
  const heads = new THREE.InstancedMesh(headGeo, headMat, xs.length)
  const poolMat = new THREE.MeshBasicMaterial({ map: glowTexture(), color: '#ff9a3a', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })
  const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(9, 9).rotateX(-Math.PI / 2), poolMat, xs.length)
  xs.forEach((x, i) => {
    const z = LAYOUT.kerbZ + 0.6
    poles.setMatrixAt(i, m4.makeTranslation(x, 0.2, z))
    arms.setMatrixAt(i, m4.makeTranslation(x, 0.2, z))
    heads.setMatrixAt(i, m4.makeTranslation(x, 8.2, z - 2.1))
    pools.setMatrixAt(i, m4.makeTranslation(x, 0.05, z - 3))
  })
  poles.castShadow = true
  scene.add(poles, arms, heads, fx(pools))

  ctx.onMode((mix) => {
    roadMat.color.set(PAL.asphalt).lerp(new THREE.Color(PAL.asphaltNight), mix)
    groundMat.color.set('#b49f80').lerp(new THREE.Color('#3a3530'), mix)
    headMat.color.set('#ffb54a').multiplyScalar(0.7 + 2.4 * mix)
    poolMat.opacity = 0.08 + 0.55 * mix
  })
}
