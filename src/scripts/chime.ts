/*
 * Station sounds for page changes, off by default; the speaker switch
 * (SoundToggle.astro) stores the choice in localStorage `chime`.
 *
 * - The chime: the two-strike jingle that plays before announcements on
 *   Indian Railways platforms, from a real recording ("Indian Railway
 *   announcement" by egovind, freesound.org/s/684835, CC0), cut to the
 *   chime alone (public/audio/station-chime.*). Plays when the switch is
 *   turned on.
 * - The announcements: that chime followed by "पुढील स्थानक, <page>" ("next
 *   station, <page>") in a Marathi station-announcer voice, one file per
 *   page (public/audio/announce/*, built by tools/announcements.py, lengths
 *   in src/announcements.json). page-wipe.ts plays the destination's and
 *   holds the cover until it has finished.
 */
import announcements from '../announcements.json'
import { cleanPath } from '../site'

const KEY = 'chime'
const GAIN = 0.75

type Announcement = { key: string, ms: number }
const ANNOUNCE = announcements as Record<string, Announcement>

export const chimeOn = () => {
  try {
    return localStorage.getItem(KEY) === 'on'
  } catch {
    return false
  }
}

export const setChime = (on: boolean) => {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off')
  } catch {
    // Storage disabled: the switch just doesn't stick.
  }
  if (on) warm()
}

let audio: AudioContext | null = null
const buffers = new Map<string, Promise<AudioBuffer | null>>()

const context = () => {
  try {
    audio ??= new AudioContext()
    return audio
  } catch {
    return null
  }
}

// Fetch and decode a sound once, trying Opus first, then MP3 (Safari).
const load = (ctx: AudioContext, base: string) => {
  let buffer = buffers.get(base)
  if (!buffer) {
    buffer = (async () => {
      for (const ext of ['webm', 'mp3']) {
        try {
          const res = await fetch(`${base}.${ext}`)
          if (!res.ok) continue
          return await ctx.decodeAudioData(await res.arrayBuffer())
        } catch {
          // Format not supported here: try the next one.
        }
      }
      return null
    })()
    buffers.set(base, buffer)
  }
  return buffer
}

const announceBase = (a: Announcement) => `/audio/announce/${a.key}`

// Decode everything ahead while the browser is idle, so a click plays at once.
function warm() {
  const ctx = context()
  if (!ctx) return
  const run = () => {
    void load(ctx, '/audio/station-chime')
    for (const a of Object.values(ANNOUNCE)) void load(ctx, announceBase(a))
  }
  if ('requestIdleCallback' in window) requestIdleCallback(run)
  else setTimeout(run, 500)
}
if (chimeOn()) warm()

// Plays a decoded sound; fades it out from `fadeAtMs` if given.
const play = (base: string, fadeAtMs?: number) => {
  const ctx = context()
  if (!ctx) return false
  void ctx.resume()
  void load(ctx, base).then((data) => {
    if (!data) return
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    source.buffer = data
    gain.gain.value = GAIN
    source.connect(gain).connect(ctx.destination)
    const now = ctx.currentTime
    source.start(now)
    if (fadeAtMs !== undefined) {
      const from = now + fadeAtMs / 1000 - 0.25
      gain.gain.setValueAtTime(GAIN, from)
      gain.gain.linearRampToValueAtTime(0, from + 0.23)
    }
  })
  return true
}

/** The chime alone, if switched on (the switch plays it as a preview). */
export const playChime = () => chimeOn() && play('/audio/station-chime')

/**
 * The announcement for the page at `path`, if switched on. Returns how long
 * a page change should wait for it (ms), or 0 when nothing plays.
 */
export const playAnnouncement = (path: string) => {
  if (!chimeOn()) return 0
  const a = ANNOUNCE[cleanPath(path)]
  if (!a) return 0
  return play(announceBase(a), a.ms) ? a.ms : 0
}
