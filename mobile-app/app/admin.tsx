import React from 'react';
import { router } from 'expo-router';

import AdminPanel from '@/src/components/AdminPanel';
import { Screen } from '@/src/components/Screen';
import { useDiet } from '@/src/context/DietContext';
import { HAS_API_BASE, HAS_DIRECT_GEMINI_KEY } from '@/src/services/apiBase';
import { clearAppStorage } from '@/src/utils/appStorage';
import { showAppAlert, showAppConfirm } from '@/src/utils/appDialogs';

export default function AdminScreen() {
  const {
    activeBundles,
    geminiStatus,
    refreshGeminiStatus,
    exportProfilePdf,
    isDarkMode,
  } = useDiet();
  const aiMode = HAS_API_BASE ? 'backend' : HAS_DIRECT_GEMINI_KEY ? 'direct' : 'disabled';

  const handleClear = async () => {
    const confirmed = await showAppConfirm(
      'Limpiar almacenamiento',
      'Esto borrara el estado local guardado en el dispositivo.'
    );
    if (!confirmed) return;

    await clearAppStorage();
    await showAppAlert('Listo', 'El almacenamiento local fue limpiado.');
  };

  return (
    <Screen title="Admin" subtitle="Utilidades de mantenimiento para la version Android.">
      <AdminPanel
        onClearStorage={handleClear}
        onOpenQuestionnaire={() => router.push('/questionnaire')}
        onRefreshGeminiStatus={refreshGeminiStatus}
        onExportFirstProfilePdf={async () => {
          const first = activeBundles[0]?.id;
          if (!first) {
            await showAppAlert('Sin perfil activo', 'No hay perfil disponible para exportar.');
            return;
          }
          await exportProfilePdf(first);
        }}
        geminiStatus={geminiStatus}
        apiBaseUrl={process.env.EXPO_PUBLIC_API_BASE_URL || ''}
        aiMode={aiMode}
        isDarkMode={isDarkMode}
      />
    </Screen>
  );
}
