# MyMusic 🎵

> A modern, high-performance, offline-first music player for Android built with React Native, Expo SDK 57, TypeScript, and Zustand.

[![Platform](https://img.shields.io/badge/Platform-Android-green.svg?style=flat-square&logo=android)](https://www.android.com/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-000020.svg?style=flat-square&logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB.svg?style=flat-square&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## 🌟 Overview

**MyMusic** is an elegant, full-featured offline music player engineered for seamless audio playback on Android devices. Designed with a sleek modern aesthetic, smooth vinyl animations, and deep audio customization, MyMusic brings a desktop-grade listening experience directly to your mobile device — without ads, subscriptions, or telemetry.

---

## ✨ Features

### 🎧 Core Playback
- **Lock Screen & Media Notification Controls**: Native Android notification scrubber with album artwork, play/pause, skip forwards/backwards, and audio focus handling powered by `react-native-track-player`.
- **Persistent Mini-Player**: Floating player bar with real-time playback progress, quick gestures, and single-tap expansion to full screen.
- **Full Player Experience**: Rotating vinyl disc artwork, seekable slider scrubber, track duration, favorite toggle, and loop/shuffle controls.
- **Queue Management**: Dynamic playback queue supporting on-the-fly reordering, track removal, clear queue, and queue shuffling.
- **Playback Speed**: Fine-grained playback rate controls (0.75x, 1.0x, 1.25x, 1.5x, 2.0x).

### 📁 Library & Media Discovery
- **Local Audio Scanner**: Automatic device scanning using `expo-media-library` for `.mp3`, `.m4a`, `.flac`, `.wav`, and `.aac` files.
- **Smart Categorization**: Browse your music collection organized by **Tracks**, **Albums**, **Artists**, **Folders**, and **Playlists**.
- **M3U Playlist Import & Export**: Import standard `.m3u` / `.m3u8` playlists from storage or export custom in-app playlists.
- **Favorites & Liked Songs**: Instant one-tap bookmarking persisted locally with AsyncStorage.
- **Demo Tracks**: Built-in royalty-free fallback tracks for immediate out-of-the-box testing.

### 🎛️ Audio Customization & Tools
- **Built-in Equalizer (EQ)**: Multi-band equalizer with fine-tuning sliders.
- **EQ Presets**: Instant acoustic modes including *Flat*, *Bass Boost*, *Rock*, *Pop*, *Classical*, *Vocal Boost*, *Electronic*, and *Acoustic*.
- **Synced & Unsynced Lyrics**: Dedicated lyrics overlay supporting `.lrc` timestamped lyrics and plain text formats.
- **Sleep Timer**: Configurable countdown timer (15 min to custom durations) with optional smooth volume fade-out.

### 🎨 Themes & Personalization
- **Theme Modes**: Dark, OLED Pure Black, Midnight Blue, and Light themes.
- **Custom Accent Colors**: Choose your signature color from *Purple*, *Neon Blue*, *Emerald*, *Sunset Orange*, and *Hot Pink*.
- **Edge-to-Edge UI**: Designed with safe-area insets, fluid swipe navigation, and crisp Lucide icons.

### 🔒 Privacy & Performance
- **100% Offline & Private**: Zero data collection, analytics, or background telemetry. Your files remain on your device.
- **Lightweight State Management**: Reactive, memory-efficient state updates using **Zustand**.

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Framework** | [React Native](https://reactnative.dev/) (v0.86) & [Expo](https://expo.dev/) (SDK 57) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) with AsyncStorage persistence |
| **Audio Engine** | [react-native-track-player](https://github.com/doublesymmetry/react-native-track-player) |
| **Media Scanning** | [expo-media-library](https://docs.expo.dev/versions/latest/sdk/media-library/) |
| **Icons** | [lucide-react-native](https://lucide.dev/) |
| **Navigation** | [React Navigation v7](https://reactnavigation.org/) (Native Stack & Bottom Tabs) |

---

## 📁 Project Structure

```
MyMusic/
├── assets/                  # App icons, splash screens, and demo assets
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI (EmptyState, SectionHeader, SleepTimerModal, WelcomeModal)
│   │   ├── music/           # TrackItem, AlbumCard, TrackArtwork, AddToPlaylistModal
│   │   ├── navigation/      # SwipeableTabScreen wrapper
│   │   └── player/          # MiniPlayer, FullPlayerModal, QueueModal
│   ├── constants/           # Color palettes, theme configs, demo track data
│   ├── navigation/          # RootNavigator (Tabs + Modals + Detail Screens)
│   ├── screens/             # Home, Library, Search, Playlists, Settings, Details
│   ├── services/            # MediaScanner, PlaybackManager, TrackPlayerService
│   ├── store/               # useMusicStore (Zustand store + EQ presets)
│   ├── types/               # TypeScript data definitions (Track, Playlist, Player)
│   └── utils/               # Formatters, lyrics parser, M3U import/export
├── app.json                 # Expo application configuration & permissions
├── index.ts                 # React Native & TrackPlayer service entry point
├── package.json             # Project dependencies and npm scripts
└── tsconfig.json            # TypeScript configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.x` or later (LTS recommended)
- **npm** or **yarn**
- **Android Studio** (for Android SDK, platform tools, and emulator)
- **JDK**: Java Development Kit 17

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/subeshyadav3/MyMusic.git
   cd MyMusic
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run on Android**:

   *Note: Because `react-native-track-player` relies on native background playback services, running on a physical Android device or Android emulator with native build is recommended.*

   ```bash
   # Prebuild and launch on connected Android device/emulator
   npx expo run:android
   ```

   Or start Metro bundler for development:
   ```bash
   npm start
   ```

---

## 📱 Android Permissions

The app requests the following Android permissions defined in `app.json`:
- `READ_MEDIA_AUDIO` / `READ_EXTERNAL_STORAGE`: To index and play audio files stored on device.
- `FOREGROUND_SERVICE` & `FOREGROUND_SERVICE_MEDIA_PLAYBACK`: For persistent playback in background.
- `WAKE_LOCK`: Prevents playback interruption when the screen turns off.
- `POST_NOTIFICATIONS`: To show the media notification player on Android 13+.
- `MODIFY_AUDIO_SETTINGS`: For equalizer and audio routing adjustments.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/subeshyadav3/MyMusic/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.
