import { Platform } from 'react-native';
import { Track } from '../types/music';

let isPlayerInitialized = false;
let setupPromise: Promise<boolean> | null = null;
let webAudio: any = null;
let currentLoadedQueueHash: string = '';
// Whether a track/queue has actually been handed to the audio engine in this
// session. Used to distinguish "paused" from "restored metadata, nothing loaded".
let hasActiveTrack = false;

export const isTrackLoaded = (): boolean => {
  if (Platform.OS === 'web') return !!webAudio;
  return hasActiveTrack;
};

const queueHash = (tracks: Track[]): string => {
  if (tracks.length === 0) return 'empty';
  const first = tracks[0]?.id ?? '';
  const last = tracks[tracks.length - 1]?.id ?? '';
  let durSum = 0;
  for (let i = 0; i < tracks.length; i++) durSum += tracks[i].duration || 0;
  return `${tracks.length}:${first}:${last}:${durSum}`;
};

const getTrackPlayer = () => {
  if (Platform.OS === 'web') return null;
  try {
    const tp = require('react-native-track-player');
    return tp?.default || tp;
  } catch {
    return null;
  }
};

export const setupPlayer = async (): Promise<boolean> => {
  if (Platform.OS === 'web') return true;
  if (isPlayerInitialized) return true;
  if (setupPromise) return setupPromise;

  setupPromise = (async () => {
    const TrackPlayer = getTrackPlayer();
    if (!TrackPlayer) return false;
    try {
      const tp = require('react-native-track-player');
      const { AppKilledPlaybackBehavior, Capability } = tp;

      try {
        await TrackPlayer.setupPlayer({
          autoHandleInterruptions: true,
        });
      } catch (err: any) {
        console.log('[PlaybackManager] setupPlayer notice:', err?.message || err);
      }

      await TrackPlayer.updateOptions({
        android: {
          // Keep the foreground playback service alive when the user swipes the
          // app out of the recents/task switcher — music keeps playing (and the
          // notification stays) until the user explicitly pauses/stops it.
          appKilledPlaybackBehavior:
            AppKilledPlaybackBehavior?.ContinuePlayback ||
            'continue-playback',
        },
        progressUpdateEventInterval: 1,
        capabilities: [
          Capability?.SkipToPrevious ?? 3,
          Capability?.Play ?? 0,
          Capability?.Pause ?? 1,
          Capability?.SkipToNext ?? 2,
          Capability?.SeekTo ?? 4,
        ],
        compactCapabilities: [
          Capability?.SkipToPrevious ?? 3,
          Capability?.Play ?? 0,
          Capability?.Pause ?? 1,
          Capability?.SkipToNext ?? 2,
        ],
        notificationCapabilities: [
          Capability?.SkipToPrevious ?? 3,
          Capability?.Play ?? 0,
          Capability?.Pause ?? 1,
          Capability?.SkipToNext ?? 2,
          Capability?.SeekTo ?? 4,
        ],
        color: 0x7C3AED,
      });

      isPlayerInitialized = true;
      return true;
    } catch (e) {
      console.warn('[PlaybackManager] setupPlayer error:', e);
      return false;
    }
  })();

  const result = await setupPromise;
  if (!result) setupPromise = null;
  return result;
};

export const playAudio = async (
  tracks: Track[],
  startIndex: number = 0,
  onProgress?: (pos: number, dur: number) => void
  , initialPosition: number = 0,
  crossfadeSec: number = 0
): Promise<void> => {
  const track = tracks[startIndex] || tracks[0];
  if (!track) return;

  if (Platform.OS === 'web') {
    if (webAudio) {
      webAudio.pause();
      webAudio = null;
    }
    if (typeof window !== 'undefined') {
       webAudio = new window.Audio(track.url);
       hasActiveTrack = true;
       if (initialPosition > 0) webAudio.currentTime = initialPosition;
      if (onProgress) {
        webAudio.ontimeupdate = () =>
          onProgress(webAudio.currentTime, webAudio.duration || track.duration || 0);
      }
      webAudio.onended = () => {
        try {
          const { useMusicStore } = require('../store/useMusicStore');
          useMusicStore.getState().skipToNext();
        } catch {}
      };
      await webAudio.play().catch((e: any) => console.warn('Web audio play error:', e));
    }
    return;
  }

  const TrackPlayer = getTrackPlayer();
  if (TrackPlayer) {
    try {
      await setupPlayer();

      const sig = queueHash(tracks);
      const isSameQueue = sig === currentLoadedQueueHash;
      const fadeMs = Math.max(0, Math.min(5, crossfadeSec)) * 1000;

      if (isSameQueue) {
        // Instant skip without reloading the entire queue (preserve seek)
        if (fadeMs > 0) await rampVolume(1, 0.2, Math.min(fadeMs, 400)).catch(() => {});
        await TrackPlayer.skip(startIndex);
        if (initialPosition > 0) {
          try { await TrackPlayer.seekTo(initialPosition); } catch {}
        }
        await TrackPlayer.play();
        hasActiveTrack = true;
        if (fadeMs > 0) await rampVolume(0.2, 1, Math.min(fadeMs, 600)).catch(() => {});
        else await setVolumeNative(1).catch(() => {});
      } else {
        if (fadeMs > 0) await rampVolume(1, 0.2, Math.min(fadeMs, 400)).catch(() => {});
        else await setVolumeNative(1).catch(() => {});
        await TrackPlayer.reset();

        const payload = tracks.map((t, idx) => ({
          id: String(t.id || `track-${idx}`),
          url: t.url,
          title: t.title || 'Unknown Title',
          artist: t.artist || 'Unknown Artist',
          album: t.album || 'Unknown Album',
          artwork:
            t.artwork && (t.artwork.startsWith('http') || t.artwork.startsWith('file://') || t.artwork.startsWith('content://'))
              ? t.artwork
              : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
          duration: typeof t.duration === 'number' && t.duration > 0 ? t.duration : undefined,
        }));

        await TrackPlayer.add(payload);
        currentLoadedQueueHash = sig;

         if (startIndex > 0 && startIndex < payload.length) {
           await TrackPlayer.skip(startIndex, initialPosition);
         } else if (initialPosition > 0) {
           await TrackPlayer.seekTo(initialPosition);
        }

        await TrackPlayer.play();
        hasActiveTrack = true;
        if (fadeMs > 0) await rampVolume(0.2, 1, Math.min(fadeMs, 800)).catch(() => {});
        else await setVolumeNative(1).catch(() => {});
      }
    } catch (e) {
      console.warn('[PlaybackManager] Native playAudio error:', e);
    }
  }
};

export const pauseAudio = async () => {
  if (Platform.OS === 'web') {
    webAudio?.pause();
    return;
  }
  const TrackPlayer = getTrackPlayer();
  if (TrackPlayer) {
    try {
      await TrackPlayer.pause();
    } catch (e) {
      console.warn('[PlaybackManager] pause error:', e);
    }
  }
};

export const resumeAudio = async () => {
  if (Platform.OS === 'web') {
    await webAudio?.play().catch(() => {});
    return;
  }
  const TrackPlayer = getTrackPlayer();
  if (TrackPlayer) {
    try {
      await TrackPlayer.play();
    } catch (e) {
      console.warn('[PlaybackManager] resume error:', e);
    }
  }
};

export const seekAudio = async (seconds: number) => {
  if (Platform.OS === 'web') {
    if (webAudio) webAudio.currentTime = seconds;
    return;
  }
  const TrackPlayer = getTrackPlayer();
  if (TrackPlayer) {
    try {
      await TrackPlayer.seekTo(seconds);
    } catch (e) {
      console.warn('[PlaybackManager] seek error:', e);
    }
  }
};

export const setPlaybackRate = async (rate: number) => {
  if (Platform.OS === 'web') {
    if (webAudio) webAudio.playbackRate = rate;
    return;
  }
  const TrackPlayer = getTrackPlayer();
  if (TrackPlayer && typeof TrackPlayer.setRate === 'function') {
    try {
      await TrackPlayer.setRate(rate);
    } catch (e) {
      console.warn('[PlaybackManager] setPlaybackRate error:', e);
    }
  }
};

export const setVolumeNative = async (volume: number) => {
  const v = Math.max(0, Math.min(1, volume));
  if (Platform.OS === 'web') {
    if (webAudio) webAudio.volume = v;
    return;
  }
  const TrackPlayer = getTrackPlayer();
  if (TrackPlayer && typeof TrackPlayer.setVolume === 'function') {
    try { await TrackPlayer.setVolume(v); } catch {}
  }
};

/** Linear volume ramp over ms (used for crossfade + sleep fade-out). */
export const rampVolume = async (from: number, to: number, ms: number) => {
  const STEPS = 12;
  const stepMs = Math.max(30, Math.floor(ms / STEPS));
  for (let i = 1; i <= STEPS; i++) {
    const v = from + ((to - from) * i) / STEPS;
    await setVolumeNative(v);
    await new Promise(r => setTimeout(r, stepMs));
  }
};

export const setRepeatMode = async (mode: 'off' | 'track' | 'queue') => {
  if (Platform.OS === 'web') return;
  const TrackPlayer = getTrackPlayer();
  if (TrackPlayer) {
    try {
      const { RepeatMode } = require('react-native-track-player');
      const targetMode =
        mode === 'track'
          ? RepeatMode?.Track ?? 1
          : mode === 'queue'
          ? RepeatMode?.Queue ?? 2
          : RepeatMode?.Off ?? 0;
      await TrackPlayer.setRepeatMode(targetMode);
    } catch (e) {
      console.warn('[PlaybackManager] setRepeatMode error:', e);
    }
  }
};

const toNativeTrack = (t: Track, idx: number) => ({
  id: String(t.id || `track-${idx}`),
  url: t.url,
  title: t.title || 'Unknown Title',
  artist: t.artist || 'Unknown Artist',
  album: t.album || 'Unknown Album',
  artwork:
    t.artwork && (t.artwork.startsWith('http') || t.artwork.startsWith('file://') || t.artwork.startsWith('content://'))
      ? t.artwork
      : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
  duration: typeof t.duration === 'number' && t.duration > 0 ? t.duration : undefined,
});

export const nativeAppendTrack = async (track: Track) => {
  if (Platform.OS === 'web') return;
  const TrackPlayer = getTrackPlayer();
  if (!TrackPlayer) return;
  try {
    await setupPlayer();
    await TrackPlayer.add([toNativeTrack(track, Date.now() % 100000)]);
    currentLoadedQueueHash = '';
  } catch (e) {
    console.warn('[PlaybackManager] nativeAppendTrack error:', e);
  }
};

export const nativeRemoveAt = async (index: number) => {
  if (Platform.OS === 'web') return;
  const TrackPlayer = getTrackPlayer();
  if (!TrackPlayer) return;
  try {
    if (typeof TrackPlayer.remove === 'function') {
      await TrackPlayer.remove(index);
      currentLoadedQueueHash = '';
    }
  } catch (e) {
    console.warn('[PlaybackManager] nativeRemoveAt error:', e);
  }
};

export const nativePlayNext = async (track: Track, afterIndex: number) => {
  if (Platform.OS === 'web') return;
  const TrackPlayer = getTrackPlayer();
  if (!TrackPlayer) return;
  try {
    await setupPlayer();
    if (typeof TrackPlayer.add === 'function') {
      // react-native-track-player v4 supports insert position as 2nd arg
      await (TrackPlayer.add as any)([toNativeTrack(track, Date.now() % 100000)], afterIndex + 1);
      currentLoadedQueueHash = '';
    }
  } catch (e) {
    console.warn('[PlaybackManager] nativePlayNext error:', e);
  }
};

export const nativeMove = async (from: number, to: number) => {
  if (Platform.OS === 'web') return;
  const TrackPlayer = getTrackPlayer();
  if (!TrackPlayer || typeof (TrackPlayer as any).move !== 'function') return;
  try {
    await (TrackPlayer as any).move(from, to);
    currentLoadedQueueHash = '';
  } catch (e) {
    console.warn('[PlaybackManager] nativeMove error:', e);
  }
};

export const syncUpcomingTracks = async (upcomingTracks: Track[]) => {
  if (Platform.OS === 'web') return;
  const TrackPlayer = getTrackPlayer();
  if (!TrackPlayer) return;
  try {
    await setupPlayer();
    if (typeof TrackPlayer.removeUpcomingTracks === 'function') {
      await TrackPlayer.removeUpcomingTracks();
    }
    if (upcomingTracks.length > 0 && typeof TrackPlayer.add === 'function') {
      const payload = upcomingTracks.map((t, idx) => toNativeTrack(t, idx));
      await TrackPlayer.add(payload);
    }
    currentLoadedQueueHash = '';
  } catch (e) {
    console.warn('[PlaybackManager] syncUpcomingTracks error:', e);
  }
};
