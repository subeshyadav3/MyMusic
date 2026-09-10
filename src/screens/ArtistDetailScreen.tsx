import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Play, Shuffle, User } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { ColorTheme } from '../constants/colors';
import { useMusicStore } from '../store/useMusicStore';
import { TrackItem } from '../components/music/TrackItem';
import { formatTime } from '../utils/formatters';
import { useThemeColors } from '../constants/theme';

export default function ArtistDetailScreen() {
  const __theme = useThemeColors();
  const styles = useMemo(() => makeStyles(__theme), [__theme]);
  const nav = useNavigation();
  const route = useRoute<any>();
  const { artistId } = route.params;
  const { artists, albums, allTracks, playTrack } = useMusicStore();

  const artist = artists.find(a => a.id === artistId);
  if (!artist) return null;

  const artistTracks = allTracks.filter(t => artist.trackIds.includes(t.id));
  const artistAlbums = albums.filter(a => artist.albumIds.includes(a.id));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={__theme.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.artistHeader}>
          <View style={styles.artistIcon}><User size={52} color={__theme.textMuted} /></View>
          <Text style={styles.artistName}>{artist.name}</Text>
          <Text style={styles.artistMeta}>{artistTracks.length} songs · {artistAlbums.length} albums</Text>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.playBtn} onPress={() => artistTracks.length && playTrack(artistTracks[0], artistTracks)}>
            <Play size={18} color="#FFF" fill="#FFF" />
            <Text style={styles.playTxt}>Play All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shuffleBtn} onPress={() => {
            if (!artistTracks.length) return;
            const s = [...artistTracks].sort(() => Math.random() - 0.5);
            playTrack(s[0], s);
          }}>
            <Shuffle size={18} color={__theme.accentLight} />
            <Text style={styles.shuffleTxt}>Shuffle</Text>
          </TouchableOpacity>
        </View>

        {artistAlbums.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Albums</Text>
            <FlatList
              horizontal showsHorizontalScrollIndicator={false}
              data={artistAlbums}
              keyExtractor={a => a.id}
              renderItem={({ item }) => {
                const art = allTracks.find(t => item.trackIds.includes(t.id))?.artwork;
                return (
                  <TouchableOpacity style={styles.albumChip} onPress={() => {
                    const tracks = allTracks.filter(t => item.trackIds.includes(t.id));
                    if (tracks.length) playTrack(tracks[0], tracks);
                  }}>
                    <Image source={{ uri: art || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200' }} style={styles.albumArt} />
                    <Text style={styles.albumName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.albumCount}>{item.trackIds.length} songs</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Songs</Text>
          <View style={{ paddingHorizontal: 16 }}>
            {artistTracks.map(t => <TrackItem key={t.id} track={t} queue={artistTracks} />)}
          </View>
        </View>

         <View style={{ height: 210 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  backRow: { paddingHorizontal: 10, paddingTop: 4 },
  backBtn: { padding: 8, width: 40 },
  artistHeader: { alignItems: 'center', paddingVertical: 16 },
  artistIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.bgElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.border, marginBottom: 12 },
  artistName: { color: C.textPrimary, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  artistMeta: { color: C.textMuted, fontSize: 13, marginTop: 4 },
  btnRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: 12 },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 },
  playTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  shuffleBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.bgCard, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  shuffleTxt: { color: C.accentLight, fontSize: 14, fontWeight: '700' },
  section: { marginTop: 8, marginBottom: 8 },
  sectionTitle: { color: C.textPrimary, fontSize: 16, fontWeight: '800', paddingHorizontal: 16, marginBottom: 10 },
  albumChip: { width: 130, marginLeft: 16, marginBottom: 8 },
  albumArt: { width: 130, height: 130, borderRadius: 12, backgroundColor: C.bgSurface, marginBottom: 6 },
  albumName: { color: C.textPrimary, fontSize: 12, fontWeight: '700' },
  albumCount: { color: C.textMuted, fontSize: 11, marginTop: 2 },
});
