import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Folder as FolderIcon, Play } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { ColorTheme } from '../constants/colors';
import { useMusicStore } from '../store/useMusicStore';
import { TrackItem } from '../components/music/TrackItem';
import { useThemeColors } from '../constants/theme';

export default function FolderScreen() {
  const __theme = useThemeColors();
  const styles = useMemo(() => makeStyles(__theme), [__theme]);
  const nav = useNavigation();
  const route = useRoute<any>();
  const { folderPath } = route.params;
  const { folders, allTracks, playTrack } = useMusicStore();

  const folder = folders.find(f => f.path === folderPath);
  if (!folder) return null;

  const tracks = allTracks.filter(t => folder.trackIds.includes(t.id));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <ChevronLeft size={24} color={__theme.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.folderHeader}>
          <View style={styles.folderIcon}><FolderIcon size={44} color={__theme.accentBlue} /></View>
          <Text style={styles.folderName}>{folder.name}</Text>
          <Text style={styles.folderPath} numberOfLines={1}>{folder.path}</Text>
          <Text style={styles.folderMeta}>{tracks.length} songs</Text>
        </View>
        {tracks.length > 0 && (
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.playBtn} onPress={() => playTrack(tracks[0], tracks)}>
              <Play size={18} color="#FFF" fill="#FFF" />
              <Text style={styles.playTxt}>Play All</Text>
            </TouchableOpacity>
          </View>
        )}
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
  folderHeader: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 20 },
  folderIcon: { width: 90, height: 90, borderRadius: 18, backgroundColor: `${C.accentBlue}18`, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  folderName: { color: C.textPrimary, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  folderPath: { color: C.textMuted, fontSize: 11, marginTop: 4, textAlign: 'center' },
  folderMeta: { color: C.textSecondary, fontSize: 13, marginTop: 4 },
  btnRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 10 },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 20, paddingHorizontal: 28, paddingVertical: 10 },
  playTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
