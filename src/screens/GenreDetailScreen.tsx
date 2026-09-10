import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Play, Shuffle, Disc } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { ColorTheme } from '../constants/colors';
import { useMusicStore } from '../store/useMusicStore';
import { TrackItem } from '../components/music/TrackItem';
import { ScrollView } from 'react-native';
import { useThemeColors } from '../constants/theme';

export default function GenreDetailScreen() {
  const __theme = useThemeColors();
  const styles = useMemo(() => makeStyles(__theme), [__theme]);
  const nav = useNavigation();
  const route = useRoute<any>();
  const { genreId } = route.params;
  const { genres, allTracks, playTrack } = useMusicStore();

  const genre = genres.find(g => g.id === genreId);
  if (!genre) return null;

  const tracks = allTracks.filter(t => genre.trackIds.includes(t.id));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={__theme.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.genreHeader}>
          <View style={styles.genreIcon}><Disc size={48} color={__theme.accentLight} /></View>
          <Text style={styles.genreName}>{genre.name}</Text>
          <Text style={styles.genreMeta}>{tracks.length} songs</Text>
        </View>
        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.playBtn} onPress={() => tracks.length && playTrack(tracks[0], tracks)}>
            <Play size={18} color="#FFF" fill="#FFF" />
            <Text style={styles.playTxt}>Play All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shuffleBtn} onPress={() => {
            if (!tracks.length) return;
            const s = [...tracks].sort(() => Math.random() - 0.5);
            playTrack(s[0], s);
          }}>
            <Shuffle size={18} color={__theme.accentLight} />
            <Text style={styles.shuffleTxt}>Shuffle</Text>
          </TouchableOpacity>
        </View>
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
  genreHeader: { alignItems: 'center', paddingVertical: 20 },
  genreIcon: { width: 100, height: 100, borderRadius: 20, backgroundColor: C.accentGlow, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  genreName: { color: C.textPrimary, fontSize: 24, fontWeight: '800' },
  genreMeta: { color: C.textMuted, fontSize: 13, marginTop: 4 },
  btnRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, paddingVertical: 12 },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 },
  playTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  shuffleBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.bgCard, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10, borderWidth: 1, borderColor: C.border },
  shuffleTxt: { color: C.accentLight, fontSize: 14, fontWeight: '700' },
});
