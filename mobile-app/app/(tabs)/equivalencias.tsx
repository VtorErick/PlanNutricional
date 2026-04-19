import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import EquivalenciasCard from '@/src/components/EquivalenciasCard';
import Header from '@/src/components/Header';
import { Screen } from '@/src/components/Screen';
import { useDiet } from '@/src/context/DietContext';
import { getShadows, getSurfacePalette } from '@/src/utils/mobileTheme';

export default function EquivalenciasScreen() {
  const { activeBundles, isDarkMode } = useDiet();
  const palette = getSurfacePalette(isDarkMode);

  return (
    <Screen title="Equivalencias" subtitle="Referencias SMAE y notas practicas por perfil.">
      <Header />
      {activeBundles.map(({ id, profile, equivalencias }) => (
        <View
          key={id}
          style={[
            styles.section,
            getShadows('small', isDarkMode),
            { backgroundColor: palette.card, borderColor: palette.border },
          ]}
        >
          <Text style={[styles.profileTitle, { color: palette.text }]}>{profile.nombre}</Text>
          {equivalencias.map((item) => (
            <EquivalenciasCard key={`${id}-${item.titulo}`} equivalencia={item} />
          ))}
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  profileTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
});
