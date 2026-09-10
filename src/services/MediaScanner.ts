import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
import { Track } from '../types/music';

const { AudioScanner } = NativeModules;

function safeRequireExpoMediaLibrary(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-media-library');
  } catch {
    return null;
  }
}

function guessFormat(path: string): string | undefined {
  const m = path.toLowerCase().match(/\.([a-z0-9]+)(\?|#|$)/);
  return m ? m[1] : undefined;
}

export async function requestMediaPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;

  try {
    const sdkInt =
      typeof Platform.Version === 'number'
        ? Platform.Version
        : parseInt(String(Platform.Version), 10) || 30;

    if (sdkInt >= 33) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
        'android.permission.POST_NOTIFICATIONS' as any,
      ]);

      const audioGranted =
        results[PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO] ===
        PermissionsAndroid.RESULTS.GRANTED;

      return audioGranted;
    } else {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);

      const storageGranted =
        results[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
        PermissionsAndroid.RESULTS.GRANTED;

      return storageGranted;
    }
  } catch (err) {
    console.warn('[Permissions] Request error:', err);
    return false;
  }
}

export async function scanDeviceAudioFiles(): Promise<Track[]> {
  if (Platform.OS === 'web') return [];

  try {
    const granted = await requestMediaPermissions();
    if (!granted) {
      console.warn('[MediaScanner] Storage/Audio permission not granted.');
      // Continue anyway as some devices allow MediaStore query
    }

    // 1. Try Native Android AudioScanner Module (Fastest & Most Complete)
    if (AudioScanner && typeof AudioScanner.scanAudioFiles === 'function') {
      try {
        const rawTracks: any[] = await AudioScanner.scanAudioFiles();
        if (Array.isArray(rawTracks) && rawTracks.length > 0) {
          const tracks: Track[] = rawTracks.map(t => ({
            id: String(t.id),
            url: t.url,
            title: t.title || 'Unknown Title',
            artist: t.artist || 'Unknown Artist',
            album: t.album || 'Device Audio',
            duration: typeof t.duration === 'number' ? Math.round(t.duration) : 0,
            isLocal: true,
            filePath: t.filePath || t.url,
            fileSize: t.fileSize,
            dateAdded: t.dateAdded || Date.now(),
            artwork: t.artwork || undefined,
            genre: t.genre && t.genre !== '<unknown>' ? t.genre : undefined,
            year: typeof t.year === 'number' && t.year > 0 ? t.year : undefined,
            trackNumber: typeof t.trackNumber === 'number' && t.trackNumber > 0 ? t.trackNumber : undefined,
            fileFormat: t.fileFormat || guessFormat(t.filePath || t.url || ''),
            mimeType: t.mimeType || undefined,
          }));

          console.log(`[MediaScanner] Native AudioScanner found ${tracks.length} tracks.`);
          return tracks;
        }
      } catch (e) {
        console.warn('[MediaScanner] Native AudioScanner scan error:', e);
      }
    }

    // 2. Fallback: expo-media-library (works in Expo Go / when native module missing)
    try {
      const ML = safeRequireExpoMediaLibrary();
      if (ML) {
        const perm = await ML.requestPermissionsAsync(false, ['audio'] as any).catch(() =>
          ML.requestPermissionsAsync()
        );
        const granted = (perm as any)?.granted ?? (perm as any)?.status === 'granted';
        if (granted || granted === undefined) {
          const assets = await ML.getAssetsAsync({
            mediaType: (ML.MediaType?.audio ?? 'audio') as any,
            first: 2000,
            sortBy: [(ML.SortBy?.creationTime ?? 'creationTime') as any],
          });
          const list = (assets?.assets ?? []) as any[];
          if (list.length > 0) {
            console.log(`[MediaScanner] expo-media-library fallback found ${list.length} assets.`);
            return list.map((a, i) => ({
              id: String(a.id ?? `ml-${i}`),
              url: a.uri,
              title: (a.filename?.replace(/\.[^.]+$/, '') || 'Unknown Title').replace(/_/g, ' '),
              artist: 'Unknown Artist',
              album: 'Device Audio',
              duration: Math.round(a.duration ?? 0),
              isLocal: true,
              filePath: a.uri,
              fileSize: a.fileSize,
              dateAdded: (a.creationTime ?? Date.now()),
              fileFormat: guessFormat(a.filename || a.uri || ''),
            }) as Track);
          }
        }
      }
    } catch (e) {
      console.warn('[MediaScanner] expo-media-library fallback error:', e);
    }

    return [];
  } catch (e) {
    console.warn('[MediaScanner] scanDeviceAudioFiles fatal error:', e);
    return [];
  }
}
