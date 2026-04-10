import { useMemo, useState } from 'react';
import {
  ChevronDown,
  Moon,
  RefreshCcw,
  RotateCcw,
  Server,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import AdminPanel from '../AdminPanel';
import { useDiet } from '../../context/DietContext';
import { getRawDataText, perfilesData as origPerfilesData } from '../../data';
import { clearAppStorage } from '../../utils/appStorage';
import {
  DEFAULT_GEMINI_MODEL,
  GEMINI_MODEL_OPTIONS,
  getGeminiFallbackModels,
  getGeminiModelLabel,
  getOrderedGeminiModels,
} from '../../utils/geminiModels';

export default function AdminLayout() {
  const {
    setShowAdmin,
    setPerfilActivo,
    setDiaActivo,
    setTab,
    geminiModel,
    setGeminiModel,
    geminiAvailableModels,
    geminiFallbackModels,
    geminiRecommendedModel,
    geminiAvailabilityLoading,
    geminiAvailabilityMessage,
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  const defaultElJson = useMemo(() => getRawDataText('el'), []);
  const defaultEllaJson = useMemo(() => getRawDataText('ella'), []);

  const currentModel = geminiModel || geminiRecommendedModel || DEFAULT_GEMINI_MODEL;
  const currentModelLabel = getGeminiModelLabel(currentModel);
  const recommendedModel = geminiRecommendedModel || DEFAULT_GEMINI_MODEL;
  const recommendedModelLabel = getGeminiModelLabel(recommendedModel);
  const orderedModels = geminiAvailableModels.length
    ? getOrderedGeminiModels(geminiAvailableModels, currentModel)
    : [currentModel, ...getGeminiFallbackModels(GEMINI_MODEL_OPTIONS.map((option) => option.id), currentModel)];
  const fallbackPreview = (geminiFallbackModels.length
    ? geminiFallbackModels
    : orderedModels.slice(1)
  ).slice(0, 3);

  const visibleModelOptions = GEMINI_MODEL_OPTIONS.map((option) => ({
    ...option,
    available: geminiAvailableModels.includes(option.id),
  }));

  const applyRecommendedConfig = async () => {
    setGeminiModel(DEFAULT_GEMINI_MODEL);

    const status = await refreshGeminiAvailability({
      preferredModel: DEFAULT_GEMINI_MODEL,
      checkGeneration: true,
      syncModel: true,
    });

    if (!status?.ok) {
      await notify(
        'Gemini no disponible',
        status?.error || 'No fue posible validar Gemini desde el servidor.'
      );
      return;
    }

    const usedModel = getGeminiModelLabel(status.selectedModel || DEFAULT_GEMINI_MODEL);
    const fallbackLabel = (status.fallbackModels || [])
      .slice(0, 2)
      .map((model) => getGeminiModelLabel(model))
      .join(', ');

    await notify(
      'Configuracion recomendada aplicada',
      fallbackLabel
        ? `Modelo por defecto: ${usedModel}.\nFallback: ${fallbackLabel}.`
        : `Modelo por defecto: ${usedModel}.`
    );
  };

  const validateCurrentModel = async () => {
    const status = await refreshGeminiAvailability({
      preferredModel: currentModel,
      checkGeneration: true,
      syncModel: true,
    });

    if (!status?.ok) {
      await notify(
        'Validacion fallida',
        status?.error || 'No fue posible validar el modelo seleccionado.'
      );
      return;
    }

    await notify(
      'Validacion completada',
      `Modelo activo: ${getGeminiModelLabel(status.selectedModel || currentModel)}.`
    );
  };

  const handleModelSelection = async (nextModel: string) => {
    setGeminiModel(nextModel);

    const status = await refreshGeminiAvailability({
      preferredModel: nextModel,
      checkGeneration: true,
      syncModel: true,
    });

    if (!status?.ok) {
      await notify(
        'Modelo no validado',
        status?.error || 'No fue posible validar el modelo seleccionado.'
      );
      return;
    }

    const selectedLabel = getGeminiModelLabel(status.selectedModel || nextModel);
    const fallbackLabel = (status.fallbackModels || [])
      .slice(0, 2)
      .map((model) => getGeminiModelLabel(model))
      .join(', ');

    await notify(
      'Modelo actualizado',
      fallbackLabel
        ? `La app usara ${selectedLabel} por defecto.\nFallback: ${fallbackLabel}.`
        : `La app usara ${selectedLabel} por defecto.`
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 dark:bg-slate-950/95 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">Configuracion</h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
              Respaldo local y control avanzado del modelo Gemini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDarkMode((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-2xl border text-xs font-bold transition-colors ${
              isDarkMode
                ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-900/90 rounded-2xl">
          {([
            { key: 'manual', label: 'Respaldo', shortLabel: 'Respaldo', emoji: 'JSON' },
            { key: 'settings', label: 'Gemini', shortLabel: 'Gemini', emoji: 'AI' },
          ] as const).map((tabItem) => (
            <button
              key={tabItem.key}
              onClick={() => setAdminTab(tabItem.key)}
              data-testid={`admin-tab-${tabItem.key}`}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 ${
                adminTab === tabItem.key
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-950 dark:text-slate-100 dark:border dark:border-slate-800'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span className="block text-xs font-black">{tabItem.emoji}</span>
              <span className="hidden sm:block">{tabItem.label}</span>
              <span className="sm:hidden">{tabItem.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 pb-24">
        {adminTab === 'settings' && (
          <div className="space-y-5 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center pb-1">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Gemini solo por servidor</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                La app usa unicamente `GEMINI_API_KEY` del servidor. No se guarda ni se pide una API key en el navegador.
              </p>
            </div>

            <section className="bg-white dark:bg-slate-950 rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Modo recomendado</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Prioriza calidad. Primero intenta Gemini 3.1 Pro Preview y usa fallback automatico si hace falta.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">Modelo actual</p>
                  <p className="mt-2 text-sm font-bold text-emerald-900">{currentModelLabel}</p>
                  <p className="mt-1 text-xs text-emerald-800/80">
                    Recomendado del sistema: {recommendedModelLabel}.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    Estado servidor
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {geminiAvailabilityLoading
                      ? 'Validando modelos disponibles...'
                      : geminiAvailabilityMessage || 'Pendiente de validacion.'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={applyRecommendedConfig}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-2xl transition-all active:scale-[0.98] shadow-md"
                >
                  Usar configuracion recomendada
                </button>
                <button
                  type="button"
                  onClick={validateCurrentModel}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-100"
                >
                  <RefreshCcw className="w-4 h-4" />
                  Validar ahora
                </button>
              </div>
            </section>

            <section className="bg-white dark:bg-slate-950 rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Fallback automatico</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Si el modelo principal falla por disponibilidad o cuota, la app prueba el siguiente sin exponer la API key.
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                {orderedModels.slice(0, 5).map((model, index) => (
                  <div
                    key={model}
                    className={`flex items-start gap-3 rounded-2xl border p-3 ${
                      index === 0
                        ? 'border-indigo-300 bg-indigo-50/70 dark:border-indigo-700 dark:bg-indigo-950/30'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                      index === 0
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'
                    }`}>
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {getGeminiModelLabel(model)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {index === 0 ? 'Modelo principal para plan y edicion.' : 'Fallback automatico.'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Fallback visible
                </p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                  {fallbackPreview.length
                    ? fallbackPreview.map((model) => getGeminiModelLabel(model)).join(', ')
                    : 'Sin fallback validado todavia.'}
                </p>
              </div>
            </section>

            <section className="bg-white dark:bg-slate-950 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <div className="min-w-0 pr-4">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Ajustes avanzados</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Aqui puedes cambiar el modelo por defecto sin tocar ninguna API key.
                  </p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                />
              </button>

              {showAdvanced && (
                <div className="px-5 md:px-6 pb-6 border-t border-slate-100 dark:border-slate-800 space-y-5">
                  <div className="pt-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-4">
                    <div className="flex items-start gap-3">
                      <Server className="w-5 h-5 text-slate-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          Entorno esperado
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          Local: `.env.local` con `GEMINI_API_KEY` y `GEMINI_MODEL`. Vercel: mismas variables en Environment Variables.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="admin-default-model"
                      className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2"
                    >
                      Modelo por defecto
                    </label>
                    <select
                      id="admin-default-model"
                      value={currentModel}
                      onChange={(event) => void handleModelSelection(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-100 outline-none"
                    >
                      {visibleModelOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.technicalLabel}{option.available ? '' : ' (sin validar)'}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      El selector define la prioridad inicial. Si falla, la API usa la cadena de fallback automaticamente.
                    </p>
                  </div>

                  <div className="grid gap-3">
                    {visibleModelOptions.slice(0, 6).map((option) => {
                      const isCurrent = currentModel === option.id;
                      return (
                        <div
                          key={option.id}
                          className={`rounded-2xl border p-4 ${
                            isCurrent
                              ? 'border-indigo-300 bg-indigo-50/70 dark:border-indigo-700 dark:bg-indigo-950/30'
                              : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                              {option.technicalLabel}
                            </p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${option.badgeClassName}`}>
                              {option.badge}
                            </span>
                            {isCurrent ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200">
                                Actual
                              </span>
                            ) : null}
                            {option.available ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                Validado
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{option.description}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={applyRecommendedConfig}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-100 font-bold py-3 px-4"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Volver al recomendado
                    </button>
                    <button
                      type="button"
                      onClick={validateCurrentModel}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold py-3 px-4 shadow-md"
                    >
                      <Sparkles className="w-4 h-4" />
                      Probar modelo seleccionado
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {adminTab === 'manual' && (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center mb-6">
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

            <div className="mt-5 bg-white dark:bg-slate-950 rounded-3xl p-4 border border-rose-200 dark:border-rose-900/60 shadow-sm">
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
