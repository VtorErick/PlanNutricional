import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChefHat, FileText, Moon, Sun } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import {
  getCombinedProfileLabel,
  getCompactProfileLabel,
  getProfileLabel,
} from '../../utils/profileLabels';

export default function Header() {
  const [showPdfMenu, setShowPdfMenu] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);
  const pdfMenuRef = React.useRef<HTMLDivElement | null>(null);
  const profileMenuRef = React.useRef<HTMLDivElement | null>(null);

  const {
    setPerfilActivo: setActiveProfile,
    perfilActivo: activeProfile,
    perfilesData: profilesData,
    profileLabels,
    diaActivo: activeDay,
    selecciones: selections,
    ac: accentColors,
    isDarkMode,
    setIsDarkMode,
    notify,
  } = useDiet();
  const activeProfileLabel = activeProfile
    ? getCompactProfileLabel(profileLabels, activeProfile)
    : 'Perfil';
  const menuProfileLabel = (profileId: 'el' | 'ella' | 'ambos') =>
    profileId === 'ambos' ? getCombinedProfileLabel(profileLabels) : getProfileLabel(profileLabels, profileId);

  React.useEffect(() => {
    if (!showPdfMenu) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (pdfMenuRef.current?.contains(target)) return;
      setShowPdfMenu(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showPdfMenu]);

  // Close profile dropdown when clicking outside
  React.useEffect(() => {
    if (!showProfileMenu) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (profileMenuRef.current?.contains(target)) return;
      setShowProfileMenu(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [showProfileMenu]);

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
      className={`sticky top-0 z-50 backdrop-blur-xl shadow-[0_10px_30px_rgba(15,23,42,0.08)] ${
        isDarkMode
          ? 'bg-slate-950/92'
          : 'bg-white/92'
      }`}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveProfile(null)}
              className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl hover:bg-slate-100 active:scale-95 transition-all dark:hover:bg-slate-800 sm:flex"
              aria-label="Volver a perfiles"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-200" />
            </button>

            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accentColors.bgGradient} shadow-sm`}
            >
              <ChefHat className="w-4 h-4 text-white" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-base font-black leading-tight text-slate-950 dark:text-white">
                Plan Nutricional
              </p>
              <p className="hidden text-[11px] font-bold text-slate-400 dark:text-slate-500 sm:block">
                Plan de alimentacion personalizado
              </p>
            </div>
          </div>

          <div className="relative flex flex-shrink-0 items-center gap-1.5 sm:mr-[248px] sm:gap-2" ref={pdfMenuRef}>
          <button
            type="button"
            onClick={() => setIsDarkMode((prev) => !prev)}
            className={`inline-flex h-10 w-10 items-center justify-center gap-2 rounded-2xl text-xs font-bold transition-colors sm:w-auto sm:px-3 ${
              isDarkMode
                ? 'bg-slate-900/90 text-slate-100 hover:bg-slate-800'
                : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80'
            }`}
            title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span className="hidden sm:inline">{isDarkMode ? 'Claro' : 'Oscuro'}</span>
          </button>

          <button
            onClick={() => setShowPdfMenu((value) => !value)}
            data-testid="header-pdf-button"
            className={`inline-flex h-10 w-10 items-center justify-center gap-2 rounded-2xl transition-all sm:w-auto sm:px-3 ${accentColors.bgLight} ${accentColors.text} shadow-sm hover:opacity-95`}
            title="Descargar plan"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-bold">Descargar</span>
          </button>

          <div className="relative sm:hidden" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu((value) => !value)}
              className={`inline-flex h-10 min-w-[58px] max-w-[76px] items-center justify-center rounded-2xl px-2 text-[11px] font-black leading-none transition active:scale-95 ${accentColors.btnActive} shadow-sm`}
              aria-label="Cambiar perfil"
            >
              <span className="truncate">{activeProfileLabel}</span>
            </button>

            {showProfileMenu ? (
              <div className={`absolute right-0 top-12 z-50 w-44 rounded-2xl border p-1.5 shadow-xl ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-100 bg-white'}`}>
                {(['el', 'ella', 'ambos'] as const).map((profileId) => (
                  <button
                    key={profileId}
                    type="button"
                    onClick={() => {
                      setActiveProfile(profileId);
                      setShowProfileMenu(false);
                    }}
                    data-testid={`header-profile-${profileId}`}
                    className={`flex h-10 w-full items-center justify-between rounded-xl px-3 text-sm font-bold ${
                      activeProfile === profileId
                        ? `${accentColors.bgLight} ${accentColors.text}`
                        : isDarkMode ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{menuProfileLabel(profileId)}</span>
                    {activeProfile === profileId ? <span className="ml-2 text-xs">Activo</span> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {showPdfMenu && (
            <div
              className={`absolute top-12 right-0 z-50 w-48 rounded-2xl shadow-xl p-1.5 ${
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
        </div>

        <div className="mt-2 hidden grid-cols-3 gap-1.5 sm:absolute sm:right-[max(1.5rem,calc((100vw-64rem)/2+1.5rem))] sm:top-2.5 sm:mt-0 sm:flex">
          {(['el', 'ella', 'ambos'] as const).map((profileId) => {
            const isActive = activeProfile === profileId;

            return (
              <button
                key={profileId}
                onClick={() => {
                  setActiveProfile(profileId);
                }}
                data-testid={`header-profile-${profileId}`}
                className={`
                  h-10 px-3 sm:px-3.5
                  rounded-2xl
                  text-xs font-bold
                  transition-all duration-300
                  whitespace-nowrap
                  ${
                    isActive
                      ? `${accentColors.btnActive} shadow-sm scale-[1.03]`
                      : isDarkMode
                        ? 'bg-slate-900/90 text-slate-300 hover:bg-slate-800'
                        : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
                  }
                `}
              >
                {profileId === 'ambos' ? 'Ambos' : getProfileLabel(profileLabels, profileId)}
              </button>
            );
          })}
        </div>
      </div>
    </motion.header>
  );
}
