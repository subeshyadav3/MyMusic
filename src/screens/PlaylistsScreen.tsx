import React, {useState, useMemo} from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Modal, Pressable, Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X, Music, Play, Edit2, Trash2, Check, Upload, Download } from 'lucide-react-native';
import type { ColorTheme } from '../constants/colors';
import { useMusicStore } from '../store/useMusicStore';
import { Playlist, Track } from '../types/music';
import { TrackItem } from '../components/music/TrackItem';
import { EmptyState } from '../components/common/EmptyState';
import { formatTime } from '../utils/formatters';
import { SwipeableTabScreen } from '../components/navigation/SwipeableTabScreen';
import { useThemeColors } from '../constants/theme';
import { exportPlaylistM3U, importM3UPlaylist } from '../utils/m3u';

export default function PlaylistsScreen() {
  const __theme = useThemeColors();
  const styles = useMemo(() => makeStyles(__theme), [__theme]);
  const insets = useSafeAreaInsets();
  const { playlists, allTracks, favorites, playCounts, history, createPlaylist, deletePlaylist, renamePlaylist, playTrack, addToPlaylist } = useMusicStore();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createPlaylist(newName.trim());
    setNewName(''); setCreating(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Playlist', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deletePlaylist(id); if (openedId === id) setOpenedId(null); } },
    ]);
  };

  const handleExport = async (pl: Playlist) => {
    try {
      const byId = new Map(allTracks.map(t => [t.id, t]));
      const uri = await exportPlaylistM3U(pl, byId);
      Alert.alert('Exported', `Saved ${pl.trackIds.length} tracks to:\n${uri}`);
    } catch (e: any) {
      Alert.alert('Export failed', e?.message || 'Could not export playlist');
    }
  };

  const handleImport = async () => {
    try {
      const r = await importM3UPlaylist(allTracks, createPlaylist, addToPlaylist);
      Alert.alert('Imported', `"${r.name}": matched ${r.matched}/${r.total} entries`);
    } catch (e: any) {
      if (e?.message !== 'cancelled') Alert.alert('Import failed', e?.message || 'Could not import playlist');
    }
  };

  // Built-in smart playlists
  const favTracks = allTracks.filter(t => favorites.includes(t.id));
  const recentPlayed = history.slice(0, 20).map(h => allTracks.find(t => t.id === h.trackId)).filter(Boolean) as Track[];
  const mostPlayed = [...allTracks].sort((a, b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0)).filter(t => (playCounts[t.id] || 0) > 0).slice(0, 20);

  const SMART: Array<{ id: string; name: string; tracks: Track[]; color: string }> = [
    { id: '__fav', name: '❤️ Favorites', tracks: favTracks, color: __theme.accentPink },
    { id: '__recent', name: '🕐 Recently Played', tracks: recentPlayed, color: __theme.accentBlue },
    { id: '__top', name: '🔥 Most Played', tracks: mostPlayed, color: __theme.accentGreen },
  ];

  const getPlTracks = (pl: Playlist) => allTracks.filter(t => pl.trackIds.includes(t.id));
  const getPlDuration = (pl: Playlist) => getPlTracks(pl).reduce((sum, t) => sum + (t.duration || 0), 0);

  const openedPlaylist = playlists.find(p => p.id === openedId);
  const openedTracks = openedPlaylist ? getPlTracks(openedPlaylist) : [];

  return (
    <SwipeableTabScreen>
      <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Playlists</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.addBtn} onPress={handleImport}>
            <Upload size={18} color={__theme.accentLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setCreating(true)}>
            <Plus size={20} color={__theme.accentLight} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Create new playlist input */}
      {creating && (
        <View style={styles.createRow}>
          <TextInput
            style={styles.createInput}
            placeholder="Playlist name..."
            placeholderTextColor={__theme.textMuted}
            value={newName}
            onChangeText={setNewName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
          <TouchableOpacity onPress={handleCreate} style={styles.createConfirm}><Check size={18} color={__theme.accentLight} /></TouchableOpacity>
          <TouchableOpacity onPress={() => { setCreating(false); setNewName(''); }} style={styles.createCancel}><X size={18} color={__theme.textMuted} /></TouchableOpacity>
        </View>
      )}

      <FlatList
        data={[...SMART.map(s => ({ ...s, isSmart: true })), ...playlists.map(p => ({ ...p, isSmart: false, color: __theme.accent }))]}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        renderItem={({ item }) => {
          const isSmart = (item as any).isSmart;
          const tracks: Track[] = isSmart ? (item as any).tracks : getPlTracks(item as Playlist);
          const isOpen = openedId === item.id;
          const isRenaming = renaming === item.id;

          return (
            <View>
              <Pressable
                style={({ pressed }) => [styles.plCard, pressed && { opacity: 0.8 }]}
                onPress={() => setOpenedId(isOpen ? null : item.id)}
              >
                {/* Color strip */}
                <View style={[styles.colorStrip, { backgroundColor: (item as any).color }]} />

                <View style={styles.plInfo}>
                  {isRenaming ? (
                    <TextInput
                      style={styles.renameInput}
                      value={renameVal}
                      onChangeText={setRenameVal}
                      autoFocus
                      onSubmitEditing={async () => {
                        if (renameVal.trim()) await renamePlaylist(item.id, renameVal.trim());
                        setRenaming(null);
                      }}
                    />
                  ) : (
                    <Text style={styles.plName}>{item.name}</Text>
                  )}
                  <Text style={styles.plMeta}>
                    {tracks.length} songs
                    {!isSmart && tracks.length > 0 ? `  ·  ${formatTime(getPlDuration(item as Playlist))}` : ''}
                    {isSmart ? '  ·  Smart' : ''}
                  </Text>
                </View>

                <View style={styles.plActions}>
                  {tracks.length > 0 && (
                    <TouchableOpacity
                      style={styles.playBtn}
                      onPress={() => playTrack(tracks[0], tracks)}
                    >
                      <Play size={14} color="#FFF" fill="#FFF" />
                    </TouchableOpacity>
                  )}
                  {!isSmart && (
                    <>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => handleExport(item as Playlist)}
                      >
                        <Download size={15} color={__theme.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => { setRenaming(item.id); setRenameVal(item.name); }}
                      >
                        <Edit2 size={15} color={__theme.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() => handleDelete(item.id, item.name)}
                      >
                        <Trash2 size={15} color={__theme.accentPink} />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </Pressable>

              {/* Expanded track list */}
              {isOpen && (
                <View style={styles.expandedList}>
                  {tracks.length === 0 ? (
                    <Text style={styles.emptyTxt}>No songs yet — add from any track menu</Text>
                  ) : (
                    tracks.slice(0, 8).map(t => <TrackItem key={t.id} track={t} queue={tracks} />)
                  )}
                  {tracks.length > 8 && (
                    <TouchableOpacity onPress={() => playTrack(tracks[0], tracks)} style={styles.showMoreBtn}>
                      <Text style={styles.showMoreTxt}>Play all {tracks.length} songs</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon={<Music size={40} color={__theme.textMuted} />}
            title="No playlists yet"
            subtitle="Create a playlist to organize your music"
            action={{ label: 'Create Playlist', onPress: () => setCreating(true) }}
          />
        }
         ListFooterComponent={<View style={{ height: 220 + insets.bottom }} />}
      />
      </SafeAreaView>
    </SwipeableTabScreen>
  );
}

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { color: C.textPrimary, fontSize: 24, fontWeight: '800' },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  createRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, gap: 8 },
  createInput: { flex: 1, backgroundColor: C.bgCard, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: C.textPrimary, fontSize: 14, borderWidth: 1, borderColor: C.accentLight },
  createConfirm: { padding: 10, backgroundColor: C.bgCard, borderRadius: 10 },
  createCancel: { padding: 10, backgroundColor: C.bgCard, borderRadius: 10 },
  list: { paddingHorizontal: 16 },
  plCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgCard, borderRadius: 14, marginBottom: 8, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
  colorStrip: { width: 4, alignSelf: 'stretch' },
  plInfo: { flex: 1, paddingLeft: 12, paddingVertical: 14 },
  plName: { color: C.textPrimary, fontSize: 15, fontWeight: '700' },
  plMeta: { color: C.textSecondary, fontSize: 12, marginTop: 3 },
  renameInput: { color: C.accentLight, fontSize: 15, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: C.accentLight, paddingBottom: 2 },
  plActions: { flexDirection: 'row', alignItems: 'center', paddingRight: 10, gap: 4 },
  playBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { padding: 6 },
  expandedList: { backgroundColor: C.bgElevated, marginBottom: 8, borderRadius: 12, padding: 8, marginTop: -8, borderWidth: 1, borderColor: C.border },
  emptyTxt: { color: C.textMuted, fontSize: 13, textAlign: 'center', padding: 16 },
  showMoreBtn: { alignItems: 'center', paddingVertical: 10 },
  showMoreTxt: { color: C.accentLight, fontSize: 13, fontWeight: '700' },
});
