export interface LyricLine {
  time: number;
  text: string;
}

const LRC_TAG = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;

export function parseLRC(content: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const raw of content.split(/\r?\n/)) {
    const tags = [...raw.matchAll(LRC_TAG)];
    if (tags.length === 0) continue;
    const text = raw.replace(LRC_TAG, '').trim();
    if (!text) continue;
    for (const m of tags) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const fracRaw = m[3] ?? '0';
      const frac = parseInt(fracRaw.padEnd(3, '0').slice(0, 3), 10) / 1000;
      lines.push({ time: min * 60 + sec + frac, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

export function activeLyricIndex(lines: LyricLine[], position: number): number {
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= position + 0.15) idx = i;
    else break;
  }
  return idx;
}

export function lrcPathForTrack(filePath?: string): string | null {
  if (!filePath) return null;
  const clean = filePath.replace(/^file:\/\//, '');
  const dot = clean.lastIndexOf('.');
  if (dot === -1) return null;
  return `${clean.slice(0, dot)}.lrc`;
}
