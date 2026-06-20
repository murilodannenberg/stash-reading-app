import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { LibraryScreen } from '../screens/LibraryScreen';
import { HighlightsScreen } from '../screens/HighlightsScreen';
import { ShelvesScreen } from '../screens/ShelvesScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { ReaderScreen } from '../screens/ReaderScreen';
import { FolderDetailScreen } from '../screens/FolderDetailScreen';
import { AddArticleScreen } from '../screens/AddArticleScreen';

import { RootStackParamList, MainTabParamList } from '../types';
import { useAppThemeStore, getHomeColors } from '../stores/appThemeStore';
import { palette } from '../theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Botão central [+ Salvar] — elevado acima da tab bar, design system §6.7
function AddSaveTabButton({ onPress: _onPress }: BottomTabBarButtonProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const accent = useAppThemeStore((s) => s.prefs.accentColor);

  return (
    <View style={btnStyles.wrap} pointerEvents="box-none">
      <TouchableOpacity
        style={[btnStyles.circle, { backgroundColor: accent, shadowColor: accent }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AddArticle', {})}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
      <Text style={[btnStyles.label, { color: palette.gray400 }]}>Salvar</Text>
    </View>
  );
}

const btnStyles = StyleSheet.create({
  wrap: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: 0,
  },
  circle: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    marginTop: -22,           // eleva acima da tab bar
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  label: { fontSize: 10, fontWeight: '500', marginTop: 3 },
});

// Tela vazia usada como placeholder para a aba central (que nunca é mostrada)
function NullScreen() {
  return <View />;
}

function MainTabs() {
  const { prefs } = useAppThemeStore();
  const colors = getHomeColors(prefs.homeTheme);
  const accent = prefs.accentColor;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconMap: Record<string, { on: string; off: string }> = {
            Library:        { on: 'library',        off: 'library-outline' },
            Highlights:     { on: 'bookmark',       off: 'bookmark-outline' },
            Shelves:        { on: 'archive',        off: 'archive-outline' },
            Settings:       { on: 'settings',       off: 'settings-outline' },
          };
          const icons = iconMap[route.name];
          if (!icons) return null;
          return (
            <Ionicons
              name={(focused ? icons.on : icons.off) as keyof typeof Ionicons.glyphMap}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,          // Papel / superfície
          borderTopColor: colors.border,            // Pergaminho
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
          elevation: 0,                             // sem sombra — design system máx 2
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
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
        name="Highlights"
        component={HighlightsScreen}
        options={{ title: 'Destaques', tabBarLabel: 'Destaques' }}
      />
      <Tab.Screen
        name="AddArticleTab"
        component={NullScreen}
        options={{
          tabBarLabel: '',
          headerShown: false,
          tabBarButton: (props) => <AddSaveTabButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Shelves"
        component={ShelvesScreen}
        options={{ title: 'Estantes', tabBarLabel: 'Estantes' }}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
