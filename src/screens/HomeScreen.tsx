import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Pressable, Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Scan, Play, Pause, Heart, Flame, ListMusic, Sparkles,
} from 'lucide-react-native';
import type { ColorTheme } from '../constants/colors';
import { useMusicStore } from '../store/useMusicStore';
import { Track } from '../types/music';
import { TrackArtwork } from '../components/music/TrackArtwork';
import { TrackItem } from '../components/music/TrackItem';
import { useThemeColors } from '../constants/theme';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const nav = useNavigation<any>();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const {
    userName, allTracks, currentTrack, isPlaying, history, playCounts,
    favorites, playlists, isScanning, scanLocalTracks, playTrack, togglePlayPause,
  } = useMusicStore();

  // Recently played tracks
  const recentlyPlayed = useMemo(() => {
    return history
      .slice(0, 15)
      .map(h => allTracks.find(t => t.id === h.trackId))
      .filter(Boolean)
      .filter((t, i, arr) => arr.findIndex(x => x?.id === t?.id) === i)
      .slice(0, 8) as Track[];
  }, [history, allTracks]);

  // Featured track
  const activeTrack = currentTrack || allTracks[0];

  // Library stats for the hero banner
  const libraryStats = useMemo(() => {
    const totalSec = allTracks.reduce((s, t) => s + (t.duration || 0), 0);
    const mins = Math.round(totalSec / 60);
    const label = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins} min`;
    return `${allTracks.length} tracks · ${label} · ${playlists.length} playlists`;
  }, [allTracks, playlists]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Listen Now</Text>
              <Text style={styles.subtitle}>
                {userName ? `Welcome back, ${userName}` : 'Your personal offline library'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.scanBtn, isScanning && { opacity: 0.6 }]}
              onPress={scanLocalTracks}
              disabled={isScanning}
              activeOpacity={0.8}
            >
              <Scan size={15} color={theme.accentLight} />
              <Text style={styles.scanTxt}>{isScanning ? 'Scanning…' : 'Scan'}</Text>
            </TouchableOpacity>
          </View>

          {/* Featured banner with artwork ambience */}
          {activeTrack && (
            <Pressable
              style={styles.heroCard}
              onPress={() => {
                if (currentTrack?.id === activeTrack.id) togglePlayPause();
                else playTrack(activeTrack, allTracks);
              }}
            >
              {activeTrack.artwork ? (
                <Image
                  source={{ uri: activeTrack.artwork }}
                  style={StyleSheet.absoluteFill}
                  blurRadius={28}
                />
              ) : null}
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <TrackArtwork
                  uri={activeTrack.artwork}
                  size={64}
                  borderRadius={14}
                  iconSize={24}
                />
                <View style={styles.heroMeta}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Sparkles size={12} color={theme.accentLight} />
                    <Text style={styles.heroBadge}>
                      {currentTrack ? 'NOW PLAYING' : 'FEATURED'}
                    </Text>
                  </View>
                  <Text style={styles.heroTitle} numberOfLines={1}>
                    {activeTrack.title}
                  </Text>
                  <Text style={styles.heroArtist} numberOfLines={1}>
                    {activeTrack.artist}
                  </Text>
                </View>

                <View style={styles.heroPlayBtn}>
                  {isPlaying && currentTrack?.id === activeTrack.id ? (
                    <Pause size={18} color="#FFF" />
                  ) : (
                    <Play size={18} color="#FFF" fill="#FFF" style={{ marginLeft: 2 }} />
                  )}
                </View>
              </View>
              <Text style={styles.heroStats} numberOfLines={1}>
                {libraryStats}
              </Text>
            </Pressable>
          )}

          {/* Quick Categories Bar */}
          <View style={styles.quickGrid}>
            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => nav.navigate('Playlists')}
            >
              <Heart size={18} color={theme.accentPink} fill={theme.accentPink} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.quickTitle}>Favorites</Text>
                <Text style={styles.quickSub}>{favorites.length} songs</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickCard}
              onPress={() => nav.navigate('Playlists')}
            >
              <ListMusic size={18} color={theme.accentBlue} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.quickTitle}>Playlists</Text>
                <Text style={styles.quickSub}>{playlists.length} lists</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Recently Played Horizontal Carousel */}
          {recentlyPlayed.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recently Played</Text>
              <FlatList
                data={recentlyPlayed}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={5}
                contentContainerStyle={{ paddingRight: 10 }}
                renderItem={({ item }) => (
                  <Pressable
                    style={({ pressed }) => [styles.recentCard, pressed && { opacity: 0.8 }]}
                    onPress={() => playTrack(item, recentlyPlayed)}
                  >
                    <TrackArtwork
                      uri={item.artwork}
                      size={110}
                      borderRadius={14}
                      iconSize={36}
                    />
                    <Text style={styles.recentCardTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.recentCardArtist} numberOfLines={1}>
                      {item.artist}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          )}

          {/* Songs List (Max 10 with See All) */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sectionTitle}>All Songs</Text>
                <Text style={styles.sectionCount}>{allTracks.length} tracks</Text>
              </View>

              <TouchableOpacity
                onPress={() => nav.navigate('Library')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.seeAllHeaderBtnTxt}>See All →</Text>
              </TouchableOpacity>
            </View>

            {allTracks.slice(0, 10).map(track => (
              <TrackItem key={track.id} track={track} queue={allTracks} />
            ))}

            {allTracks.length > 10 && (
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => nav.navigate('Library')}
              >
                <Text style={styles.seeAllTxt}>View all {allTracks.length} songs in Library →</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: 140 + insets.bottom }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
    maxWidth: 600,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    marginBottom: 16,
  },
  greeting: {
    color: C.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: C.textSecondary,
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.bgElevated,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  scanTxt: {
    color: C.accentLight,
    fontSize: 12,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: C.bgCard,
    borderRadius: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    padding: 14,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 8, 14, 0.72)',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroStats: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  heroMeta: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  heroBadge: {
    color: C.accentLight,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    color: C.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  heroArtist: {
    color: C.textSecondary,
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  heroPlayBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgCard,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  quickTitle: {
    color: C.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  quickSub: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  section: {
    marginBottom: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: C.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 10,
  },
  sectionCount: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  recentCard: {
    width: 110,
    marginRight: 12,
  },
  recentCardTitle: {
    color: C.textPrimary,
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 6,
  },
  recentCardArtist: {
    color: C.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  seeAllBtn: {
    backgroundColor: C.bgCard,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  seeAllTxt: {
    color: C.accentLight,
    fontSize: 13,
    fontWeight: '700',
  },
  seeAllHeaderBtnTxt: {
    color: C.accentLight,
    fontSize: 13,
    fontWeight: '700',
  },
});
