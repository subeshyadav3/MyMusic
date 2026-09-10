import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';

registerRootComponent(App);

if (Platform.OS !== 'web') {
  try {
    const tp = require('react-native-track-player');
    const TrackPlayer = tp?.default || tp;
    const { PlaybackService } = require('./src/services/TrackPlayerService');
    if (TrackPlayer && typeof TrackPlayer.registerPlaybackService === 'function') {
      TrackPlayer.registerPlaybackService(() => PlaybackService);
    }
  } catch (e) {
    console.warn('[MyMusic] TrackPlayer registration:', e);
  }
}
