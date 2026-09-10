import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Library, Search, ListMusic, Settings } from 'lucide-react-native';
import { useThemeColors } from '../constants/theme';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SearchScreen from '../screens/SearchScreen';
import PlaylistsScreen from '../screens/PlaylistsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AlbumDetailScreen from '../screens/AlbumDetailScreen';
import ArtistDetailScreen from '../screens/ArtistDetailScreen';
import GenreDetailScreen from '../screens/GenreDetailScreen';
import FolderScreen from '../screens/FolderScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const ICON_SIZE = 22;

function TabNavigator() {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);
  const tabHeight = 60 + bottomInset;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.bgCard,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 8,
          elevation: 10,
        },
        tabBarActiveTintColor: theme.accentLight,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: -2 },
        tabBarIcon: ({ color }) => {
          if (route.name === 'Home') return <Home size={ICON_SIZE} color={color} />;
          if (route.name === 'Library') return <Library size={ICON_SIZE} color={color} />;
          if (route.name === 'Search') return <Search size={ICON_SIZE} color={color} />;
          if (route.name === 'Playlists') return <ListMusic size={ICON_SIZE} color={color} />;
          if (route.name === 'Settings') return <Settings size={ICON_SIZE} color={color} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Playlists" component={PlaylistsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
        <Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
        <Stack.Screen name="GenreDetail" component={GenreDetailScreen} />
        <Stack.Screen name="Folder" component={FolderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
