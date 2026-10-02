#!/usr/bin/env bash
# Cut the Start page name reel from the "4K TIMELAPSE MUMBAI" night skyline:
# the whole 30 s shot, made seamless by crossfading its last 1.5 s into its
# first 1.5 s, silent, 960 px, as VP9 WebM + H.264 MP4 (Safari), plus a
# poster frame.
#
#   tools/mumbai-reel.sh "path/to/4K TIMELAPSE MUMBAI.mp4"
set -euo pipefail
SRC="$1"
OUT="$(dirname "$0")/../public/video"
FADE=1.5
mkdir -p "$OUT"
LEN=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
BODY=$(awk -v l="$LEN" -v f="$FADE" 'BEGIN { printf "%.3f", l - f }')
OFFSET=$(awk -v b="$BODY" -v f="$FADE" 'BEGIN { printf "%.3f", b - f }')
# [a] = the shot from FADE to the end; [b] = its first FADE seconds, which
# fade in over [a]'s tail, so the last frame leads straight into the first.
FC="[0:v]trim=start=$FADE,setpts=PTS-STARTPTS,scale=960:-2:flags=lanczos,fps=25,format=yuv420p[a];\
[0:v]trim=end=$FADE,setpts=PTS-STARTPTS,scale=960:-2:flags=lanczos,fps=25,format=yuv420p[b];\
[a][b]xfade=transition=fade:duration=$FADE:offset=$OFFSET,format=yuv420p[v]"
ffmpeg -v error -y -i "$SRC" -filter_complex "$FC" -map "[v]" -an \
  -c:v libvpx-vp9 -b:v 0 -crf 42 -row-mt 1 -deadline good -cpu-used 2 "$OUT/mumbai-reel.webm"
ffmpeg -v error -y -i "$SRC" -filter_complex "$FC" -map "[v]" -an \
  -c:v libx264 -preset slow -crf 28 -profile:v high -movflags +faststart "$OUT/mumbai-reel.mp4"
ffmpeg -v error -y -ss 12 -i "$SRC" -frames:v 1 -vf "scale=960:-2" -q:v 6 "$OUT/mumbai-reel.jpg"
