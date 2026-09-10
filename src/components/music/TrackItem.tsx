import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable, Modal, Platform,
} from 'react-native';
import {
  Heart, MoreVertical, Volume2, Plus, ListPlus, Trash2, X, HardDrive, Smartphone, ArrowLeft,
} from 'lucide-react-native';
import type { ColorTheme } from '../../constants/colors';
import { Track } from '../../types/music';
import { useMusicStore } from '../../store/useMusicStore';
import { formatTime } from '../../utils/formatters';
import { TrackArtwork } from './TrackArtwork';
import { useThemeColors } from '../../constants/theme';

interface Props {
  track: Track;
  queue?: Track[];
  onLongPress?: () => void;
}

export const TrackItem: React.FC<Props> = ({ track, queue, onLongPress }) => {
  const theme = useThemeColors();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const {
    currentTrack, isPlaying, playTrack, toggleFavorite,
    isFavorite, setAddToPlaylistVisible, playNext, deleteTrack,
  } = useMusicStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalView, setModalView] = useState<'actions' | 'delete'>('actions');

  const isCurrent = currentTrack?.id === track.id;
  const isFav = isFavorite(track.id);

  const openModal = () => {
    setModalView('actions');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalView('actions');
  };

  const handleDelete = async (deleteFromDevice: boolean) => {
    closeModal();
    await deleteTrack(track.id, deleteFromDevice);
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.container,
          isCurrent && styles.activeContainer,
          pressed && { opacity: 0.75 },
        ]}
        onPress={() => playTrack(track, queue)}
        onLongPress={onLongPress}
        delayLongPress={300}
      >
        <View style={styles.artWrapper}>
          <TrackArtwork uri={track.artwork} size={46} borderRadius={10} />
          {isCurrent && isPlaying && (
            <View style={styles.overlay}>
              <Volume2 size={15} color={theme.accentLight} />
            </View>
          )}
        </View>

        <View style={styles.meta}>
          <Text
            style={[styles.title, isCurrent && { color: theme.accentLight }]}
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <View style={styles.subRow}>
            <Text style={styles.artist} numberOfLines={1}>
              {track.artist}
              {track.duration ? `  ·  ${formatTime(track.duration)}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => toggleFavorite(track.id)}
            style={styles.actionBtn}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Heart
              size={17}
              color={isFav ? theme.accentPink : theme.textMuted}
              fill={isFav ? theme.accentPink : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={openModal}
            style={styles.actionBtn}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <MoreVertical size={17} color={theme.textMuted} />
          </TouchableOpacity>
        </View>
      </Pressable>

      {/* Unified Track Options & Deletion Modal (No double modals or overlap) */}
      {modalVisible && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={closeModal}
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={closeModal}
          >
            <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
              {modalView === 'actions' ? (
                <>
                  {/* Header */}
                  <View style={styles.headerRow}>
                    <TrackArtwork uri={track.artwork} size={44} borderRadius={10} />
                    <View style={styles.headerTextBox}>
                      <Text style={styles.trackName} numberOfLines={1}>{track.title}</Text>
                      <Text style={styles.trackSub} numberOfLines={1}>{track.artist}</Text>
                    </View>
                    <TouchableOpacity onPress={closeModal} style={styles.closeBtn}>
                      <X size={18} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.divider} />

                  {/* Play Next */}
                  <TouchableOpacity
                    style={styles.itemRow}
                    onPress={() => {
                      closeModal();
                      playNext(track);
                    }}
                  >
                    <ListPlus size={19} color={theme.accentLight} />
                    <Text style={styles.itemTxt}>Play Next in Queue</Text>
                  </TouchableOpacity>

                  {/* Add to Playlist */}
                  <TouchableOpacity
                    style={styles.itemRow}
                    onPress={() => {
                      closeModal();
                      setAddToPlaylistVisible(true, track);
                    }}
                  >
                    <Plus size={19} color={theme.textPrimary} />
                    <Text style={styles.itemTxt}>Add to Playlist</Text>
                  </TouchableOpacity>

                  {/* Delete Track */}
                  <TouchableOpacity
                    style={styles.itemRow}
                    onPress={() => setModalView('delete')}
                  >
                    <Trash2 size={19} color={theme.accentPink} />
                    <Text style={[styles.itemTxt, { color: theme.accentPink }]}>Delete Track…</Text>
                  </TouchableOpacity>
                </>
              ) : (
                /* Delete View */
                <View style={styles.deleteContent}>
                  <View style={styles.deleteIconWrap}>
                    <Trash2 size={24} color={theme.accentPink} />
                  </View>

                  <Text style={styles.deleteHeading}>Delete Music</Text>
                  <Text style={styles.deleteSub} numberOfLines={1}>"{track.title}"</Text>
                  <Text style={styles.deleteDesc}>
                    Choose how you would like to delete this track:
                  </Text>

                  {/* Option 1: Remove from App Only */}
                  <TouchableOpacity
                    style={styles.optionBox}
                    onPress={() => handleDelete(false)}
                  >
                    <Smartphone size={18} color={theme.textPrimary} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.optionBoxTitle}>Remove from App Only</Text>
                      <Text style={styles.optionBoxSub}>Keeps original file safe on your phone storage</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Option 2: Delete from Mobile Storage */}
                  <TouchableOpacity
                    style={[styles.optionBox, styles.optionBoxDanger]}
                    onPress={() => handleDelete(true)}
                  >
                    <HardDrive size={18} color={theme.accentPink} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.optionBoxTitle, { color: theme.accentPink }]}>
                        Delete from Mobile Storage
                      </Text>
                      <Text style={styles.optionBoxSub}>Permanently erases audio file from phone</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Back to actions */}
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => setModalView('actions')}
                  >
                    <ArrowLeft size={16} color={theme.textSecondary} />
                    <Text style={styles.backBtnTxt}>Back</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Pressable>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
};

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 13,
    marginVertical: 2,
    backgroundColor: C.bgCard,
  },
  activeContainer: {
    backgroundColor: C.bgElevated,
    borderWidth: 1,
    borderColor: C.border,
  },
  artWrapper: {
    width: 46,
    height: 46,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: C.bgSurface,
    marginRight: 11,
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,15,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1, paddingRight: 6 },
  title: { color: C.textPrimary, fontSize: 14, fontWeight: '600' },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  artist: { color: C.textSecondary, fontSize: 12, flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  actionBtn: { padding: 6, marginLeft: 2 },

  // Unified Modal
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'android' ? 76 : 36,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTextBox: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  trackName: {
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  trackSub: {
    color: C.textSecondary,
    fontSize: 12.5,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 14,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
  },
  itemTxt: {
    color: C.textPrimary,
    fontSize: 14.5,
    fontWeight: '600',
  },

  // Delete View
  deleteContent: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  deleteIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(236,72,153,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  deleteHeading: {
    color: C.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  deleteSub: {
    color: C.accentLight,
    fontSize: 13.5,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  deleteDesc: {
    color: C.textSecondary,
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  optionBox: {
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
  optionBoxDanger: {
    borderColor: 'rgba(236,72,153,0.3)',
    backgroundColor: 'rgba(236,72,153,0.08)',
  },
  optionBoxTitle: {
    color: C.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  optionBoxSub: {
    color: C.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 2,
  },
  backBtnTxt: {
    color: C.textSecondary,
    fontSize: 13.5,
    fontWeight: '600',
  },
});
