import { create } from 'zustand';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Track, Album, Artist, Genre, Folder, Playlist, RepeatModeType } from '../types/music';
import { DEMO_TRACKS } from '../constants/demoTracks';
import { setupPlayer, playAudio, pauseAudio, resumeAudio, seekAudio, setRepeatMode, setPlaybackRate, nativeAppendTrack, nativeRemoveAt, nativePlayNext } from '../services/PlaybackManager';
import { scanDeviceAudioFiles } from '../services/MediaScanner';
import { updateGlobalTheme } from '../constants/colors';

const STORAGE_KEYS = {
  FAVORITES: '@mm_favorites',
  PLAYLISTS: '@mm_playlists',
  HISTORY: '@mm_history',
  PLAY_COUNTS: '@mm_playcounts',
  SETTINGS: '@mm_settings',
  USER_NAME: '@mm_username',
  LAST_TRACK: '@mm_lasttrack',
};

// Throttled playback-position persistence: progress ticks fire ~2x/sec,
// so only hit disk every 5s (or on track change / explicit save).
let lastPersistAt = 0;
let lastPersistTrackId: string | null = null;
let sleepTimeout: ReturnType<typeof setTimeout> | null = null;
let sleepFadeTimeout: ReturnType<typeof setTimeout> | null = null;
const PERSIST_THROTTLE_MS = 5000;

async function persistPlayback(trackId: string, position: number, force = false) {
  const now = Date.now();
  const trackChanged = trackId !== lastPersistTrackId;
  if (!force && !trackChanged && now - lastPersistAt < PERSIST_THROTTLE_MS) return;
  lastPersistAt = now;
  lastPersistTrackId = trackId;
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_TRACK, JSON.stringify({ trackId, position }));
  } catch {}
}

async function pushEqToNative(gains: number[], enabled: boolean) {
  try {
    const { NativeModules, Platform } = require('react-native');
    if (Platform.OS === 'web') return;
    const mod = NativeModules.AudioScanner;
    if (mod?.setEqualizer) {
      await mod.setEqualizer(enabled, gains);
    }
  } catch {}
}

type SavedPlayback = { trackId: string; position: number };

export const EQ_FREQS = [60, 230, 910, 3600, 14000];

export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0],
  'Bass Boost': [6, 4, 1, 0, 0],
  Rock: [4, 2, -1, 2, 4],
  Pop: [1, 3, 4, 3, 1],
  Jazz: [3, 2, 0, 2, 4],
  Electronic: [5, 3, 0, 2, 5],
  Vocal: [-1, 1, 4, 3, 1],
};

export interface AppSettings {
  autoResume: boolean;
  highQualityAudio: boolean;
  gaplessPlayback: boolean;
  shakeToSkip: boolean;
  trackHistory: boolean;
  themeMode: 'dark' | 'amoled' | 'system';
  accentColor: string;
  playbackSpeed: number;
  eqEnabled: boolean;
  eqPreset: string;
  eqGains: number[];
  crossfadeSec: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  autoResume: true,
  highQualityAudio: true,
  gaplessPlayback: true,
  shakeToSkip: false,
  trackHistory: true,
  themeMode: 'dark',
  accentColor: '#7C3AED',
  playbackSpeed: 1.0,
  eqEnabled: false,
  eqPreset: 'Flat',
  eqGains: [0, 0, 0, 0, 0],
  crossfadeSec: 0,
};

function buildLibrary(tracks: Track[]) {
  // Albums
  const albumMap = new Map<string, Album>();
  tracks.forEach(t => {
    const key = `${t.album || 'Unknown Album'}__${t.artist || 'Unknown Artist'}`;
    if (!albumMap.has(key)) {
      albumMap.set(key, {
        id: key,
        name: t.album || 'Unknown Album',
        artist: t.artist || 'Unknown Artist',
        artwork: t.artwork,
        year: t.year,
        trackIds: [],
      });
    }
    albumMap.get(key)!.trackIds.push(t.id);
  });

  // Artists
  const artistMap = new Map<string, Artist>();
  tracks.forEach(t => {
    const key = t.artist || 'Unknown Artist';
    if (!artistMap.has(key)) {
      artistMap.set(key, { id: key, name: key, trackIds: [], albumIds: [] });
    }
    const artist = artistMap.get(key)!;
    artist.trackIds.push(t.id);
    const albumKey = `${t.album || 'Unknown Album'}__${key}`;
    if (!artist.albumIds.includes(albumKey)) artist.albumIds.push(albumKey);
  });

  // Genres
  const genreMap = new Map<string, Genre>();
  tracks.forEach(t => {
    const key = t.genre || 'Unknown Genre';
    if (!genreMap.has(key)) genreMap.set(key, { id: key, name: key, trackIds: [] });
    genreMap.get(key)!.trackIds.push(t.id);
  });

  // Folders (with parent -> children links)
  const folderMap = new Map<string, Folder>();
  tracks.forEach(t => {
    if (!t.filePath) return;
    const parts = t.filePath.split('/');
    const folderPath = parts.slice(0, -1).join('/');
    const folderName = parts[parts.length - 2] || folderPath;
    if (!folderMap.has(folderPath)) {
      folderMap.set(folderPath, { path: folderPath, name: folderName, trackIds: [], subfolders: [] });
    }
    folderMap.get(folderPath)!.trackIds.push(t.id);
  });
  // Link subfolders: /A is parent of /A/B
  folderMap.forEach((folder, path) => {
    const parentPath = path.split('/').slice(0, -1).join('/');
    const parent = folderMap.get(parentPath);
    if (parent && !parent.subfolders.includes(path)) parent.subfolders.push(path);
  });

  return {
    albums: Array.from(albumMap.values()),
    artists: Array.from(artistMap.values()),
    genres: Array.from(genreMap.values()),
    folders: Array.from(folderMap.values()),
  };
}

interface MusicStore {
  // User Profile & Settings
  userName: string;
  settings: AppSettings;
  setUserName: (name: string) => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  setEqBand: (index: number, gain: number) => Promise<void>;
  setEqPreset: (name: string) => Promise<void>;

  // Library
  allTracks: Track[];
  albums: Album[];
  artists: Artist[];
  genres: Genre[];
  folders: Folder[];
  isScanning: boolean;
  scanProgress: number;

  // Playback
  currentTrack: Track | null;
  currentQueue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  shuffleMode: boolean;
  repeatMode: RepeatModeType;

  // User data
  favorites: string[];
  playlists: Playlist[];
  history: { trackId: string; playedAt: number }[];
  playCounts: Record<string, number>;

  // UI
  isFullPlayerVisible: boolean;
  isAddToPlaylistVisible: boolean;
  isQueueVisible: boolean;
  isSleepTimerVisible: boolean;
  trackForPlaylist: Track | null;
  tracksForPlaylist: Track[];
  sleepTimerEnd: number | null;

  // Actions
  initStore: () => Promise<void>;
  scanLocalTracks: () => Promise<void>;
  playTrack: (track: Track, queue?: Track[]) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  seekTo: (sec: number) => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeat: () => Promise<void>;
  toggleFavorite: (trackId: string) => Promise<void>;
  isFavorite: (trackId: string) => boolean;
  createPlaylist: (name: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  addToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  moveInQueue: (from: number, to: number) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  setSleepTimer: (minutes: number | null) => void;
  clearHistory: () => Promise<void>;
  setFullPlayerVisible: (v: boolean) => void;
  setAddToPlaylistVisible: (v: boolean, tracks?: Track | Track[] | null) => void;
  setQueueVisible: (v: boolean) => void;
  setSleepTimerVisible: (v: boolean) => void;
  setIsPlaying: (v: boolean) => void;
  deleteTrack: (trackId: string, deleteFromDevice: boolean) => Promise<boolean>;
  bulkDeleteTracks: (trackIds: string[], deleteFromDevice: boolean) => Promise<boolean>;
  bulkAddToPlaylist: (playlistId: string, trackIds: string[]) => Promise<void>;
  setCurrentTrack: (track: Track | null) => void;
  isWelcomeVisible: boolean;
  setWelcomeVisible: (v: boolean) => void;
  updatePlaybackProgress: (pos: number, dur: number) => void;
}

export const useMusicStore = create<MusicStore>((set, get) => ({
  userName: 'Subesh',
  settings: DEFAULT_SETTINGS,

  allTracks: DEMO_TRACKS,
  albums: [],
  artists: [],
  genres: [],
  folders: [],
  isScanning: false,
  scanProgress: 0,
  currentTrack: null,
  currentQueue: DEMO_TRACKS,
  queueIndex: 0,
  isPlaying: false,
  position: 0,
  duration: 0,
  shuffleMode: false,
  repeatMode: 'off',
  favorites: [],
  playlists: [
    { id: 'pl-default-1', name: 'Chill Vibes', createdAt: Date.now(), updatedAt: Date.now(), trackIds: ['demo-1','demo-3','demo-5'] },
    { id: 'pl-default-2', name: 'Workout Power', createdAt: Date.now(), updatedAt: Date.now(), trackIds: ['demo-2','demo-4'] },
  ],
  history: [],
  playCounts: {},
  isFullPlayerVisible: false,
  isAddToPlaylistVisible: false,
  isQueueVisible: false,
  isSleepTimerVisible: false,
  trackForPlaylist: null,
  tracksForPlaylist: [],
  sleepTimerEnd: null,
  isWelcomeVisible: false,

  setUserName: async (name: string) => {
    const trimmed = name.trim() || 'Subesh';
    set({ userName: trimmed });
    await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, trimmed);
  },

  setWelcomeVisible: (v: boolean) => set({ isWelcomeVisible: v }),

  updateSettings: async (partial: Partial<AppSettings>) => {
    const updated = { ...get().settings, ...partial };
    set({ settings: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));

    updateGlobalTheme(updated.accentColor, updated.themeMode);

    if (partial.playbackSpeed !== undefined) {
      setPlaybackRate(partial.playbackSpeed).catch(() => {});
    }
    if (
      partial.eqGains !== undefined ||
      partial.eqEnabled !== undefined ||
      partial.eqPreset !== undefined
    ) {
      pushEqToNative(updated.eqGains, updated.eqEnabled).catch(() => {});
    }
  },

  setEqBand: async (index: number, gain: number) => {
    const gains = [...get().settings.eqGains];
    gains[index] = Math.max(-10, Math.min(10, gain));
    await get().updateSettings({ eqGains: gains, eqPreset: 'Custom', eqEnabled: true });
  },

  setEqPreset: async (name: string) => {
    const gains = [...(EQ_PRESETS[name] ?? EQ_PRESETS.Flat)];
    await get().updateSettings({ eqPreset: name, eqGains: gains, eqEnabled: name !== 'Flat' ? get().settings.eqEnabled : false });
  },

  initStore: async () => {
    try {
      await setupPlayer();
      const initialLib = buildLibrary(DEMO_TRACKS);
      set(initialLib);

       const [favs, playlists, history, counts, savedName, savedSettings, savedPlayback] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
        AsyncStorage.getItem(STORAGE_KEYS.PLAYLISTS),
        AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.PLAY_COUNTS),
        AsyncStorage.getItem(STORAGE_KEYS.USER_NAME),
         AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
         AsyncStorage.getItem(STORAGE_KEYS.LAST_TRACK),
       ]);
      if (favs) set({ favorites: JSON.parse(favs) });
      if (playlists) set({ playlists: JSON.parse(playlists) });
      if (history) set({ history: JSON.parse(history) });
      if (counts) set({ playCounts: JSON.parse(counts) });
      if (savedName) {
        set({ userName: savedName });
      } else {
        set({ isWelcomeVisible: true });
      }
       if (savedSettings) {
        const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
        // Guard arrays from corrupted storage
        if (!Array.isArray(parsed.eqGains) || parsed.eqGains.length !== 5) {
          parsed.eqGains = [...DEFAULT_SETTINGS.eqGains];
        }
        set({ settings: parsed });
         updateGlobalTheme(parsed.accentColor, parsed.themeMode);
         pushEqToNative(parsed.eqGains, parsed.eqEnabled).catch(() => {});
       }

       if (savedPlayback) {
         try {
           const parsed = JSON.parse(savedPlayback) as SavedPlayback;
           const track = get().allTracks.find(t => t.id === parsed.trackId);
           if (track && get().settings.autoResume) {
             set({ currentTrack: track, position: Math.max(0, parsed.position || 0), duration: track.duration || 0 });
           }
         } catch {
           await AsyncStorage.removeItem(STORAGE_KEYS.LAST_TRACK);
         }
       }

      // Automatically scan device audio on startup
      get().scanLocalTracks().catch(() => {});
    } catch (e) {
      console.warn('initStore:', e);
    }
  },

  scanLocalTracks: async () => {
    set({ isScanning: true, scanProgress: 0 });
    try {
      const local = await scanDeviceAudioFiles();
      if (local.length === 0) {
        // Keep existing library (demo) — don't wipe queue/playback
        const lib = buildLibrary(get().allTracks.length > 0 ? get().allTracks : DEMO_TRACKS);
        set({ ...lib });
        return;
      }
      const lib = buildLibrary(local);
      const prev = get();
      const stillExists = prev.currentTrack ? local.some(t => t.id === prev.currentTrack!.id) : false;
      // Prune playlists/favorites/history to existing ids so UI never points at ghosts
      const validIds = new Set(local.map(t => t.id));
      const playlists = prev.playlists
        .map(p => ({ ...p, trackIds: p.trackIds.filter(id => validIds.has(id)) }))
        .filter(p => !p.id.startsWith('pl-default') || p.trackIds.length > 0);
      set({
        allTracks: local,
        ...lib,
        playlists,
        favorites: prev.favorites.filter(id => validIds.has(id)),
        history: prev.history.filter(h => validIds.has(h.trackId)),
        currentTrack: stillExists ? prev.currentTrack : null,
        currentQueue: prev.currentQueue.length > 0 && prev.currentTrack ? prev.currentQueue : local,
        queueIndex: stillExists ? prev.queueIndex : 0,
      });
    } catch (e) {
      console.warn('scan:', e);
    } finally {
      set({ isScanning: false, scanProgress: 100 });
    }
  },

  playTrack: async (track, queue) => {
    const q = queue || get().allTracks;
    const idx = Math.max(0, q.findIndex(t => t.id === track.id));
    const saved = get().settings.autoResume ? await AsyncStorage.getItem(STORAGE_KEYS.LAST_TRACK) : null;
    let startPosition = 0;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SavedPlayback;
        if (parsed.trackId === track.id) startPosition = Math.max(0, parsed.position || 0);
      } catch {}
    }
    set({ currentTrack: track, currentQueue: q, queueIndex: idx, isPlaying: true, position: startPosition, duration: track.duration || 0 });
    if (get().settings.autoResume) persistPlayback(track.id, startPosition, true).catch(() => {});
    // Update history
    if (get().settings.trackHistory) {
      const history = [{ trackId: track.id, playedAt: Date.now() }, ...get().history.filter(h => h.trackId !== track.id)].slice(0, 100);
      const playCounts = { ...get().playCounts, [track.id]: (get().playCounts[track.id] || 0) + 1 };
      set({ history, playCounts });
      AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history)).catch(() => {});
      AsyncStorage.setItem(STORAGE_KEYS.PLAY_COUNTS, JSON.stringify(playCounts)).catch(() => {});
    }
     await playAudio(q, idx, (pos, dur) => get().updatePlaybackProgress(pos, dur), startPosition, get().settings.crossfadeSec);
  },

  togglePlayPause: async () => {
    const { isPlaying, currentTrack, currentQueue, position } = get();
    if (!currentTrack && currentQueue.length > 0) { await get().playTrack(currentQueue[0], currentQueue); return; }
    if (isPlaying) {
      await pauseAudio(); set({ isPlaying: false });
      if (currentTrack && get().settings.autoResume) persistPlayback(currentTrack.id, position, true).catch(() => {});
    }
    else { await resumeAudio(); set({ isPlaying: true }); }
  },

  skipToNext: async () => {
    const { currentQueue, queueIndex, shuffleMode, repeatMode, currentTrack } = get();
    if (!currentQueue.length) return;
    if (repeatMode === 'track' && currentTrack) {
      await seekAudio(0); set({ position: 0 });
      return;
    }
    let next = shuffleMode ? Math.floor(Math.random() * currentQueue.length) : (queueIndex + 1);
    if (shuffleMode && currentQueue.length > 1) {
      let guard = 0;
      while (next === queueIndex && guard++ < 5) next = Math.floor(Math.random() * currentQueue.length);
    }
    if (next >= currentQueue.length) { if (repeatMode === 'queue') next = 0; else return; }
    await get().playTrack(currentQueue[next], currentQueue);
  },

  skipToPrevious: async () => {
    const { currentQueue, queueIndex, position } = get();
    if (!currentQueue.length) return;
    if (position > 3) { await seekAudio(0); set({ position: 0 }); return; }
    const prev = Math.max(0, queueIndex - 1);
    await get().playTrack(currentQueue[prev], currentQueue);
  },

   seekTo: async (sec) => {
     const safeSec = Math.max(0, sec);
     await seekAudio(safeSec);
     set({ position: safeSec });
     const track = get().currentTrack;
     if (track && get().settings.autoResume) {
       await persistPlayback(track.id, safeSec, true);
     }
   },

  toggleShuffle: () => set(s => ({ shuffleMode: !s.shuffleMode })),

  cycleRepeat: async () => {
    const { repeatMode } = get();
    const next: RepeatModeType = repeatMode === 'off' ? 'queue' : repeatMode === 'queue' ? 'track' : 'off';
    set({ repeatMode: next });
    await setRepeatMode(next);
  },

  toggleFavorite: async (trackId) => {
    const favs = get().favorites;
    const updated = favs.includes(trackId) ? favs.filter(id => id !== trackId) : [...favs, trackId];
    set({ favorites: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
  },

  isFavorite: (trackId) => get().favorites.includes(trackId),

  createPlaylist: async (name) => {
    const pl: Playlist = { id: `pl-${Date.now()}`, name: name.trim(), createdAt: Date.now(), updatedAt: Date.now(), trackIds: [] };
    const updated = [pl, ...get().playlists];
    set({ playlists: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
    return pl;
  },

  deletePlaylist: async (id) => {
    const updated = get().playlists.filter(p => p.id !== id);
    set({ playlists: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
  },

  renamePlaylist: async (id, name) => {
    const updated = get().playlists.map(p => p.id === id ? { ...p, name: name.trim(), updatedAt: Date.now() } : p);
    set({ playlists: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
  },

  addToPlaylist: async (playlistId, trackId) => {
    const updated = get().playlists.map(p =>
      p.id === playlistId && !p.trackIds.includes(trackId) ? { ...p, trackIds: [...p.trackIds, trackId], updatedAt: Date.now() } : p
    );
    set({ playlists: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
  },

  removeFromPlaylist: async (playlistId, trackId) => {
    const updated = get().playlists.map(p =>
      p.id === playlistId ? { ...p, trackIds: p.trackIds.filter(id => id !== trackId), updatedAt: Date.now() } : p
    );
    set({ playlists: updated });
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updated));
  },

  addToQueue: (track) => {
    const q = [...get().currentQueue, track];
    set({ currentQueue: q });
    nativeAppendTrack(track).catch(() => {});
  },

  playNext: (track: Track) => {
    const { currentQueue, queueIndex } = get();
    const q = [...currentQueue.slice(0, queueIndex + 1), track, ...currentQueue.slice(queueIndex + 1)];
    set({ currentQueue: q });
    nativePlayNext(track, queueIndex).catch(() => {});
  },

  moveInQueue: (from: number, to: number) => {
    const q = [...get().currentQueue];
    if (from < 0 || to < 0 || from >= q.length || to >= q.length) return;
    const [item] = q.splice(from, 1);
    q.splice(to, 0, item);
    const curId = get().currentTrack?.id;
    const newIdx = curId ? q.findIndex(t => t.id === curId) : get().queueIndex;
    set({ currentQueue: q, queueIndex: Math.max(0, newIdx) });
  },

  removeFromQueue: (index) => {
    const { currentQueue, queueIndex } = get();
    const q = currentQueue.filter((_, i) => i !== index);
    let nextIdx = queueIndex;
    if (index < queueIndex) nextIdx = Math.max(0, queueIndex - 1);
    else if (index === queueIndex) nextIdx = Math.min(queueIndex, Math.max(0, q.length - 1));
    set({ currentQueue: q, queueIndex: nextIdx });
    nativeRemoveAt(index).catch(() => {});
  },

  clearQueue: () => set({ currentQueue: [], queueIndex: 0 }),

  setSleepTimer: (minutes) => {
    // Clear any previous JS fallback timers
    if (sleepTimeout) { clearTimeout(sleepTimeout); sleepTimeout = null; }
    if (sleepFadeTimeout) { clearTimeout(sleepFadeTimeout); sleepFadeTimeout = null; }
    if (minutes && minutes > 0) {
      const end = Date.now() + minutes * 60 * 1000;
      set({ sleepTimerEnd: end });
      try {
        const { NativeModules, Platform } = require('react-native');
        if (Platform.OS !== 'web' && NativeModules.AudioScanner?.setSleepTimer) {
          NativeModules.AudioScanner.setSleepTimer(minutes);
        }
      } catch (e) {
        console.warn('Native setSleepTimer error:', e);
      }
      // JS fallback with 15s fade-out (3s for timers under 1 min).
      const ms = Math.max(1000, minutes * 60 * 1000);
      const fadeMs = ms > 60000 ? 15000 : 3000;
      if (ms > fadeMs + 1000) {
        sleepFadeTimeout = setTimeout(() => {
          import('../services/PlaybackManager').then(m => m.rampVolume(1, 0, fadeMs).catch(() => {}));
          sleepFadeTimeout = null;
        }, ms - fadeMs) as unknown as ReturnType<typeof setTimeout>;
      }
      sleepTimeout = setTimeout(() => {
        pauseAudio().catch(() => {});
        import('../services/PlaybackManager').then(m => m.setVolumeNative(1).catch(() => {}));
        set({ isPlaying: false, sleepTimerEnd: null });
        sleepTimeout = null;
      }, ms) as unknown as ReturnType<typeof setTimeout>;
    } else {
      set({ sleepTimerEnd: null });
      try {
        const { NativeModules, Platform } = require('react-native');
        if (Platform.OS !== 'web' && NativeModules.AudioScanner?.cancelSleepTimer) {
          NativeModules.AudioScanner.cancelSleepTimer();
        }
      } catch (e) {
        console.warn('Native cancelSleepTimer error:', e);
      }
    }
  },

  clearHistory: async () => {
    set({ history: [], playCounts: {} });
    await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
    await AsyncStorage.removeItem(STORAGE_KEYS.PLAY_COUNTS);
  },

  deleteTrack: async (trackId: string, deleteFromDevice: boolean) => {
    const state = get();
    const trackToDelete = state.allTracks.find(t => t.id === trackId);
    if (!trackToDelete) return false;

    // If currently playing, skip or stop
    if (state.currentTrack?.id === trackId) {
      if (state.currentQueue.length > 1) {
        await state.skipToNext();
      } else {
        await pauseAudio().catch(() => {});
        set({ isPlaying: false, currentTrack: null, position: 0 });
      }
    }

    // Delete from device storage if requested
    if (deleteFromDevice && trackToDelete.filePath && Platform.OS !== 'web') {
      try {
        const FS = require('expo-file-system');
        const uri = trackToDelete.filePath.startsWith('file://')
          ? trackToDelete.filePath
          : 'file://' + trackToDelete.filePath;
        await FS.deleteAsync(uri, { idempotent: true }).catch(() => {});
      } catch (e) {
        console.warn('[deleteTrack] FileSystem delete error:', e);
      }

      try {
        const MediaLibrary = require('expo-media-library');
        await MediaLibrary.deleteAssetsAsync([trackToDelete.id]).catch(() => {});
      } catch {}
    }

    // Filter out from library collections
    const updatedTracks = state.allTracks.filter(t => t.id !== trackId);
    const updatedQueue = state.currentQueue.filter(t => t.id !== trackId);
    const updatedFavs = state.favorites.filter(id => id !== trackId);
    const updatedHistory = state.history.filter(h => h.trackId !== trackId);
    const updatedPlaylists = state.playlists.map(pl => ({
      ...pl,
      trackIds: pl.trackIds.filter(id => id !== trackId),
    }));

    const lib = buildLibrary(updatedTracks);

    set({
      allTracks: updatedTracks,
      ...lib,
      currentQueue: updatedQueue,
      favorites: updatedFavs,
      history: updatedHistory,
      playlists: updatedPlaylists,
    });

    try {
      const { ToastAndroid } = require('react-native');
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          deleteFromDevice ? 'Track deleted from device storage' : 'Track removed from app',
          ToastAndroid.SHORT
        );
      }
    } catch {}

    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavs)).catch(() => {});
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updatedPlaylists)).catch(() => {});
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory)).catch(() => {});

    return true;
  },

  bulkDeleteTracks: async (trackIds: string[], deleteFromDevice: boolean) => {
    const state = get();
    const idSet = new Set(trackIds);
    const tracksToDelete = state.allTracks.filter(t => idSet.has(t.id));
    if (tracksToDelete.length === 0) return false;

    // If currently playing track is in delete list
    if (state.currentTrack && idSet.has(state.currentTrack.id)) {
      const nextRemaining = state.currentQueue.find(t => !idSet.has(t.id));
      if (nextRemaining) {
        await state.playTrack(nextRemaining);
      } else {
        await pauseAudio().catch(() => {});
        set({ isPlaying: false, currentTrack: null, position: 0 });
      }
    }

    // Delete from filesystem if requested
    if (deleteFromDevice && Platform.OS !== 'web') {
      try {
        const FS = require('expo-file-system');
        for (const t of tracksToDelete) {
          if (t.filePath) {
            const uri = t.filePath.startsWith('file://') ? t.filePath : 'file://' + t.filePath;
            await FS.deleteAsync(uri, { idempotent: true }).catch(() => {});
          }
        }
      } catch (e) {
        console.warn('[bulkDeleteTracks] FileSystem error:', e);
      }

      try {
        const MediaLibrary = require('expo-media-library');
        await MediaLibrary.deleteAssetsAsync(tracksToDelete.map(t => t.id)).catch(() => {});
      } catch {}
    }

    const updatedTracks = state.allTracks.filter(t => !idSet.has(t.id));
    const updatedQueue = state.currentQueue.filter(t => !idSet.has(t.id));
    const updatedFavs = state.favorites.filter(id => !idSet.has(id));
    const updatedHistory = state.history.filter(h => !idSet.has(h.trackId));
    const updatedPlaylists = state.playlists.map(pl => ({
      ...pl,
      trackIds: pl.trackIds.filter(id => !idSet.has(id)),
    }));

    const lib = buildLibrary(updatedTracks);

    set({
      allTracks: updatedTracks,
      ...lib,
      currentQueue: updatedQueue,
      favorites: updatedFavs,
      history: updatedHistory,
      playlists: updatedPlaylists,
    });

    try {
      const { ToastAndroid } = require('react-native');
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          deleteFromDevice
            ? `Deleted ${tracksToDelete.length} songs from storage`
            : `Removed ${tracksToDelete.length} songs from library`,
          ToastAndroid.SHORT
        );
      }
    } catch {}

    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updatedFavs)).catch(() => {});
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(updatedPlaylists)).catch(() => {});
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updatedHistory)).catch(() => {});

    return true;
  },

  bulkAddToPlaylist: async (playlistId: string, trackIds: string[]) => {
    const state = get();
    const pl = state.playlists.find(p => p.id === playlistId);
    if (!pl) return;
    const existing = new Set(pl.trackIds);
    const toAdd = trackIds.filter(id => !existing.has(id));
    const updated = {
      ...pl,
      trackIds: [...pl.trackIds, ...toAdd],
      updatedAt: Date.now(),
    };
    const playlists = state.playlists.map(p => p.id === playlistId ? updated : p);
    set({ playlists });
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(playlists));
    try {
      const { ToastAndroid } = require('react-native');
      if (Platform.OS === 'android') {
        ToastAndroid.show(`Added ${toAdd.length} songs to ${pl.name}`, ToastAndroid.SHORT);
      }
    } catch {}
  },

  setFullPlayerVisible: (v) => set({ isFullPlayerVisible: v }),
  setAddToPlaylistVisible: (v, tracks = null) => {
    const list: Track[] = Array.isArray(tracks)
      ? tracks
      : tracks
      ? [tracks]
      : [];
    set({
      isAddToPlaylistVisible: v,
      trackForPlaylist: list[0] || null,
      tracksForPlaylist: list,
    });
  },
  setQueueVisible: (v) => set({ isQueueVisible: v }),
  setSleepTimerVisible: (v) => set({ isSleepTimerVisible: v }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setCurrentTrack: (track: Track | null) => set({ currentTrack: track }),
  updatePlaybackProgress: (pos, dur) => {
    const track = get().currentTrack;
    set({ position: pos, duration: dur > 0 ? dur : get().duration });
    if (track && get().settings.autoResume && Number.isFinite(pos)) {
      persistPlayback(track.id, pos).catch(() => {});
    }
  },
}));
