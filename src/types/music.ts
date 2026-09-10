export interface Track {
  id: string;
  url: string;
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
  duration?: number;
  genre?: string;
  year?: number;
  trackNumber?: number;
  fileFormat?: string;
  mimeType?: string;
  fileSize?: number;
  bitrate?: number;
  sampleRate?: number;
  isLocal?: boolean;
  filePath?: string;
  playCount?: number;
  rating?: number; // 0-5
  lastPlayed?: number; // timestamp
  dateAdded?: number; // timestamp
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  artwork?: string;
  year?: number;
  trackIds: string[];
}

export interface Artist {
  id: string;
  name: string;
  artwork?: string;
  albumIds: string[];
  trackIds: string[];
}

export interface Genre {
  id: string;
  name: string;
  trackIds: string[];
}

export interface Folder {
  path: string;
  name: string;
  trackIds: string[];
  subfolders: string[];
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  trackIds: string[];
  coverArt?: string;
  isSmartPlaylist?: boolean;
}

export interface PlaybackState {
  currentTrackId: string | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  queue: string[];
  queueIndex: number;
  shuffleMode: boolean;
  repeatMode: RepeatModeType;
  volume: number;
}

export type RepeatModeType = 'off' | 'track' | 'queue';
export type SortByType = 'title' | 'artist' | 'album' | 'dateAdded' | 'duration' | 'playCount';
export type ViewModeType = 'list' | 'grid';
export type ThemeType = 'dark' | 'amoled' | 'light';
