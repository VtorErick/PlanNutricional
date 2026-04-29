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
  getGeminiModelLabel,
} from '../../utils/geminiModels';

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

  const currentModel = geminiModel || geminiRecommendedModel || DEFAULT_GEMINI_MODEL;
  const currentModelLabel = getGeminiModelLabel(currentModel);
  const fallbackPreview = (geminiFallbackModels.length
    ? geminiFallbackModels
    : []
  ).slice(0, 3);

  const handleReplaceApiKey = async () => {
    const nextKey = window.prompt('Pega tu API key de Gemini');
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
      `Modelo activo: ${getGeminiModelLabel(status.selectedModel || currentModel)}.`
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
      `Modelo activo: ${getGeminiModelLabel(status.selectedModel || currentModel)}.`
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
        status?.error || 'No fue posible validar Gemini.'
      );
      return;
    }

    await notify(
      'Validacion completada',
      `Modelo activo: ${getGeminiModelLabel(status.selectedModel || currentModel)}.`
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
      'Aplicacion restablecida',
      'Se limpiaron los datos locales de esta app y volvio al estado inicial.'
    );

    try {
      window.location.reload();
    } catch (error) {
      console.warn('Failed to reload the page after reset:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 dark:bg-slate-950/95 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-slate-100 flex items-center justify-center shadow-sm">
            <Settings className="w-4 h-4 text-white dark:text-slate-950" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">Configuracion</h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
              Respaldo local y control del modelo Gemini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDarkMode((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
              isDarkMode
                ? 'border-amber-300/40 bg-amber-400/15 text-amber-200 hover:bg-amber-400/20'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 fill-current" /> : <Moon className="w-4 h-4 fill-current" />}
            <span className="hidden sm:inline">{isDarkMode ? 'Claro' : 'Oscuro'}</span>
          </button>

          <button
            onClick={() => setShowAdmin(false)}
            data-testid="admin-close-button"
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-3">
        <div className="flex gap-1.5 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {([
            { key: 'manual', label: 'Respaldo', shortLabel: 'Respaldo', emoji: 'JSON' },
            { key: 'settings', label: 'Gemini', shortLabel: 'Gemini', emoji: 'AI' },
          ] as const).map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setAdminTab(tabItem.key)}
              data-testid={`admin-tab-${tabItem.key}`}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-bold text-sm transition-all duration-200 active:scale-95 ${
                adminTab === tabItem.key
                  ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-100 dark:text-slate-950'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span className="block text-xs font-black">{tabItem.emoji}</span>
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
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">AI Gemini</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Modelo activo, fallback y llave usada por la app.
              </p>
            </div>

            <section className="bg-white dark:bg-slate-950 rounded-2xl p-4 md:p-5 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 dark:bg-emerald-950/30 dark:border-emerald-900/50">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Estado actual</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {geminiAvailabilityLoading
                      ? 'Validando Gemini...'
                      : geminiAvailabilityMessage || 'Pendiente de validacion.'}
                  </p>
                </div>
              </div>

              <div className="grid gap-2.5 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Modelo actual</p>
                  <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">{currentModelLabel}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {geminiCustomApiKey ? 'Usando API key personalizada.' : 'Usando API key default.'}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Fallback</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {fallbackPreview.length
                      ? fallbackPreview.map((model) => getGeminiModelLabel(model)).join(', ')
                      : 'Sin fallback validado todavia.'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={handleReplaceApiKey}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] dark:bg-slate-100 dark:text-slate-950"
                >
                  <KeyRound className="w-4 h-4" />
                  Reemplazar API key
                </button>
                <button
                  type="button"
                  onClick={restoreDefaultApiKey}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restaurar default
                </button>
                <button
                  type="button"
                  onClick={validateCurrentModel}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
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
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Respaldo y restauracion</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Guarda una copia de tus planes o recupera una version anterior desde un archivo JSON.
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

            <div className="mt-5 bg-white dark:bg-slate-950 rounded-2xl p-4 border border-rose-200 dark:border-rose-900/60 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-rose-600 dark:text-rose-300 mb-1">
                Zona de riesgo
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-300 mb-3">
                Si encuentras un error o quieres empezar desde cero en este dispositivo, puedes limpiar el almacenamiento local de esta app.
                <br />
                Esto no se puede deshacer y perderas cualquier dato que no hayas respaldado.
              </p>
              <button
                onClick={resetAppState}
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition-all active:scale-[0.98]"
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
