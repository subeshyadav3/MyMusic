import React, { useEffect } from 'react';
import { StatusBar, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { MiniPlayer } from './src/components/player/MiniPlayer';
import { FullPlayerModal } from './src/components/player/FullPlayerModal';
import { QueueModal } from './src/components/player/QueueModal';
import { AddToPlaylistModal } from './src/components/music/AddToPlaylistModal';
import { SleepTimerModal } from './src/components/common/SleepTimerModal';
import { WelcomeModal } from './src/components/common/WelcomeModal';
import { useMusicStore } from './src/store/useMusicStore';
import { getThemeColors } from './src/constants/theme';
import { setupPlayer } from './src/services/PlaybackManager';

function ThemedRoot() {
  // Subscribe to theme settings so accent/AMOLED apply without restart
  const accentColor = useMusicStore(s => s.settings.accentColor);
  const themeMode = useMusicStore(s => s.settings.themeMode);
  const theme = getThemeColors(accentColor, themeMode);
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={theme.bg} />
        <RootNavigator />
        <MiniPlayer />
        <FullPlayerModal />
        <QueueModal />
        <AddToPlaylistModal />
        <SleepTimerModal />
        <WelcomeModal />
      </SafeAreaProvider>
    </View>
  );
}

export default function App() {
  const { initStore, setIsPlaying, setCurrentTrack, updatePlaybackProgress } = useMusicStore();

  useEffect(() => {
    // 1. Initialize store preferences & auto-scan local tracks
    initStore();

    let progressTimer: any = null;
    let subscriptions: Array<{ remove: () => void }> = [];

    // 2. Set up audio player & event listeners
    if (Platform.OS !== 'web') {
      setupPlayer().then(() => {
        try {
          const tp = require('react-native-track-player');
          const TrackPlayer = tp?.default || tp;
          const { Event, State } = tp;

          if (TrackPlayer && typeof TrackPlayer.addEventListener === 'function' && Event) {
            subscriptions.push(TrackPlayer.addEventListener(Event.PlaybackState, (event: any) => {
              if (event && event.state !== undefined) {
                const playing =
                  event.state === State?.Playing ||
                  event.state === 'playing' ||
                  event.state === 3;
                setIsPlaying(playing);
              }
            }));

            subscriptions.push(TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (event: any) => {
              const trackObj = event?.track;
              const trackIndex = event?.index;
              const store = useMusicStore.getState();

              if (typeof trackIndex === 'number') {
                useMusicStore.setState({ queueIndex: trackIndex, position: 0, duration: 0 });
              }
              if (trackObj?.id) {
                const match = store.allTracks.find(t => String(t.id) === String(trackObj.id));
                if (match) {
                  setCurrentTrack(match);
                }
              } else if (typeof trackIndex === 'number' && store.currentQueue[trackIndex]) {
                setCurrentTrack(store.currentQueue[trackIndex]);
              }
            }));

            subscriptions.push(TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event: any) => {
              if (event && typeof event.position === 'number') {
                updatePlaybackProgress(event.position, event.duration || 0);
              }
            }));

            subscriptions.push(TrackPlayer.addEventListener(Event.PlaybackQueueEnded, () => {
              setIsPlaying(false);
            }));

            // Audio focus / headphone-disconnect: auto-pause on duck/noisy route
            if (Event.RemoteDuck) {
              subscriptions.push(TrackPlayer.addEventListener(Event.RemoteDuck, (e: any) => {
                if (e?.paused || e?.permanent) {
                  try { TrackPlayer.pause(); } catch {}
                  useMusicStore.getState().setIsPlaying(false);
                }
              }));
            }

            // Native sleep timer broadcast listener
            const { DeviceEventEmitter } = require('react-native');
            const sleepSub = DeviceEventEmitter.addListener('onSleepTimerExpired', () => {
              useMusicStore.getState().setIsPlaying(false);
              useMusicStore.getState().setSleepTimer(null);
            });
            subscriptions.push(sleepSub);
          }

          // Active 500ms progress poller for seamless time updates
          progressTimer = setInterval(async () => {
            try {
              if (TrackPlayer && typeof TrackPlayer.getProgress === 'function') {
                const prog = await TrackPlayer.getProgress();
                if (prog && typeof prog.position === 'number') {
                  updatePlaybackProgress(prog.position, prog.duration || 0);
                }
              } else if (TrackPlayer && typeof TrackPlayer.getPosition === 'function') {
                const pos = await TrackPlayer.getPosition();
                const dur = await TrackPlayer.getDuration();
                if (typeof pos === 'number') {
                  updatePlaybackProgress(pos, dur || 0);
                }
              }
            } catch {}
          }, 500);
        } catch (e) {
          console.warn('[MyMusic] Native listener initialization error:', e);
        }
      }).catch(e => {
        console.warn('[MyMusic] setupPlayer initialization error:', e);
      });
    }

    return () => {
      if (progressTimer) clearInterval(progressTimer);
      subscriptions.forEach(subscription => subscription.remove());
    };
  }, []);

  return (
    <ThemedRoot />
  );
}
