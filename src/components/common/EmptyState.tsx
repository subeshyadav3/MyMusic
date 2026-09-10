import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Music } from 'lucide-react-native';
import type { ColorTheme } from '../../constants/colors';
import { useThemeColors } from '../../constants/theme';

interface Props {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export const EmptyState: React.FC<Props> = ({ icon, title, subtitle, action }) => {
  const __theme = useThemeColors();
  const styles = useMemo(() => makeStyles(__theme), [__theme]);
  return (
  <View style={styles.container}>
    <View style={styles.iconWrap}>{icon || <Music size={40} color={__theme.textMuted} />}</View>
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    {action && (
      <TouchableOpacity style={styles.btn} onPress={action.onPress}>
        <Text style={styles.btnTxt}>{action.label}</Text>
      </TouchableOpacity>
    )}
  </View>
  );
};

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.bgElevated, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { color: C.textPrimary, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  subtitle: { color: C.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  btn: { marginTop: 20, backgroundColor: C.accent, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 },
  btnTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
