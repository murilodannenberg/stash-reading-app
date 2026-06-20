import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { LibraryScreen } from '../screens/LibraryScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { TagsScreen } from '../screens/TagsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ReaderScreen } from '../screens/ReaderScreen';
import { FolderDetailScreen } from '../screens/FolderDetailScreen';
import { AddArticleScreen } from '../screens/AddArticleScreen';

import { RootStackParamList, MainTabParamList } from '../types';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, { focused: string; default: string }> = {
  Library: { focused: 'library', default: 'library-outline' },
  Search: { focused: 'search', default: 'search-outline' },
  Tags: { focused: 'pricetags', default: 'pricetags-outline' },
  Settings: { focused: 'settings', default: 'settings-outline' },
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
          const iconName = focused ? icons.focused : icons.default;
          return <Ionicons name={iconName as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
        },
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
          height: 56,
          paddingBottom: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        headerShown: true,
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{ title: 'Biblioteca', tabBarLabel: 'Biblioteca' }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ title: 'Buscar', tabBarLabel: 'Buscar' }}
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

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700', fontSize: 18 },
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
          options={({ route }: { route: { params: { folderName: string } } }) => ({ title: route.params.folderName })}
        />
        <Stack.Screen
          name="AddArticle"
          component={AddArticleScreen}
          options={{ title: 'Adicionar artigo', animation: 'slide_from_bottom' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
