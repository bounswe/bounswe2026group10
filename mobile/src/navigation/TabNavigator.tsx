import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { RootTabParamList } from './types';
import { useAuth } from '../context/AuthContext';
import { HomeStack } from './HomeStack';
import { SearchStack } from './SearchStack';
import { CreateStack } from './CreateStack';
import { LibraryStack } from './LibraryStack';
import { ProfileStack } from './ProfileStack';
import { colors, fonts, fontSizes } from '../theme';

const Tab = createBottomTabNavigator<RootTabParamList>();

export function TabNavigator() {
  const { authState } = useAuth();
  const { t } = useTranslation('common');

  const role =
    authState.status === 'authenticated' ? (authState.user.role ?? '').toUpperCase() : '';
  const canCreate = role === 'COOK' || role === 'EXPERT';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontFamily: fonts.sansMedium,
          fontSize: fontSizes.xs,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.outline,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 85,
          paddingBottom: 28,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: t('nav.home'),
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="SearchTab"
        component={SearchStack}
        options={{
          tabBarLabel: t('nav.search'),
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="magnify" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CreateTab"
        component={CreateStack}
        options={{
          tabBarLabel: t('nav.create'),
          tabBarIcon: ({ focused }) => (
            <View style={styles.createButton}>
              <MaterialCommunityIcons
                name="plus"
                size={24}
                color={focused ? colors.white : colors.white}
              />
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            if (!canCreate) {
              e.preventDefault();
              Alert.alert(
                t('nav.createDisabledTitle'),
                t('nav.createDisabledHint')
              );
            }
          },
        }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={LibraryStack}
        options={{
          tabBarLabel: t('nav.library'),
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: t('nav.profile'),
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'account' : 'account-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    marginTop: -4,
  },
});
