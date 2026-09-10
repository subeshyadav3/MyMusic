import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, Modal, TextInput, TouchableOpacity,
} from 'react-native';
import { Sparkles, Music2, ArrowRight } from 'lucide-react-native';
import type { ColorTheme } from '../../constants/colors';
import { useMusicStore } from '../../store/useMusicStore';
import { useThemeColors } from '../../constants/theme';

export const WelcomeModal: React.FC = () => {
  const theme = useThemeColors();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { isWelcomeVisible, setWelcomeVisible, setUserName } = useMusicStore();
  const [name, setName] = useState('');

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed) {
      await setUserName(trimmed);
    } else {
      await setUserName('Music Lover');
    }
    setWelcomeVisible(false);
  };

  const handleSkip = async () => {
    await setUserName('Subesh');
    setWelcomeVisible(false);
  };

  return (
    <Modal
      visible={isWelcomeVisible}
      animationType="fade"
      transparent
      onRequestClose={handleSkip}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Sparkles size={28} color={theme.accentLight} />
          </View>

          <Text style={styles.title}>Welcome to MyMusic</Text>
          <Text style={styles.subtitle}>
            What should we call you? We will personalize your library and greetings.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your name (e.g. Subesh)"
            placeholderTextColor={theme.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} activeOpacity={0.88}>
            <Text style={styles.primaryBtnTxt}>Get Started</Text>
            <ArrowRight size={18} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipBtnTxt}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: C.bgCard,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  title: {
    color: C.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: C.textSecondary,
    fontSize: 13.5,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    width: '100%',
    backgroundColor: C.bgElevated,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: C.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnTxt: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  skipBtn: {
    paddingVertical: 12,
    marginTop: 4,
  },
  skipBtnTxt: {
    color: C.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
