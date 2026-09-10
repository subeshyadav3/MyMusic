import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Clock, Check, Disc } from 'lucide-react-native';
import type { ColorTheme } from '../../constants/colors';
import { useMusicStore } from '../../store/useMusicStore';
import { useThemeColors } from '../../constants/theme';

const OPTIONS = [
  { label: '5 min', value: 5 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
];

export const SleepTimerModal: React.FC = () => {
  const theme = useThemeColors();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const {
    isSleepTimerVisible, sleepTimerEnd, duration, position,
    setSleepTimerVisible, setSleepTimer,
  } = useMusicStore();

  const [remaining, setRemaining] = useState<string | null>(null);
  const [customMin, setCustomMin] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (sleepTimerEnd) {
      const tick = () => {
        const left = Math.max(0, Math.floor((sleepTimerEnd - Date.now()) / 1000));
        const m = Math.floor(left / 60);
        const s = left % 60;
        setRemaining(`${m}:${s.toString().padStart(2, '0')}`);
        if (left === 0) {
          setSleepTimer(null);
          if (intervalRef.current) clearInterval(intervalRef.current);
          const { pauseAudio } = require('../../services/PlaybackManager');
          pauseAudio().catch(() => {});
          useMusicStore.getState().setIsPlaying(false);
        }
      };
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setRemaining(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sleepTimerEnd]);

  const handleCustomSubmit = () => {
    const mins = parseInt(customMin.trim(), 10);
    if (!isNaN(mins) && mins > 0) {
      setSleepTimer(mins);
      setCustomMin('');
      setShowCustom(false);
      setSleepTimerVisible(false);
    }
  };

  const handleEndOfTrack = () => {
    const remainingSec = Math.max(5, duration - position);
    const mins = Math.max(0.1, remainingSec / 60);
    setSleepTimer(mins);
    setSleepTimerVisible(false);
  };

  return (
    <Modal
      visible={isSleepTimerVisible}
      animationType="slide"
      transparent
      onRequestClose={() => setSleepTimerVisible(false)}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 68 : 28) + 16 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Clock size={20} color={theme.accentLight} />
              <Text style={styles.title}>Sleep Timer</Text>
            </View>
            <TouchableOpacity onPress={() => setSleepTimerVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={20} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Active Timer Display */}
          {remaining && (
            <View style={styles.activeTimer}>
              <Text style={styles.activeLabel}>Playback will stop in</Text>
              <Text style={styles.remainingTxt}>{remaining}</Text>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSleepTimer(null)}>
                <Text style={styles.cancelTxt}>Cancel Timer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* End of Current Track Option */}
          <TouchableOpacity style={styles.endOfTrackBtn} onPress={handleEndOfTrack}>
            <Disc size={18} color={theme.accentLight} />
            <Text style={styles.endOfTrackTxt}>Stop at end of this song</Text>
          </TouchableOpacity>

          {/* Preset Grid */}
          <View style={styles.grid}>
            {OPTIONS.map(o => (
              <TouchableOpacity
                key={o.value}
                style={styles.option}
                onPress={() => {
                  setSleepTimer(o.value);
                  setSleepTimerVisible(false);
                }}
              >
                <Text style={styles.optionTxt}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Timer Row */}
          {!showCustom ? (
            <TouchableOpacity
              style={styles.customToggleBtn}
              onPress={() => setShowCustom(true)}
            >
              <Text style={styles.customToggleTxt}>+ Set Custom Minutes</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                placeholder="Enter minutes (e.g. 90)"
                placeholderTextColor={theme.textMuted}
                keyboardType="number-pad"
                value={customMin}
                onChangeText={setCustomMin}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCustomSubmit}
              />
              <TouchableOpacity style={styles.customConfirmBtn} onPress={handleCustomSubmit}>
                <Check size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
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
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: C.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  activeTimer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: C.bgElevated,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  activeLabel: {
    color: C.textSecondary,
    fontSize: 12,
  },
  remainingTxt: {
    color: C.accentLight,
    fontSize: 36,
    fontWeight: '800',
    marginVertical: 4,
    fontVariant: ['tabular-nums'],
  },
  cancelBtn: {
    marginTop: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: C.bgSurface,
    borderRadius: 20,
  },
  cancelTxt: {
    color: C.accentPink,
    fontSize: 13,
    fontWeight: '700',
  },
  endOfTrackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.bgElevated,
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  endOfTrackTxt: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  option: {
    width: '31%',
    backgroundColor: C.bgElevated,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  optionTxt: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  customToggleBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  customToggleTxt: {
    color: C.accentLight,
    fontSize: 13.5,
    fontWeight: '700',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  customInput: {
    flex: 1,
    backgroundColor: C.bgElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: C.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: C.accentLight,
  },
  customConfirmBtn: {
    backgroundColor: C.accent,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
