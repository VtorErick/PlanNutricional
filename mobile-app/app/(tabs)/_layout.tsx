import React from 'react';
import { Tabs } from 'expo-router';
import { BookOpen, CalendarDays, ClipboardList, Flame, Pill, ShoppingCart } from 'lucide-react-native';
import { useDiet } from '@/src/context/DietContext';
import { getSurfacePalette } from '@/src/utils/mobileTheme';

export default function TabsLayout() {
  const { isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.border,
          borderTopWidth: 1,
          height: 74,
          paddingTop: 8,
          paddingBottom: 10,
          paddingHorizontal: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'Plan',
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="equivalencias"
        options={{
          title: 'Extras',
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calorias"
        options={{
          title: 'Kcal',
          tabBarIcon: ({ color, size }) => <Flame color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="compras"
        options={{
          title: 'Compras',
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="resumen"
        options={{
          title: 'Resumen',
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="suplementos"
        options={{
          title: 'Sups',
          tabBarIcon: ({ color, size }) => <Pill color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
