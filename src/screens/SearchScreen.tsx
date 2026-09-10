import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, SectionList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search as SearchIcon, X, Clock, Music } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ColorTheme } from '../constants/colors';
import { useMusicStore } from '../store/useMusicStore';
import { TrackItem } from '../components/music/TrackItem';
import { EmptyState } from '../components/common/EmptyState';
import { SwipeableTabScreen } from '../components/navigation/SwipeableTabScreen';
import { useThemeColors } from '../constants/theme';

const RECENT_KEY = '@mm_recent_searches';

export default function SearchScreen() {
  const __theme = useThemeColors();
  const styles = useMemo(() => makeStyles(__theme), [__theme]);
  const insets = useSafeAreaInsets();
  const { allTracks, albums, artists, playlists, playTrack } = useMusicStore();
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches on mount
  React.useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY).then(v => {
      if (v) setRecentSearches(JSON.parse(v));
    });
  }, []);

  const saveSearch = async (q: string) => {
    const updated = [q, ...recentSearches.filter(s => s !== q)].slice(0, 10);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  const clearRecent = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_KEY);
  };

  const q = query.toLowerCase().trim();

  const results = useMemo(() => {
    if (!q) return null;
    const songs = allTracks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      (t.album || '').toLowerCase().includes(q)
    );
    const matchAlbums = albums.filter(
      a => a.name.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)
    );
    const matchArtists = artists.filter(a => a.name.toLowerCase().includes(q));
    const matchPlaylists = playlists.filter(p => p.name.toLowerCase().includes(q));
    return { songs, albums: matchAlbums, artists: matchArtists, playlists: matchPlaylists };
  }, [q, allTracks, albums, artists, playlists]);

  const sections = results
    ? [
        ...(results.songs.length > 0
          ? [{ title: `Songs (${results.songs.length})`, data: results.songs, type: 'songs' }]
          : []),
        ...(results.albums.length > 0
          ? [{
              title: `Albums (${results.albums.length})`,
              data: results.albums.map(a => ({ ...a, _type: 'album' })),
              type: 'albums',
            }]
          : []),
        ...(results.artists.length > 0
          ? [{
              title: `Artists (${results.artists.length})`,
              data: results.artists.map(a => ({ ...a, _type: 'artist' })),
              type: 'artists',
            }]
          : []),
        ...(results.playlists.length > 0
          ? [{
              title: `Playlists (${results.playlists.length})`,
              data: results.playlists.map(p => ({ ...p, _type: 'playlist' })),
              type: 'playlists',
            }]
          : []),
      ]
    : [];

  const hasResults = sections.length > 0;

  return (
    <SwipeableTabScreen>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={__theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Songs, artists, albums..."
            placeholderTextColor={__theme.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => query.trim() && saveSearch(query.trim())}
          />
          {query.length > 0 ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={16} color={__theme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Conditional Content */}
        {!query ? (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            {recentSearches.length > 0 ? (
              <>
                <View style={styles.recentHeader}>
                  <Text style={styles.recentTitle}>Recent Searches</Text>
                  <TouchableOpacity onPress={clearRecent}>
                    <Text style={styles.clearTxt}>Clear</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={recentSearches}
                  keyExtractor={(_, i) => String(i)}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.recentItem} onPress={() => setQuery(item)}>
                      <Clock size={14} color={__theme.textMuted} />
                      <Text style={styles.recentItemTxt}>{item}</Text>
                    </TouchableOpacity>
                  )}
                />
              </>
            ) : (
              <EmptyState
                icon={<SearchIcon size={40} color={__theme.textMuted} />}
                title="Search your library"
                subtitle="Find songs, artists, albums, and playlists"
              />
            )}
          </View>
        ) : !hasResults ? (
          <EmptyState
            icon={<Music size={40} color={__theme.textMuted} />}
            title="No results"
            subtitle={`Nothing found for "${query}"`}
          />
        ) : (
          <SectionList
            sections={sections as any}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={styles.results}
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            maxToRenderPerBatch={15}
            windowSize={7}
            removeClippedSubviews
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.sectionTitle}>{title}</Text>
            )}
            renderItem={({ item, section }: any) => {
              if (section.type === 'songs') {
                return <TrackItem track={item} queue={results?.songs} />;
              }
              return (
                <TouchableOpacity
                  style={styles.simpleRow}
                  onPress={() => {
                    if (section.type === 'albums') {
                      const tracks = allTracks.filter(t => item.trackIds?.includes(t.id));
                      if (tracks.length) playTrack(tracks[0], tracks);
                    } else if (section.type === 'artists') {
                      const tracks = allTracks.filter(t => item.trackIds?.includes(t.id));
                      if (tracks.length) playTrack(tracks[0], tracks);
                    } else if (section.type === 'playlists') {
                      const tracks = allTracks.filter(t => item.trackIds?.includes(t.id));
                      if (tracks.length) playTrack(tracks[0], tracks);
                    }
                  }}
                >
                  <View style={styles.simpleIcon}>
                    <Music size={18} color={__theme.textMuted} />
                  </View>
                  <View>
                    <Text style={styles.simpleTitle}>{item.name || item.title}</Text>
                    {item.artist ? <Text style={styles.simpleSub}>{item.artist}</Text> : null}
                    {item.trackIds ? (
                      <Text style={styles.simpleSub}>{item.trackIds.length} songs</Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            }}
            ListFooterComponent={<View style={{ height: 180 + insets.bottom }} />}
          />
        )}
      </SafeAreaView>
    </SwipeableTabScreen>
  );
}

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  headerTitle: { color: C.textPrimary, fontSize: 24, fontWeight: '800' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginVertical: 10,
    backgroundColor: C.bgCard,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: C.border,
  },
  searchInput: { flex: 1, color: C.textPrimary, fontSize: 15 },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  recentTitle: { color: C.textPrimary, fontSize: 16, fontWeight: '700' },
  clearTxt: { color: C.accentPink, fontSize: 13, fontWeight: '600' },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  recentItemTxt: { color: C.textSecondary, fontSize: 14 },
  results: { paddingHorizontal: 16 },
  sectionTitle: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  simpleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: C.bgCard,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  simpleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: C.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleTitle: { color: C.textPrimary, fontSize: 14, fontWeight: '600' },
  simpleSub: { color: C.textSecondary, fontSize: 12, marginTop: 2 },
});
