import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, Alert, Platform } from 'react-native';
import { X, Play, Trash2, ListMusic, Shuffle } from 'lucide-react-native';
import type { ColorTheme } from '../../constants/colors';
import { useThemeColors } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMusicStore } from '../../store/useMusicStore';
import { formatTime } from '../../utils/formatters';

export const QueueModal: React.FC = () => {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const {
    isQueueVisible, setQueueVisible, currentQueue, currentTrack, queueIndex,
    playTrack, removeFromQueue, clearQueue, createPlaylist,
    shuffleMode, toggleShuffle,
  } = useMusicStore();

  const handleSaveAsPlaylist = async () => {
    if (currentQueue.length === 0) return;
    const pl = await createPlaylist(`Queue ${new Date().toLocaleDateString()}`);
    for (const t of currentQueue) {
      await useMusicStore.getState().addToPlaylist(pl.id, t.id);
    }
    Alert.alert('Saved', `Queue saved as "${pl.name}"`);
  };

  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 68 : 28) + 16;

  return (
    <Modal
      visible={isQueueVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setQueueVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: theme.bgCard, borderColor: theme.border, paddingBottom: safeBottom }]}>
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ListMusic size={18} color={theme.accentLight} />
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Up Next ({currentQueue.length})
              </Text>
            </View>
            <TouchableOpacity onPress={() => setQueueVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.btn,
                { borderColor: theme.border },
                shuffleMode && { backgroundColor: theme.accentLight + '20', borderColor: theme.accentLight },
              ]}
              onPress={toggleShuffle}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Shuffle size={13} color={shuffleMode ? theme.accentLight : theme.textMuted} />
                <Text style={[styles.btnTxt, { color: shuffleMode ? theme.accentLight : theme.textMuted }]}>
                  {shuffleMode ? 'Shuffle ON' : 'Sequential'}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, { borderColor: theme.border }]} onPress={handleSaveAsPlaylist}>
              <Text style={[styles.btnTxt, { color: theme.accentLight }]}>Save as playlist</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, { borderColor: theme.border }]}
              onPress={() => Alert.alert('Clear queue?', 'Remove all queued tracks?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clearQueue },
              ])}
            >
              <Text style={[styles.btnTxt, { color: theme.textMuted }]}>Clear</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={currentQueue}
            keyExtractor={(item, i) => `${item.id}-${i}`}
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const isCurrent = item.id === currentTrack?.id && index === queueIndex;
              return (
                <View style={[styles.row, isCurrent && { borderColor: theme.accentLight, backgroundColor: theme.bgElevated }]}>
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => { playTrack(item, currentQueue); }}>
                    <Text style={[styles.rowTitle, { color: isCurrent ? theme.accentLight : theme.textPrimary }]} numberOfLines={1}>
                      {index + 1}. {item.title}
                    </Text>
                    <Text style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={1}>
                      {item.artist} · {formatTime(item.duration)}
                    </Text>
                  </TouchableOpacity>
                  {!isCurrent && (
                    <TouchableOpacity onPress={() => playTrack(item, currentQueue)} hitSlop={10} style={{ padding: 6 }}>
                      <Play size={16} color={theme.textMuted} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={() => removeFromQueue(index)}
                    hitSlop={10}
                    style={{ padding: 6, marginLeft: 4 }}
                  >
                    <Trash2 size={16} color={theme.accentPink} />
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.textMuted }]}>Queue is empty</Text>
            }
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnTxt: {
    fontSize: 13,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 40,
  },
});
