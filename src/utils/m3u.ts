import { Platform } from 'react-native';
import { Playlist, Track } from '../types/music';

export interface ParsedM3U {
  name: string;
  entries: string[];
}

/** Build an extended .m3u playlist from track metadata. */
export function buildM3U(playlist: Playlist, tracksById: Map<string, Track>): string {
  const lines = ['#EXTM3U'];
  for (const id of playlist.trackIds) {
    const t = tracksById.get(id);
    if (!t) continue;
    const dur = Math.max(-1, Math.round(t.duration ?? -1));
    lines.push(`#EXTINF:${dur},${t.artist || 'Unknown Artist'} - ${t.title || 'Unknown Title'}`);
    // Prefer absolute file path for local files so other players resolve it
    const target =
      t.isLocal && t.filePath && !t.filePath.startsWith('content://')
        ? t.filePath.replace(/^file:\/\//, '')
        : t.url;
    lines.push(target);
  }
  return lines.join('\n') + '\n';
}

/** Parse .m3u / .m3u8 content into raw entries (paths, urls, or titles). */
export function parseM3U(content: string, fallbackName: string): ParsedM3U {
  const entries: string[] = [];
  let title: string | null = null;
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) {
      const m = line.match(/^#PLAYLIST:(.+)$/i);
      if (m) title = m[1].trim();
      continue;
    }
    entries.push(line);
  }
  const base = fallbackName.replace(/\.(m3u8?)$/i, '');
  return { name: title || base || 'Imported Playlist', entries };
}

/** Resolve m3u entries to library tracks by exact path/URL, then filename, then title. */
export function resolveM3UEntries(entries: string[], allTracks: Track[]): Track[] {
  const byPath = new Map<string, Track>();
  const byFile = new Map<string, Track>();
  const byTitle = new Map<string, Track>();
  for (const t of allTracks) {
    const paths = [t.filePath, t.url].filter(Boolean) as string[];
    for (const p of paths) byPath.set(normPath(p), t);
    const fname = fileName(t.filePath || t.url || '').toLowerCase();
    if (fname && !byFile.has(fname)) byFile.set(fname, t);
    const key = `${t.artist} - ${t.title}`.toLowerCase();
    if (!byTitle.has(key)) byTitle.set(key, t);
    if (!byTitle.has(t.title.toLowerCase())) byTitle.set(t.title.toLowerCase(), t);
  }
  const out: Track[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    const direct = byPath.get(normPath(e));
    const f = byFile.get(fileName(e).toLowerCase());
    const t = byTitle.get(e.toLowerCase());
    const match = direct || f || t;
    if (match && !seen.has(match.id)) {
      seen.add(match.id);
      out.push(match);
    }
  }
  return out;
}

function normPath(p: string): string {
  let s = p.replace(/^file:\/\//, '');
  // m3u entries may be windows-style or uri-encoded
  try { s = decodeURIComponent(s); } catch {}
  return s.replace(/\\/g, '/').toLowerCase();
}

function fileName(p: string): string {
  const s = normPath(p);
  const i = s.lastIndexOf('/');
  return i === -1 ? s : s.slice(i + 1);
}

/** Export playlist via StorageAccessFramework (Android) or document directory fallback. */
export async function exportPlaylistM3U(
  playlist: Playlist,
  tracksById: Map<string, Track>
): Promise<string> {
  const FS = require('expo-file-system');
  const content = buildM3U(playlist, tracksById);
  const safeName = (playlist.name || 'playlist').replace(/[^\w\- ]+/g, '').trim() || 'playlist';
  const fileNameOut = `${safeName}.m3u`;

  if (Platform.OS === 'android' && FS.StorageAccessFramework) {
    const perm = await FS.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (perm.granted) {
      const uri = await FS.StorageAccessFramework.createFileAsync(
        perm.directoryUri,
        fileNameOut,
        'audio/x-mpegurl'
      );
      await FS.writeAsStringAsync(uri, content, {
        encoding: (FS.EncodingType?.UTF8 ?? 'utf8') as any,
      });
      return uri;
    }
  }
  const target = ((FS.documentDirectory ?? FS.cacheDirectory ?? '') as string) + fileNameOut;
  await FS.writeAsStringAsync(target, content, {
    encoding: (FS.EncodingType?.UTF8 ?? 'utf8') as any,
  });
  return target;
}

/** Pick an .m3u file and import it as a new playlist. Returns track count. */
export async function importM3UPlaylist(
  allTracks: Track[],
  createPlaylist: (name: string) => Promise<Playlist>,
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>
): Promise<{ name: string; matched: number; total: number }> {
  const Picker = require('expo-document-picker');
  const FS = require('expo-file-system');
  const res = await Picker.getDocumentAsync({
    type: ['audio/x-mpegurl', 'application/x-mpegurl', 'audio/mpegurl', '*/*'],
    copyToCacheDirectory: true,
  });
  if (res.canceled) throw new Error('cancelled');
  const asset = res.assets?.[0];
  if (!asset) throw new Error('No file selected');
  const content: string = await FS.readAsStringAsync(asset.uri, {
    encoding: (FS.EncodingType?.UTF8 ?? 'utf8') as any,
  });
  const parsed = parseM3U(content, asset.name || 'Imported');
  const matched = resolveM3UEntries(parsed.entries, allTracks);
  const pl = await createPlaylist(parsed.name);
  for (const t of matched) {
    await addToPlaylist(pl.id, t.id);
  }
  return { name: pl.name, matched: matched.length, total: parsed.entries.length };
}
