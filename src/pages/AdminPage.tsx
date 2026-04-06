import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../AppContext';
import { Settings, X, KeyRound, Zap } from 'lucide-react';
import AdminPanel from '../components/AdminPanel';

export function AdminPage() {
  const {
    closeAdmin,
    geminiApiKey,
    setGeminiApiKey,
    geminiModel,
    setGeminiModel,
    rawData,
    customData,
    setCustomData,
    dataVersions,
    setDataVersions,
    origPerfilesData,
    notify,
    confirmAction,
  } = useAppContext();

  const [adminTab, setAdminTab] = useState<'settings' | 'manual'>('settings');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Settings className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">Panel de Administración</h1>
            <p className="text-[11px] text-slate-400 hidden sm:block">Gestiona respaldos y configura el motor de IA</p>
          </div>
        </div>
        <button
          onClick={closeAdmin}
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Admin Tab Bar */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex gap-2 p-1.5 bg-slate-100/80 rounded-2xl">
          {([
            { key: 'manual' as const, label: 'Backup', shortLabel: 'Backup', emoji: '💾' },
            { key: 'settings' as const, label: 'Ajustes IA', shortLabel: 'Ajustes', emoji: '⚙️' },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setAdminTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 ${
                adminTab === t.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5 max-w-2xl mx-auto"
          >
            <div className="text-center pb-2">
              <h2 className="text-lg font-bold text-slate-800">⚙️ Ajustes de Inteligencia Artificial</h2>
              <p className="text-sm text-slate-500">Configura tu clave y el modelo de Gemini a utilizar.</p>
            </div>

            {/* API Key */}
            <section className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Clave de API Gemini</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Se guarda en tu navegador. Evita el límite de solicitudes compartido (Error 429).
                  </p>
                </div>
              </div>
              <div className="relative mb-3">
                <input
                  type="password"
                  id="admin-api-key"
                  placeholder="Ingresa tu API key de Gemini (AIzaSy...)"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 text-slate-700 font-mono text-sm outline-none focus:ring-2 focus:ring-orange-400 transition"
                />
                {geminiApiKey && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-bold">
                    ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (geminiApiKey) {
                      localStorage.setItem('geminiApiKey', geminiApiKey);
                      setGeminiApiKey('');
                      await notify('Configuración guardada', '✅ API Key guardada exitosamente');
                    } else {
                      const envKey = (import.meta as any).env?.GEMINI_API_KEY || '';
                      localStorage.setItem('geminiApiKey', envKey);
                      setGeminiApiKey(envKey);
                      if (envKey) {
                        await notify('Configuración actualizada', '✅ API Key predeterminada cargada');
                      } else {
                        await notify('Configuración actualizada', '🗑️ API Key eliminada');
                      }
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all active:scale-[0.98] shadow-md"
                >
                  {geminiApiKey ? '💾 Guardar API Key' : '🔄 Cargar predeterminada'}
                </button>
                {geminiApiKey && (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-3 py-2 rounded-lg">
                    ✅ Configurada
                  </span>
                )}
              </div>
            </section>

            {/* Model Select */}
            <section className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-slate-200">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Motor de Gemini</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Selecciona qué versión de Gemini usará el generador de planes.</p>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-600 mb-2">Selecciona tu modelo preferido:</p>
              <div className="grid gap-2">
                {[
                  { val: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', badge: '⚡ Más reciente', desc: 'Versión más nueva y rápida de 2.5', badgeColor: 'bg-emerald-100 text-emerald-700' },
                  { val: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', badge: 'Recomendado', desc: 'Velocidad óptima y calidad alta', badgeColor: 'bg-blue-100 text-blue-700' },
                  { val: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', badge: '🆓 Gratuito', desc: 'Ideal para cuentas sin cuota pagada', badgeColor: 'bg-slate-100 text-slate-700' },
                  { val: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', badge: '🧠 Pro', desc: 'Razonamiento complejo, más lento', badgeColor: 'bg-violet-100 text-violet-700' },
                  { val: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', badge: '🚀 Máx. potencia', desc: 'El modelo más avanzado disponible', badgeColor: 'bg-amber-100 text-amber-700' },
                ].map((m) => (
                  <button
                    key={m.val}
                    type="button"
                    onClick={() => setGeminiModel(m.val)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all ${
                      geminiModel === m.val
                        ? 'border-indigo-400 bg-indigo-50 shadow-sm'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        geminiModel === m.val ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 bg-white'
                      }`}
                    >
                      {geminiModel === m.val && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{m.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.badgeColor}`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </motion.div>
        )}

        {/* ── MANUAL BACKUP TAB ── */}
        {adminTab === 'manual' && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-slate-800">💾 Backup y Restauración</h2>
              <p className="text-sm text-slate-500">Descarga tu plan como respaldo o restaura una versión anterior desde archivo JSON.</p>
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
                setDataVersion={(ver) => setDataVersions((prev) => ({ ...prev, el: ver }))}
                perfilesDataObj={origPerfilesData.el}
                notify={notify}
                confirmAction={confirmAction}
              />
              <AdminPanel
                perfilId="ella"
                title="Datos Ella"
                themeColor="rose"
                rawDataText={rawData.ella}
                customData={customData}
                setCustomData={setCustomData}
                dataVersion={dataVersions.ella}
                setDataVersion={(ver) => setDataVersions((prev) => ({ ...prev, ella: ver }))}
                perfilesDataObj={origPerfilesData.ella}
                notify={notify}
                confirmAction={confirmAction}
              />
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}
