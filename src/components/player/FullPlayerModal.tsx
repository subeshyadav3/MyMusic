import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Platform, ScrollView, useWindowDimensions, Easing, Pressable, Image,
} from 'react-native';
import {
  ChevronDown, Heart, Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, ListMusic, Clock, MoreHorizontal,
  FileText, Sparkles, X, Info, Trash2, Smartphone, HardDrive, ArrowLeft,
} from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import type { ColorTheme } from '../../constants/colors';
import { useMusicStore } from '../../store/useMusicStore';
import { formatTime } from '../../utils/formatters';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parseLRC, activeLyricIndex, lrcPathForTrack, LyricLine } from '../../utils/lyrics';
import { TrackArtwork } from '../music/TrackArtwork';
import { useThemeColors } from '../../constants/theme';

export const FullPlayerModal: React.FC = () => {
  const theme = useThemeColors();
  const insets = useSafeAreaInsets();
  const { width: winW, height: winH } = useWindowDimensions();
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 76 : 36);
  const safeTop = Math.max(insets.top, Platform.OS === 'ios' ? 52 : 32);
  const artSize = Math.min(winW - 72, winH * 0.28, 250);
  const styles = useMemo(() => makeStyles(theme, artSize), [theme, artSize]);

  const {
    currentTrack, isPlaying, position, duration,
    shuffleMode, repeatMode, isFullPlayerVisible, currentQueue,
    sleepTimerEnd,
    setFullPlayerVisible, togglePlayPause, skipToNext, skipToPrevious,
    seekTo, toggleFavorite, isFavorite, toggleShuffle, cycleRepeat,
    setAddToPlaylistVisible, setSleepTimerVisible, setQueueVisible,
    deleteTrack,
  } = useMusicStore();

  const [showLyrics, setShowLyrics] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sheetView, setSheetView] = useState<'specs' | 'delete'>('specs');
  const [seeking, setSeeking] = useState(false);
  const [seekVal, setSeekVal] = useState(0);
  const [syncedLyrics, setSyncedLyrics] = useState<LyricLine[] | null>(null);
  const [lyricsStatus, setLyricsStatus] = useState<'idle' | 'loading' | 'found' | 'missing'>('idle');
  const lyricsScrollRef = useRef<ScrollView>(null);

  // Smooth artwork spring scale on play/pause
  const artScale = useRef(new Animated.Value(isPlaying ? 1.0 : 0.94)).current;
  useEffect(() => {
    Animated.spring(artScale, {
      toValue: isPlaying ? 1.0 : 0.94,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
  }, [isPlaying]);

  // 15-bar ultra-fluid hardware-accelerated audio wave (co-prime organic cycle, 60/120fps native)
  const b0 = useRef(new Animated.Value(0.18)).current;
  const b1 = useRef(new Animated.Value(0.22)).current;
  const b2 = useRef(new Animated.Value(0.28)).current;
  const b3 = useRef(new Animated.Value(0.35)).current;
  const b4 = useRef(new Animated.Value(0.45)).current;
  const b5 = useRef(new Animated.Value(0.6)).current;
  const b6 = useRef(new Animated.Value(0.75)).current;
  const b7 = useRef(new Animated.Value(0.95)).current; // Center peak
  const b8 = useRef(new Animated.Value(0.75)).current;
  const b9 = useRef(new Animated.Value(0.6)).current;
  const b10 = useRef(new Animated.Value(0.45)).current;
  const b11 = useRef(new Animated.Value(0.35)).current;
  const b12 = useRef(new Animated.Value(0.28)).current;
  const b13 = useRef(new Animated.Value(0.22)).current;
  const b14 = useRef(new Animated.Value(0.18)).current;
  const waveBars = [b0, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14];

  useEffect(() => {
    if (isPlaying) {
      // Co-prime multi-step loop sequences running 100% on native render thread
      const loops = [
        Animated.loop(Animated.sequence([
          Animated.timing(b0, { toValue: 0.65, duration: 410, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b0, { toValue: 0.2, duration: 290, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b0, { toValue: 0.72, duration: 350, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b0, { toValue: 0.18, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(b1, { toValue: 0.78, duration: 360, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b1, { toValue: 0.25, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b1, { toValue: 0.85, duration: 400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b1, { toValue: 0.22, duration: 270, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(b2, { toValue: 0.88, duration: 390, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b2, { toValue: 0.3, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b2, { toValue: 0.75, duration: 340, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b2, { toValue: 0.28, duration: 310, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(b3, { toValue: 0.95, duration: 330, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b3, { toValue: 0.35, duration: 370, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b3, { toValue: 0.88, duration: 310, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b3, { toValue: 0.32, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(b4, { toValue: 1.0, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b4, { toValue: 0.4, duration: 350, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b4, { toValue: 0.92, duration: 290, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b4, { toValue: 0.38, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(b5, { toValue: 0.96, duration: 340, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b5, { toValue: 0.42, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b5, { toValue: 1.0, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b5, { toValue: 0.45, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(b6, { toValue: 1.0, duration: 270, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b6, { toValue: 0.5, duration: 330, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b6, { toValue: 0.95, duration: 290, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b6, { toValue: 0.48, duration: 310, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
        // Center Peak (b7)
        Animated.loop(Animated.sequence([
          Animated.timing(b7, { toValue: 1.0, duration: 250, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b7, { toValue: 0.55, duration: 310, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b7, { toValue: 0.98, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b7, { toValue: 0.52, duration: 260, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(b8, { toValue: 0.98, duration: 310, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b8, { toValue: 0.48, duration: 290, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b8, { toValue: 1.0, duration: 330, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b8, { toValue: 0.46, duration: 270, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(b9, { toValue: 0.92, duration: 290, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b9, { toValue: 0.4, duration: 360, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b9, { toValue: 0.96, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b9, { toValue: 0.38, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(b10, { toValue: 1.0, duration: 320, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b10, { toValue: 0.36, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b10, { toValue: 0.9, duration: 350, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b10, { toValue: 0.32, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(b11, { toValue: 0.9, duration: 380, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b11, { toValue: 0.32, duration: 310, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b11, { toValue: 0.82, duration: 330, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b11, { toValue: 0.28, duration: 270, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(b12, { toValue: 0.85, duration: 350, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b12, { toValue: 0.28, duration: 290, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b12, { toValue: 0.78, duration: 370, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b12, { toValue: 0.24, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(b13, { toValue: 0.75, duration: 400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b13, { toValue: 0.24, duration: 330, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b13, { toValue: 0.7, duration: 360, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b13, { toValue: 0.2, duration: 280, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
        Animated.loop(Animated.sequence([
          Animated.timing(b14, { toValue: 0.65, duration: 430, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b14, { toValue: 0.18, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b14, { toValue: 0.6, duration: 340, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(b14, { toValue: 0.18, duration: 290, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
      ];
      loops.forEach(l => l.start());
      return () => loops.forEach(l => l.stop());
    } else {
      waveBars.forEach((bar, i) => {
        const dist = Math.abs(i - 7) / 7;
        Animated.timing(bar, {
          toValue: 0.18 + (1 - dist) * 0.2,
          duration: 180,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isPlaying]);

  // Load companion .lrc file
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setSyncedLyrics(null);
      setLyricsStatus('idle');
      const lrcPath = lrcPathForTrack(currentTrack?.filePath);
      if (!lrcPath || Platform.OS === 'web') return;
      try {
        setLyricsStatus('loading');
        const FS = require('expo-file-system');
        const info = await FS.getInfoAsync('file://' + lrcPath).catch(() => null);
        if (!info?.exists) {
          if (!cancelled) setLyricsStatus('missing');
          return;
        }
        const content: string = await FS.readAsStringAsync('file://' + lrcPath);
        const parsed = parseLRC(content);
        if (!cancelled) {
          if (parsed.length > 0) {
            setSyncedLyrics(parsed);
            setLyricsStatus('found');
          } else {
            setLyricsStatus('missing');
          }
        }
      } catch {
        if (!cancelled) setLyricsStatus('missing');
      }
    };
    load();
    return () => { cancelled = true; };
  }, [currentTrack?.id]);

  const isFav = currentTrack ? isFavorite(currentTrack.id) : false;
  const dispPos = seeking ? seekVal : position;
  const maxDur = duration > 0 ? duration : (currentTrack?.duration || 1);
  const remainingTime = Math.max(0, maxDur - dispPos);
  const activeLyric = syncedLyrics ? activeLyricIndex(syncedLyrics, dispPos) : -1;

  useEffect(() => {
    if (showLyrics && activeLyric >= 0) {
      lyricsScrollRef.current?.scrollTo({
        y: Math.max(0, activeLyric * 46 - 120),
        animated: true,
      });
    }
  }, [activeLyric, showLyrics]);

  if (!currentTrack) return null;

  const formatSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return 'Unknown';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const openSheet = () => {
    setSheetView('specs');
    setShowSheet(true);
  };

  const closeSheet = () => {
    setShowSheet(false);
    setSheetView('specs');
  };

  const handleDelete = async (deleteFromDevice: boolean) => {
    closeSheet();
    setFullPlayerVisible(false);
    await deleteTrack(currentTrack.id, deleteFromDevice);
  };

  return (
    <Modal
      visible={isFullPlayerVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        if (showSheet) closeSheet();
        else if (showLyrics) setShowLyrics(false);
        else setFullPlayerVisible(false);
      }}
    >
      <View style={styles.container}>
        {/* Dynamic ambient blurred background */}
        {currentTrack?.artwork ? (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Image
              source={{ uri: currentTrack.artwork }}
              style={styles.ambientArt}
              blurRadius={Platform.OS === 'ios' ? 28 : 18}
            />
            <View style={styles.ambientOverlay} />
          </View>
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.ambientGlowFallback]} pointerEvents="none">
            <View style={styles.ambientOrb1} />
            <View style={styles.ambientOrb2} />
          </View>
        )}

        <View style={[styles.innerWrapper, { paddingTop: safeTop, paddingBottom: safeBottom }]}>
          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => setFullPlayerVisible(false)}
              style={styles.iconBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ChevronDown size={26} color={theme.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerTitleBox}>
              <Text style={styles.headerSub}>PLAYING FROM</Text>
              <Text style={styles.headerMain} numberOfLines={1}>
                {currentTrack.album || 'My Library'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={openSheet}
              style={styles.iconBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <MoreHorizontal size={22} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Main Area: Artwork or Lyrics */}
          {!showLyrics ? (
            <View style={styles.centerSection}>
              {/* Artwork with Soft Neon Glow Aura */}
              <View style={styles.artSection}>
                <View style={styles.artAura} />
                <Animated.View style={[styles.artWrapper, { transform: [{ scale: artScale }] }]}>
                  <TrackArtwork
                    uri={currentTrack.artwork}
                    size={artSize}
                    borderRadius={22}
                    iconSize={64}
                  />
                </Animated.View>
              </View>

              {/* Title & Artist & Favorite */}
              <View style={styles.metaRow}>
                <View style={styles.metaLeft}>
                  <Text style={styles.trackTitle} numberOfLines={1}>
                    {currentTrack.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {currentTrack.artist}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => toggleFavorite(currentTrack.id)}
                  style={styles.favBtn}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Heart
                    size={24}
                    color={isFav ? theme.accentPink : theme.textMuted}
                    fill={isFav ? theme.accentPink : 'transparent'}
                  />
                </TouchableOpacity>
              </View>

              {/* 15-Bar Butter-Smooth Flawless Audio Wave (60/120fps hardware-accelerated) */}
              <View style={styles.waveformContainer}>
                {waveBars.map((anim, idx) => {
                  const isCenter = idx >= 5 && idx <= 9;
                  return (
                    <Animated.View
                      key={idx}
                      style={[
                        styles.waveBar,
                        { transform: [{ scaleY: anim }] },
                        isCenter && { backgroundColor: theme.accentLight, width: 3.5 },
                      ]}
                    />
                  );
                })}
              </View>
            </View>
          ) : (
            /* Lyrics View */
            <View style={styles.lyricsContainer}>
              <View style={styles.lyricsTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={16} color={theme.accentLight} />
                  <Text style={styles.lyricsHeading}>
                    {syncedLyrics ? 'Synced Lyrics' : 'Lyrics'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowLyrics(false)} style={styles.lyricsCloseBtn}>
                  <X size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView
                ref={lyricsScrollRef}
                style={styles.lyricsScroll}
                contentContainerStyle={styles.lyricsScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {syncedLyrics ? (
                  syncedLyrics.map((line, i) => {
                    const isActive = i === activeLyric;
                    return (
                      <TouchableOpacity
                        key={i}
                        activeOpacity={0.7}
                        onPress={() => seekTo(line.time)}
                        style={styles.lyricLineWrap}
                      >
                        <Text style={[styles.lyricLine, isActive && styles.lyricLineActive]}>
                          {line.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.lyricsEmpty}>
                    <Text style={styles.lyricsEmptyText}>
                      {lyricsStatus === 'loading'
                        ? 'Searching for synced lyrics…'
                        : 'No synced lyrics found for this song.'}
                    </Text>
                    <Text style={styles.lyricsHint}>
                      Place a matching .lrc file in the same folder as this song to enable karaoke lyrics.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}

          {/* Scrubber Progress Bar */}
          <View style={styles.scrubberContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={maxDur}
              value={dispPos}
              minimumTrackTintColor={theme.accentLight}
              maximumTrackTintColor="rgba(255,255,255,0.12)"
              thumbTintColor={theme.accentLight}
              onValueChange={(v) => {
                setSeeking(true);
                setSeekVal(v);
              }}
              onSlidingComplete={async (v) => {
                setSeeking(false);
                await seekTo(v);
              }}
            />
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(dispPos)}</Text>
              <Text style={styles.timeText}>-{formatTime(remainingTime)}</Text>
            </View>
          </View>

          {/* Main Playback Controls */}
          <View style={styles.mainControlsRow}>
            {/* Shuffle */}
            <TouchableOpacity style={styles.ctrlSideBtn} onPress={toggleShuffle}>
              <Shuffle size={20} color={shuffleMode ? theme.accentLight : theme.textMuted} />
              {shuffleMode && <View style={styles.activeDot} />}
            </TouchableOpacity>

            {/* Previous */}
            <TouchableOpacity style={styles.ctrlSkipBtn} onPress={skipToPrevious}>
              <SkipBack size={28} color={theme.textPrimary} fill={theme.textPrimary} />
            </TouchableOpacity>

            {/* Big Play / Pause */}
            <TouchableOpacity
              style={styles.bigPlayButton}
              onPress={togglePlayPause}
              activeOpacity={0.88}
            >
              {isPlaying ? (
                <Pause size={30} color="#FFF" />
              ) : (
                <Play size={30} color="#FFF" fill="#FFF" style={{ marginLeft: 3 }} />
              )}
            </TouchableOpacity>

            {/* Next */}
            <TouchableOpacity style={styles.ctrlSkipBtn} onPress={skipToNext}>
              <SkipForward size={28} color={theme.textPrimary} fill={theme.textPrimary} />
            </TouchableOpacity>

            {/* Repeat */}
            <TouchableOpacity style={styles.ctrlSideBtn} onPress={cycleRepeat}>
              {repeatMode === 'track' ? (
                <Repeat1 size={20} color={theme.accentLight} />
              ) : (
                <Repeat size={20} color={repeatMode === 'queue' ? theme.accentLight : theme.textMuted} />
              )}
              {repeatMode !== 'off' && <View style={styles.activeDot} />}
            </TouchableOpacity>
          </View>

          {/* Bottom Utility Actions (Lyrics, Queue, Sleep Timer) */}
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={[styles.bottomPill, showLyrics && styles.bottomPillActive]}
              onPress={() => setShowLyrics(!showLyrics)}
            >
              <FileText size={15} color={showLyrics ? theme.accentLight : theme.textSecondary} />
              <Text style={[styles.bottomPillTxt, showLyrics && { color: theme.accentLight }]}>
                Lyrics
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomPill}
              onPress={() => setQueueVisible(true)}
            >
              <ListMusic size={15} color={theme.textSecondary} />
              <Text style={styles.bottomPillTxt}>Queue ({currentQueue.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomPill}
              onPress={() => setSleepTimerVisible(true)}
            >
              <Clock size={15} color={sleepTimerEnd ? theme.accentLight : theme.textSecondary} />
              <Text style={[styles.bottomPillTxt, sleepTimerEnd ? { color: theme.accentLight } : null]}>
                {sleepTimerEnd ? 'Timer' : 'Sleep'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Unified Quick Options & Track Deletion Sheet (No modal overlap) */}
        {showSheet && (
          <Modal visible transparent animationType="fade" onRequestClose={closeSheet}>
            <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeSheet}>
              <Pressable style={styles.specsSheet} onPress={e => e.stopPropagation()}>
                {sheetView === 'specs' ? (
                  <>
                    <View style={styles.specsHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Info size={18} color={theme.accentLight} />
                        <Text style={styles.specsTitle}>Track Details</Text>
                      </View>
                      <TouchableOpacity onPress={closeSheet} style={{ padding: 4 }}>
                        <X size={20} color={theme.textMuted} />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.specCard}>
                      <View style={styles.specRow}>
                        <Text style={styles.specLabel}>Title</Text>
                        <Text style={styles.specValue}>{currentTrack.title}</Text>
                      </View>
                      <View style={styles.specDivider} />
                      <View style={styles.specRow}>
                        <Text style={styles.specLabel}>Artist</Text>
                        <Text style={styles.specValue}>{currentTrack.artist}</Text>
                      </View>
                      <View style={styles.specDivider} />
                      <View style={styles.specRow}>
                        <Text style={styles.specLabel}>Album</Text>
                        <Text style={styles.specValue}>{currentTrack.album || 'Unknown'}</Text>
                      </View>
                      <View style={styles.specDivider} />
                      <View style={styles.specRow}>
                        <Text style={styles.specLabel}>Duration</Text>
                        <Text style={styles.specValue}>{formatTime(currentTrack.duration || duration)}</Text>
                      </View>
                      <View style={styles.specDivider} />
                      <View style={styles.specRow}>
                        <Text style={styles.specLabel}>Format</Text>
                        <Text style={styles.specValue}>{(currentTrack.fileFormat || 'audio').toUpperCase()}</Text>
                      </View>
                      <View style={styles.specDivider} />
                      <View style={styles.specRow}>
                        <Text style={styles.specLabel}>Size</Text>
                        <Text style={styles.specValue}>{formatSize(currentTrack.fileSize)}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.addPlaylistBtn}
                      onPress={() => {
                        closeSheet();
                        setAddToPlaylistVisible(true, currentTrack);
                      }}
                    >
                      <Text style={styles.addPlaylistTxt}>Add to Playlist</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtnInSheet}
                      onPress={() => setSheetView('delete')}
                    >
                      <Trash2 size={16} color={theme.accentPink} />
                      <Text style={styles.deleteBtnInSheetTxt}>Delete Track…</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  /* Delete Confirmation inside the same sheet (zero overlap) */
                  <View style={styles.deleteSheetBox}>
                    <View style={styles.deleteIconWrap}>
                      <Trash2 size={24} color={theme.accentPink} />
                    </View>

                    <Text style={styles.deleteDialogTitle}>Delete Track</Text>
                    <Text style={styles.deleteDialogSub} numberOfLines={1}>
                      "{currentTrack.title}"
                    </Text>
                    <Text style={styles.deleteDialogDesc}>
                      Choose how you would like to delete this track:
                    </Text>

                    {/* Option 1: Remove from App Only */}
                    <TouchableOpacity
                      style={styles.deleteOptionBtn}
                      onPress={() => handleDelete(false)}
                    >
                      <Smartphone size={18} color={theme.textPrimary} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.deleteOptionTitle}>Remove from App Only</Text>
                        <Text style={styles.deleteOptionSub}>Keeps original audio on your device storage</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Option 2: Delete from Mobile Storage */}
                    <TouchableOpacity
                      style={[styles.deleteOptionBtn, { borderColor: 'rgba(236,72,153,0.35)', backgroundColor: 'rgba(236,72,153,0.08)' }]}
                      onPress={() => handleDelete(true)}
                    >
                      <HardDrive size={18} color={theme.accentPink} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.deleteOptionTitle, { color: theme.accentPink }]}>
                          Delete from Mobile Storage
                        </Text>
                        <Text style={styles.deleteOptionSub}>Permanently erases audio file from phone</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backBtn}
                      onPress={() => setSheetView('specs')}
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
      </View>
    </Modal>
  );
};

const makeStyles = (C: ColorTheme, artSize: number) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientArt: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    opacity: 0.32,
    transform: [{ scale: 1.25 }],
  },
  ambientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(9, 9, 15, 0.78)',
  },
  ambientGlowFallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: C.bg,
    overflow: 'hidden',
  },
  ambientOrb1: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: C.accent,
    opacity: 0.15,
  },
  ambientOrb2: {
    position: 'absolute',
    bottom: 80,
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: C.accentLight,
    opacity: 0.1,
  },
  artSection: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 14,
  },
  artAura: {
    position: 'absolute',
    width: artSize * 0.92,
    height: artSize * 0.92,
    borderRadius: (artSize * 0.92) / 2,
    backgroundColor: C.accent,
    opacity: 0.26,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 30,
    elevation: 16,
  },
  innerWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 12,
  },
  headerSub: {
    color: C.textMuted,
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerMain: {
    color: C.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  artWrapper: {
    width: artSize,
    height: artSize,
    borderRadius: 22,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  metaLeft: {
    flex: 1,
    marginRight: 12,
  },
  trackTitle: {
    color: C.textPrimary,
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  trackArtist: {
    color: C.textSecondary,
    fontSize: 14.5,
    fontWeight: '500',
    marginTop: 2,
  },
  favBtn: {
    padding: 6,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 26,
    marginTop: 8,
  },
  waveBar: {
    width: 3,
    height: 22,
    backgroundColor: C.accent,
    borderRadius: 2,
    opacity: 0.85,
  },
  scrubberContainer: {
    width: '100%',
    marginVertical: 2,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: -6,
  },
  timeText: {
    color: C.textMuted,
    fontSize: 11.5,
    fontVariant: ['tabular-nums'],
  },
  mainControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 12,
    marginVertical: 4,
  },
  ctrlSideBtn: {
    padding: 10,
    alignItems: 'center',
    position: 'relative',
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.accentLight,
  },
  ctrlSkipBtn: {
    padding: 8,
  },
  bigPlayButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingTop: 6,
  },
  bottomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.bgCard,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  bottomPillActive: {
    borderColor: C.accentLight,
    backgroundColor: C.bgElevated,
  },
  bottomPillTxt: {
    color: C.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  lyricsContainer: {
    flex: 1,
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    marginVertical: 8,
  },
  lyricsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lyricsHeading: {
    color: C.accentLight,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  lyricsCloseBtn: {
    padding: 4,
  },
  lyricsScroll: {
    flex: 1,
  },
  lyricsScrollContent: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  lyricLineWrap: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  lyricLine: {
    color: C.textMuted,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  lyricLineActive: {
    color: C.textPrimary,
    fontSize: 19,
    fontWeight: '800',
  },
  lyricsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  lyricsEmptyText: {
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  lyricsHint: {
    color: C.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'flex-end',
  },
  specsSheet: {
    backgroundColor: C.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === 'android' ? 76 : 36,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  specsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  specsTitle: {
    color: C.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  specCard: {
    backgroundColor: C.bgElevated,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  specLabel: {
    color: C.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  specValue: {
    color: C.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    maxWidth: '65%',
    textAlign: 'right',
  },
  specDivider: {
    height: 1,
    backgroundColor: C.border,
  },
  addPlaylistBtn: {
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  addPlaylistTxt: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  deleteBtnInSheet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(236,72,153,0.1)',
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(236,72,153,0.3)',
  },
  deleteBtnInSheetTxt: {
    color: C.accentPink,
    fontSize: 14,
    fontWeight: '700',
  },

  // Delete View inside Sheet
  deleteSheetBox: {
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
  deleteDialogTitle: {
    color: C.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  deleteDialogSub: {
    color: C.accentLight,
    fontSize: 13.5,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  deleteDialogDesc: {
    color: C.textSecondary,
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
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
