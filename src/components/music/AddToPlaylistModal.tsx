import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, TextInput,
  FlatList, Pressable, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Plus, Check, Music } from 'lucide-react-native';
import type { ColorTheme } from '../../constants/colors';
import { useMusicStore } from '../../store/useMusicStore';
import { useThemeColors } from '../../constants/theme';
import { Track } from '../../types/music';

export const AddToPlaylistModal: React.FC = () => {
  const theme = useThemeColors();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const {
    isAddToPlaylistVisible, trackForPlaylist, tracksForPlaylist, playlists,
    setAddToPlaylistVisible, createPlaylist, addToPlaylist, bulkAddToPlaylist,
  } = useMusicStore();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [added, setAdded] = useState<string[]>([]);

  if (!isAddToPlaylistVisible || (!trackForPlaylist && (!tracksForPlaylist || tracksForPlaylist.length === 0))) {
    return null;
  }

  const activeTracks = tracksForPlaylist && tracksForPlaylist.length > 0
    ? tracksForPlaylist
    : trackForPlaylist ? [trackForPlaylist] : [];

  const isBulk = activeTracks.length > 1;

  const close = () => {
    setAddToPlaylistVisible(false, null);
    setNewName('');
    setCreating(false);
    setAdded([]);
  };

  const handleAdd = async (playlistId: string) => {
    if (isBulk) {
      await bulkAddToPlaylist(playlistId, activeTracks.map((t: Track) => t.id));
    } else if (activeTracks[0]) {
      await addToPlaylist(playlistId, activeTracks[0].id);
    }
    setAdded(p => [...p, playlistId]);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const pl = await createPlaylist(newName.trim());
    if (isBulk) {
      await bulkAddToPlaylist(pl.id, activeTracks.map((t: Track) => t.id));
    } else if (activeTracks[0]) {
      await addToPlaylist(pl.id, activeTracks[0].id);
    }
    setAdded(p => [...p, pl.id]);
    setNewName('');
    setCreating(false);
  };

  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 68 : 28) + 16;

  return (
    <Modal visible={isAddToPlaylistVisible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: safeBottom }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.headerTitle}>Add to Playlist</Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {isBulk
                  ? `${activeTracks.length} tracks selected`
                  : `${activeTracks[0]?.title} · ${activeTracks[0]?.artist}`}
              </Text>
            </View>
            <TouchableOpacity onPress={close} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Create new */}
          <TouchableOpacity style={styles.createRow} onPress={() => setCreating(!creating)}>
            <View style={styles.createIcon}>
              <Plus size={18} color={theme.accentLight} />
            </View>
            <Text style={styles.createLabel}>New Playlist</Text>
          </TouchableOpacity>

          {creating && (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Playlist name…"
                placeholderTextColor={theme.textMuted}
                value={newName}
                onChangeText={setNewName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreate}
              />
              <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
                <Text style={styles.createBtnTxt}>Create</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Playlists List */}
          <FlatList
            data={playlists}
            keyExtractor={p => p.id}
            style={{ maxHeight: 280 }}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const allAlreadyIn = !isBulk
                ? item.trackIds.includes(activeTracks[0]?.id)
                : activeTracks.every((t: Track) => item.trackIds.includes(t.id));
              const isAdded = added.includes(item.id) || allAlreadyIn;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.plItem,
                    pressed && { opacity: 0.7 },
                    isAdded && styles.plItemAdded,
                  ]}
                  onPress={() => !isAdded && handleAdd(item.id)}
                >
                  <View style={styles.plArt}>
                    <Music size={18} color={theme.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.plName}>{item.name}</Text>
                    <Text style={styles.plCount}>{item.trackIds.length} songs</Text>
                  </View>
                  {isAdded && <Check size={18} color={theme.accentLight} />}
                </Pressable>
              );
            }}
            ListEmptyComponent={<Text style={styles.empty}>No playlists yet</Text>}
          />
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    color: C.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  headerSub: {
    color: C.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 8,
  },
  createIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createLabel: {
    color: C.accentLight,
    fontSize: 14,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: C.bgElevated,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: C.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  createBtn: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  createBtnTxt: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  plItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  plItemAdded: {
    opacity: 0.65,
  },
  plArt: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: C.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plName: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  plCount: {
    color: C.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  empty: {
    color: C.textMuted,
    textAlign: 'center',
    marginVertical: 20,
  },
});
