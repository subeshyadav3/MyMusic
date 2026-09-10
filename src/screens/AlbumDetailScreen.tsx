import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Play, Shuffle } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { ColorTheme } from '../constants/colors';
import { useMusicStore } from '../store/useMusicStore';
import { TrackItem } from '../components/music/TrackItem';
import { formatTime } from '../utils/formatters';
import { TrackArtwork } from '../components/music/TrackArtwork';
import { useThemeColors } from '../constants/theme';

export default function AlbumDetailScreen() {
  const __theme = useThemeColors();
  const styles = useMemo(() => makeStyles(__theme), [__theme]);
  const nav = useNavigation();
  const route = useRoute<any>();
  const { albumId } = route.params;
  const { albums, allTracks, playTrack } = useMusicStore();

  const album = albums.find(a => a.id === albumId);
  if (!album) return null;

  const tracks = allTracks.filter(t => album.trackIds.includes(t.id))
    .sort((a, b) => (a.trackNumber || 99) - (b.trackNumber || 99));
  const totalDur = tracks.reduce((s, t) => s + (t.duration || 0), 0);
  const art = tracks[0]?.artwork;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={__theme.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Art + Info */}
        <View style={styles.artSection}>
          <TrackArtwork
            uri={art}
            size={180}
            borderRadius={18}
            iconSize={64}
            style={styles.albumArt}
          />
          <Text style={styles.albumName}>{album.name}</Text>
          <Text style={styles.albumArtist}>{album.artist}</Text>
          {album.year && <Text style={styles.albumMeta}>{album.year}</Text>}
          <Text style={styles.albumMeta}>{tracks.length} songs · {formatTime(totalDur)}</Text>
        </View>

        {/* Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.playAllBtn} onPress={() => tracks.length && playTrack(tracks[0], tracks)}>
            <Play size={18} color="#FFF" fill="#FFF" />
            <Text style={styles.playAllTxt}>Play All</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shuffleBtn}
            onPress={() => {
              if (!tracks.length) return;
              const shuffled = [...tracks].sort(() => Math.random() - 0.5);
              playTrack(shuffled[0], shuffled);
            }}
          >
            <Shuffle size={18} color={__theme.accentLight} />
            <Text style={styles.shuffleTxt}>Shuffle</Text>
          </TouchableOpacity>
        </View>

        {/* Track list */}
         <View style={{ paddingHorizontal: 16, paddingBottom: 210 }}>
          {tracks.map(t => <TrackItem key={t.id} track={t} queue={tracks} />)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  backRow: { paddingHorizontal: 10, paddingTop: 4 },
  backBtn: { padding: 8, width: 40 },
  artSection: { alignItems: 'center', paddingVertical: 16 },
  albumArt: { width: 200, height: 200, borderRadius: 16, backgroundColor: C.bgSurface, marginBottom: 16 },
  albumName: { color: C.textPrimary, fontSize: 22, fontWeight: '800', textAlign: 'center', paddingHorizontal: 20 },
  albumArtist: { color: C.accentLight, fontSize: 15, fontWeight: '600', marginTop: 4 },
  albumMeta: { color: C.textMuted, fontSize: 12, marginTop: 4 },
  btnRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: 16 },
  playAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10, shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  playAllTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  shuffleBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.bgCard, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  shuffleTxt: { color: C.accentLight, fontSize: 14, fontWeight: '700' },
});
