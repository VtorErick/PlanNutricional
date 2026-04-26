import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, ChevronDown, FileText, Moon, Settings, Sun } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import { getProfileLabel } from '../../utils/profileLabels';

export default function Header() {
  const [showPdfMenu, setShowPdfMenu] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const pdfMenuRef = React.useRef<HTMLDivElement | null>(null);
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null);

  const {
    setPerfilActivo: setActiveProfile,
    perfilActivo: activeProfile,
    tab: activeTab,
    perfilesData: profilesData,
    profileLabels,
    diaActivo: activeDay,
    selecciones: selections,
    ac: accentColors,
    isDarkMode,
    setIsDarkMode,
    notify,
    setShowAdmin: setIsAdminOpen,
  } = useDiet();

  const menuProfileLabel = (profileId: 'el' | 'ella' | 'ambos') =>
    profileId === 'ambos' ? 'Ambos' : getProfileLabel(profileLabels, profileId);
  const activeProfileLabel = activeProfile ? menuProfileLabel(activeProfile) : 'Perfil';
  const profileOptions = (['el', 'ella', 'ambos'] as const).map((profileId) => ({
    id: profileId,
    label: menuProfileLabel(profileId),
  }));

  React.useEffect(() => {
    if (!showPdfMenu && !showProfileMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (pdfMenuRef.current?.contains(target) || profileMenuRef.current?.contains(target)) return;
      setShowPdfMenu(false);
      setShowProfileMenu(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showPdfMenu, showProfileMenu]);

  const handleDownloadDayPdf = React.useCallback(async () => {
    if (!activeProfile) return;
    try {
      const { downloadDaySelectionPdf } = await import('../../services/pdfService');

      if (activeProfile === 'ambos') {
        downloadDaySelectionPdf(
          activeDay,
          [
            { perfilData: profilesData.el, color: [37, 99, 235], planObj: profilesData.el.plan, perfilId: 'el' },
            { perfilData: profilesData.ella, color: [225, 29, 72], planObj: profilesData.ella.plan, perfilId: 'ella' },
          ],
          selections
        );
        return;
      }

      const isElla = activeProfile === 'ella';
      downloadDaySelectionPdf(
        activeDay,
        [
          {
            perfilData: profilesData[activeProfile],
            color: isElla ? [225, 29, 72] : [37, 99, 235],
            planObj: profilesData[activeProfile].plan,
            perfilId: activeProfile,
          },
        ],
        selections
      );
    } catch (error: any) {
      await notify('Error al exportar PDF', error?.message || 'No fue posible generar el PDF del dia.');
    }
  }, [activeProfile, activeDay, notify, profilesData, selections]);

  const handleDownloadFullPlanPdf = React.useCallback(async () => {
    if (!activeProfile) return;
    try {
      const { downloadCombinedDietPdf, downloadDietPdf } = await import('../../services/pdfService');

      if (activeProfile === 'ambos') {
        downloadCombinedDietPdf([
          { perfilData: profilesData.el, planObj: profilesData.el.plan, isVA: false },
          { perfilData: profilesData.ella, planObj: profilesData.ella.plan, isVA: true },
        ]);
        return;
      }

      downloadDietPdf(
        profilesData[activeProfile],
        profilesData[activeProfile].plan,
        activeProfile === 'ella'
      );
    } catch (error: any) {
      await notify('Error al exportar PDF', error?.message || 'No fue posible generar el plan completo en PDF.');
    }
  }, [activeProfile, notify, profilesData]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`sticky top-0 z-50 w-full overflow-x-clip border-b backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.06)] ${
        isDarkMode
          ? 'border-slate-800 bg-slate-950/94'
          : 'border-slate-200/70 bg-white/96'
      }`}
    >
      <div className="max-w-5xl mx-auto px-2.5 min-[380px]:px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          {/* Left: Logo and Profile */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            {/* Logo */}
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className={`flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-2xl border shadow-sm ${accentColors.bgLight} ${accentColors.borderLight} ${accentColors.text}`}>
                <ChefHat className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="hidden sm:block text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  Tu plan diario
                </p>
              </div>
            </div>

            {/* Profile dropdown */}
            <div className="relative w-[110px] flex-shrink-0 min-[380px]:w-[125px] sm:w-[145px]" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu((value) => !value);
                  setShowPdfMenu(false);
                }}
                data-testid="header-profile-menu-button"
                aria-expanded={showProfileMenu}
                className={`flex h-9 w-full min-w-0 items-center justify-between gap-1 rounded-xl border px-2 text-left text-xs font-black transition active:scale-[0.98] min-[380px]:h-10 min-[380px]:gap-1.5 min-[380px]:rounded-2xl min-[380px]:px-2.5 sm:text-sm ${
                  isDarkMode
                    ? 'border-slate-800 bg-slate-900 text-slate-100 hover:bg-slate-800'
                    : `border-slate-200 bg-slate-50 ${accentColors.text} shadow-sm hover:bg-white`
                }`}
              >
                <span className="min-w-0 truncate">{activeProfileLabel}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 flex-shrink-0 transition-transform min-[380px]:h-4 min-[380px]:w-4 ${showProfileMenu ? 'rotate-180' : ''}`}
                />
              </button>

            {showProfileMenu ? (
              <div
                className={`absolute left-0 right-0 top-12 z-[80] rounded-2xl border p-1.5 shadow-xl ${
                  isDarkMode
                    ? 'border-slate-800 bg-slate-950'
                    : 'border-slate-200 bg-white'
                }`}
              >
                {profileOptions.map((profile) => {
                  const isActive = activeProfile === profile.id;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => {
                        setActiveProfile(profile.id);
                        setShowProfileMenu(false);
                      }}
                      data-testid={`header-profile-${profile.id}`}
                      className={`flex h-10 w-full items-center justify-between rounded-xl px-3 text-sm font-bold transition ${
                        isActive
                          ? `${accentColors.bgLight} ${accentColors.text}`
                          : isDarkMode
                            ? 'text-slate-200 hover:bg-slate-900'
                            : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate">{profile.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          </div>

          {/* Right: Theme, PDF, Settings buttons */}
          <div className="flex items-center gap-1.5 min-[380px]:gap-2 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border transition active:scale-95 min-[380px]:h-10 min-[380px]:w-10 min-[380px]:rounded-2xl ${
                isDarkMode
                  ? 'border-violet-300/30 bg-violet-400/15 text-violet-200 hover:bg-violet-400/20'
                  : 'border-violet-100 bg-violet-50 text-violet-600 shadow-sm hover:bg-violet-100'
              }`}
              aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {isDarkMode ? <Sun className="h-4 w-4 fill-current text-violet-200" /> : <Moon className="h-4 w-4 fill-sky-200 text-sky-400" />}
            </button>

            {/* PDF button */}
            <div className="relative flex flex-shrink-0 items-center" ref={pdfMenuRef}>
              <button
                onClick={() => {
                  setShowPdfMenu((value) => !value);
                  setShowProfileMenu(false);
                }}
                data-testid="header-pdf-button"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all active:scale-95 min-[380px]:h-10 min-[380px]:w-10 min-[380px]:rounded-2xl ${
                  isDarkMode
                    ? 'border-violet-300/30 bg-violet-400/15 text-violet-200 hover:bg-violet-400/20'
                    : 'border-violet-100 bg-violet-50 text-violet-600 shadow-sm hover:bg-violet-100'
                }`}
                title="Descargar plan"
              >
                <FileText className="w-4 h-4" />
              </button>

              {showPdfMenu && (
                <div
                  className={`absolute top-11 right-0 z-50 w-48 rounded-2xl shadow-xl p-1.5 ${
                    isDarkMode
                      ? 'bg-slate-950'
                      : 'bg-white'
                  }`}
                >
                  <button
                    onClick={() => {
                      void handleDownloadDayPdf();
                      setShowPdfMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${
                      isDarkMode
                        ? 'text-slate-100 hover:bg-slate-800'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Menu de hoy
                  </button>
                  <button
                    onClick={() => {
                      void handleDownloadFullPlanPdf();
                      setShowPdfMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${
                      isDarkMode
                        ? 'text-slate-100 hover:bg-slate-800'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Plan completo
                  </button>
                </div>
              )}
            </div>

            {/* Settings button (solo en Inicio) */}
            {activeTab === 'inicio' && (
              <button
                type="button"
                onClick={() => setIsAdminOpen(true)}
                data-testid="header-settings-button"
                className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border transition active:scale-95 min-[380px]:h-10 min-[380px]:w-10 min-[380px]:rounded-2xl ${
                  isDarkMode
                    ? 'border-violet-300/30 bg-violet-400/15 text-violet-200 hover:bg-violet-400/20'
                    : 'border-violet-100 bg-violet-50 text-violet-600 shadow-sm hover:bg-violet-100'
                }`}
                aria-label="Configuracion"
                title="Configuracion"
              >
                <Settings className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}
