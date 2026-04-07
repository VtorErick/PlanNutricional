import { useEffect, useState } from 'react';
import { Settings, X, KeyRound, Zap, Sparkles, ChevronDown, ShieldCheck, Moon, Sun } from 'lucide-react';
import AdminPanel from '../AdminPanel';
import { useDiet } from '../../context/DietContext';
import { perfilesData as origPerfilesData, rawData } from '../../data';
import { getEnvGeminiApiKey, persistGeminiApiKey } from '../../utils/geminiKey';

export default function AdminLayout() {
  const {
    setShowAdmin,
    setPerfilActivo,
    setDiaActivo,
    setTab,
    geminiApiKey, setGeminiApiKey,
    geminiModel, setGeminiModel,
    geminiAvailableModels,
    geminiRecommendedModel,
    geminiAvailabilityLoading,
    geminiAvailabilityMessage,
    refreshGeminiAvailability,
    customData, setCustomData,
    dataVersions, setDataVersions,
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
  const [apiKeyDraft, setApiKeyDraft] = useState(geminiApiKey);

  const envKey = getEnvGeminiApiKey();
  const usingCustomKey = !!geminiApiKey.trim();

  const modelOptions = [
    {
      val: 'gemini-2.0-flash',
      label: 'Equilibrado',
      techLabel: 'Gemini 2.0 Flash',
      desc: 'Equilibrio entre velocidad y buenos resultados.',
      badge: 'Balance',
      badgeColor: 'bg-blue-100 text-blue-700',
    },
    {
      val: 'gemini-2.5-flash',
      label: 'Más rápido',
      techLabel: 'Gemini 2.5 Flash',
      desc: 'Genera respuestas rápido y con buen rendimiento.',
      badge: 'Rápido',
      badgeColor: 'bg-emerald-100 text-emerald-700',
    },
    {
      val: 'gemini-1.5-flash',
      label: 'Básico',
      techLabel: 'Gemini 1.5 Flash',
      desc: 'Opción ligera para uso sencillo.',
      badge: 'Simple',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
    {
      val: 'gemini-1.5-pro',
      label: 'Más detallado',
      techLabel: 'Gemini 1.5 Pro',
      desc: 'Puede dedicar más análisis, aunque tarda un poco más.',
      badge: 'Detallado',
      badgeColor: 'bg-violet-100 text-violet-700',
    },
    {
      val: 'gemini-2.5-pro',
      label: 'Máxima calidad',
      techLabel: 'Gemini 2.5 Pro',
      desc: 'La opción más potente para resultados más elaborados.',
      badge: 'Premium',
      badgeColor: 'bg-amber-100 text-amber-700',
    },
  ];

  const visibleModelOptions = geminiAvailableModels.length
    ? modelOptions.filter((option) => geminiAvailableModels.includes(option.val))
    : modelOptions;
  const recommendedModel = geminiRecommendedModel || visibleModelOptions[0]?.val || '';
  const recommendedModelLabel = modelOptions.find((option) => option.val === recommendedModel)?.techLabel || recommendedModel;

  useEffect(() => {
    setApiKeyDraft(geminiApiKey);
  }, [geminiApiKey]);

  const resetApiKeyToDefault = async () => {
    setApiKeyDraft('');
    setGeminiApiKey('');
    setGeminiModel('');
    persistGeminiApiKey('');

    const status = await refreshGeminiAvailability({
      customApiKey: '',
      preferredModel: '',
      syncModel: true,
    });

    if (envKey && status?.ok) {
      await notify('Configuracion actualizada', `Se restauro la clave del entorno. Modelo sugerido: ${status.selectedModel}`);
      return;
    }

    if (envKey) {
      await notify('Configuracion actualizada', status?.error || 'Se restauro la clave del entorno, pero no se pudo validar Gemini.');
      return;
    }

    await notify('Configuracion actualizada', 'Se elimino la clave personalizada y no hay una clave del entorno disponible.');
  };

  const resetAppState = async () => {
    const accepted = await confirmAction(
      'Restablecer app',
      'Esto borrará datos locales, cookies y configuraciones guardadas. ¿Deseas continuar?'
    );
    if (!accepted) return;

    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }

    try {
      sessionStorage.clear();
    } catch (error) {
      console.warn('Failed to clear sessionStorage:', error);
    }

    try {
      document.cookie.split(';').forEach((cookie) => {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos) : cookie;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      });
    } catch (error) {
      console.warn('Failed to clear cookies:', error);
    }

    setCustomData({});
    setDataVersions({ el: 'original', ella: 'original' });
    setSelecciones({});
    setComprasCheck({});
    setApiKeyDraft('');
    setGeminiApiKey('');
    setGeminiModel('');
    setPerfilActivo(null);
    setDiaActivo('Lunes');
    setTab('plan');
    setQuestionnaireTargetProfile('ambos');
    setQuestionnaireStepIdx(0);
    setQuestionnaireEl({
      age: '', currentWeightKg: '70', heightCm: '165', targetWeightKg: '',
      objectives: [], objectiveTimeline: '12 sem', diagnostics: '', allergies: '',
      medications: '', intolerances: '', digestiveSymptoms: '', favoriteFoods: '',
      dislikedFoods: '', favoriteCuisineStyles: '', cookingTime: '', activityLevel: 'Moderado',
      wakeTime: '', sleepTime: '', trainingFrequency: ''
    });
    setQuestionnaireElla({
      age: '', currentWeightKg: '60', heightCm: '160', targetWeightKg: '',
      objectives: [], objectiveTimeline: '12 sem', diagnostics: '', allergies: '',
      medications: '', intolerances: '', digestiveSymptoms: '', favoriteFoods: '',
      dislikedFoods: '', favoriteCuisineStyles: '', cookingTime: '', activityLevel: 'Moderado',
      wakeTime: '', sleepTime: '', trainingFrequency: ''
    });
    setQuestionnairePortionMode('auto');
    setQuestionnaireManualPortions({});
    setQuestionnaireAdditionalNotes('');

    await notify('Aplicación restablecida', '✅ Se limpiaron datos locales y la app volvió al estado inicial.');
    try {
      window.location.reload();
    } catch (error) {
      console.warn('Failed to reload the page after reset:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 dark:bg-slate-950/95 dark:border-slate-800 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">Configuración</h1>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">
              Respalda tus planes y ajusta la generación automática
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
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-900/90 rounded-2xl">
          {([
            { key: 'manual', label: 'Respaldo', shortLabel: 'Respaldo', emoji: '💾' },
            { key: 'settings', label: 'Generación', shortLabel: 'Generación', emoji: '✨' },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setAdminTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 ${
                adminTab === t.key
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-950 dark:text-slate-100 dark:border dark:border-slate-800'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <span className="block text-sm mb-0.5">{t.emoji}</span>
              <span className="hidden sm:block">{t.label}</span>
              <span className="sm:hidden">{t.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 pb-24">

        {/* ── SETTINGS TAB ── */}
        {adminTab === 'settings' && (
          <div className="space-y-5 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">

            <div className="text-center pb-1">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Generación automática de planes</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Aquí eliges cómo quieres que la app genere o actualice tus planes.
              </p>
            </div>

            {/* Simple mode */}
            <section className="bg-white dark:bg-slate-950 rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3 mb-5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Modo recomendado</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    La opción más simple para la mayoría de las personas.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Usa la configuración recomendada
                    </p>
                    <p className="text-xs text-emerald-700/90 mt-1 leading-relaxed">
                      Esta opción ya deja lista la app para generar planes de forma normal,
                      sin que tengas que entender claves, modelos o configuraciones técnicas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={async () => {
                    setApiKeyDraft('');
                    setGeminiApiKey('');
                    setGeminiModel('');

                    const status = await refreshGeminiAvailability({
                      customApiKey: '',
                      preferredModel: '',
                      syncModel: true,
                    });

                    await notify(
                      'Configuracion lista',
                      envKey
                        ? `La app quedo usando la clave del entorno. Modelo sugerido: ${status?.selectedModel || recommendedModel}`
                        : 'La app quedo con el modelo recomendado, pero no hay clave del entorno disponible'
                    );
                  }}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3 px-4 rounded-2xl transition-all active:scale-[0.98] shadow-md"
                >
                  Usar configuracion recomendada
                </button>

                <div className="flex items-center justify-center px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-200 font-medium">
                  Modelo actual: {modelOptions.find((m) => m.val === geminiModel)?.label || recommendedModelLabel || 'Sin validar'}
                </div>
              </div>
            </section>

            {/* Select mode */}
            <section className="bg-white dark:bg-slate-950 rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Velocidad o calidad</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Puedes elegir cómo prefieres que responda la generación automática.
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                {visibleModelOptions.map((m) => (
                  <button
                    key={m.val}
                    type="button"
                    onClick={() => setGeminiModel(m.val)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                      geminiModel === m.val
                        ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        geminiModel === m.val ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-950'
                      }`}
                    >
                      {geminiModel === m.val && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{m.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.badgeColor}`}>
                          {m.badge}
                        </span>
                        {recommendedModel === m.val && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300">
                <p>
                  {geminiAvailabilityLoading
                    ? 'Validando modelos disponibles para la API key actual...'
                    : geminiAvailabilityMessage || `Modelo sugerido por defecto: ${recommendedModelLabel || 'sin datos'}`}
                </p>
              </div>
            </section>

            {/* Advanced section */}
            <section className="bg-white dark:bg-slate-950 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <div className="min-w-0 pr-4">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Opciones avanzadas</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Solo si ya sabes lo que estás haciendo o quieres usar tu propia configuración.
                  </p>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                />
              </button>

              {showAdvanced && (
                <div className="px-5 md:px-6 pb-6 border-t border-slate-100 dark:border-slate-800 space-y-5">
                  <div className="pt-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <KeyRound className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">Clave personal de acceso</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Esto es opcional. Solo úsalo si alguien te indicó que pegaras una clave aquí.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 mb-3">
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Para la mayoría de usuarios, no hace falta tocar esta parte.
                        La app puede funcionar con la configuración recomendada.
                      </p>
                    </div>

                    <div className="relative mb-3">
                      <input
                        type="password"
                        id="admin-api-key"
                        placeholder="Pega aqui tu clave si te la compartieron"
                        value={apiKeyDraft}
                        onChange={(e) => setApiKeyDraft(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 pr-10 text-slate-700 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-orange-400 transition"
                      />
                      {usingCustomKey && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-bold">
                          OK
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={async () => {
                          const trimmedKey = apiKeyDraft.trim();

                          if (trimmedKey) {
                            const status = await refreshGeminiAvailability({
                              customApiKey: trimmedKey,
                              preferredModel: '',
                              syncModel: true,
                            });

                            if (!status?.ok) {
                              await notify('Clave invalida', status?.error || 'No fue posible validar la API key.');
                              return;
                            }

                            setGeminiApiKey(trimmedKey);
                            setGeminiModel(status.selectedModel || '');
                            await notify('Guardado', `Tu clave personal quedo guardada. Modelo sugerido: ${status.selectedModel}`);
                          } else {
                            await resetApiKeyToDefault();
                          }
                        }}
                        className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all active:scale-[0.98] shadow-md"
                      >
                        {apiKeyDraft.trim() ? 'Guardar clave personal' : 'Restaurar configuracion predeterminada'}
                      </button>

                      {usingCustomKey && (
                        <button
                          onClick={resetApiKeyToDefault}
                          className="sm:w-auto bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-100 font-bold py-2.5 px-4 rounded-xl transition-all active:scale-[0.98]"
                        >
                          Quitar clave
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">Nombre técnico del motor</h4>
                    <div className="rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3">
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        Opción actual: <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {modelOptions.find((m) => m.val === geminiModel)?.techLabel || geminiModel}
                        </span>
                      </p>
                      {geminiAvailableModels.length > 0 && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Disponibles con esta clave: {geminiAvailableModels.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ── MANUAL BACKUP TAB ── */}
        {adminTab === 'manual' && (
          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">💾 Respaldo y restauración</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Guarda una copia de tus planes o recupera una versión anterior desde un archivo JSON.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AdminPanel
                perfilId="el"
                title="Datos El"
                themeColor="blue"
                rawDataText={rawData.el}
                customData={customData}
                setCustomData={setCustomData}
                dataVersion={dataVersions.el}
                setDataVersion={(ver: string) => setDataVersions((prev: any) => ({ ...prev, el: ver }))}
                perfilesDataObj={origPerfilesData.el}
                notify={notify}
                confirmAction={() => Promise.resolve(true)}
              />
              <AdminPanel
                perfilId="ella"
                title="Datos Ella"
                themeColor="rose"
                rawDataText={rawData.ella}
                customData={customData}
                setCustomData={setCustomData}
                dataVersion={dataVersions.ella}
                setDataVersion={(ver: string) => setDataVersions((prev: any) => ({ ...prev, ella: ver }))}
                perfilesDataObj={origPerfilesData.ella}
                notify={notify}
                confirmAction={() => Promise.resolve(true)}
              />
            </div>

            <div className="mt-5 bg-white dark:bg-slate-950 rounded-3xl p-4 border border-rose-200 dark:border-rose-900/60 shadow-sm">
              <p className="text-xs text-slate-500 dark:text-slate-300 mb-3">
                Si encuentras un error o quieres empezar desde cero en este dispositivo, puedes limpiar almacenamiento local y cookies.
                <br />
                ⚠️ Esto no se puede deshacer y perderás cualquier dato que no hayas respaldado. Asegúrate de guardar tu información antes de continuar.
              </p>
              <button
                onClick={resetAppState}
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition-all active:scale-[0.98]"
              >
                Restablecer app (borrar datos locales)
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
