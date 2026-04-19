import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

export function DayTabs({
  value,
  onChange,
}: {
  value: string;
  onChange: (day: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
      {DAYS.map((day) => {
        const active = day === value;
        return (
          <Pressable key={day} onPress={() => onChange(day)} style={[styles.button, active && styles.activeButton]}>
            <Text style={[styles.text, active && styles.activeText]}>{day}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
  },
  activeButton: {
    backgroundColor: '#2563eb',
  },
  text: {
    color: '#334155',
    fontWeight: '600',
  },
  activeText: {
    color: '#ffffff',
  },
});
