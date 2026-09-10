import React, {useState, useMemo} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
  TextInput, Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Scan, Trash2, Info, Music, ChevronRight, Volume2, User,
  Palette, Gauge, ShieldCheck, Check, Sparkles, Sliders, Moon, RefreshCw,
  Code2, Heart,
} from 'lucide-react-native';
import type { ColorTheme } from '../constants/colors';
import { useMusicStore, EQ_FREQS, EQ_PRESETS } from '../store/useMusicStore';
import { SwipeableTabScreen } from '../components/navigation/SwipeableTabScreen';
import { useThemeColors } from '../constants/theme';
import Slider from '@react-native-community/slider';

const ACCENT_COLORS = [
  { name: 'Purple', hex: '#7C3AED' },
  { name: 'Neon Blue', hex: '#3B82F6' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Sunset', hex: '#F97316' },
  { name: 'Hot Pink', hex: '#EC4899' },
];

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];

const SRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  dangerous?: boolean;
  right?: React.ReactNode;
}> = ({ icon, label, value, onPress, dangerous, right }) => {
  const __theme = useThemeColors();
  const styles = useMemo(() => makeStyles(__theme), [__theme]);
  return (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    disabled={!onPress && !right}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={[styles.rowIcon, dangerous && { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
      {icon}
    </View>
    <View style={styles.rowText}>
      <Text style={[styles.rowLabel, dangerous && { color: __theme.accentPink }]}>{label}</Text>
      {value && <Text style={styles.rowValue}>{value}</Text>}
    </View>
    {right || (onPress && <ChevronRight size={16} color={__theme.textMuted} />)}
  </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const __theme = useThemeColors();
  const styles = useMemo(() => makeStyles(__theme), [__theme]);
  const insets = useSafeAreaInsets();
  const {
    userName, setUserName, settings, updateSettings, setEqBand, setEqPreset,
    allTracks, playlists, favorites, history,
    isScanning, scanLocalTracks, clearHistory,
  } = useMusicStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const handleSaveName = async () => {
    if (tempName.trim()) {
      await setUserName(tempName.trim());
      setIsEditingName(false);
    }
  };

  return (
    <SwipeableTabScreen>
      <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.innerContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <Text style={styles.headerSubtitle}>Preferences, library & playback options</Text>
          </View>

          {/* Profile & Name Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarTxt}>
                {(userName || 'S').charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.profileGreeting}>User Profile</Text>
              {isEditingName ? (
                <View style={styles.nameEditRow}>
                  <TextInput
                    style={styles.nameInput}
                    value={tempName}
                    onChangeText={setTempName}
                    autoFocus
                    placeholder="Enter name"
                    placeholderTextColor={__theme.textMuted}
                    returnKeyType="done"
                    onSubmitEditing={handleSaveName}
                  />
                  <TouchableOpacity style={styles.saveNameBtn} onPress={handleSaveName}>
                    <Check size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.nameDisplayRow}>
                  <Text style={styles.profileName}>{userName || 'Subesh'}</Text>
                  <TouchableOpacity
                    style={styles.editNameBtn}
                    onPress={() => {
                      setTempName(userName);
                      setIsEditingName(true);
                    }}
                  >
                    <Text style={styles.editNameBtnTxt}>Edit Name</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* SECTION: PLAYBACK & AUDIO */}
          <Text style={styles.sectionLabel}>PLAYBACK & AUDIO</Text>
          <View style={styles.section}>
            <SRow
              icon={<Volume2 size={18} color={__theme.accentLight} />}
              label="Resume Playback Position"
              value="Remember exact timestamp where you left off"
              right={
                <Switch
                  value={settings.autoResume}
                  onValueChange={v => updateSettings({ autoResume: v })}
                  trackColor={{ true: __theme.accent }}
                  thumbColor="#FFF"
                />
              }
            />

            <SRow
              icon={<Sparkles size={18} color={__theme.accentLight} />}
              label="High Quality Audio"
              value="320 kbps high-fidelity reproduction"
              right={
                <Switch
                  value={settings.highQualityAudio}
                  onValueChange={v => updateSettings({ highQualityAudio: v })}
                  trackColor={{ true: __theme.accent }}
                  thumbColor="#FFF"
                />
              }
            />

            <SRow
              icon={<Sliders size={18} color={__theme.accentLight} />}
              label="Gapless Playback"
              value="Smooth seamless transitions between songs"
              right={
                <Switch
                  value={settings.gaplessPlayback}
                  onValueChange={v => updateSettings({ gaplessPlayback: v })}
                  trackColor={{ true: __theme.accent }}
                  thumbColor="#FFF"
                />
              }
            />

            {/* Playback Speed Selector */}
            <View style={styles.speedRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.rowIcon}>
                  <Gauge size={18} color={__theme.accentLight} />
                </View>
                <View>
                  <Text style={styles.rowLabel}>Default Speed</Text>
                  <Text style={styles.rowValue}>{settings.playbackSpeed}x multiplier</Text>
                </View>
              </View>

              <View style={styles.speedPills}>
                {SPEED_OPTIONS.map(spd => (
                  <TouchableOpacity
                    key={spd}
                    style={[
                      styles.speedPill,
                      settings.playbackSpeed === spd && styles.speedPillActive,
                    ]}
                    onPress={() => updateSettings({ playbackSpeed: spd })}
                  >
                    <Text
                      style={[
                        styles.speedPillTxt,
                        settings.playbackSpeed === spd && styles.speedPillTxtActive,
                      ]}
                    >
                      {spd}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Crossfade Selector */}
            <View style={styles.speedRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.rowIcon}>
                  <Sliders size={18} color={__theme.accentLight} />
                </View>
                <View>
                  <Text style={styles.rowLabel}>Crossfade</Text>
                  <Text style={styles.rowValue}>
                    {settings.crossfadeSec > 0 ? `${settings.crossfadeSec}s blend between tracks` : 'Hard cut between tracks'}
                  </Text>
                </View>
              </View>

              <View style={styles.speedPills}>
                {[0, 1, 2, 3, 5].map(s => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.speedPill,
                      settings.crossfadeSec === s && styles.speedPillActive,
                    ]}
                    onPress={() => updateSettings({ crossfadeSec: s })}
                  >
                    <Text
                      style={[
                        styles.speedPillTxt,
                        settings.crossfadeSec === s && styles.speedPillTxtActive,
                      ]}
                    >
                      {s === 0 ? 'Off' : `${s}s`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* SECTION: EQUALIZER */}
          <Text style={styles.sectionLabel}>EQUALIZER</Text>
          <View style={styles.section}>
            <SRow
              icon={<Sliders size={18} color={__theme.accentLight} />}
              label="Enable Equalizer"
              value={settings.eqEnabled ? `Active · ${settings.eqPreset}` : 'Disabled (flat response)'}
              right={
                <Switch
                  value={settings.eqEnabled}
                  onValueChange={v => updateSettings({ eqEnabled: v })}
                  trackColor={{ true: __theme.accent }}
                  thumbColor="#FFF"
                />
              }
            />

            {settings.eqEnabled && (
              <View style={styles.eqContainer}>
                <View style={styles.speedPills}>
                  {Object.keys(EQ_PRESETS).map(name => (
                    <TouchableOpacity
                      key={name}
                      style={[
                        styles.speedPill,
                        settings.eqPreset === name && styles.speedPillActive,
                      ]}
                      onPress={() => setEqPreset(name)}
                    >
                      <Text
                        style={[
                          styles.speedPillTxt,
                          settings.eqPreset === name && styles.speedPillTxtActive,
                        ]}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {EQ_FREQS.map((freq, i) => (
                  <View key={freq} style={styles.eqRow}>
                    <Text style={styles.eqFreq}>
                      {freq >= 1000 ? `${freq / 1000}k` : freq}Hz
                    </Text>
                    <Slider
                      style={{ flex: 1, height: 32 }}
                      minimumValue={-10}
                      maximumValue={10}
                      step={1}
                      value={settings.eqGains[i] ?? 0}
                      minimumTrackTintColor={__theme.accentLight}
                      maximumTrackTintColor="rgba(255,255,255,0.12)"
                      thumbTintColor={__theme.accentLight}
                      onSlidingComplete={v => setEqBand(i, v)}
                    />
                    <Text style={styles.eqGain}>
                      {(settings.eqGains[i] > 0 ? '+' : '') + (settings.eqGains[i] ?? 0)}dB
                    </Text>
                  </View>
                ))}
                <Text style={styles.eqNote}>
                  On-device hardware DSP equalizer applied in real-time.
                </Text>
              </View>
            )}
          </View>

          {/* SECTION: APPEARANCE & THEME */}
          <Text style={styles.sectionLabel}>APPEARANCE & ACCENT</Text>
          <View style={styles.section}>
            <View style={styles.accentContainer}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <View style={styles.rowIcon}>
                  <Palette size={18} color={__theme.accentLight} />
                </View>
                <View>
                  <Text style={styles.rowLabel}>Accent Color</Text>
                  <Text style={styles.rowValue}>Customize app highlight color</Text>
                </View>
              </View>

              <View style={styles.colorPaletteRow}>
                {ACCENT_COLORS.map(c => {
                  const isSelected = (settings.accentColor || '#7C3AED') === c.hex;
                  return (
                    <TouchableOpacity
                      key={c.hex}
                      style={[
                        styles.colorDot,
                        { backgroundColor: c.hex },
                        isSelected && styles.colorDotSelected,
                      ]}
                      onPress={() => updateSettings({ accentColor: c.hex })}
                    >
                      {isSelected && <Check size={14} color="#FFF" />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <SRow
              icon={<Moon size={18} color={__theme.accentLight} />}
              label="Theme Mode"
              value={settings.themeMode === 'amoled' ? 'Pure AMOLED Black' : 'Midnight Dark'}
              right={
                <TouchableOpacity
                  style={styles.modeToggleBtn}
                  onPress={() =>
                    updateSettings({
                      themeMode: settings.themeMode === 'dark' ? 'amoled' : 'dark',
                    })
                  }
                >
                  <Text style={styles.modeToggleTxt}>
                    {settings.themeMode === 'amoled' ? 'AMOLED' : 'Dark'}
                  </Text>
                </TouchableOpacity>
              }
            />
          </View>

          {/* SECTION: LIBRARY & SCANNING */}
          <Text style={styles.sectionLabel}>LIBRARY & STORAGE</Text>
          <View style={styles.section}>
            <SRow
              icon={<Scan size={18} color={__theme.accentLight} />}
              label={isScanning ? 'Scanning Storage...' : 'Scan Phone for Music'}
              value="Index all local MP3, FLAC, M4A & WAV audio files"
              onPress={isScanning ? undefined : scanLocalTracks}
              right={
                <TouchableOpacity
                  style={[styles.actionPill, isScanning && { opacity: 0.6 }]}
                  onPress={isScanning ? undefined : scanLocalTracks}
                  disabled={isScanning}
                >
                  <RefreshCw size={13} color={__theme.accentLight} />
                  <Text style={styles.actionPillTxt}>{isScanning ? 'Scanning' : 'Rescan'}</Text>
                </TouchableOpacity>
              }
            />

            <SRow
              icon={<Music size={18} color={__theme.textSecondary} />}
              label="Library Inventory"
              value={`${allTracks.length} tracks · ${playlists.length} playlists · ${favorites.length} favorites`}
            />
          </View>

          {/* SECTION: PRIVACY & HISTORY */}
          <Text style={styles.sectionLabel}>PRIVACY & DATA</Text>
          <View style={styles.section}>
            <SRow
              icon={<ShieldCheck size={18} color={__theme.accentGreen} />}
              label="Track Listening History"
              value="Keep record of recently played songs locally"
              right={
                <Switch
                  value={settings.trackHistory}
                  onValueChange={v => updateSettings({ trackHistory: v })}
                  trackColor={{ true: __theme.accent }}
                  thumbColor="#FFF"
                />
              }
            />

            <SRow
              icon={<Trash2 size={18} color={__theme.accentPink} />}
              label="Clear Listening History"
              value={`${history.length} logged plays`}
              onPress={() =>
                Alert.alert(
                  'Clear History',
                  'Are you sure you want to clear your local playback history and play counts?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Clear', style: 'destructive', onPress: clearHistory },
                  ]
                )
              }
              dangerous
            />
          </View>

          {/* SECTION: ABOUT & DEVELOPER */}
          <Text style={styles.sectionLabel}>ABOUT & DEVELOPER</Text>
          <View style={styles.section}>
            <SRow
              icon={<Info size={18} color={__theme.textSecondary} />}
              label="MyMusic"
              value="v1.1.0 · High-Fidelity Audio Player"
            />
            <SRow
              icon={<Code2 size={18} color={__theme.accentLight} />}
              label="Lead Developer"
              value="Subesh Yadav"
            />
          </View>

          {/* Developer Card */}
          <View style={styles.developerCard}>
            <View style={styles.devHeaderRow}>
              <View style={styles.devAvatar}>
                <Text style={styles.devAvatarTxt}>SY</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.devName}>Subesh Yadav</Text>
                  <View style={styles.devBadge}>
                    <Text style={styles.devBadgeTxt}>DEVELOPER</Text>
                  </View>
                </View>
                <Text style={styles.devRole}>Creator & Lead Engineer</Text>
              </View>
            </View>
            <View style={styles.devDivider} />
            <View style={styles.devFooterRow}>
              <Heart size={14} color={__theme.accentPink} fill={__theme.accentPink} />
              <Text style={styles.devFooterTxt}>
                Developed with passion by Subesh Yadav
              </Text>
            </View>
          </View>

          {/* Offline & Privacy Banner */}
          <View style={styles.privacyBanner}>
            <ShieldCheck size={20} color={__theme.accentGreen} />
            <View style={{ flex: 1 }}>
              <Text style={styles.privacyTitle}>100% Offline & Private</Text>
              <Text style={styles.privacySub}>
                Your library, history, and playlists never leave your device. No ads, no telemetry.
              </Text>
            </View>
          </View>

          {/* Spacer for mini player and bottom bar */}
          <View style={{ height: 180 + insets.bottom }} />
        </View>
      </ScrollView>
      </SafeAreaView>
    </SwipeableTabScreen>
  );
}

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
    maxWidth: 620,
  },
  header: {
    paddingTop: 4,
    marginBottom: 16,
  },
  headerTitle: {
    color: C.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    color: C.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bgCard,
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    gap: 14,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  profileAvatarTxt: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileGreeting: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  profileName: {
    color: C.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  nameDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  editNameBtn: {
    backgroundColor: C.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  editNameBtnTxt: {
    color: C.accentLight,
    fontSize: 11.5,
    fontWeight: '700',
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  nameInput: {
    flex: 1,
    backgroundColor: C.bgElevated,
    color: C.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
    borderColor: C.accentLight,
  },
  saveNameBtn: {
    backgroundColor: C.accent,
    padding: 8,
    borderRadius: 8,
  },
  sectionLabel: {
    color: C.textMuted,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    marginTop: 14,
    paddingHorizontal: 4,
  },
  section: {
    backgroundColor: C.bgCard,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowText: {
    flex: 1,
    paddingRight: 8,
  },
  rowLabel: {
    color: C.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  rowValue: {
    color: C.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  speedRow: {
    padding: 14,
    gap: 12,
  },
  speedPills: {
    flexDirection: 'row',
    gap: 8,
    paddingLeft: 48,
  },
  speedPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: C.bgElevated,
    borderWidth: 1,
    borderColor: C.border,
  },
  speedPillActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  speedPillTxt: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  speedPillTxtActive: {
    color: '#FFF',
  },
  eqContainer: {
    paddingVertical: 10,
    backgroundColor: C.bgElevated,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  eqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  eqFreq: {
    color: C.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    width: 52,
  },
  eqGain: {
    color: C.accentLight,
    fontSize: 12,
    fontWeight: '700',
    width: 48,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  eqNote: {
    color: C.textMuted,
    fontSize: 11,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 4,
  },
  accentContainer: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  colorPaletteRow: {
    flexDirection: 'row',
    gap: 12,
    paddingLeft: 48,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderWidth: 2,
    borderColor: '#FFF',
    transform: [{ scale: 1.15 }],
  },
  modeToggleBtn: {
    backgroundColor: C.bgElevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  modeToggleTxt: {
    color: C.accentLight,
    fontSize: 12,
    fontWeight: '700',
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionPillTxt: {
    color: C.accentLight,
    fontSize: 12,
    fontWeight: '700',
  },
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  privacyTitle: {
    color: C.accentGreen,
    fontSize: 13.5,
    fontWeight: '800',
  },
  privacySub: {
    color: C.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  developerCard: {
    backgroundColor: C.bgCard,
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.25)',
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  devHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  devAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.accentLight,
  },
  devAvatarTxt: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  devName: {
    color: C.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  devBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
  },
  devBadgeTxt: {
    color: C.accentLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  devRole: {
    color: C.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  devDivider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 12,
  },
  devFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  devFooterTxt: {
    color: C.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});
