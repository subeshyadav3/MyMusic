import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Dimensions, Pressable, Modal, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Search, ChevronDown, ChevronUp, Folder, User, Disc, Music,
  CheckSquare, Square, Trash2, FolderPlus, ListPlus, X, HardDrive, Smartphone,
  Check,
} from 'lucide-react-native';
import type { ColorTheme } from '../constants/colors';
import { useMusicStore } from '../store/useMusicStore';
import { TrackItem } from '../components/music/TrackItem';
import { EmptyState } from '../components/common/EmptyState';
import { formatTime } from '../utils/formatters';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SwipeableTabScreen } from '../components/navigation/SwipeableTabScreen';
import { TrackArtwork } from '../components/music/TrackArtwork';
import { useThemeColors } from '../constants/theme';
import { Track } from '../types/music';

type Nav = NativeStackNavigationProp<any>;
const { width: SW } = Dimensions.get('window');
const TABS = ['Songs', 'Albums', 'Artists', 'Genres', 'Folders'] as const;
type TabType = typeof TABS[number];

type SortKey = 'title' | 'artist' | 'album' | 'duration';

export default function LibraryScreen() {
  const theme = useThemeColors();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const {
    allTracks, albums, artists, genres, folders,
    playTrack, playNext, bulkDeleteTracks, setAddToPlaylistVisible,
  } = useMusicStore();

  const [activeTab, setActiveTab] = useState<TabType>('Songs');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('title');
  const [sortAsc, setSortAsc] = useState(true);
  const [showSort, setShowSort] = useState(false);

  // Bulk Selection State
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteModalVisible, setBulkDeleteModalVisible] = useState(false);

  const sorted = useMemo(() => {
    let list = [...allTracks];
    if (search) list = list.filter(t =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase())
    );
    list.sort((a, b) => {
      const aVal = (a[sortBy] ?? '') as string | number;
      const bVal = (b[sortBy] ?? '') as string | number;
      const cmp = typeof aVal === 'number' && typeof bVal === 'number'
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [allTracks, search, sortBy, sortAsc]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async (deleteFromDevice: boolean) => {
    setBulkDeleteModalVisible(false);
    await bulkDeleteTracks(selectedIds, deleteFromDevice);
    setIsSelecting(false);
    setSelectedIds([]);
  };

  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 68 : 28) + 16;

  return (
    <SwipeableTabScreen>
      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Header */}
        {!isSelecting ? (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Library</Text>
            <View style={styles.headerActions}>
              {activeTab === 'Songs' && (
                <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort(!showSort)}>
                  <Text style={styles.sortTxt}>{sortBy}</Text>
                  {sortAsc ? <ChevronUp size={14} color={theme.accentLight} /> : <ChevronDown size={14} color={theme.accentLight} />}
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          /* Selection Mode Header */
          <View style={styles.selectionHeader}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setIsSelecting(false);
                setSelectedIds([]);
              }}
            >
              <X size={20} color={theme.textPrimary} />
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.selectedCountTxt}>
              {selectedIds.length} Selected
            </Text>

            <TouchableOpacity
              style={styles.selectAllBtn}
              onPress={() => {
                if (selectedIds.length === sorted.length) setSelectedIds([]);
                else setSelectedIds(sorted.map(t => t.id));
              }}
            >
              <Text style={styles.selectAllTxt}>
                {selectedIds.length === sorted.length ? 'Deselect' : 'Select All'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sort Dropdown */}
        {showSort && !isSelecting && (
          <View style={styles.sortDropdown}>
            {(['title', 'artist', 'album', 'duration'] as SortKey[]).map(k => (
              <TouchableOpacity
                key={k}
                style={[styles.sortOption, sortBy === k && styles.sortOptionActive]}
                onPress={() => {
                  if (sortBy === k) setSortAsc(!sortAsc);
                  else { setSortBy(k); setSortAsc(true); }
                  setShowSort(false);
                }}
              >
                <Text style={[styles.sortOptionTxt, sortBy === k && { color: theme.accentLight }]}>
                  {k.charAt(0).toUpperCase() + k.slice(1)} {sortBy === k ? (sortAsc ? '↑' : '↓') : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Tabs (hidden in selection mode to avoid clutter) */}
        {!isSelecting && (
          <View style={styles.tabBar}>
            {TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabTxt, activeTab === tab && styles.tabTxtActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Search (Songs only) */}
        {activeTab === 'Songs' && !isSelecting && (
          <View style={styles.searchRow}>
            <Search size={16} color={theme.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search songs..."
              placeholderTextColor={theme.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        )}

        {/* Content */}
        {activeTab === 'Songs' && (
          <FlatList
            data={sorted}
            keyExtractor={t => t.id}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: isSelecting ? 180 : 140 + insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}
            initialNumToRender={15}
            maxToRenderPerBatch={20}
            windowSize={7}
            removeClippedSubviews
            renderItem={({ item }) => {
              if (isSelecting) {
                const isChecked = selectedIds.includes(item.id);
                return (
                  <Pressable
                    style={[styles.selectRow, isChecked && styles.selectRowChecked]}
                    onPress={() => toggleSelect(item.id)}
                  >
                    <View style={styles.checkIconWrap}>
                      {isChecked ? (
                        <CheckSquare size={20} color={theme.accentLight} />
                      ) : (
                        <Square size={20} color={theme.textMuted} />
                      )}
                    </View>
                    <TrackArtwork uri={item.artwork} size={42} borderRadius={10} />
                    <View style={{ flex: 1, marginLeft: 10, marginRight: 6 }}>
                      <Text style={styles.trackTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>{item.artist}</Text>
                    </View>
                    <Text style={styles.trackDur}>{formatTime(item.duration)}</Text>
                  </Pressable>
                );
              }
              return (
                <TrackItem
                  track={item}
                  queue={sorted}
                  onLongPress={() => {
                    setIsSelecting(true);
                    setSelectedIds([item.id]);
                  }}
                />
              );
            }}
            ListEmptyComponent={<EmptyState title="No songs found" subtitle="Try scanning your device for music" />}
          />
        )}

        {activeTab === 'Albums' && (
          <FlatList
            data={albums}
            keyExtractor={a => a.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={[styles.list, { paddingBottom: 140 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const art = allTracks.find(t => item.trackIds.includes(t.id))?.artwork;
              return (
                <Pressable
                  style={({ pressed }) => [styles.albumCard, pressed && { opacity: 0.8 }]}
                  onPress={() => nav.navigate('AlbumDetail', { albumId: item.id })}
                >
                  <TrackArtwork
                    uri={art}
                    size={(SW - 44) / 2}
                    borderRadius={0}
                    iconSize={48}
                    style={styles.albumArt}
                  />
                  <Text style={styles.albumName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.albumArtist} numberOfLines={1}>{item.artist}</Text>
                  <Text style={styles.albumCount}>{item.trackIds.length} songs</Text>
                </Pressable>
              );
            }}
          />
        )}

        {activeTab === 'Artists' && (
          <FlatList
            data={artists}
            keyExtractor={a => a.id}
            contentContainerStyle={[styles.list, { paddingBottom: 140 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.artistRow}
                onPress={() => nav.navigate('ArtistDetail', { artistName: item.name })}
              >
                <View style={styles.artistAvatar}>
                  <User size={22} color={theme.accentLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.artistName}>{item.name}</Text>
                  <Text style={styles.artistCount}>{item.trackIds.length} tracks</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {activeTab === 'Genres' && (
          <FlatList
            data={genres}
            keyExtractor={g => g.id}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={[styles.list, { paddingBottom: 140 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.genreCard}
                onPress={() => nav.navigate('GenreDetail', { genreName: item.name })}
              >
                <Disc size={28} color={theme.accentLight} />
                <Text style={styles.genreName}>{item.name}</Text>
                <Text style={styles.genreCount}>{item.trackIds.length} songs</Text>
              </TouchableOpacity>
            )}
          />
        )}

        {activeTab === 'Folders' && (
          <FlatList
            data={folders}
            keyExtractor={f => f.path}
            contentContainerStyle={[styles.list, { paddingBottom: 140 + insets.bottom }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.folderRow}
                onPress={() => nav.navigate('Folder', { folderPath: item.path })}
              >
                <Folder size={22} color={theme.accentLight} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.folderName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.folderCount}>{item.trackIds.length} songs</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* Floating Bulk Action Bar */}
        {isSelecting && selectedIds.length > 0 && (
          <View style={[styles.bulkBarContainer, { bottom: 70 + insets.bottom }]}>
            <View style={styles.bulkBarCard}>
              {/* Add to Playlist */}
              <TouchableOpacity
                style={styles.bulkActionBtn}
                onPress={() => {
                  const selTracks = allTracks.filter(t => selectedIds.includes(t.id));
                  setAddToPlaylistVisible(true, selTracks);
                  setIsSelecting(false);
                  setSelectedIds([]);
                }}
              >
                <FolderPlus size={19} color={theme.accentLight} />
                <Text style={styles.bulkActionTxt}>Playlist</Text>
              </TouchableOpacity>

              <View style={styles.bulkDivider} />

              {/* Play Next */}
              <TouchableOpacity
                style={styles.bulkActionBtn}
                onPress={() => {
                  const selTracks = allTracks.filter(t => selectedIds.includes(t.id));
                  selTracks.forEach(t => playNext(t));
                  setIsSelecting(false);
                  setSelectedIds([]);
                }}
              >
                <ListPlus size={19} color={theme.textPrimary} />
                <Text style={styles.bulkActionTxt}>Play Next</Text>
              </TouchableOpacity>

              <View style={styles.bulkDivider} />

              {/* Bulk Delete */}
              <TouchableOpacity
                style={styles.bulkActionBtn}
                onPress={() => setBulkDeleteModalVisible(true)}
              >
                <Trash2 size={19} color={theme.accentPink} />
                <Text style={[styles.bulkActionTxt, { color: theme.accentPink }]}>
                  Delete ({selectedIds.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bulk Delete Options Dialog (No overlap, safe bottom padding) */}
        {bulkDeleteModalVisible && (
          <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={() => setBulkDeleteModalVisible(false)}
          >
            <View style={styles.modalBackdrop}>
              <View style={[styles.deleteDialog, { marginBottom: safeBottom }]}>
                <View style={styles.deleteIconWrap}>
                  <Trash2 size={26} color={theme.accentPink} />
                </View>

                <Text style={styles.deleteDialogTitle}>Delete {selectedIds.length} Tracks</Text>
                <Text style={styles.deleteDialogDesc}>
                  Choose how you would like to delete the selected tracks:
                </Text>

                {/* Option 1: Remove from App Only */}
                <TouchableOpacity
                  style={styles.deleteOptionBtn}
                  onPress={() => handleBulkDelete(false)}
                >
                  <Smartphone size={18} color={theme.textPrimary} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.deleteOptionTitle}>Remove from App Only</Text>
                    <Text style={styles.deleteOptionSub}>Keeps original audio files on your phone storage</Text>
                  </View>
                </TouchableOpacity>

                {/* Option 2: Delete from Mobile Storage */}
                <TouchableOpacity
                  style={[styles.deleteOptionBtn, { borderColor: 'rgba(236,72,153,0.35)', backgroundColor: 'rgba(236,72,153,0.08)' }]}
                  onPress={() => handleBulkDelete(true)}
                >
                  <HardDrive size={18} color={theme.accentPink} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.deleteOptionTitle, { color: theme.accentPink }]}>
                      Delete from Mobile Storage
                    </Text>
                    <Text style={styles.deleteOptionSub}>Permanently erases audio files from device storage</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteCancelBtn}
                  onPress={() => setBulkDeleteModalVisible(false)}
                >
                  <Text style={styles.deleteCancelTxt}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </SafeAreaView>
    </SwipeableTabScreen>
  );
}

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    color: C.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectToggleBtn: {
    backgroundColor: C.bgCard,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  selectToggleTxt: {
    color: C.accentLight,
    fontSize: 12.5,
    fontWeight: '700',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.bgCard,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  sortTxt: { color: C.textSecondary, fontSize: 12, textTransform: 'capitalize', fontWeight: '600' },
  sortDropdown: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 99,
    backgroundColor: C.bgElevated,
    borderRadius: 14,
    padding: 6,
    borderWidth: 1,
    borderColor: C.border,
    elevation: 8,
  },
  sortOption: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  sortOptionActive: { backgroundColor: C.bgCard },
  sortOptionTxt: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },

  // Selection Mode Header
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: C.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  cancelTxt: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  selectedCountTxt: {
    color: C.accentLight,
    fontSize: 15,
    fontWeight: '800',
  },
  selectAllBtn: {
    paddingVertical: 4,
  },
  selectAllTxt: {
    color: C.accentLight,
    fontSize: 14,
    fontWeight: '700',
  },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginVertical: 8,
    gap: 6,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.bgCard,
  },
  tabActive: { backgroundColor: C.accent },
  tabTxt: { color: C.textMuted, fontSize: 12.5, fontWeight: '600' },
  tabTxtActive: { color: '#FFF', fontWeight: '700' },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgCard,
    marginHorizontal: 14,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 38,
    borderWidth: 1,
    borderColor: C.border,
    gap: 8,
  },
  searchInput: { flex: 1, color: C.textPrimary, fontSize: 13 },
  list: { paddingHorizontal: 14 },
  gridRow: { justifyContent: 'space-between', marginBottom: 12 },
  albumCard: {
    width: (SW - 44) / 2,
    backgroundColor: C.bgCard,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    paddingBottom: 8,
  },
  albumArt: { width: '100%', aspectRatio: 1 },
  albumName: { color: C.textPrimary, fontSize: 13, fontWeight: '700', marginTop: 6, marginHorizontal: 8 },
  albumArtist: { color: C.textSecondary, fontSize: 11, marginHorizontal: 8, marginTop: 1 },
  albumCount: { color: C.textMuted, fontSize: 10, marginHorizontal: 8, marginTop: 2 },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: C.bgCard,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  artistAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  artistName: { color: C.textPrimary, fontSize: 14, fontWeight: '700' },
  artistCount: { color: C.textSecondary, fontSize: 12, marginTop: 2 },
  genreCard: {
    width: (SW - 44) / 2,
    backgroundColor: C.bgCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  genreName: { color: C.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 10 },
  genreCount: { color: C.textSecondary, fontSize: 12, marginTop: 2 },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: C.bgCard,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  folderName: { color: C.textPrimary, fontSize: 14, fontWeight: '600' },
  folderCount: { color: C.textSecondary, fontSize: 12, marginTop: 2 },

  // Select Item Row
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 13,
    marginVertical: 2,
    backgroundColor: C.bgCard,
  },
  selectRowChecked: {
    backgroundColor: C.bgElevated,
    borderWidth: 1,
    borderColor: C.accentLight,
  },
  checkIconWrap: {
    marginRight: 10,
  },
  trackTitle: { color: C.textPrimary, fontSize: 14, fontWeight: '600' },
  trackArtist: { color: C.textSecondary, fontSize: 12, marginTop: 2 },
  trackDur: { color: C.textMuted, fontSize: 11.5 },

  // Floating Bulk Bar
  bulkBarContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    alignItems: 'center',
  },
  bulkBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.accentLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
    gap: 8,
  },
  bulkActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bulkActionTxt: {
    color: C.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  bulkDivider: {
    width: 1,
    height: 20,
    backgroundColor: C.border,
  },

  // Modal Backdrop & Dialog
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteDialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: C.bgCard,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
  },
  deleteIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(236,72,153,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  deleteDialogTitle: {
    color: C.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  deleteDialogDesc: {
    color: C.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 18,
    lineHeight: 18,
  },
  deleteOptionBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgElevated,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  deleteOptionTitle: {
    color: C.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  deleteOptionSub: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  deleteCancelBtn: {
    paddingVertical: 10,
    marginTop: 4,
  },
  deleteCancelTxt: {
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
