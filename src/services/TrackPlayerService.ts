export const PlaybackService = async function () {
  // Lazy-require so Expo Go / Web (where the native module is absent) never crashes on import.
  try {
    const tp = require('react-native-track-player');
    const TrackPlayer = tp?.default || tp;
    const { Event } = tp;
    if (!TrackPlayer || !Event) return;
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
    TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext().catch(() => {}));
    TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious().catch(() => {}));
    TrackPlayer.addEventListener(Event.RemoteSeek, (e: any) => TrackPlayer.seekTo(e.position));
    TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
    TrackPlayer.addEventListener(Event.RemoteDuck, async (e: any) => {
      try {
        if (e?.permanent) await TrackPlayer.stop();
        else if (e?.paused) await TrackPlayer.pause();
        else if (e?.permanent === false && !e?.paused) await TrackPlayer.play();
      } catch {}
    });
  } catch (e) {
    console.warn('[PlaybackService] unavailable:', e);
  }
};
