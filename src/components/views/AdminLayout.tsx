import { useMemo, useState } from 'react';
import {
  KeyRound,
  Moon,
  RefreshCcw,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react';
import AdminPanel from '../AdminPanel';
import { useDiet } from '../../context/DietContext';
import { getRawDataText, perfilesData as origPerfilesData } from '../../data';
import { clearAppStorage } from '../../utils/appStorage';
import {
  DEFAULT_GEMINI_MODEL,
} from '../../utils/geminiModels';
import { DEFAULT_AI_FALLBACK_MODELS, DEFAULT_AI_MODEL, getAiModelLabel } from '../../utils/aiModels';

export default function AdminLayout() {
  const {
    setShowAdmin,
    setPerfilActivo,
    setDiaActivo,
    setTab,
    geminiModel,
    setGeminiModel,
    geminiFallbackModels,
    geminiRecommendedModel,
    geminiAvailabilityLoading,
    geminiAvailabilityMessage,
    geminiCustomApiKey,
    setGeminiCustomApiKey,
    refreshGeminiAvailability,
    customData,
    setCustomData,
    dataVersions,
    setDataVersions,
    setSelecciones,
    setComprasCheck,
    setQuestionnaireTargetProfile,
    setQuestionnaireStepIdx,
    setQuestionnaireEl,
    setQuestionnaireElla,
    setQuestionnairePortionMode,
    setQuestionnaireManualPortions,
    setQuestionnaireAdditionalNotes,
    isDarkMode,
    setIsDarkMode,
    confirmAction,
    notify,
  } = useDiet();

  const [adminTab, setAdminTab] = useState<'manual' | 'settings'>('manual');

  const defaultElJson = useMemo(() => getRawDataText('el'), []);
  const defaultEllaJson = useMemo(() => getRawDataText('ella'), []);

  const currentModel = geminiRecommendedModel || DEFAULT_AI_MODEL || geminiModel || DEFAULT_GEMINI_MODEL;
  const currentModelLabel = getAiModelLabel(currentModel);
  const availabilityMessage = (geminiAvailabilityMessage || 'Pendiente de validación.')
    .replace(/\bGEMINI_API_KEY\b/g, 'API key')
    .replace(/\bGemini\b/g, 'IA');
  const fallbackPreview = (geminiFallbackModels.length
    ? geminiFallbackModels
    : DEFAULT_AI_FALLBACK_MODELS
  ).slice(0, 3);

  const handleReplaceApiKey = async () => {
    const nextKey = window.prompt('Pega tu API key de IA');
    if (nextKey === null) return;

    const customApiKey = nextKey.trim();
    if (!customApiKey) {
      await notify('API key vacia', 'Pega una API key valida o usa Restaurar default.');
      return;
    }

    setGeminiCustomApiKey(customApiKey);
    const status = await refreshGeminiAvailability({
      preferredModel: currentModel,
      checkGeneration: true,
      syncModel: true,
      force: true,
      customApiKey,
    });

    if (!status?.ok) {
      await notify(
        'API key guardada',
        status?.error || 'Se guardo la API key personalizada, pero no fue posible validarla ahora.'
      );
      return;
    }

    await notify(
      'API key actualizada',
      `Modelo activo: ${getAiModelLabel(status.selectedModel || currentModel)}.`
    );
  };

  const restoreDefaultApiKey = async () => {
    setGeminiCustomApiKey('');
    const status = await refreshGeminiAvailability({
      preferredModel: currentModel,
      checkGeneration: true,
      syncModel: true,
      force: true,
      customApiKey: '',
    });

    if (!status?.ok) {
      await notify(
        'Default restaurada',
        status?.error || 'Se restauro la API key default, pero no fue posible validarla ahora.'
      );
      return;
    }

    await notify(
      'Default restaurada',
      `Modelo activo: ${getAiModelLabel(status.selectedModel || currentModel)}.`
    );
  };

  const validateCurrentModel = async () => {
    const status = await refreshGeminiAvailability({
      preferredModel: currentModel,
      checkGeneration: true,
      syncModel: true,
      force: true,
    });

    if (!status?.ok) {
      await notify(
        'Validacion fallida',
        status?.error || 'No fue posible validar IA.'
      );
      return;
    }

    await notify(
      'Validacion completada',
      `Modelo activo: ${getAiModelLabel(status.selectedModel || currentModel)}.`
    );
  };

  const resetAppState = async () => {
    const accepted = await confirmAction(
      'Restablecer app',
      'Esto borrara solo los datos y configuraciones locales de esta app en este dispositivo. Deseas continuar?'
    );
    if (!accepted) return;

    try {
      clearAppStorage();
    } catch (error) {
      console.warn('Failed to clear app storage:', error);
    }

    setCustomData({});
    setDataVersions({ el: 'original', ella: 'original' });
    setSelecciones({});
    setComprasCheck({});
    setGeminiModel(DEFAULT_GEMINI_MODEL);
    setGeminiCustomApiKey('');
    setPerfilActivo(null);
    setDiaActivo('Lunes');
    setTab('plan');
    setQuestionnaireTargetProfile('ambos');
    setQuestionnaireStepIdx(0);
    setQuestionnaireEl({
      age: '',
      currentWeightKg: '70',
      heightCm: '165',
      targetWeightKg: '',
      objectives: [],
      objectiveTimeline: '12 sem',
      diagnostics: '',
      allergies: '',
      medications: '',
      intolerances: '',
      digestiveSymptoms: '',
      favoriteFoods: '',
      dislikedFoods: '',
      favoriteCuisineStyles: '',
      cookingTime: '',
      activityLevel: 'Moderado',
      wakeTime: '',
      sleepTime: '',
      trainingFrequency: '',
    });
    setQuestionnaireElla({
      age: '',
      currentWeightKg: '60',
      heightCm: '160',
      targetWeightKg: '',
      objectives: [],
      objectiveTimeline: '12 sem',
      diagnostics: '',
      allergies: '',
      medications: '',
      intolerances: '',
      digestiveSymptoms: '',
      favoriteFoods: '',
      dislikedFoods: '',
      favoriteCuisineStyles: '',
      cookingTime: '',
      activityLevel: 'Moderado',
      wakeTime: '',
      sleepTime: '',
      trainingFrequency: '',
    });
    setQuestionnairePortionMode('auto');
    setQuestionnaireManualPortions({});
    setQuestionnaireAdditionalNotes('');

    await notify(
      'Aplicación restablecida',
      'Se limpiaron los datos locales de esta app y volvió al estado inicial.'
    );

    try {
      window.location.reload();
    } catch (error) {
      console.warn('Failed to reload the page after reset:', error);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-ink-950 flex flex-col">
      <header className="sticky top-0 z-50 bg-cream-50/90 backdrop-blur-xl border-b border-cream-200 dark:bg-ink-950/90 dark:border-ink-700 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-ink-900 dark:bg-cream-100 flex items-center justify-center shadow-sm">
            <Settings className="w-4 h-4 text-cream-50 dark:text-ink-900" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-ink-900 dark:text-cream-100 leading-tight">Configuración</h1>
            <p className="text-xs text-ink-400 dark:text-ink-400 hidden sm:block">
              Respaldo local y control del modelo IA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDarkMode((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-bold transition-colors ${
              isDarkMode
                ? 'border-ink-600 bg-ink-800 text-cream-200 hover:bg-ink-700'
                : 'border-cream-200 bg-white text-ink-600 hover:bg-cream-100'
            }`}
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden sm:inline">{isDarkMode ? 'Claro' : 'Oscuro'}</span>
          </button>

          <button
            onClick={() => setShowAdmin(false)}
            data-testid="admin-close-button"
            aria-label="Cerrar configuración"
            className="p-2 bg-cream-100 hover:bg-cream-200 dark:bg-ink-800 dark:hover:bg-ink-700 rounded-full text-ink-500 dark:text-cream-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-3">
        <div className="flex gap-1 rounded-2xl border border-cream-200 bg-white p-1 dark:border-ink-700 dark:bg-ink-900">
          {([
            { key: 'manual', label: 'Respaldo', shortLabel: 'Respaldo' },
            { key: 'settings', label: 'Inteligencia artificial', shortLabel: 'IA' },
          ] as const).map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setAdminTab(tabItem.key)}
              data-testid={`admin-tab-${tabItem.key}`}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors active:scale-[.98] ${
                adminTab === tabItem.key
                  ? 'bg-ink-900 text-cream-50 shadow-sm dark:bg-cream-100 dark:text-ink-900'
                  : 'text-ink-400 hover:text-ink-700 hover:bg-cream-100 dark:text-ink-400 dark:hover:text-cream-100 dark:hover:bg-ink-800'
              }`}
            >
              <span className="hidden sm:block">{tabItem.label}</span>
              <span className="sm:hidden">{tabItem.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 pb-24">
        {adminTab === 'settings' && (
          <div className="space-y-4 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-cream-50">AI</h2>
              <p className="text-sm text-ink-400 dark:text-ink-400 mt-0.5">
                Modelo activo, alternativa y clave usada por la app.
              </p>
            </div>

            <section className="rounded-2xl border border-cream-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-900 md:p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-pine-50 border border-pine-100 flex items-center justify-center flex-shrink-0 dark:bg-pine-950/40 dark:border-pine-900/50">
                  <ShieldCheck className="w-5 h-5 text-pine-600 dark:text-pine-300" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-cream-100">Estado actual</h3>
                  <p className="text-sm text-ink-400 dark:text-ink-400 mt-0.5">
                    {geminiAvailabilityLoading
                      ? 'Validando IA...'
                      : availabilityMessage}
                  </p>
                </div>
              </div>

              <div className="grid gap-2.5 md:grid-cols-2">
                <div className="rounded-2xl border border-cream-200 bg-cream-50 p-3.5 dark:border-ink-700 dark:bg-ink-800/60">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink-400 dark:text-ink-400">Modelo actual</p>
                  <p className="mt-1.5 text-sm font-bold text-ink-900 dark:text-cream-100">{currentModelLabel}</p>
                  <p className="mt-1 text-xs text-ink-400 dark:text-ink-400">
                    {geminiCustomApiKey ? 'Usando API key personalizada.' : 'Usando API key default.'}
                  </p>
                </div>

                <div className="rounded-2xl border border-cream-200 bg-cream-50 p-3.5 dark:border-ink-700 dark:bg-ink-800/60">
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-ink-400 dark:text-ink-400">Alternativas</p>
                  <p className="mt-1.5 text-sm font-semibold text-ink-800 dark:text-cream-100">
                    {fallbackPreview.length
                      ? fallbackPreview.map((model) => getAiModelLabel(model)).join(', ')
                      : 'Sin alternativa validada todavía.'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={handleReplaceApiKey}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-ink-900 px-4 py-3 text-sm font-bold text-cream-50 shadow-sm transition-all active:scale-[0.98] dark:bg-cream-100 dark:text-ink-900"
                >
                  <KeyRound className="w-4 h-4" />
                  Reemplazar API key
                </button>
                <button
                  type="button"
                  onClick={restoreDefaultApiKey}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-cream-200 bg-cream-100 px-4 py-3 text-sm font-bold text-ink-600 dark:border-ink-700 dark:bg-ink-800 dark:text-cream-100"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar default
                </button>
                <button
                  type="button"
                  onClick={validateCurrentModel}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-cream-200 bg-white px-4 py-3 text-sm font-bold text-ink-600 dark:border-ink-700 dark:bg-ink-900 dark:text-cream-100"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Validar
                </button>
              </div>
            </section>
          </div>
        )}

        {adminTab === 'manual' && (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="mb-4">
              <h2 className="font-display text-2xl font-semibold text-ink-900 dark:text-cream-50">Respaldo y restauración</h2>
              <p className="text-sm text-ink-400 dark:text-ink-400">
                Guarda una copia de tus planes o recupera una versión anterior desde un archivo JSON.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminPanel
                perfilId="el"
                title="Datos El"
                themeColor="blue"
                rawDataText={defaultElJson}
                customData={customData}
                setCustomData={setCustomData}
                dataVersion={dataVersions.el}
                setDataVersion={(ver: string) => setDataVersions((prev: any) => ({ ...prev, el: ver }))}
                perfilesDataObj={origPerfilesData.el}
                notify={notify}
                confirmAction={confirmAction}
              />
              <AdminPanel
                perfilId="ella"
                title="Datos Ella"
                themeColor="rose"
                rawDataText={defaultEllaJson}
                customData={customData}
                setCustomData={setCustomData}
                dataVersion={dataVersions.ella}
                setDataVersion={(ver: string) => setDataVersions((prev: any) => ({ ...prev, ella: ver }))}
                perfilesDataObj={origPerfilesData.ella}
                notify={notify}
                confirmAction={confirmAction}
              />
            </div>

            <div className="mt-5 bg-white dark:bg-ink-900 rounded-2xl p-4 border border-coral-200 dark:border-coral-900/60 shadow-soft">
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-coral-600 dark:text-coral-300 mb-1">
                Zona de riesgo
              </p>
              <p className="text-xs text-ink-400 dark:text-ink-300 mb-3">
                Si encuentras un error o quieres empezar desde cero en este dispositivo, puedes limpiar el almacenamiento local de esta app.
                <br />
                Esto no se puede deshacer y perderás cualquier dato que no hayas respaldado.
              </p>
              <button
                onClick={resetAppState}
                className="w-full sm:w-auto bg-coral-600 hover:bg-coral-500 text-white text-sm font-bold py-2.5 px-5 rounded-full transition-all active:scale-[0.98]"
              >
                Restablecer app
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
