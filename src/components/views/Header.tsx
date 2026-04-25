import React from 'react';
import { motion } from 'framer-motion';
import { ChefHat, FileText } from 'lucide-react';
import { useDiet } from '../../context/DietContext';
import {
  getCombinedProfileLabel,
  getProfileLabel,
} from '../../utils/profileLabels';

export default function Header() {
  const [showPdfMenu, setShowPdfMenu] = React.useState(false);
  const pdfMenuRef = React.useRef<HTMLDivElement | null>(null);

  const {
    setPerfilActivo: setActiveProfile,
    perfilActivo: activeProfile,
    perfilesData: profilesData,
    profileLabels,
    diaActivo: activeDay,
    selecciones: selections,
    ac: accentColors,
    isDarkMode,
    notify,
  } = useDiet();

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
      <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Logo */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-3 flex-shrink-0">
            <div
              className={`flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accentColors.bgGradient} shadow-sm`}
            >
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:block min-w-0">
              <p className="truncate text-base font-black leading-tight text-slate-950 dark:text-white">
                Plan Nutricional
              </p>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                Plan de alimentacion personalizado
              </p>
            </div>
          </div>

          {/* Profile pills */}
          <div className="flex flex-1 items-center gap-1 sm:gap-1.5 min-w-0">
            {(['el', 'ella', 'ambos'] as const).map((profileId) => {
              const isActive = activeProfile === profileId;
              return (
                <button
                  key={profileId}
                  onClick={() => setActiveProfile(profileId)}
                  data-testid={`header-profile-${profileId}`}
                  className={`
                    flex-1 min-w-0 h-9 sm:h-10 px-1.5 sm:px-3.5
                    rounded-2xl
                    text-[11px] sm:text-xs font-bold
                    transition-all duration-300
                    whitespace-nowrap
                    active:scale-95
                    ${
                      isActive
                        ? `${accentColors.btnActive} shadow-sm`
                        : isDarkMode
                          ? 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-800'
                          : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                    }
                  `}
                >
                  {menuProfileLabel(profileId)}
                </button>
              );
            })}
          </div>

          {/* PDF button */}
          <div className="relative flex flex-shrink-0 items-center" ref={pdfMenuRef}>
            <button
              onClick={() => setShowPdfMenu((value) => !value)}
              data-testid="header-pdf-button"
              className={`inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-2xl transition-all active:scale-95 ${accentColors.bgLight} ${accentColors.text} shadow-sm hover:opacity-95`}
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
        </div>
      </div>
    </motion.header>
  );
}
