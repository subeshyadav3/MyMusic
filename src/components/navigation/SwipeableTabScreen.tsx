import React, {useRef, useMemo} from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { ColorTheme } from '../../constants/colors';
import { useThemeColors } from '../../constants/theme';

const TAB_ORDER = ['Home', 'Library', 'Search', 'Playlists', 'Settings'];

interface Props {
  children: React.ReactNode;
}

export const SwipeableTabScreen: React.FC<Props> = ({ children }) => {
  const __theme = useThemeColors();
  const styles = useMemo(() => makeStyles(__theme), [__theme]);
  const navigation = useNavigation<any>();
  const route = useRoute();

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture clean horizontal gestures, allowing smooth vertical scrolling
        return (
          Math.abs(gestureState.dx) > 40 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2.2
        );
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentIndex = TAB_ORDER.indexOf(route.name);
        if (currentIndex === -1) return;

        // Swipe Left -> Go to Next Tab
        if (gestureState.dx < -55 || (gestureState.dx < -30 && gestureState.vx < -0.4)) {
          if (currentIndex < TAB_ORDER.length - 1) {
            navigation.navigate(TAB_ORDER[currentIndex + 1]);
          }
        }
        // Swipe Right -> Go to Previous Tab
        else if (gestureState.dx > 55 || (gestureState.dx > 30 && gestureState.vx > 0.4)) {
          if (currentIndex > 0) {
            navigation.navigate(TAB_ORDER[currentIndex - 1]);
          }
        }
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

const makeStyles = (C: ColorTheme) => StyleSheet.create({
  container: {
    flex: 1,
  },
});
