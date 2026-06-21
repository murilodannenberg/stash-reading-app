import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  IconBooks, IconBookmark, IconBookmarkFilled,
  IconArchive, IconArchiveFilled, IconSettings, IconTags, IconFolder,
} from '@tabler/icons-react-native';

import { LibraryScreen } from '../screens/LibraryScreen';
import { FilesScreen } from '../screens/FilesScreen';
import { ShelvesScreen } from '../screens/ShelvesScreen';
import { TagsScreen } from '../screens/TagsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ReaderScreen } from '../screens/ReaderScreen';
import { FolderDetailScreen } from '../screens/FolderDetailScreen';
import { AddArticleScreen } from '../screens/AddArticleScreen';
import { TrashScreen } from '../screens/TrashScreen';
import { HighlightsScreen } from '../screens/HighlightsScreen';

import { RootStackParamList, MainTabParamList } from '../types';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { useShareStore } from '../stores/shareStore';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

type TablerIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

const TAB_ICONS: Record<keyof MainTabParamList, { active: TablerIcon; inactive: TablerIcon }> = {
  Library:  { active: IconBooks,           inactive: IconBooks },
  Files:    { active: IconFolder,          inactive: IconFolder },
  Shelves:  { active: IconArchiveFilled,   inactive: IconArchive },
  Tags:     { active: IconTags,            inactive: IconTags },
  Settings: { active: IconSettings,        inactive: IconSettings },
};

function MainTabs() {
  const { prefs } = useAppThemeStore();
  const colors = getHomeColors(prefs.homeTheme);
  const accent = prefs.accentColor;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const Icon = focused ? icons.active : icons.inactive;
          return <Icon size={size} color={color} strokeWidth={focused ? 2 : 1.5} />;
        },
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: 'Georgia', fontWeight: '700', fontSize: 20 },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ title: 'Biblioteca', tabBarLabel: 'Biblioteca' }}
      />
      <Tab.Screen
        name="Files"
        component={FilesScreen}
        options={{ title: 'Arquivos', tabBarLabel: 'Arquivos' }}
      />
      <Tab.Screen
        name="Shelves"
        component={ShelvesScreen}
        options={{ title: 'Estantes', tabBarLabel: 'Estantes' }}
      />
      <Tab.Screen
        name="Tags"
        component={TagsScreen}
        options={{ title: 'Tags', tabBarLabel: 'Tags' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Ajustes', tabBarLabel: 'Ajustes' }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { prefs } = useAppThemeStore();
  const colors = getHomeColors(prefs.homeTheme);
  const { pendingUrl, setPendingUrl } = useShareStore();

  // Navega para AddArticle quando uma URL chega via share intent
  useEffect(() => {
    if (!pendingUrl) return;
    if (!navigationRef.isReady()) return;
    navigationRef.navigate('AddArticle', { sharedUrl: pendingUrl });
    setPendingUrl(null);
  }, [pendingUrl, setPendingUrl]);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // Cobre o caso em que pendingUrl chegou antes da nav estar pronta
        const url = useShareStore.getState().pendingUrl;
        if (url) {
          navigationRef.navigate('AddArticle', { sharedUrl: url });
          useShareStore.getState().setPendingUrl(null);
        }
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: 'Georgia', fontWeight: '700', fontSize: 20 },
          headerBackTitle: 'Voltar',
          headerShadowVisible: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Reader"
          component={ReaderScreen}
          options={{ title: '' }}
        />
        <Stack.Screen
          name="FolderDetail"
          component={FolderDetailScreen}
          options={({ route }: { route: { params: { folderName: string } } }) => ({
            title: route.params.folderName,
          })}
        />
        <Stack.Screen
          name="AddArticle"
          component={AddArticleScreen}
          options={{ title: 'Adicionar artigo', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ title: 'Buscar' }}
        />
        <Stack.Screen
          name="Trash"
          component={TrashScreen}
          options={{ title: 'Lixeira' }}
        />
        <Stack.Screen
          name="Highlights"
          component={HighlightsScreen}
          options={{ title: 'Destaques' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
