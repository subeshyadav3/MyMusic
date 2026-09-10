import React, { useRef, useMemo, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Pressable, Dimensions, Easing, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Play, Pause, SkipForward, Heart } from 'lucide-react-native';
import type { ColorTheme } from '../../constants/colors';
import { useThemeColors } from '../../constants/theme';
import { useMusicStore } from '../../store/useMusicStore';
import { TrackArtwork } from '../music/TrackArtwork';

const { width: SW } = Dimensions.get('window');

export const MiniPlayer: React.FC = () => {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const {
    currentTrack, isPlaying, position, duration,
    togglePlayPause, skipToNext, setFullPlayerVisible,
    toggleFavorite, isFavorite,
  } = useMusicStore();

  const scale = useRef(new Animated.Value(1)).current;

  // 5-bar ultra-fluid hardware-accelerated audio wave (co-prime organic cycle, 60/120fps native)
  const w1 = useRef(new Animated.Value(0.2)).current;
  const w2 = useRef(new Animated.Value(0.35)).current;
  const w3 = useRef(new Animated.Value(0.5)).current;
  const w4 = useRef(new Animated.Value(0.35)).current;
  const w5 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    if (isPlaying) {
      const anims = [
        Animated.loop(
          Animated.sequence([
            Animated.timing(w1, { toValue: 0.85, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(w1, { toValue: 0.25, duration: 270, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(w1, { toValue: 0.65, duration: 330, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(w1, { toValue: 0.2, duration: 250, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(w2, { toValue: 0.95, duration: 310, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(w2, { toValue: 0.35, duration: 390, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(w2, { toValue: 0.8, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(w2, { toValue: 0.25, duration: 340, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(w3, { toValue: 1.0, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(w3, { toValue: 0.45, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(w3, { toValue: 0.9, duration: 290, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(w3, { toValue: 0.3, duration: 270, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(w4, { toValue: 0.88, duration: 350, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(w4, { toValue: 0.3, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(w4, { toValue: 0.75, duration: 340, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(w4, { toValue: 0.25, duration: 310, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ])
        ),
        Animated.loop(
          Animated.sequence([
            Animated.timing(w5, { toValue: 0.75, duration: 290, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(w5, { toValue: 0.2, duration: 360, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(w5, { toValue: 0.6, duration: 270, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            Animated.timing(w5, { toValue: 0.2, duration: 310, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          ])
        ),
      ];
      anims.forEach(a => a.start());
      return () => anims.forEach(a => a.stop());
    } else {
      [w1, w2, w3, w4, w5].forEach(anim => {
        Animated.timing(anim, {
          toValue: 0.2,
          duration: 180,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isPlaying]);

  if (!currentTrack) return null;

  const progress = duration > 0 ? Math.min(position / duration, 1) : 0;
  const isFav = isFavorite(currentTrack.id);
  // Float cleanly above bottom tab bar (tabBar height is 60 + bottomInset)
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);
  const bottomPosition = 68 + bottomInset;

  return (
    <View style={[styles.outerContainer, { bottom: bottomPosition }]} pointerEvents="box-none">
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        {/* Top Progress Line */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` as any }]} />
        </View>

        <Pressable
          style={styles.contentRow}
          onPress={() => setFullPlayerVisible(true)}
          onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        >
          {/* Artwork Thumbnail */}
          <View style={styles.artContainer}>
            <TrackArtwork uri={currentTrack.artwork} size={42} borderRadius={10} iconSize={16} />
          </View>

          {/* Song Meta */}
          <View style={styles.textColumn}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>

          {/* 5-bar Flawless Audio Wavelength (60/120fps hardware-accelerated) */}
          {isPlaying && (
            <View style={styles.miniWaveContainer}>
              <Animated.View style={[styles.miniWaveBar, { transform: [{ scaleY: w1 }] }]} />
              <Animated.View style={[styles.miniWaveBar, { transform: [{ scaleY: w2 }] }]} />
              <Animated.View style={[styles.miniWaveBar, { transform: [{ scaleY: w3 }], backgroundColor: theme.accentLight, width: 3 }]} />
              <Animated.View style={[styles.miniWaveBar, { transform: [{ scaleY: w4 }] }]} />
              <Animated.View style={[styles.miniWaveBar, { transform: [{ scaleY: w5 }] }]} />
            </View>
          )}

          {/* Quick Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              onPress={() => toggleFavorite(currentTrack.id)}
              style={styles.actionBtn}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              <Heart
                size={18}
                color={isFav ? theme.accentPink : theme.textMuted}
                fill={isFav ? theme.accentPink : 'transparent'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={togglePlayPause}
              style={styles.playButton}
              activeOpacity={0.85}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {isPlaying ? (
                <Pause size={17} color="#FFF" />
              ) : (
                <Play size={17} color="#FFF" fill="#FFF" style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={skipToNext}
              style={styles.actionBtn}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            >
              <SkipForward size={19} color={theme.textPrimary} fill={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    width: Math.min(SW - 20, 520),
    backgroundColor: C.bgCard,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  progressTrack: {
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.accentLight,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  artContainer: {
    width: 42,
    height: 42,
    marginRight: 11,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: C.bgSurface,
  },
  textColumn: {
    flex: 1,
    marginRight: 6,
  },
  trackTitle: {
    color: C.textPrimary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  trackArtist: {
    color: C.textSecondary,
    fontSize: 11.5,
    marginTop: 1.5,
    fontWeight: '500',
  },
  miniWaveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2.5,
    height: 20,
    marginRight: 6,
    paddingHorizontal: 3,
  },
  miniWaveBar: {
    width: 2.5,
    height: 16,
    backgroundColor: C.accent,
    borderRadius: 1.5,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtn: {
    padding: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
});
