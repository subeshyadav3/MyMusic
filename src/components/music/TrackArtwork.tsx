import React, {useState, useMemo, useEffect} from 'react';
import { View, Image, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Music2 } from 'lucide-react-native';
import type { ColorTheme } from '../../constants/colors';
import { useThemeColors } from '../../constants/theme';

interface Props {
  uri?: string;
  size?: number;
  borderRadius?: number;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export const TrackArtwork: React.FC<Props> = ({
  uri,
  size = 46,
  borderRadius = 10,
  iconSize,
  style,
  imageStyle,
}) => {
  const __theme = useThemeColors();
  const styles = useMemo(() => makeStyles(__theme), [__theme]);
  const [loadError, setLoadError] = useState(false);

  // Reuse of this component (e.g. full player) with a new uri must clear a
  // previous failure, otherwise the placeholder sticks forever.
  useEffect(() => {
    setLoadError(false);
  }, [uri]);

  const finalIconSize = iconSize || Math.max(16, Math.round(size * 0.42));

  if (!uri || loadError) {
    return (
      <View
        style={[
          styles.defaultPlaceholder,
          { width: size, height: size, borderRadius },
          style,
        ]}
      >
        {/* Subtle Vinyl Grooves */}
        <View
          style={[
            styles.grooveOuter,
            { width: size * 0.8, height: size * 0.8, borderRadius: (size * 0.8) / 2 },
          ]}
        />
        <View
          style={[
            styles.grooveInner,
            { width: size * 0.5, height: size * 0.5, borderRadius: (size * 0.5) / 2 },
          ]}
        />
        <Music2 size={finalIconSize} color={__theme.accentLight} />
      </View>
    );
  }

  return (
    <View style={[{ width: size, height: size, borderRadius, overflow: 'hidden' }, style]}>
      <Image
        source={{ uri }}
        style={[{ width: '100%', height: '100%' }, imageStyle]}
        onError={() => setLoadError(true)}
      />
    </View>
  );
};

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  defaultPlaceholder: {
    backgroundColor: '#1E1435',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.35)',
    overflow: 'hidden',
  },
  grooveOuter: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.12)',
  },
  grooveInner: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.18)',
  },
});
