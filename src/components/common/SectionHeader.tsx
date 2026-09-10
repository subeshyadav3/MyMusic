import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import type { ColorTheme } from '../../constants/colors';
import { useThemeColors } from '../../constants/theme';

interface Props {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}

export const SectionHeader: React.FC<Props> = ({ title, subtitle, onSeeAll }) => {
  const __theme = useThemeColors();
  const styles = useMemo(() => makeStyles(__theme), [__theme]);
  return (
  <View style={styles.row}>
    <View>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
    {onSeeAll && (
      <TouchableOpacity style={styles.seeAll} onPress={onSeeAll}>
        <Text style={styles.seeAllTxt}>See All</Text>
        <ChevronRight size={14} color={__theme.accentLight} />
      </TouchableOpacity>
    )}
  </View>
  );
};

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 },
  title: { color: C.textPrimary, fontSize: 18, fontWeight: '800' },
  subtitle: { color: C.textMuted, fontSize: 12, marginTop: 1 },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllTxt: { color: C.accentLight, fontSize: 13, fontWeight: '600' },
});
