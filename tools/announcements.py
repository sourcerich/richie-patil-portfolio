# /// script
# requires-python = ">=3.11"
# dependencies = ["gTTS"]
# ///
"""Build the station announcements played on page changes.

Each one is the real Indian Railways chime followed by "पुढील स्थानक,
<page>" ("next station, <page>") in a Marathi station-announcer voice:

1. Pronunciation: Google's Marathi TTS (gTTS) says the phrase, so every
   word is pronounced correctly.
2. Voice: that speech was converted offline into the timbre of the Central
   Railway announcer heard in two CC-BY recordings of Kurla station
   ("Kurla local train station Mumbai (1)" and "(2)" by sankalp,
   freesound.org/s/180429 and /180430) with Seed-VC, keeping the words and
   timing. The chosen takes are committed as tools/audio/voice/<key>.wav;
   `--tts` regenerates plain gTTS voices instead (step 1 only).
3. Stitch: the voice gets a light platform-PA colour (band-limited, a short
   slap echo) and comes in as the chime's second strike rings out.

Writes public/audio/announce/<key>.webm (Opus) and .mp3 (Safari), plus
src/announcements.json with each file's length, which page-wipe.ts uses to
hold the cover while it plays.

    uv run tools/announcements.py [--tts]

Keep PAGES in step with `nav` in src/site.ts.
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIO = ROOT / 'tools' / 'audio'
CHIME = AUDIO / 'station-chime.wav'
VOICES = AUDIO / 'voice'
OUT = ROOT / 'public' / 'audio' / 'announce'
INDEX = ROOT / 'src' / 'announcements.json'

# The voice comes in while the second strike is still ringing (seconds).
VOICE_AT = 1.25
# Loudness of the voice (LUFS). The chime file sits around -18; the voice
# is pitched a few dB above it so the station name carries.
VOICE_LUFS = -14
PAGES = {
    '/': ('start', 'सुरुवात'),
    '/about': ('about', 'ओळख'),
    '/service': ('service', 'सर्विस'),
    '/work': ('work', 'काम'),
    '/contact': ('contact', 'संपर्क'),
}

# Trim silence, band-limit it like a platform speaker, add a faint slap off
# the station roof.
VOICE_FX = ','.join([
    'silenceremove=start_periods=1:start_threshold=-42dB',
    'areverse', 'silenceremove=start_periods=1:start_threshold=-42dB', 'areverse',
    'highpass=f=200', 'lowpass=f=5500',
    'acompressor=threshold=-20dB:ratio=3:attack=5:release=120',
    'aecho=0.85:0.6:45|95:0.16|0.08',
])


def run(*args: str) -> None:
    subprocess.run(['ffmpeg', '-v', 'error', '-y', *args], check=True)


def duration(path: Path) -> float:
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                          '-of', 'csv=p=0', str(path)], capture_output=True, text=True, check=True)
    return float(out.stdout)


def tts(name: str, path: Path) -> None:
    from gtts import gTTS
    gTTS(f'पुढील स्थानक, {name}.', lang='mr').save(str(path))


def build(key: str, name: str, tmp: Path, use_tts: bool) -> float:
    voice = VOICES / f'{key}.wav'
    if use_tts or not voice.exists():
        voice = tmp / f'{key}-tts.mp3'
        tts(name, voice)
    mixed = tmp / f'{key}.wav'
    delay = int(VOICE_AT * 1000)
    run('-i', str(CHIME), '-i', str(voice), '-filter_complex',
        # The voice is levelled on its own, louder than the chime, which
        # keeps the level it was cut at; a limiter catches the overlap.
        f'[1:a]aresample=44100,aformat=channel_layouts=mono,{VOICE_FX},'
        f'loudnorm=I={VOICE_LUFS}:TP=-1.5:LRA=11,aresample=44100,adelay={delay}[v];'
        '[0:a]aresample=44100,aformat=channel_layouts=mono[c];'
        '[c][v]amix=inputs=2:duration=longest:normalize=0,'
        'alimiter=limit=0.9:attack=5:release=60,areverse,afade=t=in:d=0.2,areverse[out]',
        '-map', '[out]', '-ar', '44100', str(mixed))
    OUT.mkdir(parents=True, exist_ok=True)
    run('-i', str(mixed), '-c:a', 'libopus', '-b:a', '48k', '-ac', '1', str(OUT / f'{key}.webm'))
    run('-i', str(mixed), '-c:a', 'libmp3lame', '-b:a', '64k', '-ac', '1', str(OUT / f'{key}.mp3'))
    return duration(mixed)


def main() -> None:
    use_tts = '--tts' in sys.argv
    index = {}
    with tempfile.TemporaryDirectory() as tmp:
        for path, (key, name) in PAGES.items():
            seconds = build(key, name, Path(tmp), use_tts)
            index[path] = {'key': key, 'ms': round(seconds * 1000)}
            print(f'{path:9} {key:8} {seconds:.2f}s')
    INDEX.write_text(json.dumps(index, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')


main()
